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
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { Recipient, Category, PaymentItemFormData, PaymentItem } from '../types';
import {
  useRecipients,
  useCategoriesByType,
  useCreatePaymentItem,
  useCreateRecipient,
  useCreateCategory,
} from '../api/hooks';

// Styled components for customer-specified UI
const FormContainer = styled.div`
  padding: 2rem;
  max-width: 600px;
  margin: 0 auto;
  background: var(--color-background);
  color: var(--color-text-primary);
`;

const PageTitle = styled.h1`
  font-size: 1.5rem;
  margin-bottom: 2rem;
  text-align: center;
  color: var(--color-text-primary);
`;

const FormField = styled.div`
  margin-bottom: 1.5rem;
`;

const Label = styled.label`
  display: block;
  margin-bottom: 0.5rem;
  font-size: 0.9rem;
  color: var(--color-text-secondary);
`;

// Amount input field - only accepts pure digits/numbers
const AmountInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: var(--radius-md);
  background: #2a2a2a;
  color: var(--color-text-primary);
  font-size: 1rem;
  box-sizing: border-box;

  &:focus {
    outline: none;
    border-color: var(--color-positive);
  }
`;

// Toggle switch for +/- (Income/Expense)
const ToggleSwitch = styled.div`
  display: flex;
  width: 100%;
  height: 50px;
  border-radius: 25px;
  overflow: hidden;
  margin-top: 0.5rem;
`;

const ToggleHalf = styled.button<{ active: boolean; isPositive: boolean }>`
  flex: 1;
  border: none;
  font-size: 1.2rem;
  font-weight: bold;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  background-color: ${props => 
    props.active 
      ? (props.isPositive ? 'var(--color-positive)' : 'var(--color-negative)')
      : '#666'
  };
  
  color: ${props => props.active ? 'white' : '#ccc'};

  &:hover {
    background-color: ${props => 
      props.active 
        ? (props.isPositive ? '#059669' : '#dc2626')
        : '#777'
    };
  }
`;

// Checkbox for periodic payments
const CheckboxContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Checkbox = styled.input`
  width: 18px;
  height: 18px;
`;

// Description textarea for payment description
const DescriptionTextarea = styled.textarea`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: var(--radius-md);
  background: #2a2a2a;
  color: var(--color-text-primary);
  min-height: 80px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;

  &:focus {
    outline: none;
    border-color: var(--color-positive);
  }
`;

// Recipient management area
const RecipientArea = styled.div`
  background: #2a2a2a;
  border-radius: var(--radius-md);
  padding: 1rem;
  border: 1px solid #444;
`;

const RecipientDropdown = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: var(--radius-md);
  background: #333;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
`;

const RecipientInput = styled.input`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: var(--radius-md);
  background: #333;
  color: var(--color-text-primary);
  margin-bottom: 0.5rem;
  box-sizing: border-box;
`;

const AddRecipientButton = styled.button`
  width: 100%;
  padding: 0.75rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-positive);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 0.5rem;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

// Category management area
const CategoryArea = styled.div`
  background: #2a2a2a;
  border-radius: var(--radius-md);
  padding: 1rem;
  border: 1px solid #444;
`;

const CategoryDropdown = styled.select`
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: var(--radius-md);
  background: #333;
  color: var(--color-text-primary);
  margin-bottom: 1rem;
`;

const CategoryInputContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const CategoryInput = styled.input`
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #444;
  border-radius: var(--radius-md);
  background: #333;
  color: var(--color-text-primary);
`;

const AddCategoryButton = styled.button`
  padding: 0.75rem 1rem;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-positive);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

// Submit button
const SubmitButton = styled.button`
  width: 100%;
  padding: 1rem;
  font-size: 1.1rem;
  font-weight: bold;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-positive);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;
  margin-top: 2rem;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  color: var(--color-negative);
  font-size: 0.9rem;
  margin-top: 0.5rem;
`;

interface PaymentItemFormProps {
  initialData?: PaymentItem;
  onSubmit?: (data: PaymentItemFormData) => void | Promise<void>;
  isSubmitting?: boolean;
  submitError?: string | null;
}

export const PaymentItemForm: React.FC<PaymentItemFormProps> = ({
  initialData,
  onSubmit,
  isSubmitting = false,
  submitError,
}) => {
  const navigate = useNavigate();

  const isEditMode = Boolean(onSubmit && initialData);

  // Form state
  const [amount, setAmount] = useState<string>(
    initialData ? Math.abs(initialData.amount).toString() : ''
  );
  const [isPositive, setIsPositive] = useState<boolean>(
    initialData ? initialData.amount >= 0 : true
  );
  const [periodic, setPeriodic] = useState<boolean>(initialData?.periodic ?? false);

  // Payment description state
  const [paymentDescription, setPaymentDescription] = useState<string>(initialData?.description ?? '');

  // Recipient state
  const [selectedRecipientId, setSelectedRecipientId] = useState<string>(
    initialData?.recipient_id ? initialData.recipient_id.toString() : ''
  );
  const [recipientName, setRecipientName] = useState<string>('');
  const [recipientAddress, setRecipientAddress] = useState<string>('');
  const [recipientModified, setRecipientModified] = useState<boolean>(false);

  // Category state
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialData && initialData.categories && initialData.categories[0]
      ? initialData.categories[0].id.toString()
      : ''
  );
  const [newCategoryName, setNewCategoryName] = useState<string>('');
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  
  // Hooks
  const { data: recipients, isLoading: loadingRecipients, refetch: refetchRecipients } = useRecipients();
  const { data: categories, isLoading: loadingCategories } = useCategoriesByType(1); // Type ID 1 = "standard"
  const createPaymentMutation = useCreatePaymentItem();
  const createRecipientMutation = useCreateRecipient();
  const createCategoryMutation = useCreateCategory();

  // When initialData is loaded asynchronously, populate form state
  useEffect(() => {
    if (!initialData) return;
    setAmount(Math.abs(initialData.amount).toString());
    setIsPositive(initialData.amount >= 0);
    setPeriodic(initialData.periodic);
    setPaymentDescription(initialData.description ?? '');
    setSelectedRecipientId(initialData.recipient_id ? initialData.recipient_id.toString() : '');
    if (initialData.categories && initialData.categories[0]) {
      setSelectedCategoryId(initialData.categories[0].id.toString());
    }
  }, [initialData]);

  // Handle recipient selection from dropdown
  const handleRecipientSelect = (recipientId: string) => {
    setSelectedRecipientId(recipientId);
    setRecipientModified(false);
    
    if (recipientId && recipients) {
      const recipient = recipients.find(r => r.id.toString() === recipientId);
      if (recipient) {
        setRecipientName(recipient.name);
        setRecipientAddress(recipient.address || '');
      }
    } else {
      setRecipientName('');
      setRecipientAddress('');
    }
  };

  // Track recipient modifications
  useEffect(() => {
    if (selectedRecipientId && recipients) {
      const originalRecipient = recipients.find(r => r.id.toString() === selectedRecipientId);
      if (originalRecipient) {
        const nameChanged = recipientName !== originalRecipient.name;
        const addressChanged = recipientAddress !== (originalRecipient.address || '');
        
        setRecipientModified(nameChanged || addressChanged);
      }
    } else {
      setRecipientModified(recipientName.trim() !== '' || recipientAddress.trim() !== '');
    }
  }, [recipientName, recipientAddress, selectedRecipientId, recipients]);

  // Handle recipient creation
  const handleAddRecipient = async () => {
    if (!recipientName.trim()) {
      setError('Recipient name is required');
      return;
    }

    try {
      const newRecipient = await createRecipientMutation.mutateAsync({
        name: recipientName.trim(),
        address: recipientAddress.trim() || null,
      });
      
      // Select the newly created recipient
      setSelectedRecipientId(newRecipient.id.toString());
      setRecipientModified(false);
      setError(null);
      
    } catch (error) {
      console.error('Error creating recipient:', error);
      setError('Failed to create recipient. Please try again.');
    }
  };

  // Create a new category immediately and select it
  const handleAddCategory = async () => {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const newCat = await createCategoryMutation.mutateAsync({
        name,
        type_id: 1, // default category type
        parent_id: null,
      });
      setSelectedCategoryId(newCat.id.toString());
      setNewCategoryName('');
    } catch (err) {
      console.error('Error creating category:', err);
      setError('Failed to create category. Please try again.');
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate amount
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('Please enter a valid amount greater than 0');
      return;
    }
    
    try {
      // Build the payment data
      const paymentData: PaymentItemFormData = {
        amount: isPositive ? numericAmount : -numericAmount,
        date: isEditMode && initialData ? initialData.date : new Date().toISOString(),
        periodic,
        description: paymentDescription.trim() || null,
        recipient_id: null,
        category_ids: [],
      };

      if (isEditMode && initialData?.id !== undefined) {
        paymentData.id = initialData.id;
      }
      
      // Handle recipient assignment
      if (selectedRecipientId && !selectedRecipientId.startsWith('new:')) {
        paymentData.recipient_id = parseInt(selectedRecipientId);
      }
      
      // Handle category selection
      if (selectedCategoryId) {
        paymentData.category_ids = [parseInt(selectedCategoryId)];
      }
      
      if (isEditMode && onSubmit) {
        await onSubmit(paymentData);
      } else {
        await createPaymentMutation.mutateAsync(paymentData);
        // Navigate to success page
        navigate('/add-success');
      }
      
    } catch (error) {
      console.error('Error creating payment:', error);
      setError('Failed to submit payment. Please try again.');
    }
  };

  return (
    <FormContainer>
      <PageTitle>{isEditMode ? 'Edit Payment' : 'Add New Payment'}</PageTitle>
      
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

        {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        {/* Submit Button */}
        <SubmitButton
          type="submit"
          disabled={(isEditMode ? isSubmitting : createPaymentMutation.isPending) || !amount}
        >
          {isEditMode
            ? isSubmitting ? 'Updating...' : 'Update'
            : createPaymentMutation.isPending ? 'Creating...' : 'Submit'}
        </SubmitButton>
      </form>
    </FormContainer>
  );
};