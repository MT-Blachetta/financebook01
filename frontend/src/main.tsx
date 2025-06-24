/**
 * Entry point for the FinanceBook web application.
 *
 *  – Mounts React to the DOM
 *  – Configures React-Query (TanStack) for data-fetching & caching
 *  – Sets up React-Router for client-side navigation
 *
 * Every other part of the front-end is rendered inside the Router so that we
 * can provide deep-linkable URLs and a modern SPA experience.
 *
 * (c) 2025 FinanceBook – MIT License
 */

// This section imports all the necessary building blocks for our app.
// Think of it like gathering your ingredients before you start cooking.
// React is the main library we use to build the user interface.
import React from 'react';
// ReactDOM is what connects our React app to the web page.
import ReactDOM from 'react-dom/client';
// These are for managing data, like fetching your account balance from a server.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// This helps with navigation, allowing you to move between different pages in the app.
import { BrowserRouter } from 'react-router-dom';

// This imports the overall look and feel of the app, like colors and fonts.
import { GlobalStyle } from './styles/globalStyle'; // global CSS-in-JS reset
// This is the main component of our application, which holds everything together.
import App from './App';

// ---------------------------------------------------------------------------
// Query-Client configuration
// ---------------------------------------------------------------------------

/**
 * A single QueryClient instance is shared across the entire application.
 * The configuration below reflects common production defaults:
 *
 *   – Stale time:   fresh for 30s → avoids refetching on every window focus
 *   – Retry:        exponential-backoff, max = 3
 *   – Refetch on window-focus: enabled (good for finance data consistency)
 *
 * You can fine-tune these per-query in the individual hooks.
 */

// We're setting up a "Query Client" here. It's like a smart assistant for our app
// that helps fetch and manage data from the server.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // This tells our app to consider data "fresh" for 30 seconds.
      // It prevents the app from asking for the same information over and over again.
      staleTime: 30_000,
      // If the app has trouble fetching data, it will try again up to 3 times.
      retry: 3,
      // If you switch to another window and then come back, the app will automatically
      // check for any new data to make sure you're seeing the most up-to-date information.
      refetchOnWindowFocus: true,
    },
  },
});

// ---------------------------------------------------------------------------
// Mount React
// ---------------------------------------------------------------------------

// This line finds the specific spot in our HTML file where our app should be placed.
// It's like finding the right frame for a picture.
const container = document.getElementById('root');
// This is a safety check. If the "root" container is missing,
// we'll know something is wrong with our main HTML file.
if (!container) {
  throw new Error(
    "Root container with id='root' was not found in index.html. " +
      'Did Vite inject the template correctly?',
  );
}

// This is where we finally tell React to build our app and put it on the screen.
ReactDOM.createRoot(container).render(
  // StrictMode is a helper from React that checks for potential problems in our code.
  <React.StrictMode>
    {/* This makes our smart data-fetching assistant (QueryClient) available to the whole app. */}
    <QueryClientProvider client={queryClient}>
      {/* This enables the page navigation within our app. */}
      <BrowserRouter>
        {/* This applies the global styles, like background color and text styles, to our app. */}
        <GlobalStyle />
        {/* This is the main component that contains all other parts of our app. */}
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
