/**
 * “Summary” screen – displays all payment items in a descending timeline with a
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
import { useSearchParams } from 'react-router-dom';
import styled from 'styled-components';
import { format, parseISO } from 'date-fns';

import { ViewFilter, NavigationBar } from '../components/NavigationBar';
import { usePaymentItems, useCategoryTypes, useCategoriesByType } from '../api/hooks';
import { PaymentItem, isExpense, Category, CategoryType } from '../types';

/* -------------------------------------------------------------------------- */
/* Styled Components                                                          */
/* -------------------------------------------------------------------------- */

const FilterWrapper = styled.div`
  padding: 0.5rem 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #333;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  label {
    font-size: 0.9rem;
    color: #aaa;
  }

  select {
    padding: 0.5rem;
    background-color: #2a2a2a;
    color: #eaeaea;
    border: 1px solid #444;
    border-radius: var(--radius-md);
  }
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
  /* gap: var(--spacing-xs); // Use if multiple meta items */
`;

const DateText = styled.span`
  font-size: 0.9rem; /* Slightly larger as per "headline" feel */
  color: var(--color-text-secondary);
  margin-bottom: var(--spacing-sm); /* Space below date */
  display: block; /* Make it a block to take full width above amount in its column */
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
  
  // View Filter (all, expenses, incomes)
  const initialViewFilter = (searchParams.get('filter') as ViewFilter) || 'all';
  const [viewFilter, setViewFilter] = useState<ViewFilter>(initialViewFilter);

  // Category Filter
  const initialCategoryIds = searchParams.getAll('categories').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(initialCategoryIds);

  const { data: categoryTypes, isLoading: isLoadingCategoryTypes } = useCategoryTypes();
  // For simplicity, we'll fetch all categories from all types to populate the filter.
  // A more optimized approach might load categories on demand or only for selected types.
  const [allCategories, setAllCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (categoryTypes) {
      const fetchAllCategories = async () => {
        let fetchedCategories: Category[] = [];
        for (const type of categoryTypes) {
          // This is a simplified way; ideally, useCategoriesByType would be called,
          // but react-query hooks can't be called in a loop directly.
          // For a real app, consider a different strategy or a custom hook to fetch all categories.
          // For now, let's assume a hypothetical endpoint or adjust useCategoriesByType if it can fetch all.
          // As a workaround, we'll just log a TODO and leave allCategories empty for now,
          // meaning category filtering UI won't be fully populated yet.
          // TODO: Implement proper fetching of all categories for the filter.
          // This might involve a new backend endpoint or a more complex client-side aggregation.
        }
        // setAllCategories(fetchedCategories); // This line would be used once categories are fetched.
      };
      fetchAllCategories();
    }
  }, [categoryTypes]);


  // Update URL when filters change
  useEffect(() => {
    const newSearchParams = new URLSearchParams();
    if (viewFilter !== 'all') {
      newSearchParams.set('filter', viewFilter);
    }
    selectedCategoryIds.forEach(id => newSearchParams.append('categories', id.toString()));
    
    setSearchParams(newSearchParams, { replace: true });
  }, [viewFilter, selectedCategoryIds, setSearchParams]);

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

  /* ---------------------------------------------------------------------- */
  /* Callbacks                                                              */
  /* ---------------------------------------------------------------------- */
  const handleViewFilterChange = useCallback((f: ViewFilter) => {
    setViewFilter(f);
  }, []);

  const handleCategoryFilterChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const options = event.target.options;
    const value: number[] = [];
    for (let i = 0, l = options.length; i < l; i++) {
      if (options[i].selected) {
        value.push(parseInt(options[i].value, 10));
      }
    }
    setSelectedCategoryIds(value);
  };

  const handleMenu = useCallback(() => {
    // TODO: open side-drawer with additional navigation
    // Placeholder – no-op for now
    // eslint-disable-next-line no-console
    console.info('Menu clicked');
  }, []);

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <NavigationBar
        active={viewFilter}
        onChange={handleViewFilterChange}
        onMenu={handleMenu}
      />

      <FilterWrapper>
        <label htmlFor="category-filter">Filter by Categories:</label>
        {/* TODO: Replace with a better multi-select component. This is a basic HTML multi-select. */}
        {/* Also, populate this with actual categories once fetching is implemented. */}
        <select
          id="category-filter"
          multiple
          value={selectedCategoryIds.map(String)} // Select expects string values
          onChange={handleCategoryFilterChange}
          disabled={isLoadingCategoryTypes || allCategories.length === 0} // Disable if loading or no categories
        >
          {/* This is a placeholder. Real categories should be mapped here. */}
          {/* Example:
            {allCategories.map(cat => (
              <option key={cat.id} value={cat.id.toString()}>{cat.name} ({categoryTypes.find(ct => ct.id === cat.type_id)?.name})</option>
            ))}
          */}
          {allCategories.length === 0 && !isLoadingCategoryTypes && <option disabled>No categories available to filter</option>}
          {/* For testing, add some dummy options if allCategories is empty */}
          {allCategories.length === 0 && (
            <>
              <option value="1">Dummy Category 1</option>
              <option value="2">Dummy Category 2</option>
            </>
          )}
        </select>
        {isLoadingCategoryTypes && <p>Loading categories for filter...</p>}
      </FilterWrapper>

      {isLoading ? (
        <p>Loading payment items…</p>
      ) : (
        <List>
          {sorted.map(item => (
            <PaymentItemLine key={item.id} item={item} />
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
}

const PaymentItemLine: React.FC<PaymentItemLineProps> = ({ item }) => {
  // Using attachment_url for the image as per PaymentItem type
  const imageUrl = item.attachment_url;

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
          {/* Other meta information like recipient name could go here if desired */}
          {item.recipient && <span style={{fontSize: '0.8em', color: '#aaa'}}>To/From: {item.recipient.name}</span>}
          {item.categories && item.categories.length > 0 && (
            <div style={{fontSize: '0.7em', color: '#999', marginTop: '4px'}}>
              Categories: {item.categories.map(c => c.name).join(', ')}
            </div>
          )}
        </MetaInfo>
        <AmountContainer>
          <AmountText negative={isExpense(item)}>
            {item.amount.toFixed(2)} €
          </AmountText>
        </AmountContainer>
      </ContentWrapper>
    </Entry>
  );
};