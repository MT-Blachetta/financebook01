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
// This section brings in the tools we need to build this page.
import React, { useState } from 'react';
// This is a tool that lets us create and style our own components.
import styled from 'styled-components';
// This imports the data structures we use for category types and categories.
import { CategoryType, Category } from '../types';
// This imports the functions that let us fetch and create category types.
import {
  useCategoryTypes,
  useCreateCategoryType,
} from '../api/hooks';

// This is the main container for our page.
const PageWrapper = styled.div`
  padding: 1rem; // This adds some space around the content.
  color: #eaeaea; // This sets the text color.
`;

// This is the title for each section of the page.
const SectionTitle = styled.h2`
  margin-top: 2rem; // This adds some space above the title.
  margin-bottom: 1rem; // This adds some space below the title.
  border-bottom: 1px solid #555; // This adds a line below the title.
  padding-bottom: 0.5rem; // This adds some space below the line.
`;

// This is the list that will contain our category types.
const List = styled.ul`
  list-style: none; // This removes the default bullet points.
  padding: 0; // This removes the default padding.
`;

// This is an item in our list of category types.
const ListItem = styled.li`
  background-color: #2a2a2a; // This sets the background color.
  padding: 0.75rem 1rem; // This adds some space inside the item.
  margin-bottom: 0.5rem; // This adds some space below the item.
  border-radius: 4px; // This rounds the corners of the item.
  display: flex; // This arranges the content of the item in a flexible way.
  justify-content: space-between; // This spreads out the content to fill the available space.
  align-items: center; // This vertically aligns the content in the center.
`;

// This is the form for adding a new category type.
const Form = styled.form`
  display: flex; // This arranges the form fields in a flexible way.
  flex-direction: column; // This stacks the form fields vertically.
  gap: 0.5rem; // This adds some space between the form fields.
  margin-bottom: 1.5rem; // This adds some space below the form.
  padding: 1rem; // This adds some space inside the form.
  background-color: #333; // This sets the background color.
  border-radius: 8px; // This rounds the corners of the form.
`;

// This is an input field in our form.
const Input = styled.input`
  padding: 0.75rem; // This adds some space inside the input field.
  border-radius: 4px; // This rounds the corners of the input field.
  border: 1px solid #555; // This adds a border around the input field.
  background-color: #444; // This sets the background color.
  color: #fff; // This sets the text color to white.
  font-size: 1rem; // This sets the font size.
`;

// This is a button in our form.
const Button = styled.button`
  padding: 0.75rem 1.5rem; // This adds some space inside the button.
  border-radius: 4px; // This rounds the corners of the button.
  border: none; // This removes the button border.
  background-color: #007bff; // This sets the background color to blue.
  color: white; // This sets the text color to white.
  font-size: 1rem; // This sets the font size.
  cursor: pointer; // This shows a hand cursor when you hover over the button.
  transition: background-color 0.2s ease-in-out; // This creates a smooth color change on hover.
  align-self: flex-start; // This aligns the button to the left.

  // This makes the button a darker blue when you hover over it.
  &:hover {
    background-color: #0056b3;
  }

  // This styles the button when it's disabled.
  &:disabled {
    background-color: #555; // This sets a grey background color.
    cursor: not-allowed; // This shows a "not allowed" cursor.
  }
`;

// This is the message we show if there's an error.
const ErrorMessage = styled.p`
  color: red; // This sets the text color to red.
  font-size: 0.8rem; // This sets the font size.
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

// This is the main component for our category manager page.
const CategoryManagerPage: React.FC = () => {
  // This fetches the list of category types from the server.
  const { data: categoryTypes, isLoading: isLoadingTypes, error: typesError } = useCategoryTypes();
  // This is a function that lets us create a new category type on the server.
  const createCategoryTypeMutation = useCreateCategoryType();

  // This is where we store the name and description of the new category type that the user is creating.
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');

  /**
   * This function is called when you submit the form to add a new category type.
   * It sends the new category type data to the server.
   * @param e - The form event.
   */
  const handleAddCategoryType = async (e: React.FormEvent) => {
    // We prevent the form from being submitted in the default way.
    e.preventDefault();
    // We make sure that the user has entered a name for the category type.
    if (!newTypeName.trim()) {
      alert("Category type name cannot be empty.");
      return;
    }
    try {
      // We send the new category type data to the server.
      await createCategoryTypeMutation.mutateAsync({
        name: newTypeName,
        description: newTypeDescription || null,
      });
      // If the creation is successful, we clear the input fields.
      setNewTypeName('');
      setNewTypeDescription('');
    } catch (err) {
      // If there's an error, we log it to the console for debugging.
      console.error("Failed to create category type", err);
    }
  };

  // This is what the page actually shows on the screen.
  return (
    <PageWrapper>
      <h1>Category Management</h1>

      <SectionTitle>Category Types</SectionTitle>
      {/* This is the form for adding a new category type. */}
      <Form onSubmit={handleAddCategoryType}>
        <h3>Add New Category Type</h3>
        {/* This is the input field for the new category type's name. */}
        <Input
          type="text"
          placeholder="Type Name (e.g., Expense Type, Income Source)"
          value={newTypeName}
          onChange={(e) => setNewTypeName(e.target.value)}
          required
        />
        {/* This is the input field for the new category type's description. */}
        <Input
          type="text"
          placeholder="Optional Description"
          value={newTypeDescription}
          onChange={(e) => setNewTypeDescription(e.target.value)}
        />
        {/* This is the button for submitting the form. */}
        <Button type="submit" disabled={createCategoryTypeMutation.isPending}>
          {createCategoryTypeMutation.isPending ? 'Adding...' : 'Add Type'}
        </Button>
        {/* If there's an error creating the category type, we show an error message. */}
        {createCategoryTypeMutation.isError && (
          <ErrorMessage>
            Failed to add type: {(createCategoryTypeMutation.error as Error)?.message || "An unknown error occurred."}
          </ErrorMessage>
        )}
      </Form>

      {/* If the category types are still loading, we show a loading message. */}
      {isLoadingTypes && <p>Loading category types...</p>}
      {/* If there was an error fetching the category types, we show an error message. */}
      {typesError && <ErrorMessage>Error loading types: {(typesError as Error)?.message || "Could not fetch category types."}</ErrorMessage>}
      
      {/* Once the category types have been loaded, we show them in a list. */}
      {!isLoadingTypes && !typesError && categoryTypes && categoryTypes.length > 0 && (
        <List>
          {categoryTypes.map((type) => (
            <ListItem key={type.id}>
              <div>
                <strong>{type.name}</strong>
                {type.description && <em style={{ marginLeft: '0.5rem', fontSize: '0.9em', color: '#bbb' }}>({type.description})</em>}
              </div>
              {/* In the future, we'll add buttons here to edit or delete the category type. */}
            </ListItem>
          ))}
        </List>
      )}
      {/* If there are no category types, we show a message telling the user to add one. */}
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
