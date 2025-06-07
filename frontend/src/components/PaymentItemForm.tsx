/**
 * PaymentItemForm Component
 *
 * This component provides a form for creating and editing PaymentItem entities.
 * It includes fields for amount, date, periodicity, recipient selection,
 * category selection (multi-select across different category types), and
 * an optional file attachment (e.g., for an invoice).
 *
 * Features:
 * - Handles both creation (no initialData) and editing (with initialData).
 * - Uses styled-components for styling.
 * - Integrates with React Query hooks (useRecipients, useCategoryTypes, useCategoriesByType)
 *   to fetch data for dropdowns and category selections.
 * - Manages form state for all fields.
 * - Includes a sub-component `CategoryTypeSection` to render categories grouped by their type.
 * - Placeholder for file upload logic.
 *
 * Props:
 * - initialData?: PaymentItem - Optional initial data to pre-fill the form for editing.
 * - onSubmit: (data: Omit<PaymentItem, 'id' | 'recipient'> | PaymentItem) => void - Callback function
 *   triggered when the form is submitted with valid data.
 * - isSubmitting: boolean - Flag to indicate if the form submission is in progress (e.g., to disable submit button).
 * - submitError?: string | null - Optional error message to display if submission fails.
 */
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { PaymentItem, Recipient, Category, CategoryType } from '../types';
import { useRecipients, useCategoryTypes, useCategoriesByType } from '../api/hooks';

// Styled components for the form (can be expanded)
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: #333;
  border-radius: 8px;
  color: #fff;
`;

const Label = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #444;
  color: #fff;
  font-size: 1rem;

  &[type="checkbox"] {
    width: auto;
    margin-right: 0.5rem;
    align-self: flex-start;
  }
`;

const Select = styled.select`
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #444;
  color: #fff;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  background-color: #007bff;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;

  &:hover {
    background-color: #0056b3;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 0.8rem;
`;


// Sub-component to render categories for a specific type
/**
 * CategoryTypeSection Component
 *
 * A sub-component of PaymentItemForm, responsible for rendering a list of
 * categories belonging to a specific CategoryType. It fetches the categories
 * for the given type and displays them as checkboxes.
 *
 * Props:
 * - type: CategoryType - The category type for which to display categories.
 * - selectedCategoryIds: number[] - An array of currently selected category IDs.
 * - onCategoryChange: (categoryId: number) => void - Callback function triggered
 *   when a category's selection state changes.
 */
interface CategoryTypeSectionProps {
  type: CategoryType;
  selectedCategoryIds: number[];
  onCategoryChange: (categoryId: number) => void;
}

const CategoryTypeSection: React.FC<CategoryTypeSectionProps> = ({ type, selectedCategoryIds, onCategoryChange }) => {
  const { data: categories, isLoading: isLoadingCategories, error: categoriesError } = useCategoriesByType(type.id);

  if (isLoadingCategories) return <p>Loading categories for {type.name}...</p>;
  if (categoriesError) return <ErrorMessage>Error loading categories for {type.name}: {(categoriesError as Error).message}</ErrorMessage>;
  if (!categories || categories.length === 0) return <p>No categories defined for {type.name}.</p>;

  // Filter out categories that have children to only show leaf nodes for selection,
  // or adjust based on how deep selection is desired.
  // For now, let's assume we can select any category.
  // The backend should handle parent tag roll-up.
  return (
    <div style={{ marginLeft: '1rem', marginBottom: '1rem', borderLeft: '2px solid #555', paddingLeft: '1rem' }}>
      <h4>{type.name}</h4>
      {categories.map(category => (
        <Label key={category.id} style={{ flexDirection: 'row', alignItems: 'center', fontSize: '0.9rem' }}>
          <Input
            type="checkbox"
            checked={selectedCategoryIds.includes(category.id)}
            onChange={() => onCategoryChange(category.id)}
          />
          {category.name}
        </Label>
      ))}
    </div>
  );
};

/**
 * Props for the PaymentItemForm component.
 */
interface PaymentItemFormProps {
  initialData?: PaymentItem; // Data for pre-filling the form when editing an item
  onSubmit: (data: Omit<PaymentItem, 'id' | 'recipient'> | PaymentItem) => void; // Function to call on form submission
  isSubmitting: boolean; // Flag to indicate if the form submission is in progress
  submitError?: string | null; // Optional error message to display if submission fails
}

export const PaymentItemForm: React.FC<PaymentItemFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  submitError,
}: PaymentItemFormProps) => {
  const [amount, setAmount] = useState<string>(initialData?.amount.toString() || '');
  const [date, setDate] = useState<string>(initialData?.date ? initialData.date.substring(0, 16) : new Date().toISOString().substring(0, 16)); // ISO string for datetime-local
  const [periodic, setPeriodic] = useState<boolean>(initialData?.periodic || false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(initialData?.recipient_id?.toString() || '');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(
    initialData?.categories?.map(cat => cat.id) || []
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // Holds the currently selected file object
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(initialData?.attachment_url || null); // Holds the URL of an uploaded attachment

  // Fetching data for form dropdowns
  const { data: recipients, isLoading: isLoadingRecipients } = useRecipients();
  const { data: categoryTypes, isLoading: isLoadingCategoryTypes } = useCategoryTypes();
  // We might need to fetch categories for each type dynamically or all at once if not too many.
  // For simplicity, let's assume we can fetch all categories for now, or handle it per type.

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryIds(prevSelectedIds =>
      prevSelectedIds.includes(categoryId)
        ? prevSelectedIds.filter(id => id !== categoryId)
        : [...prevSelectedIds, categoryId]
    );
  };

  /**
   * Handles changes to the file input.
   * Sets the selected file in state.
   * @param event - The input change event from the file input.
   */
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
      // TODO: Implement actual file upload logic.
      // This would typically involve:
      // 1. Calling a mutation hook (e.g., `useUploadFile()`) that sends the file to the backend.
      // 2. On successful upload, the backend returns a URL for the stored file.
      // 3. Update `attachmentUrl` state with this URL.
      // Example:
      // uploadFileMutation.mutate(event.target.files[0], {
      //   onSuccess: (uploadedUrl) => setAttachmentUrl(uploadedUrl),
      //   onError: (uploadError) => console.error("Upload failed", uploadError),
      // });
      console.log("File selected:", event.target.files[0].name); // Placeholder for now
    } else {
      setSelectedFile(null); // Clear if no file is selected or selection is cancelled
      // Consider if `attachmentUrl` should also be cleared if a user deselects a file.
      // This depends on whether the form should remember a previously uploaded (and saved) attachment
      // if the user then interacts with the file input again but cancels.
      // setAttachmentUrl(null);
    }
  };

  /**
   * Handles the form submission.
   * It prevents the default form action, validates the amount,
   * constructs the `formData` object including selected categories and attachment URL,
   * and then calls the `onSubmit` prop with this data.
   * @param event - The form submission event.
   */
  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // TODO: Implement robust file upload handling if a `selectedFile` is present
    // and `attachmentUrl` hasn't been set by a successful upload yet.
    // This might involve triggering the upload here if not done in `handleFileChange`,
    // or preventing submission until upload is complete.
    // For now, it assumes `attachmentUrl` is correctly populated if a file was intended.

    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount)) {
      // Handle error: amount is not a valid number
      console.error("Invalid amount");
      return;
    }

    const formData = {
      ...(initialData ? { id: initialData.id } : {}), // Include ID if updating
      amount: numericAmount,
      date: new Date(date).toISOString(), // Ensure full ISO string
      periodic,
      recipient_id: selectedRecipientId ? parseInt(selectedRecipientId, 10) : null,
      categories: selectedCategoryIds.map(id => ({ id } as Category)), // Send as list of objects with id
      attachment_url: attachmentUrl, // This should be the URL from a successful upload
    };
    onSubmit(formData as Omit<PaymentItem, 'id' | 'recipient'> | PaymentItem);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <h2>{initialData ? 'Edit Payment Item' : 'Add New Payment Item'}</h2>
      
      <Label>
        Amount:
        <Input
          type="number"
          step="0.01"
          value={amount}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
          required
        />
      </Label>
      
      <Label>
        Date & Time:
        <Input
          type="datetime-local"
          value={date}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDate(e.target.value)}
          required
        />
      </Label>
      
      <Label style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Input
          type="checkbox"
          checked={periodic}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPeriodic(e.target.checked)}
        />
        Periodic Payment
      </Label>

      <Label>
        Recipient:
        <Select
          value={selectedRecipientId}
          onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedRecipientId(e.target.value)}
          disabled={isLoadingRecipients}
        >
          <option value="">-- Select Recipient (Optional) --</option>
          {recipients?.map((recipient: Recipient) => (
            <option key={recipient.id} value={recipient.id.toString()}>
              {recipient.name}
            </option>
          ))}
        </Select>
      </Label>

      <Label>Categories:</Label>
      {isLoadingCategoryTypes && <p>Loading category types...</p>}
      {categoryTypes?.map(type => (
        <CategoryTypeSection
          key={type.id}
          type={type}
          selectedCategoryIds={selectedCategoryIds}
          onCategoryChange={handleCategoryChange}
        />
      ))}

      <Label>
        Attachment (Invoice/Image):
        <Input
          type="file"
          accept="image/*,application/pdf"
          onChange={handleFileChange}
        />
        {selectedFile && <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Selected: {selectedFile.name}</p>}
        {attachmentUrl && !selectedFile && <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Current attachment: <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">{attachmentUrl}</a></p>}
        {/* TODO: Add progress bar for upload, and clear file/error messages */}
      </Label>
      
      {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
      
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : (initialData ? 'Update Item' : 'Add Item')}
      </Button>
    </Form>
  );
};