/**
 * Domain TypeScript definitions shared across the entire web-front-end.
 *
 * These interfaces are intentionally kept in sync with the Pydantic/SQLModel
 * schemas exposed by the FastAPI backend (see `app/models.py`).  By colocating
 * them in a single module we avoid cyclic imports and gain a single source of
 * truth for the shape of API data.
 *
 * ⚠️  Keep breaking changes backwards-compatible where possible!  Persisted
 *     production data depends on these contracts.
 */

// This defines the structure of a "Recipient" object.
// A recipient is a person or company that you pay money to or receive money from.
export interface Recipient {
  id: number; // A unique number to identify the recipient.
  name: string; // The name of the recipient.
  address?: string | null; // The address of the recipient (this is optional).
}

/**
 * A Category is part of a *tree* that belongs to a `CategoryType`.  Every
 * category may have a parent (null for roots) and any number of children.  The
 * backend sends children recursively so the front-end can build a tree view.
 */
// This defines the structure of a "Category" object.
// A category is a way to group your payments, like "Groceries" or "Salary".
export interface Category {
  id: number; // A unique number to identify the category.
  name: string; // The name of the category.
  type_id: number; // The ID of the category type that this category belongs to.
  parent_id?: number | null; // The ID of the parent category (if this is a sub-category).
  icon_file?: string | null; // The name of the file for the category's icon.
  children?: Category[]; // A list of all the sub-categories of this category.
}

/** This defines the structure of a "CategoryType" object.
 * A category type is a way to group your categories, like "Expense Type" or "Income Source".
 */
export interface CategoryType {
  id: number; // A unique number to identify the category type.
  name: string; // The name of the category type.
  description?: string | null; // A description of the category type (this is optional).
}

/**
 * Top-level cash-flow record.
 *
 * A positive amount is an income, a negative amount an expense.
 */
// This defines the structure of a "PaymentItem" object.
// A payment item is a single transaction, like a purchase or a deposit.
export interface PaymentItem {
  id: number; // A unique number to identify the payment item.
  amount: number; // The amount of the payment.
  date: string; // The date of the payment.
  periodic: boolean; // Whether the payment is periodic.
  description?: string | null; // A description of the payment (this is optional).

  // These are the relationships between a payment item and other objects.
  recipient_id?: number | null; // The ID of the recipient of the payment.
  recipient?: Recipient | null; // The recipient object itself.

  categories?: Category[]; // A list of all the categories that this payment belongs to.
  attachment_url?: string | null; // A link to an image or PDF attachment for the payment.
}

/** These are helper functions that make it easy to check if a payment is an expense or an income. */
export const isExpense = (item: PaymentItem): boolean => item.amount < 0;
export const isIncome = (item: PaymentItem): boolean => item.amount >= 0;

/**
 * This defines the structure of the summary totals that we'll get from the server in the future.
 */
export interface SummaryTotals {
  totalIncome: number; // The total amount of all incomes.
  totalExpenses: number; // The total amount of all expenses.
  net: number; // The difference between the total income and total expenses.
}

/**
 * This defines the structure of the data that we send to the server when we create or update a payment item.
 */
export type PaymentItemFormData = {
  id?: number; // The ID of the payment item (if we're updating an existing one).
  amount: number; // The amount of the payment.
  date: string; // The date of the payment.
  periodic: boolean; // Whether the payment is periodic.
  description?: string | null; // A description of the payment (this is optional).
  recipient_id?: number | null; // The ID of the recipient of the payment.
  category_ids?: number[]; // A list of the IDs of the categories that this payment belongs to.
  attachment_url?: string | null; // A link to an image or PDF attachment for the payment.
};
