// This section brings in the tools we need to build this page.
import React, { useMemo, useState, useRef, useEffect } from 'react';
// This is a tool that lets us create and style our own components.
import styled from 'styled-components';
// This imports the functions that let us fetch, create, and update categories and their types.
import {
  useAllCategories,
  useCategoryTypes,
  useUpdateCategory,
  uploadCategoryIcon,
  useCreateCategory,
} from '../api/hooks';
// This imports the data structures we use for categories and their types.
import { Category, CategoryType } from '../types';

// This is the main container for our page.
const PageWrapper = styled.div`
  padding: 1rem; // This adds some space around the content.
  color: #eaeaea; // This sets the text color.
`;


// This is the box that displays the category icon.
const IconBox = styled.div`
  width: 40px; // This sets the width of the box.
  height: 40px; // This sets the height of the box.
  background: #444; // This sets the background color.
  display: flex; // This arranges the content in a flexible way.
  justify-content: center; // This centers the content horizontally.
  align-items: center; // This centers the content vertically.
  cursor: pointer; // This shows a hand cursor when you hover over the box.
  img {
    width: 100%; // This makes the image take up the full width of the box.
    height: 100%; // This makes the image take up the full height of the box.
    object-fit: cover; // This makes sure the image covers the entire box without being distorted.
  }
`;

// This is the "Save" button for each category row.
const SaveButton = styled.button`
  margin-left: auto; // This pushes the button to the right.
`;

// This is the container for the "Add new Category" section.
const AddContainer = styled.div`
  margin: 1rem 0; // This adds some space above and below the container.
  padding: 1rem; // This adds some space inside the container.
  border: 1px solid #555; // This adds a border around the container.
  border-radius: var(--radius-md); // This rounds the corners of the container.
  background: #2a2a2a; // This sets the background color.
`;

// This is the label for the "Add new Category" section.
const AddLabel = styled.div`
  font-size: 0.8rem; // This sets the font size.
  color: #bbb; // This sets the text color.
  margin-bottom: 0.5rem; // This adds some space below the label.
`;

// This is the container for the input field and button for adding a new category.
const AddRow = styled.div`
  display: flex; // This arranges the items in a row.
  align-items: center; // This vertically aligns the items in the center.
  gap: 0.5rem; // This adds some space between the items.
`;

// This is the input field for the new category name.
const AddInput = styled.input`
  flex: 1; // This makes the input field take up as much space as possible.
  padding: 0.5rem; // This adds some space inside the input field.
  border: 1px solid #555; // This adds a border around the input field.
  border-radius: var(--radius-md); // This rounds the corners of the input field.
  background: #333; // This sets the background color.
  color: #eaeaea; // This sets the text color.
`;

// This is the button for adding a new category.
const AddButton = styled.button`
  padding: 0.5rem 1rem; // This adds some space inside the button.
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

  // This styles the button when it's disabled.
  &:disabled {
    background: #666; // This sets a grey background color.
    cursor: not-allowed; // This shows a "not allowed" cursor.
  }
`;

// This is a container for a single cell in our category grid.
const Cell = styled.div`
  display: flex; // This arranges the items in a flexible way.
  flex-direction: column; // This stacks the items vertically.
  gap: 0.25rem; // This adds some space between the items.
`;

// This is the label for a form field in our category grid.
const Label = styled.label`
  font-size: 0.75rem; // This sets the font size.
  color: #bbb; // This sets the text color.
`;

// This is a dropdown menu in our category grid.
const StyledSelect = styled.select`
  padding: 0.5rem; // This adds some space inside the dropdown.
  border: 1px solid #555; // This adds a border around the dropdown.
  border-radius: var(--radius-md); // This rounds the corners of the dropdown.
  background: #333; // This sets the background color.
  color: #eaeaea; // This sets the text color.
`;

// This is the grid that displays all the categories.
const EntryGrid = styled.div`
  display: grid; // This creates a grid layout.
  grid-template-columns: 150px 1fr 1fr 60px auto; // This defines the columns of the grid.
  gap: 0.5rem; // This adds some space between the grid cells.
  align-items: center; // This vertically aligns the items in the center.
  margin-bottom: 0.75rem; // This adds some space below each row.
`;

// This defines the "props" that our CategoryRow component accepts.
// Props are like settings that we can use to customize a component.
interface CategoryRowProps {
  cat: Category; // The category to display in this row.
  categories: Category[]; // The list of all categories.
  types: CategoryType[]; // The list of all category types.
  standardTypeId?: number; // The ID of the "standard" category type.
  standardRootId?: number; // The ID of the root category of the "standard" type.
  getDescendants(id: number): number[]; // A function to get all the descendants of a category.
}

// This component displays a single row in our category grid.
const CategoryRow: React.FC<CategoryRowProps> = ({
  cat,
  categories,
  types,
  standardTypeId,
  standardRootId,
  getDescendants,
}) => {
  // This is where we store the state for this row, such as the selected parent category and type.
  const [parentId, setParentId] = useState<number | null>(cat.parent_id ?? null);
  const [typeId, setTypeId] = useState<number>(cat.type_id);
  const [icon, setIcon] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  // This is a function that lets us update the category on the server.
  const updateMutation = useUpdateCategory(cat.id);

  // This is a special function from React that runs whenever the category's parent or type changes.
  useEffect(() => {
    setParentId(cat.parent_id ?? null);
    setTypeId(cat.type_id);
  }, [cat.parent_id, cat.type_id]);

  // This is a special function from React that runs whenever the user selects a new icon.
  // It creates a temporary URL for the icon so we can show a preview.
  useEffect(() => {
    if (!icon) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(icon);
    setPreview(url);
    // This cleans up the temporary URL when the component is no longer needed.
    return () => URL.revokeObjectURL(url);
  }, [icon]);

  // This creates a list of valid parent categories for the current category.
  // A category can't be its own parent, and it can't be a descendant of itself.
  const validParents = categories.filter(
    (c) =>
      c.type_id === typeId &&
      c.id !== cat.id &&
      !getDescendants(cat.id).includes(c.id)
  );

  // This function is called when you click the "Save" button.
  // It sends the updated category data to the server.
  const handleSave = async () => {
    let icon_file = cat.icon_file;
    // If the user has selected a new icon, we upload it to the server first.
    if (icon) {
      icon_file = await uploadCategoryIcon(icon);
    }
    // We send the updated parent ID, type ID, and icon file to the server.
    await updateMutation.mutateAsync({ parent_id: parentId, type_id: typeId, icon_file });
  };

  // We disable the type selection for the "standard" root category, so it can't be changed.
  const disableTypeSelect =
    standardTypeId && standardRootId && cat.type_id === standardTypeId && cat.id === standardRootId;

  return (
    <EntryGrid>
      <span>{cat.name}</span>
      <Cell>
        <Label>Parent category</Label>
        <StyledSelect
          value={parentId ?? ''}
          onChange={(e) => setParentId(e.target.value === '' ? null : parseInt(e.target.value))}
        >
          <option value="">No parent</option>
          {validParents.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </StyledSelect>
      </Cell>
      {!disableTypeSelect ? (
        <Cell>
          <Label>Type</Label>
          <StyledSelect value={typeId} onChange={(e) => setTypeId(parseInt(e.target.value))}>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </StyledSelect>
        </Cell>
      ) : (
        <div />
      )}
      <IconBox onClick={() => fileRef.current?.click()}>
        {preview ? (
          <img src={preview} alt="icon preview" />
        ) : cat.icon_file ? (
          <img src={`/api/download_static/${cat.icon_file}`} alt="icon" />
        ) : (
          <span>add icon</span>
        )}
        <input
          type="file"
          accept="image/png"
          style={{ display: 'none' }}
          ref={fileRef}
          onChange={(e) => setIcon(e.target.files?.[0] || null)}
        />
      </IconBox>
      <SaveButton onClick={handleSave}>Save</SaveButton>
    </EntryGrid>
  );
};

// This is the main component for our category edit page.
export default function CategoryEditPage() {
  // This fetches the list of all categories and category types from the server.
  const { data: categories = [] } = useAllCategories();
  const { data: types = [] } = useCategoryTypes();
  // This is a function that lets us create a new category on the server.
  const createCategoryMutation = useCreateCategory();
  // This is where we store the name of the new category that the user is creating.
  const [newCatName, setNewCatName] = useState('');

  // This finds the ID of the "standard" category type.
  const standardTypeId = useMemo(() => types.find(t => t.name === 'standard')?.id, [types]);

  // This sorts the categories so that the "standard" category is always at the top.
  const sorted = useMemo(() => {
    if (!standardTypeId) return categories;
    const standardIndex = categories.findIndex(c => c.type_id === standardTypeId);
    if (standardIndex === -1) return categories;
    const rest = categories.filter((_, idx) => idx !== standardIndex);
    return [categories[standardIndex], ...rest];
  }, [categories, standardTypeId]);

  // This creates a map of parent categories to their children.
  // This makes it easy to find all the descendants of a category.
  const childrenMap = useMemo(() => {
    const map: Record<number, number[]> = {};
    categories.forEach(c => {
      if (c.parent_id) {
        if (!map[c.parent_id]) map[c.parent_id] = [];
        map[c.parent_id].push(c.id);
      }
    });
    return map;
  }, [categories]);

  // This function gets all the descendants of a category.
  const getDescendants = (id: number): number[] => {
    const result: number[] = [];
    const stack = [id];
    while (stack.length) {
      const current = stack.pop()!;
      const children = childrenMap[current] || [];
      for (const child of children) {
        result.push(child);
        stack.push(child);
      }
    }
    return result;
  };

  return (
    <PageWrapper>
      <h1>Categories</h1>
      <AddContainer>
        <AddLabel>Add new Category</AddLabel>
        <AddRow>
          <AddInput
            type="text"
            value={newCatName}
            onChange={e => setNewCatName(e.target.value)}
            placeholder="Category name"
          />
          <AddButton
            onClick={async () => {
              const name = newCatName.trim();
              if (!name) return;
              const typeId = standardTypeId || (types[0] && types[0].id);
              if (!typeId) return;
              await createCategoryMutation.mutateAsync({ name, type_id: typeId, parent_id: null });
              setNewCatName('');
            }}
            disabled={!newCatName.trim() || createCategoryMutation.isPending}
          >
            Add
          </AddButton>
        </AddRow>
      </AddContainer>
      {sorted.map((cat) => (
        <CategoryRow
          key={cat.id}
          cat={cat}
          categories={categories}
          types={types}
          standardTypeId={standardTypeId}
          standardRootId={sorted[0]?.id}
          getDescendants={getDescendants}
        />
      ))}
    </PageWrapper>
  );
}
