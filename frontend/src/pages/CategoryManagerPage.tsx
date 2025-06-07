/**
 * CategoryManagerPage Component
 *
 * This page provides an interface for managing category types and their
 * associated categories. Users can view existing category types, add new ones,
 * and (in future iterations) manage the tree of categories within each type.
 *
 * Features:
 * - Displays a list of existing category types.
 * - Allows users to add new category types with a name and optional description.
 * - Uses React Query hooks (`useCategoryTypes`, `useCreateCategoryType`) for data fetching and mutations.
 * - Includes styled-components for basic layout and styling.
 * - Placeholder for displaying and managing individual category trees for each type.
 *
 * TODO:
 * - Implement `CategoryTreeDisplay` sub-component to show and manage nested categories for a type.
 * - Add functionality to edit and delete category types.
 * - Add functionality to edit and delete categories within a type's tree.
 * - Enhance UI for better user experience in managing complex category structures.
 */
import React, { useState } from 'react';
import styled from 'styled-components';
import { CategoryType, Category } from '../types'; // Category might be used by CategoryTreeDisplay
import {
  useCategoryTypes,
  useCreateCategoryType,
  // useCategoriesByType, // Will be used by CategoryTreeDisplay or similar
  // useCreateCategory    // Will be used by CategoryTreeDisplay or similar
} from '../api/hooks';

const PageWrapper = styled.div`
  padding: 1rem;
  color: #eaeaea;
`;

const SectionTitle = styled.h2`
  margin-top: 2rem;
  margin-bottom: 1rem;
  border-bottom: 1px solid #555;
  padding-bottom: 0.5rem;
`;

const List = styled.ul`
  list-style: none;
  padding: 0;
`;

const ListItem = styled.li`
  background-color: #2a2a2a;
  padding: 0.75rem 1rem;
  margin-bottom: 0.5rem;
  border-radius: 4px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: #333;
  border-radius: 8px;
`;

const Input = styled.input`
  padding: 0.75rem;
  border-radius: 4px;
  border: 1px solid #555;
  background-color: #444;
  color: #fff;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  border: none;
  background-color: #007bff;
  color: white;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s ease-in-out;
  align-self: flex-start;

  &:hover {
    background-color: #0056b3;
  }

  &:disabled {
    background-color: #555;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.p`
  color: red;
  font-size: 0.8rem;
`;

// TODO: Component for displaying and managing individual category trees
// TODO: Define and implement CategoryTreeDisplay component
// This component would likely take a `typeId: number` prop and manage
// fetching, displaying, and editing categories for that specific type.
// Example:
// const CategoryTreeDisplay = ({ typeId }: { typeId: number }) => {
//   const { data: categories, isLoading, error } = useCategoriesByType(typeId);
//   const createCategoryMutation = useCreateCategory();
//   // ... logic to display tree, add/edit/delete categories ...
//   return <div>Tree for type {typeId}</div>;
// };

const CategoryManagerPage: React.FC = () => {
  const { data: categoryTypes, isLoading: isLoadingTypes, error: typesError } = useCategoryTypes();
  const createCategoryTypeMutation = useCreateCategoryType();

  const [newTypeName, setNewTypeName] = useState(''); // State for the new category type name input
  const [newTypeDescription, setNewTypeDescription] = useState('');

  /**
   * Handles the submission of the form to add a new category type.
   * Prevents default form submission, validates input, and calls the `createCategoryTypeMutation`.
   * Clears input fields on successful submission.
   * @param e - The form event.
   */
  const handleAddCategoryType = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) {
      // Basic validation: prevent adding empty type names
      // Consider adding more robust validation and user feedback
      alert("Category type name cannot be empty.");
      return;
    }
    try {
      await createCategoryTypeMutation.mutateAsync({
        name: newTypeName,
        description: newTypeDescription || null,
      });
      setNewTypeName('');
      setNewTypeDescription('');
    } catch (err) {
      // Error is handled by mutation's isError and error properties
      console.error("Failed to create category type", err);
    }
  };

  return (
    <PageWrapper>
      <h1>Category Management</h1>

      <SectionTitle>Category Types</SectionTitle>
      <Form onSubmit={handleAddCategoryType}>
        <h3>Add New Category Type</h3>
        <Input
          type="text"
          placeholder="Type Name (e.g., Expense Type, Income Source)"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          required
        />
        <Input
          type="text"
          placeholder="Optional Description"
          value={newTypeDescription}
          onChange={(e) => setNewTypeDescription(e.target.value)}
        />
        <Button type="submit" disabled={createCategoryTypeMutation.isPending}> {/* Changed isLoading to isPending */}
          {createCategoryTypeMutation.isPending ? 'Adding...' : 'Add Type'}
        </Button>
        {createCategoryTypeMutation.isError && (
          <ErrorMessage>
            Failed to add type: {(createCategoryTypeMutation.error as Error)?.message || "An unknown error occurred."}
          </ErrorMessage>
        )}
      </Form>

      {isLoadingTypes && <p>Loading category types...</p>}
      {typesError && <ErrorMessage>Error loading types: {(typesError as Error)?.message || "Could not fetch category types."}</ErrorMessage>}
      
      {!isLoadingTypes && !typesError && categoryTypes && categoryTypes.length > 0 && (
        <List>
          {categoryTypes.map((type) => (
            <ListItem key={type.id}>
              <div>
                <strong>{type.name}</strong>
                {type.description && <em style={{ marginLeft: '0.5rem', fontSize: '0.9em', color: '#bbb' }}>({type.description})</em>}
              </div>
              {/* TODO: Add buttons for Edit/Delete Type and a link/button to manage categories for this type (e.g., navigate to /categories/:typeId or expand inline) */}
            </ListItem>
          ))}
        </List>
      )}
      {!isLoadingTypes && !typesError && (!categoryTypes || categoryTypes.length === 0) && (
        <p>No category types defined yet. Add one using the form above.</p>
      )}

      {/*
        Placeholder for where individual category trees would be managed.
        This section would iterate through `categoryTypes` and for each,
        render a `CategoryTreeDisplay` component (to be created).
        This component would handle fetching categories for that type (e.g., using `useCategoriesByType`),
        displaying them (potentially as a tree if nested), and allowing CRUD operations on them.
      */}
      {/* Example of future implementation:
        {categoryTypes?.map(type => (
          <div key={type.id}>
            <SectionTitle>Categories for: {type.name}</SectionTitle>
            { <CategoryTreeDisplay typeId={type.id} /> } // This component needs to be built
          </div>
        ))}
      */}
    </PageWrapper>
  );
};

export default CategoryManagerPage;