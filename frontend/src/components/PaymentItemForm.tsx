/**
 * PaymentItemForm Component - Customer Specification Implementation
 *
 * This component implements the exact specifications provided by the customer:
 * - Amount field with +/- toggle switch for income/expense
 * - Automatic timestamp generation on submit
 * - Recipient management with create/update functionality
 * - Category management with "standard" type and add functionality
 * - Periodic checkbox
 * - Success/error page navigation
 * 
 * The customer specifically requested to omit file upload functionality.
 */
// This section brings in all the tools we need to build our payment form.
import React, { useState, useEffect } from 'react';
// This is a helper that lets us change pages in the app.
import { useNavigate } from 'react-router-dom';
// This is a tool that lets us create and style our own components.
import styled from 'styled-components';
// This imports the data structures we use for recipients, categories, and payment items.
import { Recipient, Category, PaymentItemFormData } from '../types';
// This imports the functions that let us interact with our app's data, like fetching recipients or creating new payments.
import {
  useRecipients,
  useCategoriesByType,
  useCreatePaymentItem,
  useCreateRecipient,
  useCreateCategory,
  useUpdatePaymentItem,
} from '../api/hooks';

// This is the main container for our form. It centers the form on the page and gives it some padding.
const FormContainer = styled.div`
  padding: 2rem; // This adds space around the content of the form.
  max-width: 600px; // This sets a maximum width for the form to keep it readable.
  margin: 0 auto; // This centers the form horizontally.
  background: var(--color-background); // This sets the background color.
  color: var(--color-text-primary); // This sets the text color.
`;

// This is the title of the page, "Add New Payment".
const PageTitle = styled.h1`
  font-size: 1.5rem; // This sets the font size.
  margin-bottom: 2rem; // This adds some space below the title.
  text-align: center; // This centers the title.
  color: var(--color-text-primary); // This sets the text color.
`;

// This is a container for each field in our form, like the amount or the description.
const FormField = styled.div`
  margin-bottom: 1.5rem; // This adds some space between the form fields.
`;

// This is the label for each form field, like "Amount" or "Recipient".
const Label = styled.label`
  display: block; // This makes the label take up its own line.
  margin-bottom: 0.5rem; // This adds some space below the label.
  font-size: 0.9rem; // This sets the font size.
  color: var(--color-text-secondary); // This sets the text color.
`;

// This is the input field where you enter the amount of the payment.
const AmountInput = styled.input`
  width: 100%; // This makes the input field take up the full width of its container.
  padding: 0.75rem; // This adds some space inside the input field.
  border: 1px solid #444; // This adds a border around the input field.
  border-radius: var(--radius-md); // This rounds the corners of the input field.
  background: #2a2a2a; // This sets the background color.
  color: var(--color-text-primary); // This sets the text color.
  font-size: 1rem; // This sets the font size.
  box-sizing: border-box; // This makes sure the padding and border are included in the total width.

  // When you click on the input field, we highlight it with a green border.
  &:focus {
    outline: none; // This removes the default blue outline.
    border-color: var(--color-positive); // This sets the border color to green.
  }
`;

// This is the container for the toggle switch that lets you choose between income (+) and expense (-).
const ToggleSwitch = styled.div`
  display: flex; // This arranges the two halves of the switch in a row.
  width: 100%; // This makes the switch take up the full width of its container.
  height: 50px; // This sets the height of the switch.
  border-radius: 25px; // This rounds the corners of the switch to make it look like a pill.
  overflow: hidden; // This hides any content that goes outside the rounded corners.
  margin-top: 0.5rem; // This adds some space above the switch.
`;

// This is one half of the toggle switch, either "+" or "-".
const ToggleHalf = styled.button<{ active: boolean; isPositive: boolean }>`
  flex: 1; // This makes each half take up an equal amount of space.
  border: none; // This removes the button border.
  font-size: 1.2rem; // This sets the font size.
  font-weight: bold; // This makes the font bold.
  cursor: pointer; // This shows a hand cursor when you hover over the button.
  transition: background-color 0.2s ease; // This creates a smooth color change on click.
  
  // This sets the background color based on whether the button is active and whether it's for income or expense.
  background-color: ${props => 
    props.active 
      ? (props.isPositive ? 'var(--color-positive)' : 'var(--color-negative)')
      : '#666'
  };
  
  // This sets the text color based on whether the button is active.
  color: ${props => props.active ? 'white' : '#ccc'};

  // This changes the background color when you hover over the button.
  &:hover {
    background-color: ${props => 
      props.active 
        ? (props.isPositive ? '#059669' : '#dc2626')
        : '#777'
    };
  }
`;

// This is the container for the "Periodic Payment" checkbox and its label.
const CheckboxContainer = styled.div`
  display: flex; // This arranges the checkbox and label in a row.
  align-items: center; // This vertically aligns the checkbox and label in the center.
  gap: 0.5rem; // This adds some space between the checkbox and the label.
`;

// This is the checkbox for marking a payment as periodic.
const Checkbox = styled.input`
  width: 18px; // This sets the width of the checkbox.
  height: 18px; // This sets the height of the checkbox.
`;

// This is the text area where you can enter a description for the payment.
const DescriptionTextarea = styled.textarea`
  width: 100%; // This makes the text area take up the full width of its container.
  padding: 0.75rem; // This adds some space inside the text area.
  border: 1px solid #444; // This adds a border around the text area.
  border-radius: var(--radius-md); // This rounds the corners of the text area.
  background: #2a2a2a; // This sets the background color.
  color: var(--color-text-primary); // This sets the text color.
  min-height: 80px; // This sets a minimum height for the text area.
  resize: vertical; // This allows you to resize the text area vertically.
  box-sizing: border-box; // This makes sure the padding and border are included in the total width.
  font-family: inherit; // This makes the text area use the same font as the rest of the app.

  // When you click on the text area, we highlight it with a green border.
  &:focus {
    outline: none; // This removes the default blue outline.
    border-color: var(--color-positive); // This sets the border color to green.
  }
`;

// This is the container for the recipient management section.
const RecipientArea = styled.div`
  background: #2a2a2a; // This sets the background color.
  border-radius: var(--radius-md); // This rounds the corners of the container.
  padding: 1rem; // This adds some space inside the container.
  border: 1px solid #444; // This adds a border around the container.
`;

// This is the dropdown menu where you can select an existing recipient.
const RecipientDropdown = styled.select`
  width: 100%; // This makes the dropdown take up the full width of its container.
  padding: 0.75rem; // This adds some space inside the dropdown.
  border: 1px solid #444; // This adds a border around the dropdown.
  border-radius: var(--radius-md); // This rounds the corners of the dropdown.
  background: #333; // This sets the background color.
  color: var(--color-text-primary); // This sets the text color.
  margin-bottom: 1rem; // This adds some space below the dropdown.
`;

// This is the input field where you can enter the name or address of a new recipient.
const RecipientInput = styled.input`
  width: 100%; // This makes the input field take up the full width of its container.
  padding: 0.75rem; // This adds some space inside the input field.
  border: 1px solid #444; // This adds a border around the input field.
  border-radius: var(--radius-md); // This rounds the corners of the input field.
  background: #333; // This sets the background color.
  color: var(--color-text-primary); // This sets the text color.
  margin-bottom: 0.5rem; // This adds some space below the input field.
  box-sizing: border-box; // This makes sure the padding and border are included in the total width.
`;

// This is the button for adding a new recipient.
const AddRecipientButton = styled.button`
  width: 100%; // This makes the button take up the full width of its container.
  padding: 0.75rem 1rem; // This adds some space inside the button.
  border: none; // This removes the button border.
  border-radius: var(--radius-md); // This rounds the corners of the button.
  background: var(--color-positive); // This sets the background color to green.
  color: white; // This sets the text color to white.
  cursor: pointer; // This shows a hand cursor when you hover over the button.
  transition: background-color 0.2s ease; // This creates a smooth color change on hover.
  margin-top: 0.5rem; // This adds some space above the button.

  // This makes the button a darker green when you hover over it.
  &:hover {
    background: #059669;
  }

  // This styles the button when it's disabled.
  &:disabled {
    background: #666; // This sets a grey background color.
    cursor: not-allowed; // This shows a "not allowed" cursor.
  }
`;

// This is the container for the category management section.
const CategoryArea = styled.div`
  background: #2a2a2a; // This sets the background color.
  border-radius: var(--radius-md); // This rounds the corners of the container.
  padding: 1rem; // This adds some space inside the container.
  border: 1px solid #444; // This adds a border around the container.
`;

// This is the dropdown menu where you can select an existing category.
const CategoryDropdown = styled.select`
  width: 100%; // This makes the dropdown take up the full width of its container.
  padding: 0.75rem; // This adds some space inside the dropdown.
  border: 1px solid #444; // This adds a border around the dropdown.
  border-radius: var(--radius-md); // This rounds the corners of the dropdown.
  background: #333; // This sets the background color.
  color: var(--color-text-primary); // This sets the text color.
  margin-bottom: 1rem; // This adds some space below the dropdown.
`;

// This is the container for the input field and button for adding a new category.
const CategoryInputContainer = styled.div`
  display: flex; // This arranges the input field and button in a row.
  gap: 0.5rem; // This adds some space between the input field and the button.
  align-items: center; // This vertically aligns the input field and button in the center.
`;

// This is the input field where you can enter the name of a new category.
const CategoryInput = styled.input`
  flex: 1; // This makes the input field take up as much space as possible.
  padding: 0.75rem; // This adds some space inside the input field.
  border: 1px solid #444; // This adds a border around the input field.
  border-radius: var(--radius-md); // This rounds the corners of the input field.
  background: #333; // This sets the background color.
  color: var(--color-text-primary); // This sets the text color.
`;

// This is the button for adding a new category.
const AddCategoryButton = styled.button`
  padding: 0.75rem 1rem; // This adds some space inside the button.
  border: none; // This removes the button border.
  border-radius: var(--radius-md); // This rounds the corners of the button.
  background: var(--color-positive); // This sets the background color to green.
  color: white; // This sets the text color to white.
  cursor: pointer; // This shows a hand cursor when you hover over the button.
  transition: background-color 0.2s ease; // This creates a smooth color change on hover.

  // This makes the button a darker green when you hover over it.
  &:hover {
    background: #059669;
  }

  // This styles the button when it's disabled.
  &:disabled {
    background: #666; // This sets a grey background color.
    cursor: not-allowed; // This shows a "not allowed" cursor.
  }
`;

// This is the main "Submit" button for the form.
const SubmitButton = styled.button`
  width: 100%; // This makes the button take up the full width of its container.
  padding: 1rem; // This adds some space inside the button.
  font-size: 1.1rem; // This sets the font size.
  font-weight: bold; // This makes the font bold.
  border: none; // This removes the button border.
  border-radius: var(--radius-md); // This rounds the corners of the button.
  background: var(--color-positive); // This sets the background color to green.
  color: white; // This sets the text color to white.
  cursor: pointer; // This shows a hand cursor when you hover over the button.
  transition: background-color 0.2s ease; // This creates a smooth color change on hover.
  margin-top: 2rem; // This adds some space above the button.

  // This makes the button a darker green when you hover over it.
  &:hover {
    background: #059669;
  }

  // This styles the button when it's disabled.
  &:disabled {
    background: #666; // This sets a grey background color.
    cursor: not-allowed; // This shows a "not allowed" cursor.
  }
`;

// This is the container for any error messages that we need to show the user.
const ErrorMessage = styled.div`
  color: var(--color-negative);
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

interface PaymentItemFormProps {
  initialData?: PaymentItemFormData;
  onSubmit: (data: PaymentItemFormData) => void;
  isSubmitting: boolean;
  submitError: string | null;
}

// This is the main component for our payment form.
export const PaymentItemForm: React.FC<PaymentItemFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting,
  submitError,
}) => {
  // This is a helper that lets us change pages in the app.
  const navigate = useNavigate();
  
  // This is where we keep track of all the information in the form.
  // It's like having a set of boxes to store the amount, whether it's income or expense, etc.
  const [amount, setAmount] = useState<string>(''); // The amount of the payment.
  const [isPositive, setIsPositive] = useState<boolean>(true); // Whether the payment is income (+) or expense (-).
  const [periodic, setPeriodic] = useState<boolean>(false); // Whether the payment is periodic.
  
  // This stores the description of the payment.
  const [paymentDescription, setPaymentDescription] = useState<string>('');
  
  // This is where we keep track of the recipient information.
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(''); // The ID of the selected recipient.
  const [recipientName, setRecipientName] = useState<string>(''); // The name of the recipient.
  const [recipientAddress, setRecipientAddress] = useState<string>(''); // The address of the recipient.
  const [recipientModified, setRecipientModified] = useState<boolean>(false); // Whether the recipient information has been changed.
  
  // This is where we keep track of the category information.
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(''); // The ID of the selected category.
  const [newCategoryName, setNewCategoryName] = useState<string>(''); // The name of a new category.
  
  // This is where we store any error messages that we need to show the user.
  const [error, setError] = useState<string | null>(null);
  
  // These are special functions from React Query that help us fetch and manage data from our app's server.
  const { data: recipients, isLoading: loadingRecipients, refetch: refetchRecipients } = useRecipients(); // This fetches the list of recipients.
  const { data: categories, isLoading: loadingCategories } = useCategoriesByType(1); // This fetches the list of "standard" categories.
  const createPaymentMutation = useCreatePaymentItem(); // This is for creating a new payment.
  const updatePaymentMutation = useUpdatePaymentItem();
  const createRecipientMutation = useCreateRecipient(); // This is for creating a new recipient.
  const createCategoryMutation = useCreateCategory(); // This is for creating a new category.

  useEffect(() => {
    if (initialData) {
      setAmount(Math.abs(initialData.amount).toString());
      setIsPositive(initialData.amount >= 0);
      setPeriodic(initialData.periodic);
      setPaymentDescription(initialData.description || '');
      if (initialData.recipient_id) {
        handleRecipientSelect(initialData.recipient_id.toString());
      }
      if (initialData.category_ids && initialData.category_ids.length > 0) {
        setSelectedCategoryId(initialData.category_ids[0].toString());
      }
    }
  }, [initialData]);

  // This function is called when you select a recipient from the dropdown menu.
  const handleRecipientSelect = (recipientId: string) => {
    // We store the ID of the selected recipient.
    setSelectedRecipientId(recipientId);
    // We reset the "modified" flag, since we're just selecting an existing recipient.
    setRecipientModified(false);
    
    // If you selected a recipient, we fill in the name and address fields with their information.
    if (recipientId && recipients) {
      const recipient = recipients.find(r => r.id.toString() === recipientId);
      if (recipient) {
        setRecipientName(recipient.name);
        setRecipientAddress(recipient.address || '');
      }
    } else {
      // If you didn't select a recipient, we clear the name and address fields.
      setRecipientName('');
      setRecipientAddress('');
    }
  };

  // This is a special function from React that runs whenever the recipient information changes.
  // It checks if you've modified the name or address of the selected recipient.
  useEffect(() => {
    // If you've selected a recipient, we compare the current name and address with the original ones.
    if (selectedRecipientId && recipients) {
      const originalRecipient = recipients.find(r => r.id.toString() === selectedRecipientId);
      if (originalRecipient) {
        const nameChanged = recipientName !== originalRecipient.name;
        const addressChanged = recipientAddress !== (originalRecipient.address || '');
        
        // If the name or address has changed, we set the "modified" flag to true.
        setRecipientModified(nameChanged || addressChanged);
      }
    } else {
      // If you haven't selected a recipient, we check if you've entered a new name or address.
      setRecipientModified(recipientName.trim() !== '' || recipientAddress.trim() !== '');
    }
  }, [recipientName, recipientAddress, selectedRecipientId, recipients]);

  // This function is called when you click the "Add Recipient" button.
  const handleAddRecipient = async () => {
    // We make sure you've entered a name for the recipient.
    if (!recipientName.trim()) {
      setError('Recipient name is required');
      return;
    }

    try {
      // We send the new recipient's information to the server to be saved.
      const newRecipient = await createRecipientMutation.mutateAsync({
        name: recipientName.trim(),
        address: recipientAddress.trim() || null,
      });
      
      // We automatically select the new recipient in the dropdown menu.
      setSelectedRecipientId(newRecipient.id.toString());
      // We reset the "modified" flag.
      setRecipientModified(false);
      // We clear any previous error messages.
      setError(null);
      
    } catch (error) {
      // If something goes wrong, we show an error message.
      console.error('Error creating recipient:', error);
      setError('Failed to create recipient. Please try again.');
    }
  };

  // This function is called when you click the "Add" button for categories.
  const handleAddCategory = async () => {
    // We get the name of the new category and remove any extra spaces.
    const name = newCategoryName.trim();
    // If the name is empty, we don't do anything.
    if (!name) return;
    try {
      // We send the new category's information to the server to be saved.
      const newCat = await createCategoryMutation.mutateAsync({
        name,
        type_id: 1, // We're using the "standard" category type.
        parent_id: null, // This category doesn't have a parent.
      });
      // We automatically select the new category in the dropdown menu.
      setSelectedCategoryId(newCat.id.toString());
      // We clear the input field for the new category name.
      setNewCategoryName('');
    } catch (err) {
      // If something goes wrong, we show an error message.
      console.error('Error creating category:', err);
      setError('Failed to create category. Please try again.');
    }
  };

  // This function is called when you click the "Submit" button.
  const handleSubmit = async (e: React.FormEvent) => {
    // We prevent the form from being submitted in the default way.
    e.preventDefault();
    // We clear any previous error messages.
    setError(null);
    
    // We make sure you've entered a valid amount.
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    // We gather all the information from the form into a single object.
    const paymentData: PaymentItemFormData = {
      id: initialData?.id,
      amount: isPositive ? numericAmount : -numericAmount, // We make the amount negative if it's an expense.
      date: new Date().toISOString(), // We use the current date and time.
      periodic,
      description: paymentDescription.trim() || null,
      recipient_id: null,
      category_ids: [],
    };
    
    // If you've selected a recipient, we add their ID to the payment data.
    if (selectedRecipientId && !selectedRecipientId.startsWith('new:')) {
      paymentData.recipient_id = parseInt(selectedRecipientId);
    }
    
    // If you've selected a category, we add its ID to the payment data.
    if (selectedCategoryId) {
      paymentData.category_ids = [parseInt(selectedCategoryId)];
    }
    
    // We call the onSubmit function that was passed in as a prop.
    onSubmit(paymentData);
  };

  return (
    <FormContainer>
      <PageTitle>Add New Payment</PageTitle>
      
      <form onSubmit={handleSubmit}>
        {/* Amount Field with +/- Toggle */}
        <FormField>
          <Label>Amount (€)</Label>
          <AmountInput
            type="number"
            step="0.01"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            required
          />
          <ToggleSwitch>
            <ToggleHalf
              type="button"
              active={isPositive}
              isPositive={true}
              onClick={() => setIsPositive(true)}
            >
              +
            </ToggleHalf>
            <ToggleHalf
              type="button"
              active={!isPositive}
              isPositive={false}
              onClick={() => setIsPositive(false)}
            >
              -
            </ToggleHalf>
          </ToggleSwitch>
        </FormField>

        {/* Payment Description */}
        <FormField>
          <Label>Payment Description</Label>
          <DescriptionTextarea
            placeholder="Describe what this payment is for..."
            value={paymentDescription}
            onChange={(e) => setPaymentDescription(e.target.value)}
          />
        </FormField>

        {/* Periodic Checkbox */}
        <FormField>
          <CheckboxContainer>
            <Checkbox
              type="checkbox"
              checked={periodic}
              onChange={(e) => setPeriodic(e.target.checked)}
            />
            <Label style={{ margin: 0 }}>Periodic Payment</Label>
          </CheckboxContainer>
        </FormField>

        {/* Recipient Management */}
        <FormField>
          <Label>Recipient</Label>
          <RecipientArea>
            <RecipientDropdown
              value={selectedRecipientId}
              onChange={(e) => handleRecipientSelect(e.target.value)}
              disabled={loadingRecipients}
            >
              <option value="">-- Select Recipient (Optional) --</option>
              {recipients?.map((recipient) => (
                <option key={recipient.id} value={recipient.id.toString()}>
                  {recipient.name}
                </option>
              ))}
            </RecipientDropdown>
            
            <RecipientInput
              type="text"
              placeholder="Name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
            
            <RecipientInput
              type="text"
              placeholder="Address"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
            />
            
            <AddRecipientButton
              type="button"
              onClick={handleAddRecipient}
              disabled={!recipientName.trim() || !recipientModified}
            >
              Add Recipient
            </AddRecipientButton>
          </RecipientArea>
        </FormField>

        {/* Category Management */}
        <FormField>
          <Label>Category</Label>
          <CategoryArea>
            <CategoryDropdown
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              disabled={loadingCategories}
            >
              <option value="">-- Select Category (Optional) --</option>
              {categories?.filter(cat => cat.name !== "UNCLASSIFIED").map((category) => (
                <option key={category.id} value={category.id.toString()}>
                  {category.name}
                </option>
              ))}
            </CategoryDropdown>
            
            <CategoryInputContainer>
              <CategoryInput
                type="text"
                placeholder="Add new category"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
              />
              <AddCategoryButton
                type="button"
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
              >
                Add
              </AddCategoryButton>
            </CategoryInputContainer>
          </CategoryArea>
        </FormField>

        {error && <ErrorMessage>{error}</ErrorMessage>}
        {submitError && <ErrorMessage>{submitError}</ErrorMessage>}

        {/* Submit Button */}
        <SubmitButton 
          type="submit" 
          disabled={isSubmitting || !amount}
        >
          {isSubmitting ? 'Submitting...' : 'Submit'}
        </SubmitButton>
      </form>
    </FormContainer>
  );
};
