"""
FastAPI routes for FinanceBook.

This module exposes a clean REST interface for the core domain model defined in
`app.models`.  Each route is intentionally **thin**—it performs minimal
validation, persists data via SQLModel, and returns the resulting objects in a
JSON-serialisable form.  Business logic that doesn’t belong in an HTTP layer
(e.g. automatic tag roll-up, scheduled creation of periodic payments) should
live in its own service module so the web boundary remains easy to test.

Endpoint overview
-----------------
/payment-items            CRUD for cash-flow records (supports income/expense filter)
/category-types           Manage user-defined classification dimensions
/categories               Manage individual tags (nested trees)
/recipients               CRUD for involved persons or organisations
"""

from typing import List, Optional

from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.responses import FileResponse
import os
from sqlmodel import Session, select

from app.database import create_db_and_tables, get_session
from app.models import (
    PaymentItem,
    PaymentItemCreate,
    PaymentItemRead,
    PaymentItemUpdate,
    CategoryType,
    Category,
    Recipient,
    PaymentItemCategoryLink, # Import for joining
)

app = FastAPI(title="FinanceBook API", version="0.1.0")

# Directory to store uploaded category icons
ICON_UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploaded_icons")
os.makedirs(ICON_UPLOAD_DIR, exist_ok=True)


@app.on_event("startup")
def on_startup() -> None:
    """Create tables on first run and initialize default data."""
    create_db_and_tables()
    initialize_default_data()


def initialize_default_data() -> None:
    """Initialize default data like the 'standard' category type."""
    from app.database import engine
    with Session(engine) as session:
        # Check if 'standard' category type already exists
        standard_type = session.exec(
            select(CategoryType).where(CategoryType.name == "standard")
        ).first()
        
        if not standard_type:
            # Create the default 'standard' category type
            standard_type = CategoryType(
                name="standard",
                description="Default category type for basic expense/income classification"
            )
            session.add(standard_type)
            session.commit()
            session.refresh(standard_type)


# ---------------------------------------------------------------------------
# Payment Item Endpoints
# ---------------------------------------------------------------------------
@app.post("/payment-items", response_model=PaymentItemRead)
def create_payment_item(
    item_create: PaymentItemCreate,
    session: Session = Depends(get_session),
) -> PaymentItem:
    # 1. Validate recipient if provided
    if item_create.recipient_id:
        recipient = session.get(Recipient, item_create.recipient_id)
        if not recipient:
            raise HTTPException(status_code=404, detail=f"Recipient with id {item_create.recipient_id} not found")

    # 2. Validate categories if provided
    category_ids = []
    if item_create.category_ids:
        for cat_id in item_create.category_ids:
            category = session.get(Category, cat_id)
            if not category:
                raise HTTPException(status_code=404, detail=f"Category with id {cat_id} not found")
            category_ids.append(cat_id)

    # 3. Create PaymentItem instance from the payload
    item_data = item_create.dict(exclude={"category_ids"})
    db_item = PaymentItem(**item_data)

    # 4. Add to session and commit
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    
    # 5. Add category links if provided
    if category_ids:
        for cat_id in category_ids:
            link = PaymentItemCategoryLink(payment_item_id=db_item.id, category_id=cat_id)
            session.add(link)
        session.commit()

    return db_item


@app.get("/payment-items", response_model=List[PaymentItemRead])
def list_payment_items(
    expense_only: bool = False,
    income_only: bool = False,
    category_ids: Optional[List[int]] = Query(None, description="List of category IDs to filter by"),
    session: Session = Depends(get_session),
) -> List[PaymentItem]:
  if expense_only and income_only:
    raise HTTPException(status_code=400, detail="Choose only one filter: expense_only or income_only")

  query = select(PaymentItem)
  if expense_only:
    query = query.where(PaymentItem.amount < 0)
  if income_only:
    query = query.where(PaymentItem.amount > 0)
  
  if category_ids:
    # To filter by categories, we need to join PaymentItem with PaymentItemCategoryLink
    # and then filter by the category_id in PaymentItemCategoryLink.
    # We also want distinct payment items if an item belongs to multiple selected categories.
    # By joining from PaymentItem to the link table, we can filter by category_id.
    # We must explicitly provide the ON clause for the join.
    query = query.join(
        PaymentItemCategoryLink,
        PaymentItem.id == PaymentItemCategoryLink.payment_item_id
    ).where(PaymentItemCategoryLink.category_id.in_(category_ids)).distinct()
    
  return session.exec(query).all()


@app.get("/payment-items/{item_id}", response_model=PaymentItemRead)
def get_payment_item(item_id: int, session: Session = Depends(get_session)) -> PaymentItem:
    item = session.get(PaymentItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@app.put("/payment-items/{item_id}", response_model=PaymentItemRead)
def update_payment_item(
    item_id: int,
    item_update: PaymentItemUpdate,
    session: Session = Depends(get_session),
) -> PaymentItem:
    db_item = session.get(PaymentItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    # 1. Update standard fields
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key != "category_ids": # Defer category update
            setattr(db_item, key, value)

    # 2. Validate and update recipient if provided
    if item_update.recipient_id:
        recipient = session.get(Recipient, item_update.recipient_id)
        if not recipient:
            raise HTTPException(status_code=404, detail=f"Recipient with id {item_update.recipient_id} not found")
        db_item.recipient_id = item_update.recipient_id

    # 3. Validate and update categories if provided
    if item_update.category_ids is not None:
        categories = []
        if item_update.category_ids: # If list is not empty
            for cat_id in item_update.category_ids:
                category = session.get(Category, cat_id)
                if not category:
                    raise HTTPException(status_code=404, detail=f"Category with id {cat_id} not found")
                categories.append(category)
        db_item.categories = categories # Replace existing categories

    # 4. Commit and refresh
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


@app.delete("/payment-items/{item_id}", status_code=204)
def delete_payment_item(item_id: int, session: Session = Depends(get_session)) -> None:
    item = session.get(PaymentItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    session.delete(item)
    session.commit()


# ---------------------------------------------------------------------------
# Category Type Endpoints
# ---------------------------------------------------------------------------
@app.post("/category-types", response_model=CategoryType)
def create_category_type(
    ct: CategoryType, session: Session = Depends(get_session)
) -> CategoryType:
    session.add(ct)
    session.commit()
    session.refresh(ct)
    return ct


@app.get("/category-types", response_model=List[CategoryType])
def list_category_types(session: Session = Depends(get_session)) -> List[CategoryType]:
    return session.exec(select(CategoryType)).all()


# ---------------------------------------------------------------------------
# Category Endpoints
# ---------------------------------------------------------------------------
@app.post("/categories", response_model=Category)
def create_category(category: Category, session: Session = Depends(get_session)) -> Category:
    # Parent/type validation
    if category.parent_id and not session.get(Category, category.parent_id):
        raise HTTPException(status_code=404, detail="Parent category not found")
    if not session.get(CategoryType, category.type_id):
        raise HTTPException(status_code=404, detail="Category type not found")

    session.add(category)
    session.commit()
    session.refresh(category)
    return category


@app.get("/categories/{category_id}/tree", response_model=Category)
def get_category_tree(category_id: int, session: Session = Depends(get_session)) -> Category:
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    # children are lazy-loaded; FastAPI serialises recursively
    return category


@app.get("/categories/by-type/{type_id}", response_model=List[Category])
def list_categories_by_type(
    type_id: int, session: Session = Depends(get_session)
) -> List[Category]:
    return session.exec(select(Category).where(Category.type_id == type_id)).all()


@app.get("/categories", response_model=List[Category])
def list_all_categories(session: Session = Depends(get_session)) -> List[Category]:
    """Get all categories regardless of their type."""
    return session.exec(select(Category)).all()


# ---------------------------------------------------------------------------
# Icon Upload/Download Endpoints
# ---------------------------------------------------------------------------
@app.post("/uploadicon/")
async def upload_icon(file: UploadFile = File(...)):
    """Save uploaded icon file and return its filename."""
    file_path = os.path.join(ICON_UPLOAD_DIR, file.filename)
    with open(file_path, "wb") as f:
        contents = await file.read()
        f.write(contents)
    return {"filename": file.filename}


@app.get("/download_static/{filename}")
def download_static(filename: str):
    """Serve uploaded static files."""
    file_path = os.path.join(ICON_UPLOAD_DIR, filename)
    if not os.path.isfile(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)


# ---------------------------------------------------------------------------
# Recipient Endpoints
# ---------------------------------------------------------------------------
@app.post("/recipients", response_model=Recipient)
def create_recipient(recipient: Recipient, session: Session = Depends(get_session)) -> Recipient:
    session.add(recipient)
    session.commit()
    session.refresh(recipient)
    return recipient


@app.get("/recipients", response_model=List[Recipient])
def list_recipients(session: Session = Depends(get_session)) -> List[Recipient]:
    return session.exec(select(Recipient)).all()
