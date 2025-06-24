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

# This section brings in all the tools we need to build our app's server.
from typing import List, Optional

# FastAPI is the main tool we use to build our server.
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
# This is for sending files back to the user.
from fastapi.responses import FileResponse
# This is for working with file paths.
from pathlib import Path
# This is for copying files.
import shutil
# This is for working with our database.
from sqlmodel import Session, select

# This imports the functions and data structures we need from other parts of our app.
from app.database import create_db_and_tables, get_session
from app.models import (
    PaymentItem,
    PaymentItemCreate,
    PaymentItemRead,
    PaymentItemUpdate,
    CategoryType,
    Category,
    CategoryUpdate,
    Recipient,
    PaymentItemCategoryLink,
)

# This creates our main FastAPI app.
app = FastAPI(title="FinanceBook API", version="0.1.0")

# This is the directory where we'll store the icons for our categories.
ICON_DIR = Path("icons")
ICON_DIR.mkdir(exist_ok=True)


# This function runs when our app starts up.
@app.on_event("startup")
def on_startup() -> None:
    """This function creates the database tables and adds some default data when the app starts."""
    create_db_and_tables()
    initialize_default_data()


def initialize_default_data() -> None:
    """This function adds some default data to our database, like the "standard" category type and the "UNCLASSIFIED" category."""
    from app.database import engine
    with Session(engine) as session:
        # We check if the "standard" category type already exists.
        standard_type = session.exec(
            select(CategoryType).where(CategoryType.name == "standard")
        ).first()
        
        # If it doesn't exist, we create it.
        if not standard_type:
            standard_type = CategoryType(
                name="standard",
                description="Default category type for basic expense/income classification"
            )
            session.add(standard_type)
            session.commit()
            session.refresh(standard_type)

        # We also check if the "UNCLASSIFIED" category already exists.
        unclassified = session.exec(
            select(Category).where(Category.name == "UNCLASSIFIED")
        ).first()
        # If it doesn't exist, we create it.
        if not unclassified:
            unclassified = Category(
                name="UNCLASSIFIED",
                type_id=standard_type.id,
                parent_id=None,
            )
            session.add(unclassified)
            session.commit()



# ---------------------------------------------------------------------------
# Payment Item Endpoints
# ---------------------------------------------------------------------------
# This function creates a new payment item in our database.
@app.post("/payment-items", response_model=PaymentItemRead)
def create_payment_item(
    item_create: PaymentItemCreate,
    session: Session = Depends(get_session),
) -> PaymentItem:
    # First, we check if the recipient exists.
    if item_create.recipient_id:
        recipient = session.get(Recipient, item_create.recipient_id)
        if not recipient:
            raise HTTPException(status_code=404, detail=f"Recipient with id {item_create.recipient_id} not found")

    # Then, we check if the categories exist.
    category_ids = []
    if item_create.category_ids:
        seen_types = set()
        for cat_id in item_create.category_ids:
            category = session.get(Category, cat_id)
            if not category:
                raise HTTPException(status_code=404, detail=f"Category with id {cat_id} not found")
            if category.type_id in seen_types:
                raise HTTPException(status_code=400, detail="Only one category per type is allowed")
            seen_types.add(category.type_id)
            category_ids.append(cat_id)
    else:
        # If no categories are provided, we assign the "UNCLASSIFIED" category.
        default_cat = session.exec(select(Category).where(Category.name == "UNCLASSIFIED")).first()
        if default_cat:
            category_ids.append(default_cat.id)

    # We create a new payment item with the provided data.
    item_data = item_create.dict(exclude={"category_ids"})
    db_item = PaymentItem(**item_data)

    # We add the new payment item to the database.
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    
    # We link the payment item to its categories.
    if category_ids:
        for cat_id in category_ids:
            link = PaymentItemCategoryLink(payment_item_id=db_item.id, category_id=cat_id)
            session.add(link)
        session.commit()

    return db_item


# This function gets a list of all the payment items from our database.
@app.get("/payment-items", response_model=List[PaymentItemRead])
def list_payment_items(
    expense_only: bool = False,
    income_only: bool = False,
    category_ids: Optional[List[int]] = Query(None, description="List of category IDs to filter by"),
    session: Session = Depends(get_session),
) -> List[PaymentItem]:
    # We can't filter by both expenses and incomes at the same time.
    if expense_only and income_only:
        raise HTTPException(status_code=400, detail="Choose only one filter: expense_only or income_only")

    # We start with a query that gets all the payment items.
    query = select(PaymentItem)
    # If the user wants to see only expenses, we add a filter to the query.
    if expense_only:
        query = query.where(PaymentItem.amount < 0)
    # If the user wants to see only incomes, we add a filter to the query.
    if income_only:
        query = query.where(PaymentItem.amount > 0)

    # If the user wants to filter by categories, we add a filter to the query.
    if category_ids:
        # We also include all the sub-categories of the selected categories.
        expanded_ids: set[int] = set(category_ids)

        def gather_descendants(root_id: int) -> None:
            queue = [root_id]
            while queue:
                current = queue.pop(0)
                children = session.exec(select(Category.id).where(Category.parent_id == current)).all()
                for child_id in children:
                    if child_id not in expanded_ids:
                        expanded_ids.add(child_id)
                        queue.append(child_id)

        for cat_id in list(category_ids):
            gather_descendants(cat_id)

        query = (
            query.join(
                PaymentItemCategoryLink,
                PaymentItem.id == PaymentItemCategoryLink.payment_item_id,
            )
            .where(PaymentItemCategoryLink.category_id.in_(expanded_ids))
            .distinct()
        )

    return session.exec(query).all()


# This function gets a single payment item from our database, by its ID.
@app.get("/payment-items/{item_id}", response_model=PaymentItemRead)
def get_payment_item(item_id: int, session: Session = Depends(get_session)) -> PaymentItem:
    item = session.get(PaymentItem, item_id)
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


# This function updates an existing payment item in our database.
@app.put("/payment-items/{item_id}", response_model=PaymentItemRead)
def update_payment_item(
    item_id: int,
    item_update: PaymentItemUpdate,
    session: Session = Depends(get_session),
) -> PaymentItem:
    db_item = session.get(PaymentItem, item_id)
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")

    # We update the payment item with the new data.
    update_data = item_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        if key != "category_ids":
            setattr(db_item, key, value)

    # We check if the recipient exists.
    if item_update.recipient_id:
        recipient = session.get(Recipient, item_update.recipient_id)
        if not recipient:
            raise HTTPException(status_code=404, detail=f"Recipient with id {item_update.recipient_id} not found")
        db_item.recipient_id = item_update.recipient_id

    # We check if the categories exist.
    if item_update.category_ids is not None:
        categories = []
        seen_types = set()
        if item_update.category_ids:
            for cat_id in item_update.category_ids:
                category = session.get(Category, cat_id)
                if not category:
                    raise HTTPException(status_code=404, detail=f"Category with id {cat_id} not found")
                if category.type_id in seen_types:
                    raise HTTPException(status_code=400, detail="Only one category per type is allowed")
                seen_types.add(category.type_id)
                categories.append(category)
        else:
            # If no categories are provided, we assign the "UNCLASSIFIED" category.
            default_cat = session.exec(select(Category).where(Category.name == "UNCLASSIFIED")).first()
            if default_cat:
                categories.append(default_cat)
        db_item.categories = categories

    # We save the changes to the database.
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


# This function deletes a payment item from our database.
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
# This function creates a new category type in our database.
@app.post("/category-types", response_model=CategoryType)
def create_category_type(
    ct: CategoryType, session: Session = Depends(get_session)
) -> CategoryType:
    session.add(ct)
    session.commit()
    session.refresh(ct)
    return ct


# This function gets a list of all the category types from our database.
@app.get("/category-types", response_model=List[CategoryType])
def list_category_types(session: Session = Depends(get_session)) -> List[CategoryType]:
    return session.exec(select(CategoryType)).all()


# ---------------------------------------------------------------------------
# Category Endpoints
# ---------------------------------------------------------------------------
# This function creates a new category in our database.
@app.post("/categories", response_model=Category)
def create_category(category: Category, session: Session = Depends(get_session)) -> Category:
    # We check if the parent category and category type exist.
    if category.parent_id and not session.get(Category, category.parent_id):
        raise HTTPException(status_code=404, detail="Parent category not found")
    if not session.get(CategoryType, category.type_id):
        raise HTTPException(status_code=404, detail="Category type not found")

    session.add(category)
    session.commit()
    session.refresh(category)
    return category


# This function updates an existing category in our database.
@app.put("/categories/{category_id}", response_model=Category)
def update_category(
    category_id: int,
    category_update: CategoryUpdate,
    session: Session = Depends(get_session),
) -> Category:
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = category_update.dict(exclude_unset=True)

    # We check if the parent category and category type exist.
    if "parent_id" in update_data and update_data["parent_id"] is not None:
        if not session.get(Category, update_data["parent_id"]):
            raise HTTPException(status_code=404, detail="Parent category not found")

    if "type_id" in update_data and update_data["type_id"] is not None:
        if not session.get(CategoryType, update_data["type_id"]):
            raise HTTPException(status_code=404, detail="Category type not found")

    for key, value in update_data.items():
        setattr(category, key, value)

    session.add(category)
    session.commit()
    session.refresh(category)
    return category


# This function gets a category and all its children from our database.
@app.get("/categories/{category_id}/tree", response_model=Category)
def get_category_tree(category_id: int, session: Session = Depends(get_session)) -> Category:
    category = session.get(Category, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return category


# This function gets all the descendants of a category from our database.
@app.get("/categories/{category_id}/descendants", response_model=List[Category])
def list_category_descendants(category_id: int, session: Session = Depends(get_session)) -> List[Category]:
    root = session.get(Category, category_id)
    if not root:
        raise HTTPException(status_code=404, detail="Category not found")
    descendants: List[Category] = []
    queue = [category_id]
    while queue:
        current = queue.pop(0)
        children = session.exec(select(Category).where(Category.parent_id == current)).all()
        for child in children:
            descendants.append(child)
            queue.append(child.id)
    return descendants
# This function gets a list of all the categories for a specific type from our database.
@app.get("/categories/by-type/{type_id}", response_model=List[Category])
def list_categories_by_type(
    type_id: int, session: Session = Depends(get_session)
) -> List[Category]:
    return session.exec(select(Category).where(Category.type_id == type_id)).all()


# This function gets a list of all the categories from our database, regardless of their type.
@app.get("/categories", response_model=List[Category])
def list_all_categories(session: Session = Depends(get_session)) -> List[Category]:
    """This function gets all the categories from our database, regardless of their type."""
    return session.exec(select(Category)).all()


# ---------------------------------------------------------------------------
# Recipient Endpoints
# ---------------------------------------------------------------------------
# This function creates a new recipient in our database.
@app.post("/recipients", response_model=Recipient)
def create_recipient(recipient: Recipient, session: Session = Depends(get_session)) -> Recipient:
    session.add(recipient)
    session.commit()
    session.refresh(recipient)
    return recipient


# This function gets a list of all the recipients from our database.
@app.get("/recipients", response_model=List[Recipient])
def list_recipients(session: Session = Depends(get_session)) -> List[Recipient]:
    return session.exec(select(Recipient)).all()


# This function gets a single recipient from our database, by their ID.
@app.get("/recipients/{recipient_id}", response_model=Recipient)
def get_recipient(
    recipient_id: int, session: Session = Depends(get_session)
) -> Recipient:
    """This function gets a single recipient from our database, by their ID."""
    recipient = session.get(Recipient, recipient_id)
    if not recipient:
        raise HTTPException(status_code=404, detail="Recipient not found")
    return recipient


# ---------------------------------------------------------------------------
# File Upload/Download Endpoints
# ---------------------------------------------------------------------------
# This function uploads an icon for a category.
@app.post("/uploadicon/")
def upload_icon(file: UploadFile = File(...)) -> dict:
    """This function saves an uploaded icon file and returns its filename."""
    file_path = ICON_DIR / file.filename
    with open(file_path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    return {"filename": file.filename}


# This function downloads an icon for a category.
@app.get("/download_static/{filename}")
def download_icon(filename: str) -> FileResponse:
    """This function serves an uploaded icon file."""
    file_path = ICON_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)
