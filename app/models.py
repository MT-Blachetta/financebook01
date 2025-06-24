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
# This is a "link table" that connects payment items and categories.
# It's like a bridge that lets us say "this payment item belongs to this category".
class PaymentItemCategoryLink(SQLModel, table=True):
    """
    This is a special table that just connects two other tables together.
    In this case, it connects the "paymentitem" table and the "category" table.
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
# This defines the structure of a "CategoryType" object in our database.
class CategoryType(SQLModel, table=True):
    """
    A category type is a way to group your categories, like "Expense Type" or "Income Source".
    """
    id: Optional[int] = Field(default=None, primary_key=True) # A unique number to identify the category type.
    name: str # The name of the category type.
    description: Optional[str] = None # A description of the category type (this is optional).


# This defines the structure of a "Category" object in our database.
class Category(SQLModel, table=True):
    """
    A category is a way to group your payments, like "Groceries" or "Salary".
    """
    id: Optional[int] = Field(default=None, primary_key=True) # A unique number to identify the category.
    name: str # The name of the category.

    # This tells us which category type this category belongs to.
    type_id: int = Field(foreign_key="categorytype.id")

    # This lets us create sub-categories. For example, "Groceries" could be a parent category,
    # and "Fruit" and "Vegetables" could be its children.
    parent_id: Optional[int] = Field(default=None, foreign_key="category.id")

    # This is the name of the file for the category's icon.
    icon_file: Optional[str] = None


# This defines the structure of the data that we expect when we update a category.
class CategoryUpdate(SQLModel):
    """This is the data we need to update a category."""
    name: Optional[str] = None
    type_id: Optional[int] = None
    parent_id: Optional[int] = None
    icon_file: Optional[str] = None



###############################################################################
# Core business entities
###############################################################################
# This defines the structure of a "Recipient" object in our database.
class Recipient(SQLModel, table=True):
    """
    A recipient is a person or company that you pay money to or receive money from.
    """
    id: Optional[int] = Field(default=None, primary_key=True) # A unique number to identify the recipient.
    name: str # The name of the recipient.
    address: Optional[str] = None # The address of the recipient (this is optional).


# This is the base model for a payment item. It contains all the fields that are common to all payment items.
class PaymentItemBase(SQLModel):
    """
    This is the basic building block for a payment item.
    """
    amount: float  # The amount of the payment.
    date: datetime  # The date of the payment.
    periodic: bool = False # Whether the payment is periodic.
    description: Optional[str] = None  # A description of the payment (this is optional).

    # In the future, we could add fields here for attachments like invoices or product images.
    invoice_path: Optional[str] = None
    product_image_path: Optional[str] = None
    # This is the ID of the recipient of the payment.
    recipient_id: Optional[int] = Field(default=None, foreign_key="recipient.id")

# This is the actual database model for a payment item. It inherits all the fields from PaymentItemBase.
class PaymentItem(PaymentItemBase, table=True):
    """
    This is the full database model for a payment item.
    """
    id: Optional[int] = Field(default=None, primary_key=True) # A unique number to identify the payment item.

# ==============================================================================
# API Models (Pydantic Schemas) for PaymentItem
# ==============================================================================

# This defines the structure of the data that we expect when we create a new payment item.
class PaymentItemCreate(PaymentItemBase):
    """
    This is the data we need to create a new payment item.
    """
    category_ids: Optional[List[int]] = [] # A list of the IDs of the categories that this payment belongs to.

# This defines the structure of the data that we expect when we update a payment item.
class PaymentItemUpdate(PaymentItemBase):
    """
    This is the data we need to update a payment item.
    All the fields are optional, so you can update just one field at a time if you want.
    """
    amount: Optional[float] = None
    date: Optional[datetime] = None
    periodic: Optional[bool] = None
    description: Optional[str] = None
    invoice_path: Optional[str] = None
    product_image_path: Optional[str] = None
    recipient_id: Optional[int] = None
    category_ids: Optional[List[int]] = None

# This defines the structure of the data that we send back to the user when they ask for a payment item.
class PaymentItemRead(PaymentItemBase):
    """
    This is the data we send back to the user when they ask for a payment item.
    It includes the full recipient and category objects, so the user has all the information they need.
    """
    id: int
    recipient: Optional[Recipient] = None
    categories: List[Category] = []
