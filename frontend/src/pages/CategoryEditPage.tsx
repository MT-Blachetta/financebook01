import React, { useMemo, useState, useRef } from 'react';
import styled from 'styled-components';
import { useAllCategories, useCategoryTypes, useUpdateCategory, uploadCategoryIcon } from '../api/hooks';
import { Category } from '../types';

const PageWrapper = styled.div`
  padding: 1rem;
  color: #eaeaea;
`;

const EntryRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
`;

const IconBox = styled.div`
  width: 40px;
  height: 40px;
  background: #444;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const SaveButton = styled.button`
  margin-left: auto;
`;

export default function CategoryEditPage() {
  const { data: categories = [] } = useAllCategories();
  const { data: types = [] } = useCategoryTypes();

  const standardTypeId = useMemo(() => types.find(t => t.name === 'standard')?.id, [types]);

  const sorted = useMemo(() => {
    if (!standardTypeId) return categories;
    const standardIndex = categories.findIndex(c => c.type_id === standardTypeId);
    if (standardIndex === -1) return categories;
    const rest = categories.filter((_, idx) => idx !== standardIndex);
    return [categories[standardIndex], ...rest];
  }, [categories, standardTypeId]);

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
      {sorted.map(cat => {
        const [parentId, setParentId] = useState<number | null>(cat.parent_id ?? null);
        const [typeId, setTypeId] = useState<number>(cat.type_id);
        const [icon, setIcon] = useState<File | null>(null);
        const fileRef = useRef<HTMLInputElement>(null);
        const updateMutation = useUpdateCategory(cat.id);

        const validParents = categories.filter(c =>
          c.type_id === typeId && c.id !== cat.id && !getDescendants(cat.id).includes(c.id)
        );

        const handleSave = async () => {
          let icon_file = cat.icon_file;
          if (icon) {
            icon_file = await uploadCategoryIcon(icon);
          }
          await updateMutation.mutateAsync({ parent_id: parentId, type_id: typeId, icon_file });
        };

        return (
          <EntryRow key={cat.id}>
            <span>{cat.name}</span>
            <select value={parentId ?? ''} onChange={e => setParentId(e.target.value === '' ? null : parseInt(e.target.value))}>
              <option value="">No parent</option>
              {validParents.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {!(standardTypeId && sorted[0] && cat.type_id === standardTypeId && cat.id === sorted[0].id) && (
              <select value={typeId} onChange={e => setTypeId(parseInt(e.target.value))}>
                {types.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            )}
            <IconBox onClick={() => fileRef.current?.click()}>
              {cat.icon_file ? (
                <img src={`/api/download_static/${cat.icon_file}`} alt="icon" />
              ) : (
                <span>add icon</span>
              )}
              <input type="file" accept="image/png" style={{ display: 'none' }} ref={fileRef} onChange={e => setIcon(e.target.files?.[0] || null)} />
            </IconBox>
            <SaveButton onClick={handleSave}>Save</SaveButton>
          </EntryRow>
        );
      })}
    </PageWrapper>
  );
}
