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
// This section brings in the tools we need to build this page.
import React from 'react';
// These are helpers from React Router that let us navigate between pages and get information from the URL.
import { useNavigate, useParams } from 'react-router-dom';
// This is a tool that lets us create and style our own components.
import styled from 'styled-components';
// This imports the payment form that we created earlier.
import { PaymentItemForm } from '../components/PaymentItemForm';
// This imports the functions that let us fetch and update payment items.
import { usePaymentItem, useUpdatePaymentItem } from '../api/hooks';
// This imports the data structures we use for payment items.
import { PaymentItem, PaymentItemFormData } from '../types';

// This is the main container for our page.
const PageWrapper = styled.div`
  padding: 1rem; // This adds some space around the content.
`;

// This is the message we show while the payment item is being loaded.
const LoadingMessage = styled.p`
  color: #ccc; // This sets the text color.
  text-align: center; // This centers the text.
  padding: 2rem; // This adds some space around the message.
`;

// This is the message we show if there's an error loading the payment item.
const ErrorMessage = styled.p`
  color: red; // This sets the text color to red.
  text-align: center; // This centers the text.
  padding: 2rem; // This adds some space around the message.
`;

// This is the main component for our edit page.
const EditItemPage: React.FC = () => {
  // This is a helper that lets us change pages in the app.
  const navigate = useNavigate();
  // This gets the ID of the payment item from the URL.
  const { id } = useParams<{ id: string }>();
  // We convert the ID from a string to a number.
  const itemId = id ? parseInt(id, 10) : undefined;

  // This fetches the data for the payment item we want to edit.
  const { data: paymentItem, isLoading: isLoadingItem, isError: isFetchError, error: fetchError } = usePaymentItem(itemId);
  // This is a function that lets us update the payment item on the server.
  const updatePaymentItemMutation = useUpdatePaymentItem();

  /**
   * This function is called when you submit the form.
   * It sends the updated payment item data to the server.
   * @param data - The data from the form.
   */
  const handleSubmit = async (data: PaymentItemFormData) => {
    // We make sure that the payment item has a valid ID.
    if (typeof data.id !== 'number') {
      console.error("handleSubmit in EditItemPage received data without a valid ID. Cannot update.");
      return;
    }
    try {
      // We send the updated data to the server.
      await updatePaymentItemMutation.mutateAsync(data as { id: number; [key: string]: any; });
      // If the update is successful, we go back to the summary page.
      navigate('/');
    } catch (error) {
      // If there's an error, we log it to the console for debugging.
      console.error('Failed to update payment item:', error);
    }
  };

  // If the payment item is still loading, we show a loading message.
  if (isLoadingItem) {
    return <PageWrapper><LoadingMessage>Loading payment item...</LoadingMessage></PageWrapper>;
  }

  // If there was an error fetching the payment item, or if the item was not found, we show an error message.
  if (isFetchError || !paymentItem) {
    return (
      <PageWrapper>
        <ErrorMessage>
          Failed to load payment item: {fetchError?.message || (itemId ? 'Item was not found.' : 'No item ID was provided.')}
        </ErrorMessage>
      </PageWrapper>
    );
  }

  // Once the payment item data has been loaded, we show the form.
  return (
    <PageWrapper>
      <h1>Edit Payment Item</h1>
      {/* We use the same PaymentItemForm component that we use for adding new items. */}
      <PaymentItemForm
        initialData={paymentItem} // We pass the existing item data to the form to pre-fill the fields.
        onSubmit={handleSubmit} // We tell the form what to do when it's submitted.
        isSubmitting={updatePaymentItemMutation.isPending} // We let the form know if we're currently submitting the data.
        // We pass any error messages to the form so it can display them.
        submitError={updatePaymentItemMutation.isError ? (updatePaymentItemMutation.error as Error)?.message || 'An unknown error occurred while updating the item.' : null}
      />
    </PageWrapper>
  );
};

export default EditItemPage;
