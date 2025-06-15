/**
 * AddSuccessPage Component
 *
 * This page displays a success message when a payment item has been successfully created.
 * According to customer specifications:
 * - Shows "OK, payment added successfully" in green
 * - Has a "Back" button to redirect to the summary page
 */
import React from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

const PageContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 50vh;
  padding: 2rem;
`;

const SuccessMessage = styled.h1`
  color: var(--color-positive);
  font-size: 1.5rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const BackButton = styled.button`
  padding: 0.75rem 2rem;
  font-size: 1rem;
  border: none;
  border-radius: var(--radius-md);
  background: var(--color-positive);
  color: white;
  cursor: pointer;
  transition: background-color 0.2s ease;

  &:hover {
    background: #059669;
  }
`;

const AddSuccessPage: React.FC = () => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate('/');
  };

  return (
    <PageContainer>
      <SuccessMessage>OK, payment added successfully</SuccessMessage>
      <BackButton onClick={handleBack}>
        Back
      </BackButton>
    </PageContainer>
  );
};

export default AddSuccessPage;
