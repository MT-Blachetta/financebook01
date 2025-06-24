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

// This section brings in the tools we need to build this page.
import React, { useCallback, useState, useMemo, useEffect } from 'react';
// These are helpers from React Router that let us work with the URL.
import { useSearchParams, useNavigate } from 'react-router-dom';
// This is a tool that lets us create and style our own components.
import styled from 'styled-components';
// This is a helper for formatting dates.
import { format, parseISO } from 'date-fns';

// This imports the type for our view filter.
import { ViewFilter } from '../components/NavigationBar';
// This imports the functions that let us fetch data from our app's server.
import { usePaymentItems, useAllCategories, useCategoryTypes, useRecipient } from '../api/hooks';
// This imports the data structures we use for payment items and categories.
import { PaymentItem, isExpense, Category } from '../types';

/* -------------------------------------------------------------------------- */
/* Styled Components                                                          */
/* -------------------------------------------------------------------------- */

// This is the container for our category filter section.
const CategoryFilterWrapper = styled.div`
  padding: 1rem; // This adds some space inside the container.
  margin-bottom: 1rem; // This adds some space below the container.
  background: #2a2a2a; // This sets the background color.
  border-radius: var(--radius-lg); // This rounds the corners of the container.
  border: 1px solid #444; // This adds a border around the container.

  h3 {
    margin: 0 0 1rem 0; // This adds some space below the title.
    font-size: 1rem; // This sets the font size.
    color: #eaeaea; // This sets the text color.
  }
`;

// This is the container for the category dropdown and the "Add Category" button.
const CategoryDropdownContainer = styled.div`
  display: flex; // This arranges the items in a row.
  gap: 0.5rem; // This adds some space between the items.
  margin-bottom: 1rem; // This adds some space below the container.
  align-items: center; // This vertically aligns the items in the center.

  select {
    flex: 1; // This makes the dropdown take up as much space as possible.
    padding: 0.5rem; // This adds some space inside the dropdown.
    background-color: #333; // This sets the background color.
    color: #eaeaea; // This sets the text color.
    border: 1px solid #555; // This adds a border around the dropdown.
    border-radius: var(--radius-md); // This rounds the corners of the dropdown.
    font-size: 0.9rem; // This sets the font size.

    // When you click on the dropdown, we highlight it with a green border.
    &:focus {
      outline: none; // This removes the default blue outline.
      border-color: var(--color-positive); // This sets the border color to green.
    }
  }
`;

// This is the "Add Category" button.
const AddCategoryButton = styled.button`
  background: var(--color-positive); // This sets the background color to green.
  color: white; // This sets the text color to white.
  border: none; // This removes the button border.
  padding: 0.5rem 1rem; // This adds some space inside the button.
  border-radius: var(--radius-md); // This rounds the corners of the button.
  font-size: 0.9rem; // This sets the font size.
  cursor: pointer; // This shows a hand cursor when you hover over the button.
  white-space: nowrap; // This prevents the text from wrapping to the next line.
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

// This is the container for the selected category tags.
const SelectedCategoriesContainer = styled.div`
  display: flex; // This arranges the tags in a row.
  flex-wrap: wrap; // This allows the tags to wrap to the next line if there's not enough space.
  gap: 0.5rem; // This adds some space between the tags.
  margin-bottom: 1rem; // This adds some space below the container.
  min-height: 2rem; // This sets a minimum height for the container.
  align-items: flex-start; // This aligns the tags to the top of the container.
`;

// This is a single category tag.
const CategoryTag = styled.div`
  background: #444; // This sets the background color.
  color: #eaeaea; // This sets the text color.
  padding: 0.25rem 0.75rem; // This adds some space inside the tag.
  border-radius: var(--radius-md); // This rounds the corners of the tag.
  font-size: 0.8rem; // This sets the font size.
  display: flex; // This arranges the items in a row.
  align-items: center; // This vertically aligns the items in the center.
  gap: 0.5rem; // This adds some space between the items.

  button {
    background: none; // This makes the button background transparent.
    border: none; // This removes the button border.
    color: #aaa; // This sets the text color.
    cursor: pointer; // This shows a hand cursor when you hover over the button.
    padding: 0; // This removes the default padding.
    font-size: 1rem; // This sets the font size.
    line-height: 1; // This sets the line height.

    // This changes the color of the "x" when you hover over it.
    &:hover {
      color: #fff;
    }
  }
`;

// This is the "Reset All" button for the category filters.
const ResetButton = styled.button`
  background: #666; // This sets the background color.
  color: white; // This sets the text color.
  border: none; // This removes the button border.
  padding: 0.25rem 0.5rem; // This adds some space inside the button.
  border-radius: var(--radius-md); // This rounds the corners of the button.
  font-size: 0.8rem; // This sets the font size.
  cursor: pointer; // This shows a hand cursor when you hover over the button.
  align-self: flex-end; // This aligns the button to the bottom of the container.
  margin-left: auto; // This pushes the button to the right.

  // This changes the background color when you hover over the button.
  &:hover {
    background: #777;
  }
`;

// This is the message we show when there are no category filters applied.
const EmptyState = styled.div`
  color: #888; // This sets the text color.
  font-size: 0.8rem; // This sets the font size.
  font-style: italic; // This makes the text italic.
`;

// This is the list that will contain our payment items.
const List = styled.ul`
  list-style: none; // This removes the default bullet points.
  padding: 0; // This removes the default padding.
  margin: var(--spacing-md) 0; // This adds some space above and below the list.
  display: flex; // This arranges the items in a flexible way.
  flex-direction: column; // This stacks the items vertically.
  gap: var(--spacing-sm); // This adds some space between the items.
`;

// This is a single payment item in our list.
const Entry = styled.li`
  background: #333; // This sets the background color.
  border-radius: var(--radius-lg); // This rounds the corners of the item.
  padding: var(--spacing-md); // This adds some space inside the item.
  display: flex; // This arranges the content of the item in a flexible way.
  align-items: stretch; // This makes the content of the item stretch to fill the height.
  gap: var(--spacing-md); // This adds some space between the content items.
  width: 100%; // This makes the item take up the full width of its container.
  box-sizing: border-box; // This makes sure the padding and border are included in the total width.
`;

// This is the container for the payment item's image.
const ImageHolder = styled.div`
  flex: 0 0 25%; // This makes the image container take up 25% of the width of the item.
  max-width: 120px; // This sets a maximum width for the image.
  aspect-ratio: 1 / 1; // This makes the image container a square.
  border-radius: var(--radius-md); // This rounds the corners of the image container.
  background-color: transparent; // This makes the background of the image container transparent.
  overflow: hidden; // This hides any part of the image that goes outside the container.
  display: flex; // This arranges the content of the container in a flexible way.
  align-items: center; // This vertically aligns the content in the center.
  justify-content: center; // This horizontally aligns the content in the center.

  img {
    width: 100%; // This makes the image take up the full width of the container.
    height: 100%; // This makes the image take up the full height of the container.
    object-fit: cover; // This makes sure the image covers the entire container without being distorted.
  }
`;

// This is the container for the main content of the payment item, to the right of the image.
const ContentWrapper = styled.div`
  flex: 1 1 auto; // This makes the container take up as much space as possible.
  display: flex; // This arranges the content of the container in a flexible way.
  flex-direction: column; // This stacks the content vertically.
  justify-content: space-between; // This spreads out the content to fill the available space.
`;

// This is the container for the date and other meta information.
const MetaInfo = styled.div`
  display: flex; // This arranges the items in a flexible way.
  flex-direction: column; // This stacks the items vertically.
  gap: var(--spacing-xs); // This adds some space between the items.
`;

// This is the text for the date.
const DateText = styled.span`
  font-size: 0.9rem; // This sets the font size.
  color: var(--color-text-secondary); // This sets the text color.
  margin-bottom: var(--spacing-sm); // This adds some space below the date.
  display: block; // This makes the date take up its own line.
`;

// This is the container for the recipient information.
const RecipientInfo = styled.div`
  font-size: 0.8rem; // This sets the font size.
  color: #bbb; // This sets the text color.
  margin-bottom: var(--spacing-xs); // This adds some space below the container.
  
  .name {
    font-weight: 500; // This makes the font bold.
    color: #ddd; // This sets the text color.
  }
  
  .address {
    font-size: 0.75rem; // This sets the font size.
    color: #999; // This sets the text color.
    margin-top: 2px; // This adds some space above the address.
  }
`;

// This is the container for the category chips.
const CategoriesInfo = styled.div`
  display: flex; // This arranges the chips in a row.
  flex-wrap: wrap; // This allows the chips to wrap to the next line if there's not enough space.
  gap: 0.25rem; // This adds some space between the chips.
  margin-top: var(--spacing-xs); // This adds some space above the container.
`;

// This is a single category chip.
const CategoryChip = styled.span`
  background: #555; // This sets the background color.
  color: #ccc; // This sets the text color.
  padding: 0.125rem 0.5rem; // This adds some space inside the chip.
  border-radius: var(--radius-sm); // This rounds the corners of the chip.
  font-size: 0.7rem; // This sets the font size.
  font-weight: 500; // This makes the font bold.
`;

// This is the container for the amount, which pushes it to the right side of the item.
const AmountContainer = styled.div`
  margin-left: auto; // This pushes the container to the right.
  text-align: right; // This aligns the text to the right.
`;

// This is the text for the amount.
const AmountText = styled.span<{ $negative: boolean }>`
  font-size: 1.5rem; // This sets the font size.
  font-weight: bold; // This makes the font bold.
  // This sets the text color to red for expenses and green for incomes.
  color: ${({ $negative }) =>
    $negative ? 'var(--color-negative)' : 'var(--color-positive)'};
  display: block; // This makes the amount take up its own line.
`;

// This is the container for the "Total" row at the bottom of the list.
const TotalEntry = styled(Entry)`
  background: #444; // This sets a different background color for the total row.
  margin-top: var(--spacing-md); // This adds some space above the total row.
  border-top: 1px solid #555; // This adds a line above the total row.
  font-weight: bold; // This makes the font bold.
`;

// This is the label for the total row, "SUM".
const TotalLabel = styled.div`
    flex: 1 1 auto; // This makes the label take up as much space as possible.
    font-size: 1.2rem; // This sets the font size.
`;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

// This is the main component for our summary page.
const SummaryPage: React.FC = () => {
  // These are helpers from React Router that let us work with the URL.
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  
  // This gets the current view filter ("all", "expenses", or "incomes") from the URL.
  const viewFilter = (searchParams.get('filter') as ViewFilter) || 'all';

  // This is where we store the state for our category filter.
  const initialCategoryIds = searchParams.getAll('categories').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>(initialCategoryIds);
  const [selectedDropdownCategory, setSelectedDropdownCategory] = useState<number | ''>('');

  // This fetches all the categories and category types from the server.
  const { data: allCategories = [], isLoading: isLoadingCategories } = useAllCategories();
  const { data: categoryTypes = [] } = useCategoryTypes();
  // This finds the ID of the "standard" category type.
  const standardTypeId = useMemo(() => categoryTypes.find(t => t.name === 'standard')?.id, [categoryTypes]);

  // This is a special function from React that runs whenever the URL changes.
  // It makes sure that our selected category filters are in sync with the URL.
  useEffect(() => {
    const urlCategoryIds = searchParams.getAll('categories').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    setSelectedCategoryIds(urlCategoryIds);
  }, [searchParams]);

  // This is a special function from React that runs whenever the selected category filters change.
  // It updates the URL to reflect the new filters.
  useEffect(() => {
    const newSearchParams = new URLSearchParams(searchParams);
    
    // We remove the old category filters from the URL.
    newSearchParams.delete('categories');
    
    // We add the new category filters to the URL.
    selectedCategoryIds.forEach(id => newSearchParams.append('categories', id.toString()));
    
    // We only update the URL if the filters have actually changed.
    const currentCategoryParams = searchParams.getAll('categories').map(id => parseInt(id, 10)).filter(id => !isNaN(id));
    const hasChanged = currentCategoryParams.length !== selectedCategoryIds.length ||
                      !currentCategoryParams.every(id => selectedCategoryIds.includes(id));
    
    if (hasChanged) {
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [selectedCategoryIds, setSearchParams]);

  // This fetches the payment items from the server, based on the current filters.
  const queryResult = usePaymentItems({
    expenseOnly: viewFilter === 'expenses',
    incomeOnly: viewFilter === 'incomes',
    categoryIds: selectedCategoryIds,
  });

  // We get the payment items, loading state, and error state from the query result.
  const queryData: PaymentItem[] | undefined = queryResult.data;
  const isLoading: boolean = queryResult.isLoading;
  const error: Error | null = queryResult.error;

  // This makes sure that we always have an array of payment items to work with, even if the data is still loading.
  const paymentDataForMemo: PaymentItem[] = queryData ?? [];

  /* ---------------------------------------------------------------------- */
  /* Derived Data                                                           */
  /* ---------------------------------------------------------------------- */
  // This sorts the payment items by date, with the most recent items first.
  const sorted: PaymentItem[] = useMemo(() => {
    return [...paymentDataForMemo].sort(
      (a: PaymentItem, b: PaymentItem) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }, [paymentDataForMemo]);

  // This calculates the total amount of all the payment items.
  const total: number = useMemo(() => {
    return paymentDataForMemo.reduce(
      (sum: number, item: PaymentItem) => sum + item.amount,
      0
    );
  }, [paymentDataForMemo]);

  // This gets the full category objects for the selected category IDs.
  const selectedCategories = useMemo(() => {
    return allCategories.filter(cat => cat.name !== "UNCLASSIFIED" && selectedCategoryIds.includes(cat.id));
  }, [allCategories, selectedCategoryIds]);

  /* ---------------------------------------------------------------------- */
  /* Callbacks                                                              */
  /* ---------------------------------------------------------------------- */
  // This function is called when you click the "Add Category" button.
  const handleAddCategory = useCallback(() => {
    if (selectedDropdownCategory && !selectedCategoryIds.includes(selectedDropdownCategory as number)) {
      setSelectedCategoryIds(prev => [...prev, selectedDropdownCategory as number]);
      setSelectedDropdownCategory('');
    }
  }, [selectedDropdownCategory, selectedCategoryIds]);

  // This function is called when you click the "x" on a category tag.
  const handleRemoveCategory = useCallback((categoryId: number) => {
    setSelectedCategoryIds(prev => prev.filter(id => id !== categoryId));
  }, []);

  // This function is called when you click the "Reset All" button.
  const handleResetFilters = useCallback(() => {
    setSelectedCategoryIds([]);
  }, []);

  // This function is called when you click the menu icon.
  const handleMenu = useCallback(() => {
    // In the future, this will open a side menu.
    console.info('Menu clicked');
  }, []);

  // This function is called when you click the "ADD" button.
  const handleAdd = useCallback(() => {
    navigate('/add');
  }, [navigate]);

  /* ---------------------------------------------------------------------- */
  /* Render                                                                 */
  /* ---------------------------------------------------------------------- */

  // If there was an error fetching the payment items, we show an error message.
  if (error) return <p>Error: {error.message}</p>;

  return (
    <>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1rem',
          gap: '0.5rem',
        }}
      >
        <h2>Payments</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={() => navigate('/category-types')}>Category Types</button>
          <button onClick={() => navigate('/categories')}>Categories</button>
        </div>
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
              .filter(cat => cat.name !== "UNCLASSIFIED" && !selectedCategoryIds.includes(cat.id))
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
              <AmountText $negative={total < 0}>
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

// This defines the "props" that our PaymentItemLine component accepts.
interface PaymentItemLineProps {
  item: PaymentItem; // The payment item to display.
  allCategories: Category[]; // The list of all categories.
  standardTypeId: number | undefined; // The ID of the "standard" category type.
}

// This component displays a single payment item in our list.
const PaymentItemLine: React.FC<PaymentItemLineProps> = ({ item, allCategories, standardTypeId }) => {
  // This gets the URL for the payment item's image.
  const imageUrl = item.attachment_url;
  // This fetches the recipient information for the payment item.
  const { data: fetchedRecipient } = useRecipient(item.recipient_id ?? undefined);
  const recipient = item.recipient ?? fetchedRecipient;

  // This finds the icon for the payment item's category.
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
          <AmountText $negative={isExpense(item)}>
            {item.amount.toFixed(2)} €
          </AmountText>
        </AmountContainer>
      </ContentWrapper>
    </Entry>
  );
};
