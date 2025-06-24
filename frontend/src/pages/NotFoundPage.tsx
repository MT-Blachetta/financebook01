/**
 * Fallback 404 page for unknown routes.
 */

// This section brings in the tools we need to build this page.
import React from 'react';
// This is a tool that lets us create and style our own components.
import styled from 'styled-components';
// This is a component from React Router that lets us create links to other pages.
import { Link } from 'react-router-dom';

// This is the main container for our page.
const Wrapper = styled.section`
  display: grid; // This creates a grid layout.
  place-items: center; // This centers the content both horizontally and vertically.
  text-align: center; // This centers the text.
  padding: var(--spacing-lg); // This adds some space around the content.
  min-height: 60vh; // This makes the container take up at least 60% of the height of the screen.
`;

// This is the "404" error code.
const Code = styled.h2`
  font-size: 4rem; // This sets the font size.
  margin-bottom: var(--spacing-sm); // This adds some space below the error code.
  color: var(--color-negative); // This sets the text color to red.
`;

// This is the error message that we show to the user.
const Message = styled.p`
  font-size: 1.1rem; // This sets the font size.
  margin-bottom: var(--spacing-md); // This adds some space below the message.
  color: var(--color-text-secondary); // This sets the text color.
`;

// This is the main component for our "Not Found" page.
const NotFoundPage: React.FC = () => (
  // This is the main container for the page.
  <Wrapper>
    <div>
      {/* This is the "404" error code. */}
      <Code>404</Code>
      {/* This is the error message. */}
      <Message>Sorry, the page you’re looking for doesn’t exist.</Message>
      {/* This is a link that takes the user back to the main summary page. */}
      <Link to="/">Back to Dashboard</Link>
    </div>
  </Wrapper>
);

// This makes the NotFoundPage available to be used in other parts of our app.
export default NotFoundPage;
