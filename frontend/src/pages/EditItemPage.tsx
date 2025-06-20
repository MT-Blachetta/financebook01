/**
 * EditItemPage Component
 *
 * This page allows users to edit an existing payment item.
 * It fetches the payment item's data based on the ID from the URL parameters,
 * pre-fills the `PaymentItemForm` with this data, and handles the update submission.
 *
 * Features:
 * - Retrieves item ID from URL parameters.
 * - Fetches payment item data using `usePaymentItem` hook.
 * - Displays loading and error states during data fetching.
 * - Renders `PaymentItemForm` pre-filled with the fetched item data.
 * - Handles form submission using `useUpdatePaymentItem` mutation.
 * - Navigates to the home/summary page upon successful item update.
 * - Displays submission status (loading/error) through props passed to `PaymentItemForm`.
 */
import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { PaymentItemForm } from '../components/PaymentItemForm';
import { usePaymentItem, useUpdatePaymentItem } from '../api/hooks';
import { PaymentItem, PaymentItemFormData } from '../types';

const PageWrapper = styled.div`
  padding: 1rem;
  /* Add more styles as needed for page layout */
`;

const LoadingMessage = styled.p`
  color: #ccc;
  text-align: center;
  padding: 2rem;
`;

const ErrorMessage = styled.p`
  color: red;
  text-align: center;
  padding: 2rem;
`;

const EditItemPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>(); // Get the item ID from the URL
  const itemId = id ? parseInt(id, 10) : undefined;

  // Fetch the payment item data
  const { data: paymentItem, isLoading: isLoadingItem, isError: isFetchError, error: fetchError } = usePaymentItem(itemId);
  const updatePaymentItemMutation = useUpdatePaymentItem();

  /**
   * Handles the submission of the updated payment item form.
   * Calls the updatePaymentItem mutation and navigates on success.
   * @param data - The form data, conforming to the PaymentItemFormData type.
   */
  const handleSubmit = async (data: PaymentItemFormData) => {
    if (typeof data.id !== 'number') {
      console.error("handleSubmit in EditItemPage received data without a valid ID. Cannot update.");
      return;
    }
    try {
      await updatePaymentItemMutation.mutateAsync(data as { id: number; [key: string]: any; });
      navigate('/'); // Navigate to summary page on success
    } catch (error) {
      // Error logging is useful for development.
      // The `isError` and `error` properties of the mutation are used to display errors in the form.
      console.error('Failed to update payment item:', error);
    }
  };

  // Display loading state while fetching item data
  if (isLoadingItem) {
    return <PageWrapper><LoadingMessage>Loading payment item...</LoadingMessage></PageWrapper>;
  }

  // Display error message if fetching failed or item not found
  if (isFetchError || !paymentItem) {
    return (
      <PageWrapper>
        <ErrorMessage>
          Failed to load payment item: {fetchError?.message || (itemId ? 'Item was not found.' : 'No item ID was provided.')}
        </ErrorMessage>
      </PageWrapper>
    );
  }

  // Render the form once data is available
  return (
    <PageWrapper>
      <h1>Edit Payment Item</h1>
      <PaymentItemForm
        initialData={paymentItem} // Pre-fill form with existing item data
        onSubmit={handleSubmit}
        isSubmitting={updatePaymentItemMutation.isPending} // Changed from isLoading to isPending
        // Provide a user-friendly error message from the mutation state
        submitError={updatePaymentItemMutation.isError ? (updatePaymentItemMutation.error as Error)?.message || 'An unknown error occurred while updating the item.' : null}
      />
    </PageWrapper>
  );
};

export default EditItemPage;