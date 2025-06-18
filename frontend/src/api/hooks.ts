/**
 * Thin abstraction over TanStack React-Query that provides ready-to-use hooks
 * for the FinanceBook REST API.
 *
 * Each hook follows the convention `useXyz` and internally uses Axios for HTTP
 * requests.  Keep the layer intentionally *thin*:  we do not try to replicate a
 * full-fledged SDK but merely offer convenience wrappers so UI components stay
 * declarative.
 */

import axios from 'axios';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PaymentItem, Recipient, Category, CategoryType } from '../types';

/* -------------------------------------------------------------------------- */
/* Axios Instance                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Axios instance with sensible defaults:
 *   – Base URL `/api` so Vite proxy forwards to FastAPI (:8000)
 *   – 10 s timeout to avoid hanging UI
 */
const api = axios.create({
  baseURL: '/api',
  timeout: 10_000,
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Build query-string from optional filters. */
function buildPaymentQuery(params: {
  expense_only?: boolean;
  income_only?: boolean;
  category_ids?: number[];
}): string {
  const usp = new URLSearchParams();
  if (params.expense_only) usp.set('expense_only', 'true');
  if (params.income_only) usp.set('income_only', 'true');
  if (params.category_ids && params.category_ids.length > 0) {
    params.category_ids.forEach(id => usp.append('category_ids', id.toString()));
  }
  return usp.toString() ? `?${usp.toString()}` : '';
}

/* -------------------------------------------------------------------------- */
/* Hooks                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Fetch all payment items, optionally filtered by type.
 *
 * The hook returns a React-Query result object:
 *   const { data, isLoading, error } = usePaymentItems({ expenseOnly: true })
 */
export function usePaymentItems(opts?: {
  expenseOnly?: boolean;
  incomeOnly?: boolean;
  categoryIds?: number[];
}) {
  const { expenseOnly = false, incomeOnly = false, categoryIds = [] } = opts ?? {};
  // Sort categoryIds to ensure queryKey is consistent regardless of order
  const sortedCategoryIds = [...categoryIds].sort((a, b) => a - b);
  const queryKey = ['payment-items', expenseOnly, incomeOnly, sortedCategoryIds.join(',')];

  return useQuery<PaymentItem[], Error>({
    queryKey,
    queryFn: async () => {
      const qs = buildPaymentQuery({
        expense_only: expenseOnly,
        income_only: incomeOnly,
        category_ids: categoryIds,
      });
      const res = await api.get<PaymentItem[]>(`/payment-items${qs}`);
      return res.data;
    },
    placeholderData: (previousData) => previousData, // Updated for TanStack Query v5
  });
}

/**
 * Fetch a single payment item by its ID.
 * @param itemId - The ID of the payment item to fetch. Query is disabled if undefined.
 * @returns React-Query result object for the payment item.
 */
export function usePaymentItem(itemId: number | undefined) {
  return useQuery<PaymentItem, Error>({
    queryKey: ['payment-item', itemId],
    queryFn: async () => {
      if (itemId === undefined) {
        // This case should ideally be handled by disabling the query
        // or by the component logic not calling the hook with undefined.
        // Throwing an error or returning null/undefined depends on desired behavior.
        throw new Error('Item ID is undefined');
      }
      const res = await api.get<PaymentItem>(`/payment-items/${itemId}`);
      return res.data;
    },
    enabled: itemId !== undefined, // Only run query if itemId is defined
  });
}

/**
 * Provides a mutation hook for creating a new payment item.
 * Invalidates 'payment-items' query on success.
 * @returns React-Query mutation object.
 */
export function useCreatePaymentItem() {
  const queryClient = useQueryClient();
  // The API now expects a `PaymentItemCreate` schema, which includes `category_ids`.
  // The mutation variable type is generic to accept the form data.
  return useMutation<PaymentItem, Error, { [key: string]: any; category_ids?: number[] }>({
    mutationFn: async (newItem) => {
      const res = await api.post<PaymentItem>('/payment-items', newItem);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-items'] });
    },
  });
}

/**
 * Provides a mutation hook for updating an existing payment item.
 * Invalidates 'payment-items' and specific 'payment-item' queries on success.
 * @returns React-Query mutation object.
 */
export function useUpdatePaymentItem() {
  const queryClient = useQueryClient();
  // The API now expects a `PaymentItemUpdate` schema.
  // The mutation variable type is generic to accept the form data.
  return useMutation<PaymentItem, Error, { id: number; [key: string]: any; category_ids?: number[] }>({
    mutationFn: async (itemToUpdate) => {
      const { id, ...updateData } = itemToUpdate;
      const res = await api.put<PaymentItem>(
        `/payment-items/${id}`,
        updateData
      );
      return res.data;
    },
    onSuccess: (data: PaymentItem) => {
      queryClient.invalidateQueries({ queryKey: ['payment-items'] });
      queryClient.invalidateQueries({ queryKey: ['payment-item', data.id] });
    },
  });
}

/**
 * Provides a mutation hook for deleting a payment item by its ID.
 * Invalidates 'payment-items' query and removes specific 'payment-item' query on success.
 * @returns React-Query mutation object.
 */
export function useDeletePaymentItem() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (itemId: number) => {
      await api.delete(`/payment-items/${itemId}`);
    },
    onSuccess: (_: void, itemId: number) => {
      queryClient.invalidateQueries({ queryKey: ['payment-items'] });
      queryClient.removeQueries({ queryKey: ['payment-item', itemId] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Category Type Hooks                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Fetch all category types.
 * @returns React-Query result object for the list of category types.
 */
export function useCategoryTypes() {
  return useQuery<CategoryType[], Error>({
    queryKey: ['category-types'],
    queryFn: async () => {
      const res = await api.get<CategoryType[]>('/category-types');
      return res.data;
    },
  });
}

/**
 * Provides a mutation hook for creating a new category type.
 * Invalidates 'category-types' query on success.
 * @returns React-Query mutation object.
 */
export function useCreateCategoryType() {
  const queryClient = useQueryClient();
  return useMutation<CategoryType, Error, Omit<CategoryType, 'id'>>({
    mutationFn: async (newType: Omit<CategoryType, 'id'>) => {
      const res = await api.post<CategoryType>('/category-types', newType);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-types'] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Category Hooks                                                             */
/* -------------------------------------------------------------------------- */

/**
 * Fetch all categories for a specific type ID.
 * @param typeId - The ID of the category type. Query is disabled if undefined.
 * @returns React-Query result object for the list of categories.
 */
export function useCategoriesByType(typeId: number | undefined) {
  return useQuery<Category[], Error>({
    queryKey: ['categories-by-type', typeId],
    queryFn: async () => {
      if (typeId === undefined) throw new Error('Type ID is undefined');
      const res = await api.get<Category[]>(`/categories/by-type/${typeId}`);
      return res.data;
    },
    enabled: typeId !== undefined,
  });
}

/**
 * Fetch all categories regardless of their type.
 * @returns React-Query result object for the list of all categories.
 */
export function useAllCategories() {
  return useQuery<Category[], Error>({
    queryKey: ['all-categories'],
    queryFn: async () => {
      const res = await api.get<Category[]>('/categories');
      return res.data;
    },
  });
}

/**
 * Fetch a category and its full children tree by its ID.
 * @param categoryId - The ID of the category. Query is disabled if undefined.
 * @returns React-Query result object for the category tree.
 */
export function useCategoryTree(categoryId: number | undefined) {
  return useQuery<Category, Error>({
    queryKey: ['category-tree', categoryId],
    queryFn: async () => {
      if (categoryId === undefined) throw new Error('Category ID is undefined');
      const res = await api.get<Category>(`/categories/${categoryId}/tree`);
      return res.data;
    },
    enabled: categoryId !== undefined,
  });
}

/**
 * Provides a mutation hook for creating a new category.
 * Invalidates relevant 'categories-by-type' and 'category-tree' queries on success.
 * @returns React-Query mutation object.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, Omit<Category, 'id' | 'children'>>({
    mutationFn: async (newCategory: Omit<Category, 'id' | 'children'>) => {
      const res = await api.post<Category>('/categories', newCategory);
      return res.data;
    },
    onSuccess: (data: Category) => {
      queryClient.invalidateQueries({ queryKey: ['categories-by-type', data.type_id] });
      // If a parent exists, its tree view might change
      if (data.parent_id) {
        queryClient.invalidateQueries({ queryKey: ['category-tree', data.parent_id] });
      }
      // Invalidate general category listings if any exist
    },
  });
}

// Note: Update/Delete for Categories might be complex due to tree structure
// and potential cascading effects. For now, focusing on creation and reads.
// The backend API currently doesn't expose PUT/DELETE for /categories/{id}
// or /category-types/{id} directly, this would need backend changes first.
// Consider adding hooks for these if/when backend API supports them.

/* -------------------------------------------------------------------------- */
/* Recipient Hooks                                                            */
/* -------------------------------------------------------------------------- */

/**
 * Fetch all recipients.
 * @returns React-Query result object for the list of recipients.
 */
export function useRecipients() {
  return useQuery<Recipient[], Error>({
    queryKey: ['recipients'],
    queryFn: async () => {
      const res = await api.get<Recipient[]>('/recipients');
      return res.data;
    },
  });
}

/**
 * Provides a mutation hook for creating a new recipient.
 * Invalidates 'recipients' query on success.
 * @returns React-Query mutation object.
 */
export function useCreateRecipient() {
  const queryClient = useQueryClient();
  return useMutation<Recipient, Error, Omit<Recipient, 'id'>>({
    mutationFn: async (newRecipient: Omit<Recipient, 'id'>) => {
      const res = await api.post<Recipient>('/recipients', newRecipient);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
    },
  });
}

/**
 * Fetch a single recipient by ID.
 * @param recipientId - ID of the recipient to fetch.
 */
export function useRecipient(recipientId: number | undefined) {
  return useQuery<Recipient, Error>({
    queryKey: ['recipient', recipientId],
    queryFn: async () => {
      if (recipientId === undefined) throw new Error('Recipient ID is undefined');
      const res = await api.get<Recipient>(`/recipients/${recipientId}`);
      return res.data;
    },
    enabled: recipientId !== undefined,
  });
}