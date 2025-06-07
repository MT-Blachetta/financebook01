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

import { ReactComponent as MenuIcon } from '../assets/menu.svg'; // vector icon (to be added)

/* -------------------------------------------------------------------------- */
/* Types & Props                                                              */
/* -------------------------------------------------------------------------- */

export type ViewFilter = 'all' | 'expenses' | 'incomes';

interface NavigationBarProps {
  active: ViewFilter;
  onChange(filter: ViewFilter): void;

  /** Callback when user clicks the hamburger icon. */
  onMenu(): void;
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

/* -------------------------------------------------------------------------- */
/* Component                                                                  */
/* -------------------------------------------------------------------------- */

export const NavigationBar: React.FC<NavigationBarProps> = ({
  active,
  onChange,
  onMenu,
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

      <MenuButton aria-label="Open Menu" onClick={onMenu}>
        <MenuIcon />
      </MenuButton>
    </Bar>
  );
};