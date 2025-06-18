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

import React from 'react';
import styled from 'styled-components';
import clsx from 'clsx';

import menuIconUrl from '../assets/menu.svg';

/* -------------------------------------------------------------------------- */
/* Types & Props                                                              */
/* -------------------------------------------------------------------------- */

export type ViewFilter = 'all' | 'expenses' | 'incomes';

interface NavigationBarProps {
  active: ViewFilter;
  onChange(filter: ViewFilter): void;

  /** Callback when user clicks the hamburger icon. */
  onMenu(): void;

  /** Optional callback when user clicks the ADD button. */
  onAdd?(): void;

  /** Optional callback when user clicks the Categories button. */
  onCategories?(): void;
}

/* -------------------------------------------------------------------------- */
/* Styled Components                                                          */
/* -------------------------------------------------------------------------- */

const Bar = styled.header`
  background: var(--color-surface);
  padding: var(--spacing-sm) var(--spacing-md);
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #272727;
`;

const Title = styled.h1`
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-text-primary);
  letter-spacing: 0.02em;
`;

const Filters = styled.nav`
  display: flex;
  gap: var(--spacing-sm);

  button {
    background: none;
    border: none;
    color: var(--color-text-secondary);
    font-size: 0.9rem;
    cursor: pointer;
    padding: var(--spacing-xs) var(--spacing-sm);
    border-radius: var(--radius-md);

    &.active {
      background: #333;
      color: var(--color-text-primary);
    }
  }

  @media (max-width: 480px) {
    display: none; /* collapse into menu on small viewports */
  }
`;

const AddButton = styled.button`
  background: var(--color-positive);
  color: white;
  border: none;
  padding: var(--spacing-xs) var(--spacing-md);
  border-radius: var(--radius-md);
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #059669; /* Darker green on hover */
  }

  @media (max-width: 640px) {
    padding: var(--spacing-xs) var(--spacing-sm);
    font-size: 0.8rem;
  }
`;

const MenuButton = styled.button`
  display: none; /* hidden on desktop */
  background: transparent;
  border: none;
  padding: var(--spacing-xs);
  cursor: pointer;

  svg {
    width: 24px;
    height: 24px;
    fill: var(--color-text-primary);
  }

  @media (max-width: 480px) {
    display: block;
  }
`;

const RightSection = styled.div`
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
`;

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export const NavigationBar: React.FC<NavigationBarProps> = ({
  active,
  onChange,
  onMenu,
  onAdd,
  onCategories,
}) => {
  return (
    <Bar>
      <Title>FinanceBook</Title>

      <Filters>
        <button
          className={clsx({ active: active === 'all' })}
          onClick={() => onChange('all')}
        >
          All
        </button>
        <button
          className={clsx({ active: active === 'expenses' })}
          onClick={() => onChange('expenses')}
        >
          Expenses
        </button>
        <button
          className={clsx({ active: active === 'incomes' })}
          onClick={() => onChange('incomes')}
        >
          Incomes
        </button>
      </Filters>

      <RightSection>
        {onAdd && (
          <AddButton onClick={onAdd}>
            ADD
          </AddButton>
        )}
        {onCategories && (
          <AddButton onClick={onCategories}>
            categories
          </AddButton>
        )}
        <MenuButton aria-label="Open Menu" onClick={onMenu}>
          <img src={menuIconUrl} alt="Menu" />
        </MenuButton>
      </RightSection>
    </Bar>
  );
};
