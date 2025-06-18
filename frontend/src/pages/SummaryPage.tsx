/**
 * "Summary" screen – displays all payment items in a descending timeline with a
 * running total at the end.  Users can filter by incomes/expenses via the
 * NavigationBar.
 *
 * State Flow
 * ----------
 *  NavigationBar (presentational) ⟷ SummaryPage (filter + data fetching)
 *      ↓ items
 *  PaymentList (presentational)
 */

import React, { useCallback, useState, useMemo, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { format, parseISO } from 'date-fns';

import { ViewFilter } from '../components/NavigationBar';
import { usePaymentItems, useAllCategories, useCategoryTypes, useRecipient } from '../api/hooks';
import { PaymentItem, isExpense, Category } from '../types';

/* -------------------------------------------------------------------------- */
/* Styled Components                                                          */
/* -------------------------------------------------------------------------- */

const CategoryFilterWrapper = styled.div`
  padding: 1rem;
  margin-bottom: 1rem;
  background: #2a2a2a;
  border-radius: var(--radius-lg);
  border: 1px solid #444;

  h3 {
    margin: 0 0 1rem 0;
    font-size: 1rem;
    color: #eaeaea;
  }
`;

const CategoryDropdownContainer = styled.div`
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
  align-items: center;

  select {
    flex: 1;
    padding: 0.5rem;
    background-color: #333;
    color: #eaeaea;
    border: 1px solid #555;
    border-radius: var(--radius-md);
    font-size: 0.9rem;

    &:focus {
      outline: none;
      border-color: var(--color-positive);
    }
  }
`;

const AddCategoryButton = styled.button`
  background: var(--color-positive);
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s ease;

  &:hover {
    background: #059669;
  }

  &:disabled {
    background: #666;
    cursor: not-allowed;
  }
`;

const SelectedCategoriesContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
  min-height: 2rem;
  align-items: flex-start;
`;

const CategoryTag = styled.div`
  background: #444;
  color: #eaeaea;
  padding: 0.25rem 0.75rem;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;

  button {
    background: none;
    border: none;
    color: #aaa;
    cursor: pointer;
    padding: 0;
    font-size: 1rem;
    line-height: 1;

    &:hover {
      color: #fff;
    }
  }
`;

const ResetButton = styled.button`
  background: #666;
  color: white;
  border: none;
  padding: 0.25rem 0.5rem;
  border-radius: var(--radius-md);
  font-size: 0.8rem;
  cursor: pointer;
  align-self: flex-end;
  margin-left: auto;

  &:hover {
    background: #777;
  }
`;

const EmptyState = styled.div`
  color: #888;
  font-size: 0.8rem;
  font-style: italic;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
  margin: var(--spacing-md) 0;
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
`;

const Entry = styled.li`
  background: #333; /* Grey background for the entry block */
  border-radius: var(--radius-lg); /* Rounded edges */
  padding: var(--spacing-md);
  display: flex;
  align-items: stretch; /* Align items to stretch to fill height */
  gap: var(--spacing-md);
  width: 100%; /* Block fills the width */
  box-sizing: border-box;
`;

const ImageHolder = styled.div`
  flex: 0 0 25%; /* Thumbnail fills 25% of block width */
  max-width: 120px; /* Added max-width to prevent overly large images on wide screens */
  aspect-ratio: 1 / 1;
  border-radius: var(--radius-md);
  background-color: transparent; /* Surrounding background if no image */
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

// Container for the main content to the right of the image
const ContentWrapper = styled.div`
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  justify-content: space-between; /* Pushes amount to the bottom if date is on top */
`;

// Container for Date and other meta info (if any)
const MetaInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
`;

const DateText = styled.span`
  font-size: 0.9rem; /* Slightly larger as per "headline" feel */
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm); /* Space below date */
  display: block; /* Make it a block to take full width above amount in its column */
`;

const RecipientInfo = styled.div`
  font-size: 0.8rem;
  color: #bbb;
  margin-bottom: var(--spacing-xs);
  
  .name {
    font-weight: 500;
    color: #ddd;
  }
  
  .address {
    font-size: 0.75rem;
    color: #999;
    margin-top: 2px;
  }
`;

const CategoriesInfo = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin-top: var(--spacing-xs);
`;

const CategoryChip = styled.span`
  background: #555;
  color: #ccc;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 500;
`;

// Container for the Amount, allowing it to be on the right edge of its parent
const AmountContainer = styled.div`
  margin-left: auto; /* Pushes this container to the right */
  text-align: right; /* Aligns text to the right within this container */
`;

const AmountText = styled.span<{ negative: boolean }>`
  font-size: 1.5rem; /* "Biggest text information" */
  font-weight: bold;
  color: ${({ negative }) =>
    negative ? 'var(--color-negative)' : 'var(--color-positive)'};
  display: block; /* Ensure it takes its own line if needed */
`;

// For the "Total" row, to distinguish it
const TotalEntry = styled(Entry)`
  background: #444; // Slightly different background for total
  margin-top: var(--spacing-md);
  border-top: 1px solid #555;
  font-weight: bold;
`;

const TotalLabel = styled.div`
    flex: 1 1 auto;
    font-size: 1.2rem;
`;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

const SummaryPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // View Filter (all, expenses, incomes) - always read from URL parameters
  const viewFilter = (searchParams.get('filter') as ViewFilter) || 'all';

  // Category Filter
  const initialCategoryIds = searchParams.getAll('categories').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(initialCategoryIds);
  const [selectedDropdownCategory, setSelectedDropdownCategory] = useState<number | ''>('');

  // Fetch all categories using the new hook
  const { data: allCategories = [], isLoading: isLoadingCategories } = useAllCategories();
  const { data: categoryTypes = [] } = useCategoryTypes();
  const standardTypeId = useMemo(() => categoryTypes.find(t => t.name === 'standard')?.id, [categoryTypes]);

  // Sync selectedCategoryIds with URL parameters when they change
  useEffect(() => {
    const urlCategoryIds = searchParams.getAll('categories').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    setSelectedCategoryIds(urlCategoryIds);
  }, [searchParams]);

  // Update URL when category filters change (but not view filter - that's handled by App component)
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // Remove existing category parameters
    newSearchParams.delete('categories');
    
    // Add current category filters
    selectedCategoryIds.forEach(id => newSearchParams.append('categories', id.toString()));
    
    // Only update if there's actually a change
    const currentCategoryParams = searchParams.getAll('categories').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const hasChanged = currentCategoryParams.length !== selectedCategoryIds.length ||
                      !currentCategoryParams.every(id => selectedCategoryIds.includes(id));
    
    if (hasChanged) {
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [selectedCategoryIds, setSearchParams]);

  const queryResult = usePaymentItems({
    expenseOnly: viewFilter === 'expenses',
    incomeOnly: viewFilter === 'incomes',
    categoryIds: selectedCategoryIds,
  });

  const queryData: PaymentItem[] | undefined = queryResult.data;
  const isLoading: boolean = queryResult.isLoading;
  const error: Error | null = queryResult.error;

  // This variable is guaranteed to be PaymentItem[] for use in memos
  const paymentDataForMemo: PaymentItem[] = queryData ?? [];

  /* ---------------------------------------------------------------------- */
  /* Derived Data                                                           */
  /* ---------------------------------------------------------------------- */
  const sorted: PaymentItem[] = useMemo(() => {
    return [...paymentDataForMemo].sort(
      (a: PaymentItem, b: PaymentItem) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [paymentDataForMemo]);

  const total: number = useMemo(() => {
    return paymentDataForMemo.reduce(
      (sum: number, item: PaymentItem) => sum + item.amount,
      0
    );
  }, [paymentDataForMemo]);

  // Get selected categories for display
  const selectedCategories = useMemo(() => {
    return allCategories.filter(cat => selectedCategoryIds.includes(cat.id));
  }, [allCategories, selectedCategoryIds]);

  /* ---------------------------------------------------------------------- */
  /* Callbacks                                                              */
  /* ---------------------------------------------------------------------- */
  const handleAddCategory = useCallback(() => {
    if (selectedDropdownCategory && !selectedCategoryIds.includes(selectedDropdownCategory as number)) {
      setSelectedCategoryIds(prev => [...prev, selectedDropdownCategory as number]);
      setSelectedDropdownCategory('');
    }
  }, [selectedDropdownCategory, selectedCategoryIds]);

  const handleRemoveCategory = useCallback((categoryId: number) => {
    setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
  }, []);

  const handleResetFilters = useCallback(() => {
    setSelectedCategoryIds([]);
  }, []);

  const handleMenu = useCallback(() => {
    // TODO: open side-drawer with additional navigation
    // Placeholder – no-op for now
    // eslint-disable-next-line no-console
    console.info('Menu clicked');
  }, []);

  const handleAdd = useCallback(() => {
    navigate('/add');
  }, [navigate]);

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h2>Payments</h2>
        <button onClick={() => navigate('/categories')}>categories</button>
      </div>
      <CategoryFilterWrapper>
        <h3>Filter by Categories</h3>
        
        <CategoryDropdownContainer>
          <select
            value={selectedDropdownCategory}
            onChange={(e) => setSelectedDropdownCategory(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
            disabled={isLoadingCategories}
          >
            <option value="">Select a category...</option>
            {allCategories
              .filter(cat => !selectedCategoryIds.includes(cat.id))
              .map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))
            }
          </select>
          <AddCategoryButton
            onClick={handleAddCategory}
            disabled={!selectedDropdownCategory || isLoadingCategories}
          >
            Add Category
          </AddCategoryButton>
        </CategoryDropdownContainer>

        <SelectedCategoriesContainer>
          {selectedCategories.length === 0 ? (
            <EmptyState>No category filters applied - showing all payments</EmptyState>
          ) : (
            <>
              {selectedCategories.map(cat => (
                <CategoryTag key={cat.id}>
                  {cat.name}
                  <button onClick={() => handleRemoveCategory(cat.id)} aria-label={`Remove ${cat.name} filter`}>
                    ×
                  </button>
                </CategoryTag>
              ))}
              <ResetButton onClick={handleResetFilters}>
                Reset All
              </ResetButton>
            </>
          )}
        </SelectedCategoriesContainer>

        {isLoadingCategories && <p>Loading categories...</p>}
      </CategoryFilterWrapper>

      {isLoading ? (
        <p>Loading payment items…</p>
      ) : (
        <List>
          {sorted.map(item => (
            <PaymentItemLine
              key={item.id}
              item={item}
              allCategories={allCategories}
              standardTypeId={standardTypeId}
            />
          ))}

          {/* Total row */}
          <TotalEntry>
            <TotalLabel>SUM</TotalLabel>
            <AmountContainer>
              <AmountText negative={total < 0}>
                {total.toFixed(2)} €
              </AmountText>
            </AmountContainer>
          </TotalEntry>
        </List>
      )}
    </>
  );
};

export default SummaryPage;

/* -------------------------------------------------------------------------- */
/* Child component: PaymentItemLine                                           */
/* -------------------------------------------------------------------------- */

interface PaymentItemLineProps {
  item: PaymentItem;
  allCategories: Category[];
  standardTypeId: number | undefined;
}

const PaymentItemLine: React.FC<PaymentItemLineProps> = ({ item, allCategories, standardTypeId }) => {
  // Using attachment_url for the image as per PaymentItem type
  const imageUrl = item.attachment_url;
  const { data: fetchedRecipient } = useRecipient(item.recipient_id);
  const recipient = item.recipient ?? fetchedRecipient;

  const iconUrl = React.useMemo(() => {
    if (!item.categories || !standardTypeId) return null;
    const cat = item.categories.find(c => c.type_id === standardTypeId);
    let current = cat;
    while (current) {
      if (current.icon_file) {
        return `/api/download_static/${current.icon_file}`;
      }
      current = allCategories.find(c => c.id === current?.parent_id) || undefined;
    }
    return null;
  }, [item.categories, standardTypeId, allCategories]);

  return (
    <Entry>
      <ImageHolder>
        {imageUrl ? (
          <img src={imageUrl} alt="Payment attachment" />
        ) : (
          // If no image, area stays same as surrounding background (transparent)
          null
        )}
      </ImageHolder>

      <ContentWrapper>
        <MetaInfo>
          {/* Date is above the amount (in its own block) */}
          <DateText>{format(parseISO(item.date), 'PPP, HH:mm')}</DateText>
          
          {/* Payment description */}
          {item.description && (
            <RecipientInfo>
              <div className="name" style={{ fontStyle: 'italic', color: '#ddd' }}>
                {item.description}
              </div>
            </RecipientInfo>
          )}
          
          {/* Enhanced recipient information display */}
          {recipient && (
            <RecipientInfo>
              <div className="name">To/From: {recipient.name}</div>
              {recipient.address && (
                <div className="address">{recipient.address}</div>
              )}
            </RecipientInfo>
          )}
          
          {/* Enhanced categories display */}
          {item.categories && item.categories.length > 0 && (
            <CategoriesInfo>
              {item.categories.map(category => (
                <CategoryChip key={category.id}>
                  {category.name}
                </CategoryChip>
              ))}
            </CategoriesInfo>
          )}
        </MetaInfo>
        <AmountContainer>
          {iconUrl && (
            <img src={iconUrl} alt="category icon" style={{ width: '20px', height: '20px', marginRight: '0.25rem' }} />
          )}
          <AmountText negative={isExpense(item)}>
            {item.amount.toFixed(2)} €
          </AmountText>
        </AmountContainer>
      </ContentWrapper>
    </Entry>
  );
};
