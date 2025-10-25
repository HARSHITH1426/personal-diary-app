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
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'date'> & { tags: string }) => string;
  updateEntry: (entry: DiaryEntry) => void;
  deleteEntry: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setSelectedDate: (date: Date | undefined) => void;
  importEntries: (newEntries: DiaryEntry[]) => void;
};

const getTagsFromEntries = (entries: DiaryEntry[]): string[] => {
  const allTags = entries.flatMap(entry => entry.tags);
  return [...new Set(allTags)].sort();
};

const saveEntriesToLocalStorage = (entries: DiaryEntry[]) => {
  try {
    localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(entries));
  } catch (error) {
    console.error("Failed to save entries to local storage:", error);
  }
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
      try {
        const storedEntries = localStorage.getItem(DIARY_STORAGE_KEY);
        if (storedEntries) {
          const entries = JSON.parse(storedEntries);
          const tags = getTagsFromEntries(entries);
          set({ entries, tags, initialized: true });
        } else {
          set({ initialized: true });
        }
      } catch (error) {
        console.error("Failed to load entries from local storage:", error);
        set({ initialized: true });
      }
    },
    addEntry: (newEntry) => {
      const id = new Date().toISOString() + Math.random();
      const entry: DiaryEntry = {
        ...newEntry,
        id,
        date: new Date().toISOString(),
        tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
      };
      const updatedEntries = produce(get().entries, (draft) => {
        draft.push(entry);
      });
      const tags = getTagsFromEntries(updatedEntries);
      set({ entries: updatedEntries, tags });
      saveEntriesToLocalStorage(updatedEntries);
      return id;
    },
    updateEntry: (updatedEntry) => {
      const entryData = {
          ...updatedEntry,
          tags: Array.isArray(updatedEntry.tags) ? updatedEntry.tags : updatedEntry.tags.toString().split(',').map(t => t.trim()).filter(Boolean),
      };
      const updatedEntries = produce(get().entries, (draft) => {
        const index = draft.findIndex((e) => e.id === updatedEntry.id);
        if (index !== -1) {
          draft[index] = entryData;
        }
      });
      const tags = getTagsFromEntries(updatedEntries);
      set({ entries: updatedEntries, tags });
      saveEntriesToLocalStorage(updatedEntries);
    },
    deleteEntry: (id) => {
      const updatedEntries = get().entries.filter((e) => e.id !== id);
      const tags = getTagsFromEntries(updatedEntries);
      set({ entries: updatedEntries, tags });
      saveEntriesToLocalStorage(updatedEntries);
    },
    setSearchTerm: (term) => set({ searchTerm: term }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    importEntries: (newEntries) => {
      const currentEntries = get().entries;
      const entryMap = new Map(currentEntries.map(e => [e.id, e]));
      newEntries.forEach(e => entryMap.set(e.id, e));
      const uniqueEntries = Array.from(entryMap.values());
      
      const tags = getTagsFromEntries(uniqueEntries);
      set({ entries: uniqueEntries, tags });
      saveEntriesToLocalStorage(uniqueEntries);
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
