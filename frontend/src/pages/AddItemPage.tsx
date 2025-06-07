/**
 * AddItemPage Component
 *
 * This page provides a user interface for adding a new payment item.
 * It utilizes the `PaymentItemForm` component for the form inputs and
 * the `useCreatePaymentItem` hook to handle the creation of the payment item
 * via an API call. On successful creation, it navigates the user to the
 * summary page ('/').
 *
 * Features:
 * - Displays a title "Add New Payment Item".
 * - Renders the `PaymentItemForm` for data input.
 * - Handles form submission using the `useCreatePaymentItem` mutation.
 * - Navigates to the home/summary page upon successful item creation.
 * - Displays submission status (loading/error) through props passed to `PaymentItemForm`.
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { PaymentItemForm } from '../components/PaymentItemForm';
import { useCreatePaymentItem } from '../api/hooks';
import { PaymentItem } from '../types';

const PageWrapper = styled.div`
  padding: 1rem;
  /* Add more styles as needed for page layout */
`;

const AddItemPage: React.FC = () => {
  const navigate = useNavigate();
  const createPaymentItemMutation = useCreatePaymentItem();

  /**
   * Handles the submission of the payment item form.
   * Calls the createPaymentItem mutation and navigates on success.
   * @param data - The payment item data from the form, excluding 'id', 'recipient' object, and full 'categories' objects (expects category IDs).
   */
  const handleSubmit = async (data: Omit<PaymentItem, 'id' | 'recipient' | 'categories'>) => {
    try {
      await createPaymentItemMutation.mutateAsync(data as Omit<PaymentItem, 'id' | 'recipient'>); // Ensure type alignment with hook
      navigate('/'); // Navigate to summary page on success
    } catch (error) {
      // Error logging is useful for development.
      // The `isError` and `error` properties of the mutation are used to display errors in the form.
      console.error('Failed to create payment item:', error);
    }
  };

  return (
    <PageWrapper>
      <h1>Add New Payment Item</h1>
      <PaymentItemForm
        onSubmit={handleSubmit}
        isSubmitting={createPaymentItemMutation.isPending} // Changed from isLoading to isPending for TanStack Query v5
        // Provide a user-friendly error message from the mutation state
        submitError={createPaymentItemMutation.isError ? (createPaymentItemMutation.error as Error)?.message || 'An unknown error occurred while creating the item.' : null}
      />
    </PageWrapper>
  );
};

export default AddItemPage;