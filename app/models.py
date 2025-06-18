"""
Domain entities for FinanceBook.

The **heart** of the application is the `PaymentItem` – an atomic cash-flow event.
Everything else (recipients, tags / categories, attachments) hangs off that
object, allowing powerful filtering, aggregation and visualisation.

Modelling goals
---------------
1. *Extensibility* – users can create their own category dimensions (types) and
   extend taxonomy trees arbitrarily deep.
2. *Simplicity* – while SQLModel can handle complex relations, keep the schema
   intuitive for analysts exploring the database directly.
3. *Performance* – avoid unnecessary join tables unless the relationship is
   logically many-to-many (e.g. items ↔ categories).

All tables inherit from `SQLModel` so they work seamlessly with FastAPI's
response models and carry proper type hints for IDE autocompletion.
"""
from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from sqlmodel import Field, SQLModel, Relationship

###############################################################################
# Association table (many-to-many) between PaymentItem and Category
###############################################################################
class PaymentItemCategoryLink(SQLModel, table=True):
    """
    Pure link table.

    We *could* store extra metadata here (e.g. confidence score if tags were
    auto-inferred by an ML model), but for now the composite primary key is
    sufficient.
    """
    payment_item_id: Optional[int] = Field(
        default=None, foreign_key="paymentitem.id", primary_key=True
    )
    category_id: Optional[int] = Field(
        default=None, foreign_key="category.id", primary_key=True
    )


###############################################################################
# Taxonomy
###############################################################################
class CategoryType(SQLModel, table=True):
    """
    A user-defined classification dimension.

    Examples of types:
        • *Spending Area*   (Food, Rent, …)
        • *Payment Method*  (Cash, Credit Card, …)
        • *VAT Rate*        (19%, 7%, 0%)
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None


class Category(SQLModel, table=True):
    """
    A single tag within a `CategoryType` taxonomy tree.

    The self-referencing `parent_id` allows arbitrary depth without cycles
    (SQLModel enforces this by pointing `sa_relationship_kwargs["remote_side"]`
    back to the same column).
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str

    # Which dimension does this tag belong to?
    type_id: int = Field(foreign_key="categorytype.id")

    # Recursive parent pointer (nullable for root nodes)
    parent_id: Optional[int] = Field(default=None, foreign_key="category.id")

    # Optional filename of an icon associated with this category
    icon_file: Optional[str] = None


class CategoryUpdate(SQLModel):
    """Schema for updating an existing category."""
    name: Optional[str] = None
    type_id: Optional[int] = None
    parent_id: Optional[int] = None
    icon_file: Optional[str] = None



###############################################################################
# Core business entities
###############################################################################
class Recipient(SQLModel, table=True):
    """
    Person or organisation involved in a transaction.

    Keeping this in a separate table lets us:
    • De-duplicate recipient data across many payment items
    • Attach future metadata (e.g. contact info, logo, IBAN)
    """
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    address: Optional[str] = None


class PaymentItemBase(SQLModel):
    """
    Base model for a payment item, containing all common fields.

    Conventions
    -----------
    • Negative `amount`  → Expense  (money out)
    • Positive `amount`  → Income   (money in)
    • `date` uses ISO format for API consistency with frontend
    • `periodic=True` marks template items that spawn future instances via
      scheduled jobs (not yet implemented).
    """
    amount: float  # Use DECIMAL in production to avoid rounding errors
    date: datetime  # Changed from timestamp to date for frontend compatibility
    periodic: bool = False
    description: Optional[str] = None  # Description of what this payment is for

    # Optional attachments (local path or S3 URL – persisted by upload endpoints)
    invoice_path: Optional[str] = None
    product_image_path: Optional[str] = None
    recipient_id: Optional[int] = Field(default=None, foreign_key="recipient.id")

class PaymentItem(PaymentItemBase, table=True):
    """
    Database model for a payment item. Inherits from Base and adds DB-specific fields.
    """
    id: Optional[int] = Field(default=None, primary_key=True)

# ==============================================================================
# API Models (Pydantic Schemas) for PaymentItem
# ==============================================================================

class PaymentItemCreate(PaymentItemBase):
    """
    Schema for creating a new payment item via the API.
    Accepts a list of category IDs instead of full Category objects.
    """
    category_ids: Optional[List[int]] = []

class PaymentItemUpdate(PaymentItemBase):
    """
    Schema for updating an existing payment item via the API.
    All fields are optional for partial updates.
    """
    amount: Optional[float] = None
    date: Optional[datetime] = None
    periodic: Optional[bool] = None
    description: Optional[str] = None
    invoice_path: Optional[str] = None
    product_image_path: Optional[str] = None
    recipient_id: Optional[int] = None
    category_ids: Optional[List[int]] = None

class PaymentItemRead(PaymentItemBase):
    """

    Schema for reading/returning a payment item from the API.
    Includes the full Recipient and Category objects for detailed views.
    """
    id: int
    recipient: Optional[Recipient] = None
    categories: List[Category] = []
