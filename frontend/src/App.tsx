/**
 * Root component that defines the global application layout and routes.
 *
 * We keep the shell deliberately minimal:
 *   – Top-level navigation (persistent)
 *   – <Outlet /> for nested routes
 *
 * Individual screens such as the "Summary" page are lazy-loaded to keep the
 * initial bundle small.  React-Router will automatically code-split when using
 * `lazy()` + `Suspense`.
 */

import React, { lazy, Suspense, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import styled from 'styled-components';

import { NavigationBar, ViewFilter } from './components/NavigationBar';

// ---------------------------------------------------------------------------
// Lazy-loaded route modules
// ---------------------------------------------------------------------------

// Lazy-loaded page components for better initial load performance.
// React.lazy and Suspense handle code-splitting and loading states.
const SummaryPage = lazy(() => import('./pages/SummaryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AddItemPage = lazy(() => import('./pages/AddItemPage')); // Page for creating new payment items
const AddSuccessPage = lazy(() => import('./pages/AddSuccessPage')); // Success page after creating payment
const EditItemPage = lazy(() => import('./pages/EditItemPage')); // Page for editing existing payment items
const CategoryManagerPage = lazy(() => import('./pages/CategoryManagerPage')); // Page for managing categories and types

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** Application wrapper ensures content is centred and scrollable. */
const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
  background: #000; /* page background as requested */
`;

const Content = styled.main`
  flex: 1 1 auto;
  width: 100%;
  max-width: 48rem; /* keep readable line-length on desktop */
  margin-inline: auto;
  padding: 1rem;
  color: #eaeaea; /* light grey text for contrast on black */
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const App: React.FC = () => {
  const navigate = useNavigate();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Get current filter from URL to show active state in navigation
  const [searchParams] = useSearchParams();
  const currentFilter = (searchParams.get('filter') as ViewFilter) || 'all';

  /**
   * Handles filter changes from the global NavigationBar.
   * Currently, it navigates to the summary page with the selected filter as a query parameter.
   * Also closes the drawer if it's open.
   * @param filter - The selected ViewFilter ('all', 'expenses', 'incomes').
   */
  const handleGlobalNavFilterChange = (filter: ViewFilter) => {
    if (filter === 'all') {
      navigate('/');
    } else {
      navigate(`/?filter=${filter}`);
    }
    setIsDrawerOpen(false);
  };

  /**
   * Toggles the visibility of the navigation drawer.
   * This is called when the menu icon in the NavigationBar is clicked.
   */
  const handleMenuClick = useCallback(() => {
    setIsDrawerOpen(prev => !prev);
  }, []);

  /**
   * Handles the ADD button click from the NavigationBar.
   * Navigates to the Add Payment page.
   */
  const handleAddClick = useCallback(() => {
    navigate('/add');
    setIsDrawerOpen(false);
  }, [navigate]);

  const handleCategoriesClick = useCallback(() => {
    navigate('/categories');
    setIsDrawerOpen(false);
  }, [navigate]);

  /**
   * A simple placeholder component for the navigation drawer.
   * In a real application, this would be a more robust and styled component,
   * potentially using a UI library or custom styling.
   * It provides links to different parts of the application.
   */
  const NavigationDrawer = () => (
    <div style={{ // Basic inline styles for demonstration
      position: 'fixed',
      top: 0,
      left: isDrawerOpen ? 0 : '-300px',
      width: '300px',
      height: '100%',
      background: '#222',
      color: 'white',
      padding: '20px',
      transition: 'left 0.3s ease',
      zIndex: 1000, // Ensure it's above other content
      borderRight: '1px solid #444'
    }}>
      <h3>Menu</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '10px' }}><button onClick={() => { navigate('/'); setIsDrawerOpen(false); }}>Summary</button></li>
        <li style={{ marginBottom: '10px' }}><button onClick={() => { navigate('/add'); setIsDrawerOpen(false); }}>Add Payment</button></li>
        <li style={{ marginBottom: '10px' }}><button onClick={() => { navigate('/categories'); setIsDrawerOpen(false); }}>Manage Categories</button></li>
        {/* Add more links as needed, e.g., Settings */}
      </ul>
    </div>
  );


  return (
    <Wrapper>
      <NavigationBar
        active={currentFilter}
        onChange={handleGlobalNavFilterChange}
        onMenu={handleMenuClick}
        onAdd={handleAddClick}
        onCategories={handleCategoriesClick}
      />
      <NavigationDrawer />

      <Content onClick={() => { if (isDrawerOpen) setIsDrawerOpen(false);}}> {/* Close drawer on content click */}
        <Suspense fallback={<p>Loading page content…</p>}> {/* Fallback UI during lazy load */}
          <Routes>
            {/* Main route for the payment summary */}
            <Route path="/" element={<SummaryPage />} />
            
            {/* Routes for creating and editing payment items */}
            <Route path="/add" element={<AddItemPage />} />
            <Route path="/add-success" element={<AddSuccessPage />} />
            <Route path="/payment/new" element={<AddItemPage />} />
            <Route path="/payment/:id/edit" element={<EditItemPage />} />
            
            {/* Route for managing categories */}
            <Route path="/categories" element={<CategoryManagerPage />} />
            
            {/* Fallback routes for 404 and unmatched paths */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} /> {/* Redirect any unmatched path to 404 */}
          </Routes>
        </Suspense>
      </Content>
    </Wrapper>
  );
};

export default App;
