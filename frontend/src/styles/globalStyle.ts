/**
 * Global StyleSheet using `styled-components`.
 *
 * – Implements a modern CSS reset (inspired by Josh W. Comeau’s reset)
 * – Defines CSS custom properties (design-tokens) for colours, spacing, etc.
 * – Sets default typography that mirrors professional finance dashboards
 */

// This imports a special function from styled-components that lets us create global styles.
import { createGlobalStyle } from 'styled-components';

// This is where we define all the global styles for our app.
// These styles will be applied to every page and component in the app.
export const GlobalStyle = createGlobalStyle`
  /* This is a "CSS reset". It's a set of styles that removes the default styling that browsers apply to web pages.
     This helps us make sure that our app looks the same in all browsers. */
  *,*::before,*::after{
    box-sizing:border-box;
  }
  *{
    margin:0; // This removes the default margin from all elements.
  }
  html,body{
    height:100%; // This makes the html and body elements take up the full height of the screen.
  }
  body{
    line-height:1.5; // This sets the line height for the text.
    -webkit-font-smoothing:antialiased; // This makes the text look smoother on some screens.
    background:#000;          // This sets the background color of the page to black.
    color:#eaeaea;            // This sets the default text color to a light grey.
    // This sets the default font for the app.
    font-family: 'Inter', ui-sans-serif, system-ui, -apple-system,
      BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell,
      'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
    font-size: 16px; // This sets the default font size.
  }
  img,picture,video,canvas,svg{
    display:block; // This makes images and other media take up their own line.
    max-width:100%; // This makes sure that images and other media don't overflow their containers.
  }
  input,button,textarea,select{
    font:inherit; // This makes form elements use the same font as the rest of the app.
  }
  p,h1,h2,h3,h4,h5,h6{
    overflow-wrap:break-word; // This makes sure that long words don't overflow their containers.
  }
  #root,#__next{
    isolation:isolate; // This is a special property that helps with stacking elements on top of each other.
  }

  /* These are our "design tokens". They're like variables that we can use in our CSS to make sure that our app has a consistent look and feel. */
  :root {
    --color-bg: #000000; // The background color of the page.
    --color-surface: #1c1c1c; // The background color of surfaces like cards and menus.
    --color-text-primary: #eaeaea; // The primary text color.
    --color-text-secondary: #9e9e9e; // The secondary text color.

    --color-positive: #2ecc71; // The color for positive things, like income.
    --color-negative: #e74c3c; // The color for negative things, like expenses.

    --radius-lg: 0.75rem; // A large border radius for rounding corners.
    --radius-md: 0.5rem; // A medium border radius for rounding corners.

    --spacing-xs: 0.25rem; // Extra small spacing.
    --spacing-sm: 0.5rem; // Small spacing.
    --spacing-md: 1rem; // Medium spacing.
    --spacing-lg: 1.5rem; // Large spacing.
  }

  // This sets the style for links.
  a {
    color: var(--color-positive); // This sets the link color to our positive color (green).
    text-decoration: none; // This removes the underline from links.
  }

  /* This styles the scrollbar to match our dark theme. */
  ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  ::-webkit-scrollbar-thumb {
    background: var(--color-surface);
    border-radius: 4px;
  }
  ::-webkit-scrollbar-thumb:hover {
    background: #333;
  }
`;
