/**
 * Persistent top-navigation bar.
 *
 * Responsibilities
 * -----------------
 * • Displays application title
 * • Provides quick filters (All ▾, Expenses, Incomes) as described
 * • Offers a hamburger menu on small screens to open additional navigation
 *   (future extensions: category editor, settings, etc.)
 *
 * The component is *presentational* – it receives the active filter and
 * callbacks via props.  State-management lives higher up (e.g. in
 * `SummaryPage`) so other components can react to filter changes.
 */

// This section brings in the tools we need to build the navigation bar.
import React from 'react';
// This is a tool that lets us create and style our own components.
import styled from 'styled-components';
// This is a helper that makes it easy to apply styles conditionally.
import clsx from 'clsx';

// This imports the image for the menu icon.
import menuIconUrl from '../assets/menu.svg';

/* -------------------------------------------------------------------------- */
/* Types & Props                                                              */
/* -------------------------------------------------------------------------- */

// This defines the different ways you can filter the items on the summary page.
export type ViewFilter = 'all' | 'expenses' | 'incomes';

// This defines the "props" that our NavigationBar component accepts.
// Props are like settings that we can use to customize a component.
interface NavigationBarProps {
  // This tells the navigation bar which filter is currently active.
  active: ViewFilter;
  // This is a function that gets called when you choose a new filter.
  onChange(filter: ViewFilter): void;

  /** This function is called when you click the menu icon. */
  onMenu(): void;

  /** This function is called when you click the "ADD" button. */
  onAdd?(): void;

  /** This function is called when you click the "Categories" button. */
  onCategories?(): void;
}

/* -------------------------------------------------------------------------- */
/* Styled Components                                                          */
/* -------------------------------------------------------------------------- */

// This is the main container for the navigation bar.
const Bar = styled.header`
  background: var(--color-surface); // This sets the background color.
  padding: var(--spacing-sm) var(--spacing-md); // This adds some space around the content.
  display: flex; // This arranges items in a flexible way.
  align-items: center; // This vertically aligns the items in the center.
  justify-content: space-between; // This spreads out the items to fill the available space.
  border-bottom: 1px solid #272727; // This adds a border at the bottom of the bar.
`;

// This is the title of our app, "FinanceBook".
const Title = styled.h1`
  font-size: 1.25rem; // This sets the font size.
  font-weight: 600; // This makes the font bold.
  color: var(--color-text-primary); // This sets the text color.
  letter-spacing: 0.02em; // This adds a little space between the letters.
`;

// This is the container for the filter buttons ("All", "Expenses", "Incomes").
const Filters = styled.nav`
  display: flex; // This arranges the buttons in a row.
  gap: var(--spacing-sm); // This adds some space between the buttons.

  button {
    background: none; // This makes the button background transparent.
    border: none; // This removes the button border.
    color: var(--color-text-secondary); // This sets the text color.
    font-size: 0.9rem; // This sets the font size.
    cursor: pointer; // This shows a hand cursor when you hover over the button.
    padding: var(--spacing-xs) var(--spacing-sm); // This adds some space inside the button.
    border-radius: var(--radius-md); // This rounds the corners of the button.

    // This style is applied to the currently active filter button.
    &.active {
      background: #333; // This sets a dark background color.
      color: var(--color-text-primary); // This sets a lighter text color.
    }
  }

  // On small screens, we hide the filter buttons and show a menu icon instead.
  @media (max-width: 480px) {
    display: none;
  }
`;

// This is the "ADD" button that lets you add a new payment.
const AddButton = styled.button`
  background: var(--color-positive); // This sets the background color to green.
  color: white; // This sets the text color to white.
  border: none; // This removes the button border.
  padding: var(--spacing-xs) var(--spacing-md); // This adds some space inside the button.
  border-radius: var(--radius-md); // This rounds the corners of the button.
  font-size: 0.9rem; // This sets the font size.
  font-weight: 600; // This makes the font bold.
  cursor: pointer; // This shows a hand cursor when you hover over the button.
  transition: background-color 0.2s ease; // This creates a smooth color change on hover.

  // This makes the button a darker green when you hover over it.
  &:hover {
    background: #059669;
  }

  // On smaller screens, we make the button a little smaller.
  @media (max-width: 640px) {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.8rem;
  }
`;

// This is the menu button that appears on small screens.
const MenuButton = styled.button`
  display: none; // We hide this button on larger screens.
  background: transparent; // This makes the button background transparent.
  border: none; // This removes the button border.
  padding: var(--spacing-xs); // This adds some space inside the button.
  cursor: pointer; // This shows a hand cursor when you hover over the button.

  // This styles the menu icon itself.
  svg {
    width: 24px;
    height: 24px;
    fill: var(--color-text-primary);
  }

  // On small screens, we show the menu button.
  @media (max-width: 480px) {
    display: block;
  }
`;

// This is a container for the items on the right side of the navigation bar.
const RightSection = styled.div`
  display: flex; // This arranges the items in a row.
  align-items: center; // This vertically aligns the items in the center.
  gap: var(--spacing-md); // This adds some space between the items.
`;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

// This is the main NavigationBar component. It brings together all the styled components we defined above.
export const NavigationBar: React.FC<NavigationBarProps> = ({
  active,
  onChange,
  onMenu,
  onAdd,
  onCategories
}) => {
  return (
    // This is the main container for the navigation bar.
    <Bar>
      {/* This is the title of our app. */}
      <Title>FinanceBook</Title>

      {/* This is the container for the filter buttons. */}
      <Filters>
        {/* This is the "All" filter button. */}
        <button
          className={clsx({ active: active === 'all' })}
          onClick={() => onChange('all')}
        >
          All
        </button>
        {/* This is the "Expenses" filter button. */}
        <button
          className={clsx({ active: active === 'expenses' })}
          onClick={() => onChange('expenses')}
        >
          Expenses
        </button>
        {/* This is the "Incomes" filter button. */}
        <button
          className={clsx({ active: active === 'incomes' })}
          onClick={() => onChange('incomes')}
        >
          Incomes
        </button>
      </Filters>

      {/* This is the container for the items on the right side of the navigation bar. */}
      <RightSection>
        {/* If the "onAdd" function is provided, we show the "ADD" button. */}
        {onAdd && (
          <AddButton onClick={onAdd}>
            ADD
          </AddButton>
        )}
        {/* If the "onCategories" function is provided, we show the "Categories" button. */}
        {onCategories && (
          <button onClick={onCategories}>
            Categories
          </button>
        )}
        {/* This is the menu button that appears on small screens. */}
        <MenuButton aria-label="Open Menu" onClick={onMenu}>
          <img src={menuIconUrl} alt="Menu" />
        </MenuButton>
      </RightSection>
    </Bar>
  );
};
