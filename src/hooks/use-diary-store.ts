"use client";

import { create } from 'zustand';
import { DiaryEntry } from '@/lib/types';
import { produce } from 'immer';
import { isSameDay, parseISO } from 'date-fns';

const DIARY_STORAGE_KEY = 'core-diary-entries';

type DiaryState = {
  entries: DiaryEntry[];
  initialized: boolean;
  searchTerm: string;
  selectedDate: Date | undefined;
  tags: string[];
};

type DiaryActions = {
  initialize: () => void;
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'date' | 'tags'> & { tags: string }) => string;
  updateEntry: (entry: DiaryEntry) => void;
  deleteEntry: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setSelectedDate: (date: Date | undefined) => void;
  importEntries: (newEntries: DiaryEntry[]) => void;
};

const getEntriesFromStorage = (): DiaryEntry[] => {
  if (typeof window === 'undefined') {
    return [];
  }
  const entriesJson = localStorage.getItem(DIARY_STORAGE_KEY);
  return entriesJson ? JSON.parse(entriesJson) : [];
};

const saveEntriesToStorage = (entries: DiaryEntry[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(entries));
  }
};

const getTagsFromEntries = (entries: DiaryEntry[]): string[] => {
  const allTags = entries.flatMap(entry => entry.tags);
  return [...new Set(allTags)].sort();
};

export const useDiaryStore = create<DiaryState & { actions: DiaryActions }>()((set, get) => ({
  entries: [],
  initialized: false,
  searchTerm: '',
  selectedDate: undefined,
  tags: [],
  actions: {
    initialize: () => {
      if (get().initialized) return;
      const entries = getEntriesFromStorage();
      const tags = getTagsFromEntries(entries);
      set({ entries, tags, initialized: true });
    },
    addEntry: (newEntry) => {
      const id = crypto.randomUUID();
      const entry: DiaryEntry = {
        ...newEntry,
        id,
        date: new Date().toISOString(),
        tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const updatedEntries = produce(get().entries, (draft) => {
        draft.push(entry);
      });

      saveEntriesToStorage(updatedEntries);
      const tags = getTagsFromEntries(updatedEntries);
      set({ entries: updatedEntries, tags });
      return id;
    },
    updateEntry: (updatedEntry) => {
      const updatedEntries = produce(get().entries, (draft) => {
        const index = draft.findIndex((e) => e.id === updatedEntry.id);
        if (index !== -1) {
          draft[index] = {
            ...updatedEntry,
            tags: Array.isArray(updatedEntry.tags) ? updatedEntry.tags : updatedEntry.tags.toString().split(',').map(t => t.trim()).filter(Boolean),
          };
        }
      });
      saveEntriesToStorage(updatedEntries);
      const tags = getTagsFromEntries(updatedEntries);
      set({ entries: updatedEntries, tags });
    },
    deleteEntry: (id) => {
      const updatedEntries = get().entries.filter((e) => e.id !== id);
      saveEntriesToStorage(updatedEntries);
      const tags = getTagsFromEntries(updatedEntries);
      set({ entries: updatedEntries, tags });
    },
    setSearchTerm: (term) => set({ searchTerm: term }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    importEntries: (newEntries) => {
        const validEntries = newEntries.filter(e => e.id && e.date && e.title && typeof e.content !== 'undefined');
        const updatedEntries = [...get().entries, ...validEntries];
        // Remove duplicates, keeping the newly imported ones
        const uniqueEntries = Array.from(new Map(updatedEntries.map(e => [e.id, e])).values());
        saveEntriesToStorage(uniqueEntries);
        const tags = getTagsFromEntries(uniqueEntries);
        set({ entries: uniqueEntries, tags });
    }
  },
}));

export const useFilteredEntries = () => {
  const { entries, searchTerm, selectedDate } = useDiaryStore();

  return entries
    .filter((entry) => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = entry.title.toLowerCase().includes(searchLower);
      const contentMatch = entry.content.toLowerCase().includes(searchLower);
      const tagMatch = entry.tags.some(tag => tag.toLowerCase().includes(searchLower));
      const dateMatch = !selectedDate || isSameDay(parseISO(entry.date), selectedDate);

      return (titleMatch || contentMatch || tagMatch) && dateMatch;
    })
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
};
