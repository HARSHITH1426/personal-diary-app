"use client";

import { create } from 'zustand';
import { DiaryEntry } from '@/lib/types';
import { produce } from 'immer';
import { isSameDay, parseISO } from 'date-fns';
import { collection, doc, getDocs, writeBatch, getFirestore } from 'firebase/firestore';
import { 
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase/non-blocking-updates';

type DiaryState = {
  entries: DiaryEntry[];
  initialized: boolean;
  searchTerm: string;
  selectedDate: Date | undefined;
  tags: string[];
};

type DiaryActions = {
  initialize: (userId: string) => void;
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'date' | 'tags'> & { tags: string }, userId: string) => string;
  updateEntry: (entry: DiaryEntry, userId: string) => void;
  deleteEntry: (id: string, userId: string) => void;
  setSearchTerm: (term: string) => void;
  setSelectedDate: (date: Date | undefined) => void;
  importEntries: (newEntries: DiaryEntry[], userId: string) => void;
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
    initialize: async (userId) => {
      if (get().initialized) return;
      const db = getFirestore();
      const entriesCol = collection(db, `users/${userId}/diaryEntries`);
      const snapshot = await getDocs(entriesCol);
      const entries = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DiaryEntry));
      const tags = getTagsFromEntries(entries);
      set({ entries, tags, initialized: true });
    },
    addEntry: (newEntry, userId) => {
      const db = getFirestore();
      const id = doc(collection(db, `users/${userId}/diaryEntries`)).id;
      const entry: DiaryEntry = {
        ...newEntry,
        id,
        date: new Date().toISOString(),
        tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const docRef = doc(db, `users/${userId}/diaryEntries`, id);
      addDocumentNonBlocking(collection(db, `users/${userId}/diaryEntries`), entry);

      const updatedEntries = produce(get().entries, (draft) => {
        draft.push(entry);
      });
      const tags = getTagsFromEntries(updatedEntries);
      set({ entries: updatedEntries, tags });
      return id;
    },
    updateEntry: (updatedEntry, userId) => {
      const db = getFirestore();
      const docRef = doc(db, `users/${userId}/diaryEntries`, updatedEntry.id);
      const entryData = {
          ...updatedEntry,
          tags: Array.isArray(updatedEntry.tags) ? updatedEntry.tags : updatedEntry.tags.toString().split(',').map(t => t.trim()).filter(Boolean),
      };
      setDocumentNonBlocking(docRef, entryData, { merge: true });
      
      const updatedEntries = produce(get().entries, (draft) => {
        const index = draft.findIndex((e) => e.id === updatedEntry.id);
        if (index !== -1) {
          draft[index] = entryData;
        }
      });
      const tags = getTagsFromEntries(updatedEntries);
      set({ entries: updatedEntries, tags });
    },
    deleteEntry: (id, userId) => {
      const db = getFirestore();
      const docRef = doc(db, `users/${userId}/diaryEntries`, id);
      deleteDocumentNonBlocking(docRef);

      const updatedEntries = get().entries.filter((e) => e.id !== id);
      const tags = getTagsFromEntries(updatedEntries);
      set({ entries: updatedEntries, tags });
    },
    setSearchTerm: (term) => set({ searchTerm: term }),
    setSelectedDate: (date) => set({ selectedDate: date }),
    importEntries: async (newEntries, userId) => {
        const db = getFirestore();
        const validEntries = newEntries.filter(e => e.id && e.date && e.title && typeof e.content !== 'undefined');
        const updatedEntries = [...get().entries, ...validEntries];
        const uniqueEntries = Array.from(new Map(updatedEntries.map(e => [e.id, e])).values());

        const batch = writeBatch(db);
        validEntries.forEach(entry => {
            const docRef = doc(db, `users/${userId}/diaryEntries`, entry.id);
            batch.set(docRef, entry);
        });
        await batch.commit();

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
