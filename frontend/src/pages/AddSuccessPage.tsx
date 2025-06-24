/**
 * AddSuccessPage Component
 *
 * This page displays a success message when a payment item has been successfully created.
 * According to customer specifications:
 * - Shows "OK, payment added successfully" in green
 * - Has a "Back" button to redirect to the summary page
 */
// This section brings in the tools we need to build this page.
import React from 'react';
// This is a helper that lets us change pages in the app.
import { useNavigate } from 'react-router-dom';
// This is a tool that lets us create and style our own components.
import styled from 'styled-components';

// This is the main container for our success page.
const PageContainer = styled.div`
  display: flex; // This arranges the items in a flexible way.
  flex-direction: column; // This stacks the items vertically.
  align-items: center; // This centers the items horizontally.
  justify-content: center; // This centers the items vertically.
  min-height: 50vh; // This makes the container take up at least half the height of the screen.
  padding: 2rem; // This adds some space around the content.
`;

// This is the success message that we show to the user.
const SuccessMessage = styled.h1`
  color: var(--color-positive); // This sets the text color to green.
  font-size: 1.5rem; // This sets the font size.
  text-align: center; // This centers the text.
  margin-bottom: 2rem; // This adds some space below the message.
`;

// This is the "Back" button that takes the user back to the summary page.
const BackButton = styled.button`
  padding: 0.75rem 2rem; // This adds some space inside the button.
  font-size: 1rem; // This sets the font size.
  border: none; // This removes the button border.
  border-radius: var(--radius-md); // This rounds the corners of the button.
  background: var(--color-positive); // This sets the background color to green.
  color: white; // This sets the text color to white.
  cursor: pointer; // This shows a hand cursor when you hover over the button.
  transition: background-color 0.2s ease; // This creates a smooth color change on hover.

  // This makes the button a darker green when you hover over it.
  &:hover {
    background: #059669;
  }
`;

// This is the main component for our success page.
const AddSuccessPage: React.FC = () => {
  // This is a helper that lets us change pages in the app.
  const navigate = useNavigate();

  // This function is called when you click the "Back" button.
  const handleBack = () => {
    // This takes you back to the main summary page.
    navigate('/');
  };

  // This is what the page actually shows on the screen.
  return (
    // This is the main container for the page.
    <PageContainer>
      {/* This is the success message. */}
      <SuccessMessage>OK, payment added successfully</SuccessMessage>
      {/* This is the "Back" button. */}
      <BackButton onClick={handleBack}>
        Back
      </BackButton>
    </PageContainer>
  );
};

// This makes the AddSuccessPage available to be used in other parts of our app.
export default AddSuccessPage;
