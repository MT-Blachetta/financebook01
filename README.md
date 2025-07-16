# FinanceBook - Private Finance Management Application

FinanceBook is a web application designed for managing private finances and cash flows. It features an Android-first (though currently web-focused) approach with a unified backend, state-of-the-art technologies, and a modern design, aiming to be a fully-fledged marketable product.

This project was taken over mid-development. This README describes its current state and how to operate it.

## Core Features (Current Implementation)

*   **Payment Item Management**:
    *   Create, Read, Update, Delete (CRUD) operations for payment items.
    *   Each item includes amount, date/time, periodicity, an optional recipient, multiple categories, and an optional attachment URL.
    *   Items are classified as "Income" (positive amount) or "Expense" (negative amount).
*   **Category Management**:
    *   Define custom "Category Types" (e.g., "Spending Area", "Payment Method").
    *   Create and edit nested categories under these types. Each category may
        optionally have a PNG icon uploaded via the API.
    *   A default `UNCLASSIFIED` category is created on first run so that every
        payment item has at least one tag.
*   **Recipient Management**:
    *   Create and list recipients (persons or organizations).
*   **Filtering**:
    *   Filter payment items on the summary page by "All", "Incomes", or "Expenses".
    *   Filter by one or more categories. The backend expands selected
        categories to include all of their descendants so parent selections work
        intuitively.
*   **User Interface**:
    *   A summary page listing all payment items, sorted by date, with a running
        total and optional category filters.
    *   Forms for adding and editing payment items. Successful creation leads to
        a short confirmation page.
    *   Pages for managing category types **and** the category tree itself.
    *   Navigation drawer for accessing different sections.

## Project Structure

The project is divided into two main parts: a Python/FastAPI backend and a React/TypeScript frontend.

### Backend (`/app` directory)

*   **`main.py`**: Contains all FastAPI routes for payment items, categories,
    category types, and recipients.  Notable endpoints include:
    *   `POST /payment-items` – create a payment record.
    *   `GET /payment-items` – list items with optional income/expense and
        category filters.
    *   `POST /uploadicon/` and `GET /download_static/{filename}` – upload and
        retrieve PNG icons for categories.
    *   `GET /categories/{id}/descendants` – fetch the full subtree of a
        category.
    *   `GET /categories/by-type/{type_id}` – list categories belonging to a
        specific category type.
    The module handles HTTP requests, data validation and interaction with the
    database via SQLModel.
*   **`models.py`**: Defines the data structures (SQLModel classes) for `PaymentItem`, `Category`, `CategoryType`, `Recipient`, and the association table `PaymentItemCategoryLink`. These models map directly to database tables and are used for request/response validation.
*   **`database.py`**: Manages database connection (SQLite by default) and table creation using SQLModel.
*   **`financebook.db`**: The SQLite database file (created on first run).

### Frontend (`/frontend` directory)

*   **`src/`**: Contains all the React application source code.
    *   **`main.tsx`**: Entry point of the React application, sets up React Query and React Router.
    *   **`App.tsx`**: Root component defining global layout, routes, and the main navigation drawer.
    *   **`api/hooks.ts`**: Custom React Query hooks (`useQuery`, `useMutation`) for interacting with the backend API. Provides a clean abstraction for data fetching and state management related to API calls.
    *   **`components/`**: Reusable UI components.
        *   **`NavigationBar.tsx`**: Top navigation bar with filtering options and menu trigger.
        *   **`PaymentItemForm.tsx`**: Form used for creating and editing payment items, including recipient and category selection, and attachment input.
    *   **`pages/`**: Components representing different views/pages of the application.
        *   **`SummaryPage.tsx`**: Displays the list of payment items, totals and filtering options.
        *   **`AddItemPage.tsx`** / **`AddSuccessPage.tsx`**: Create a new payment and show a confirmation screen.
        *   **`EditItemPage.tsx`**: Edit an existing payment item.
        *   **`CategoryManagerPage.tsx`**: Manage category types.
        *   **`CategoryEditPage.tsx`**: Full CRUD interface for categories including icon upload.
        *   **`NotFoundPage.tsx`**: 404 error page.
    *   **`types.ts`**: TypeScript interfaces defining the shape of data objects (e.g., `PaymentItem`, `Category`) shared across the frontend, mirroring backend models.
    *   **`styles/globalStyle.ts`**: Global CSS styles and theme variables.
    *   **`assets/`**: Static assets like SVG icons.
*   **`package.json`**: Defines project metadata, scripts (dev, build, preview), and dependencies.
*   **`vite.config.ts`**: Configuration for Vite, the frontend build tool. Includes proxy setup for API requests to the backend.
*   **`tsconfig.json`**: TypeScript compiler configuration.

## Running the Application

You need Node.js and npm (or yarn) for the frontend, and Python with pip for the backend.

### 1. Backend (FastAPI)

Navigate to the project root directory (`financebook01`).

**Setup:**

1.  **Create a virtual environment (recommended):**
2.  Before Creating the virtual environment, store the DATABASE_URL to the previous created '.env' file
    (DATABASE_URL=postgresql+psycopg2://yourself:secretPassword@localhost/financebook),
    then create and activate the virtual environment with: 
    ```bash
    python -m venv .venv
    source .venv/bin/activate  # On Windows: .venv\Scripts\activate
    ```
    next you
4.  **Install dependencies:**
    ```bash
    pip install --upgrade pip setuptools wheel
    pip install -r requirements.txt
    ```
The `requirements.txt` file should include `fastapi`, `uvicorn`, `sqlmodel`, etc.
If you get a "uvicorn: command not found" error, ensure the virtual environment is activated
and the dependencies were installed with `pip install -r requirements.txt`.

**Create Docker image and start the postgresql docker container**
```bash
sudo docker build -t financebook-postgres .
sudo docker run -d --name financebook-db -p 5432:5432 -v postgres_data:/home/username/Projects/database financebook-postgres
```
Remember to set the DATABASE_URL correctly matching the credentials in the Dockerfile.

**Running the backend server:**

```bash
uvicorn app.main:app --reload --port 8000
```
The backend API will be available at `http://localhost:8000`. You can access the OpenAPI documentation at `http://localhost:8000/docs`.

### 2. Frontend (React with Vite)

Navigate to the `frontend` directory (`financebook01/frontend`).

**Setup:**

1.  **Install dependencies:**
    If you encountered issues with `npm` or `yarn` not being found previously, ensure one is installed and available in your PATH.
    ```bash
    npm install
    ```
    or if you prefer yarn:
    ```bash
    yarn install
    ```

**Running the frontend development server:**

```bash
npm run dev
```
or
```bash
yarn dev
```
The frontend application will be available at `http://localhost:5173` (or another port if 5173 is busy). API requests from the frontend are proxied to the backend at `http://localhost:8000/api` as configured in `vite.config.ts`.

## Code Explanation & How it Works

### Backend Logic

*   **Data Models (`models.py`)**: SQLModel is used to define Python classes that are simultaneously Pydantic models (for data validation and serialization) and SQLAlchemy models (for database interaction). Relationships like one-to-many (e.g., `Recipient` to `PaymentItem`) and many-to-many (e.g., `PaymentItem` to `Category` via `PaymentItemCategoryLink`) are defined here.
*   **API Endpoints (`main.py`)**: FastAPI uses these models to automatically validate request bodies and serialize responses. Each endpoint function typically:
    1.  Receives a database `Session` via dependency injection (`Depends(get_session)`).
    2.  Takes Pydantic models as request bodies (e.g., `item: PaymentItem` in `create_payment_item`).
    3.  Uses SQLModel's query interface (e.g., `select(PaymentItem)`) to interact with the database.
    4.  Commits changes (`session.commit()`) and refreshes objects (`session.refresh()`) to get updated state from the DB.
    5.  Returns the SQLModel objects, which FastAPI automatically converts to JSON.
*   **Database (`database.py`)**: A simple SQLite database is used. The `create_db_and_tables()` function initializes the schema if the database file doesn't exist.

### Frontend Logic

*   **State Management (React Query)**: API state (data fetched from the server, loading/error states, mutations) is managed by TanStack React Query (`@tanstack/react-query`). Custom hooks in `api/hooks.ts` wrap `useQuery` (for fetching data) and `useMutation` (for creating, updating, deleting data). This provides caching, automatic refetching, and a clean way to handle server state.
*   **Routing (React Router)**: `react-router-dom` is used for client-side routing. Routes are defined in `App.tsx`, mapping URL paths to page components. `useNavigate` is used for programmatic navigation, and `useParams` for accessing URL parameters (e.g., item ID for editing). `useSearchParams` is used for managing filters in URL query strings.
*   **Component Structure**:
    *   **Pages (`pages/`)**: Top-level components for different views. They often fetch data using API hooks and pass it down to presentational components.
    *   **Reusable Components (`components/`)**: Smaller, often presentational, components like forms, navigation bars, etc.
    *   **Styling (Styled Components)**: `styled-components` is used for CSS-in-JS, allowing component-scoped styles and dynamic styling based on props. Global styles are in `styles/globalStyle.ts`.
*   **Type Safety (TypeScript)**: The entire frontend is written in TypeScript. Interfaces in `types.ts` define the structure of data exchanged with the backend, ensuring type safety throughout the application.
*   **Build Process (Vite)**: Vite provides a fast development server with Hot Module Replacement (HMR) and an optimized build process for production. The `vite.config.ts` includes a proxy to forward `/api` requests from the frontend dev server to the backend API server, avoiding CORS issues during development.

## Further Development & TODOs

*   **Attachment Uploads**: The backend supports uploading PNG icons for
    categories, but payment item attachments (invoices, product images) are still
    TODO.
*   **Category Tree Visualisation**: The current editor is functional but could
    benefit from a more intuitive drag-and-drop tree view.
*   **User Authentication & Authorization**: Secure the application.
*   **Advanced Reporting & Visualization**: Add charts and reports for financial
    analysis.
*   **Testing**: Implement unit and integration tests for both backend and
    frontend.
*   **Deployment**: Document deployment procedures for production environments.
*   **UI/UX Polish**: Continue refining the user interface and experience.
