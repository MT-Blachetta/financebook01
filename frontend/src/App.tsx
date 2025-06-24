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

// This section brings in all the tools we need to build our app's main screen.
// It's like getting all your tools ready before starting a DIY project.
import React, { lazy, Suspense, useState, useCallback } from 'react';
// These are for setting up the different pages of our app and letting you navigate between them.
import { Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
// This is a tool that lets us create and style our own components, like buttons and backgrounds.
import styled from 'styled-components';

// This imports the navigation bar that you see at the top of the app.
import { NavigationBar, ViewFilter } from './components/NavigationBar';

// ---------------------------------------------------------------------------
// Lazy-loaded route modules
// ---------------------------------------------------------------------------

// To make the app load faster, we're telling it to only load the code for a page when you actually need it.
// This is like only taking out the ingredients you need for one recipe at a time, instead of everything at once.
const SummaryPage = lazy(() => import('./pages/SummaryPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const AddItemPage = lazy(() => import('./pages/AddItemPage')); // This is the page where you can add a new payment.
const AddSuccessPage = lazy(() => import('./pages/AddSuccessPage')); // This page shows up after you've successfully added a payment.
const EditItemPage = lazy(() => import('./pages/EditItemPage')); // This is the page where you can edit an existing payment.
const CategoryManagerPage = lazy(() => import('./pages/CategoryManagerPage')); // This page is for managing different types of categories.
const CategoryEditPage = lazy(() => import('./pages/CategoryEditPage')); // This page is for managing your spending categories.

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------

/** This is the main container for our entire application. It makes sure everything is centered and looks good on any screen. */
const Wrapper = styled.div`
  display: flex; /* This arranges items in a flexible way. */
  flex-direction: column; /* This stacks items vertically. */
  min-height: 100dvh; /* This makes sure the app fills the entire screen height. */
  background: #000; /* This sets the background color to black, as requested. */
`;

/** This is the main content area of our app, where all the pages will be displayed. */
const Content = styled.main`
  flex: 1 1 auto; /* This makes the content area grow to fill any available space. */
  width: 100%; /* This makes the content area take up the full width of the screen. */
  max-width: 48rem; /* This sets a maximum width to keep the text readable on large screens. */
  margin-inline: auto; /* This centers the content area horizontally. */
  padding: 1rem; /* This adds some space around the content. */
  color: #eaeaea; /* This sets the text color to a light grey, which is easy to read on a black background. */
`;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

// This is the main "App" component. It's like the director of a play, telling all the other components what to do.
const App: React.FC = () => {
  // This is a helper that lets us change pages in the app.
  const navigate = useNavigate();
  // This keeps track of whether the side menu is open or closed.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // We're checking the URL to see if you're filtering for "all", "expenses", or "incomes".
  const [searchParams] = useSearchParams();
  const currentFilter = (searchParams.get('filter') as ViewFilter) || 'all';

  /**
   * This function is called when you choose a filter in the navigation bar (like "all", "expenses", or "incomes").
   * It updates the page to show only the items you've selected.
   * @param filter - The selected filter ('all', 'expenses', 'incomes').
   */
  const handleGlobalNavFilterChange = (filter: ViewFilter) => {
    // If you select "all", it takes you to the main page.
    if (filter === 'all') {
      navigate('/');
    } else {
      // Otherwise, it updates the URL to reflect the filter you've chosen.
      navigate(`/?filter=${filter}`);
    }
    // This closes the side menu if it's open.
    setIsDrawerOpen(false);
  };

  /**
   * This function opens or closes the side menu when you click the menu icon.
   */
  const handleMenuClick = useCallback(() => {
    // This simply flips the state of the drawer from open to closed, or vice-versa.
    setIsDrawerOpen(prev => !prev);
  }, []);

  /**
   * This function is called when you click the "ADD" button in the navigation bar.
   * It takes you to the page where you can add a new payment.
   */
  const handleAddClick = useCallback(() => {
    // This tells the app to go to the "/add" page.
    navigate('/add');
    // This closes the side menu if it's open.
    setIsDrawerOpen(false);
  }, [navigate]);

  /**
   * This is the side menu that slides in from the left.
   * It contains links to the main pages of the app.
   */
  const NavigationDrawer = () => (
    // This is the main container for the side menu.
    <div style={{
      position: 'fixed', // This keeps the menu in place, even when you scroll.
      top: 0, // This positions the menu at the top of the screen.
      left: isDrawerOpen ? 0 : '-300px', // This slides the menu in and out of view.
      width: '300px', // This sets the width of the menu.
      height: '100%', // This makes the menu fill the entire height of the screen.
      background: '#222', // This sets the background color of the menu.
      color: 'white', // This sets the text color to white.
      padding: '20px', // This adds some space around the content of the menu.
      transition: 'left 0.3s ease', // This creates a smooth animation when the menu slides in and out.
      zIndex: 1000, // This makes sure the menu appears on top of everything else.
      borderRight: '1px solid #444' // This adds a border to the right side of the menu.
    }}>
      <h3>Menu</h3>
      {/* This is a list of links to the different pages in the app. */}
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '10px' }}><button onClick={() => { navigate('/'); setIsDrawerOpen(false); }}>Summary</button></li>
        <li style={{ marginBottom: '10px' }}><button onClick={() => { navigate('/add'); setIsDrawerOpen(false); }}>Add Payment</button></li>
        <li style={{ marginBottom: '10px' }}><button onClick={() => { navigate('/categories'); setIsDrawerOpen(false); }}>Categories</button></li>
        <li style={{ marginBottom: '10px' }}><button onClick={() => { navigate('/category-types'); setIsDrawerOpen(false); }}>Category Types</button></li>
        {/* We can add more links here later, for example, to a settings page. */}
      </ul>
    </div>
  );


  // This is what the App component actually shows on the screen.
  return (
    // This is the main container for our app.
    <Wrapper>
      {/* This is the navigation bar at the top of the screen. */}
      <NavigationBar
        active={currentFilter} // This tells the navigation bar which filter is currently active.
        onChange={handleGlobalNavFilterChange} // This tells the navigation bar what to do when you change the filter.
        onMenu={handleMenuClick} // This tells the navigation bar what to do when you click the menu icon.
        onAdd={handleAddClick} // This tells the navigation bar what to do when you click the "ADD" button.
        onCategories={() => navigate('/categories')} // This tells the navigation bar to go to the categories page when you click on it.
      />
      {/* This is the side menu that slides in from the left. */}
      <NavigationDrawer />

      {/* This is the main content area of our app. If you click on it while the side menu is open, the menu will close. */}
      <Content onClick={() => { if (isDrawerOpen) setIsDrawerOpen(false);}}>
        {/* This shows a "Loading..." message while the page content is being loaded. */}
        <Suspense fallback={<p>Loading page content…</p>}>
          {/* This is where we define all the different pages of our app. */}
          <Routes>
            {/* This is the main page of our app, which shows a summary of your payments. */}
            <Route path="/" element={<SummaryPage />} />
            
            {/* These are the pages for adding and editing payments. */}
            <Route path="/add" element={<AddItemPage />} />
            <Route path="/add-success" element={<AddSuccessPage />} />
            <Route path="/payment/new" element={<AddItemPage />} />
            <Route path="/payment/:id/edit" element={<EditItemPage />} />
            
            {/* These are the pages for managing your spending categories. */}
            <Route path="/categories" element={<CategoryEditPage />} />
            <Route path="/category-types" element={<CategoryManagerPage />} />
            
            {/* If you try to go to a page that doesn't exist, this will show a "Not Found" page. */}
            <Route path="/404" element={<NotFoundPage />} />
            <Route path="*" element={<Navigate to="/404" replace />} />
          </Routes>
        </Suspense>
      </Content>
    </Wrapper>
  );
};

export default App;
