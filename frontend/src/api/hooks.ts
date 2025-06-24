/**
 * Thin abstraction over TanStack React-Query that provides ready-to-use hooks
 * for the FinanceBook REST API.
 *
 * Each hook follows the convention `useXyz` and internally uses Axios for HTTP
 * requests.  Keep the layer intentionally *thin*:  we do not try to replicate a
 * full-fledged SDK but merely offer convenience wrappers so UI components stay
 * declarative.
 */

// This section brings in the tools we need to communicate with our app's server.
import axios from 'axios';
// These are special functions from React Query that help us fetch and manage data from the server.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
// This imports the data structures we use for our app's data.
import { PaymentItem, Recipient, Category, CategoryType } from '../types';

/* -------------------------------------------------------------------------- */
/* Axios Instance                                                             */
/* -------------------------------------------------------------------------- */

/**
 * This is a special version of "axios" (a tool for making web requests) that we've configured for our app.
 * It knows that our server is located at "/api" and will give up if a request takes longer than 10 seconds.
 */
const api = axios.create({
  baseURL: '/api', // This tells axios that all our server requests should start with "/api".
  timeout: 10_000, // This sets a 10-second timeout for all requests.
});

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** This function builds a query string for our payment items API endpoint.
 * A query string is the part of a URL that comes after the "?", and it's used to filter the results.
 */
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
 * This is a special function (called a "hook") that fetches all the payment items from the server.
 * You can also use it to filter the items by type (expenses or incomes).
 * It returns an object with the data, loading state, and error state.
 */
export function usePaymentItems(opts?: {
  expenseOnly?: boolean;
  incomeOnly?: boolean;
  categoryIds?: number[];
}) {
  const { expenseOnly = false, incomeOnly = false, categoryIds = [] } = opts ?? {};
  // We sort the category IDs to make sure that the query key is always the same,
  // no matter what order the IDs are in.
  const sortedCategoryIds = [...categoryIds].sort((a, b) => a - b);
  const queryKey = ['payment-items', expenseOnly, incomeOnly, sortedCategoryIds.join(',')];

  // This is where we actually use React Query to fetch the data.
  return useQuery<PaymentItem[], Error>({
    queryKey, // This is a unique key for this query, so React Query knows how to cache the data.
    queryFn: async () => {
      // This is the function that actually fetches the data from the server.
      const qs = buildPaymentQuery({
        expense_only: expenseOnly,
        income_only: incomeOnly,
        category_ids: categoryIds,
      });
      const res = await api.get<PaymentItem[]>(`/payment-items${qs}`);
      return res.data;
    },
    placeholderData: (previousData) => previousData, // This tells React Query to keep showing the old data while the new data is loading.
  });
}

/**
 * This hook fetches a single payment item from the server, by its ID.
 * @param itemId - The ID of the payment item to fetch.
 * @returns An object with the data, loading state, and error state.
 */
export function usePaymentItem(itemId: number | undefined) {
  return useQuery<PaymentItem, Error>({
    queryKey: ['payment-item', itemId],
    queryFn: async () => {
      if (itemId === undefined) {
        throw new Error('Item ID is undefined');
      }
      const res = await api.get<PaymentItem>(`/payment-items/${itemId}`);
      return res.data;
    },
    enabled: itemId !== undefined, // This tells React Query to only run the query if the item ID is defined.
  });
}

/**
 * This hook provides a function for creating a new payment item on the server.
 * @returns A mutation object that you can use to create a new payment item.
 */
export function useCreatePaymentItem() {
  const queryClient = useQueryClient();
  return useMutation<PaymentItem, Error, { [key: string]: any; category_ids?: number[] }>({
    mutationFn: async (newItem) => {
      const res = await api.post<PaymentItem>('/payment-items', newItem);
      return res.data;
    },
    // When the mutation is successful, we tell React Query to refetch the list of payment items.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-items'] });
    },
  });
}

/**
 * This hook provides a function for updating an existing payment item on the server.
 * @returns A mutation object that you can use to update a payment item.
 */
export function useUpdatePaymentItem() {
  const queryClient = useQueryClient();
  return useMutation<PaymentItem, Error, { id: number; [key: string]: any; category_ids?: number[] }>({
    mutationFn: async (itemToUpdate) => {
      const { id, ...updateData } = itemToUpdate;
      const res = await api.put<PaymentItem>(
        `/payment-items/${id}`,
        updateData
      );
      return res.data;
    },
    // When the mutation is successful, we tell React Query to refetch the list of payment items and the specific payment item that was updated.
    onSuccess: (data: PaymentItem) => {
      queryClient.invalidateQueries({ queryKey: ['payment-items'] });
      queryClient.invalidateQueries({ queryKey: ['payment-item', data.id] });
    },
  });
}

/**
 * This hook provides a function for deleting a payment item from the server.
 * @returns A mutation object that you can use to delete a payment item.
 */
export function useDeletePaymentItem() {
  const queryClient = useQueryClient();
  return useMutation<void, Error, number>({
    mutationFn: async (itemId: number) => {
      await api.delete(`/payment-items/${itemId}`);
    },
    // When the mutation is successful, we tell React Query to refetch the list of payment items and remove the deleted item from the cache.
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
 * This hook fetches all the category types from the server.
 * @returns An object with the data, loading state, and error state.
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
 * This hook provides a function for creating a new category type on the server.
 * @returns A mutation object that you can use to create a new category type.
 */
export function useCreateCategoryType() {
  const queryClient = useQueryClient();
  return useMutation<CategoryType, Error, Omit<CategoryType, 'id'>>({
    mutationFn: async (newType: Omit<CategoryType, 'id'>) => {
      const res = await api.post<CategoryType>('/category-types', newType);
      return res.data;
    },
    // When the mutation is successful, we tell React Query to refetch the list of category types.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['category-types'] });
    },
  });
}

/* -------------------------------------------------------------------------- */
/* Category Hooks                                                             */
/* -------------------------------------------------------------------------- */

/**
 * This hook fetches all the categories for a specific type from the server.
 * @param typeId - The ID of the category type to fetch.
 * @returns An object with the data, loading state, and error state.
 */
export function useCategoriesByType(typeId: number | undefined) {
  return useQuery<Category[], Error>({
    queryKey: ['categories-by-type', typeId],
    queryFn: async () => {
      if (typeId === undefined) throw new Error('Type ID is undefined');
      const res = await api.get<Category[]>(`/categories/by-type/${typeId}`);
      return res.data;
    },
    enabled: typeId !== undefined, // This tells React Query to only run the query if the type ID is defined.
  });
}

/**
 * This hook fetches all the categories from the server, regardless of their type.
 * @returns An object with the data, loading state, and error state.
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
 * This hook fetches a category and all its children from the server.
 * @param categoryId - The ID of the category to fetch.
 * @returns An object with the data, loading state, and error state.
 */
export function useCategoryTree(categoryId: number | undefined) {
  return useQuery<Category, Error>({
    queryKey: ['category-tree', categoryId],
    queryFn: async () => {
      if (categoryId === undefined) throw new Error('Category ID is undefined');
      const res = await api.get<Category>(`/categories/${categoryId}/tree`);
      return res.data;
    },
    enabled: categoryId !== undefined, // This tells React Query to only run the query if the category ID is defined.
  });
}
/**
 * This hook fetches all the descendants of a category from the server.
 * @param categoryId - The ID of the category to fetch the descendants of.
 * @returns An object with the data, loading state, and error state.
 */
export function useCategoryDescendants(categoryId: number | undefined) {
  return useQuery<Category[], Error>({
    queryKey: ["category-descendants", categoryId],
    queryFn: async () => {
      if (categoryId === undefined) throw new Error("Category ID is undefined");
      const res = await api.get<Category[]>(`/categories/${categoryId}/descendants`);
      return res.data;
    },
    enabled: categoryId !== undefined, // This tells React Query to only run the query if the category ID is defined.
  });
}


/**
 * This hook provides a function for creating a new category on the server.
 * @returns A mutation object that you can use to create a new category.
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, Omit<Category, 'id' | 'children'>>({
    mutationFn: async (newCategory: Omit<Category, 'id' | 'children'>) => {
      const res = await api.post<Category>('/categories', newCategory);
      return res.data;
    },
    // When the mutation is successful, we tell React Query to refetch the list of categories for the new category's type,
    // as well as the tree for the new category's parent (if it has one).
    onSuccess: (data: Category) => {
      queryClient.invalidateQueries({ queryKey: ['categories-by-type', data.type_id] });
      if (data.parent_id) {
        queryClient.invalidateQueries({ queryKey: ['category-tree', data.parent_id] });
      }
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    },
  });
}

/**
 * This hook provides a function for updating an existing category on the server.
 * @param categoryId - The ID of the category to update.
 * @returns A mutation object that you can use to update a category.
 */
export function useUpdateCategory(categoryId: number) {
  const queryClient = useQueryClient();
  return useMutation<Category, Error, Partial<Category>>({
    mutationFn: async (updated: Partial<Category>) => {
      const res = await api.put<Category>(`/categories/${categoryId}`, updated);
      return res.data;
    },
    // When the mutation is successful, we tell React Query to refetch the list of categories for the updated category's type,
    // as well as the tree for the updated category.
    onSuccess: (data: Category) => {
      queryClient.invalidateQueries({ queryKey: ['categories-by-type', data.type_id] });
      queryClient.invalidateQueries({ queryKey: ['category-tree', data.id] });
      queryClient.invalidateQueries({ queryKey: ['all-categories'] });
    },
  });
}

// This function uploads a category icon to the server.
export async function uploadCategoryIcon(file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await api.post<{ filename: string }>('/uploadicon/', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.filename;
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
 * This hook fetches all the recipients from the server.
 * @returns An object with the data, loading state, and error state.
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
 * This hook provides a function for creating a new recipient on the server.
 * @returns A mutation object that you can use to create a new recipient.
 */
export function useCreateRecipient() {
  const queryClient = useQueryClient();
  return useMutation<Recipient, Error, Omit<Recipient, 'id'>>({
    mutationFn: async (newRecipient: Omit<Recipient, 'id'>) => {
      const res = await api.post<Recipient>('/recipients', newRecipient);
      return res.data;
    },
    // When the mutation is successful, we tell React Query to refetch the list of recipients.
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipients'] });
    },
  });
}

/**
 * This hook fetches a single recipient from the server, by their ID.
 * @param recipientId - The ID of the recipient to fetch.
 * @returns An object with the data, loading state, and error state.
 */
export function useRecipient(recipientId: number | undefined) {
  return useQuery<Recipient, Error>({
    queryKey: ['recipient', recipientId],
    queryFn: async () => {
      if (recipientId === undefined) throw new Error('Recipient ID is undefined');
      const res = await api.get<Recipient>(`/recipients/${recipientId}`);
      return res.data;
    },
    enabled: recipientId !== undefined, // This tells React Query to only run the query if the recipient ID is defined.
  });
}
