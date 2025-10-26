"use client";

import { create } from 'zustand';
import { DiaryEntry } from '@/lib/types';
import { produce } from 'immer';
import { isSameDay, parseISO } from 'date-fns';
import { useAuth, useFirestore, useUser, useCollection, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { useEffect } from 'react';
import { 
  addDocumentNonBlocking, 
  updateDocumentNonBlocking, 
  deleteDocumentNonBlocking 
} from '@/firebase/non-blocking-updates';

type DiaryState = {
  entries: DiaryEntry[];
  isLoading: boolean;
  error: Error | null;
  searchTerm: string;
  selectedDate: Date | undefined;
  tags: string[];
};

type DiaryActions = {
  setEntries: (entries: DiaryEntry[]) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'date' | 'dateModified' | 'dateCreated'> & { tags: string }) => Promise<string>;
  updateEntry: (entry: DiaryEntry) => void;
  deleteEntry: (id: string) => void;
  setSearchTerm: (term: string) => void;
  setSelectedDate: (date: Date | undefined) => void;
};

const getTagsFromEntries = (entries: DiaryEntry[]): string[] => {
  const allTags = entries.flatMap(entry => entry.tags || []);
  return [...new Set(allTags)].sort();
};


export const useDiaryStore = create<DiaryState & { actions: DiaryActions }>()((set, get) => ({
  entries: [],
  isLoading: true,
  error: null,
  searchTerm: '',
  selectedDate: undefined,
  tags: [],
  actions: {
    setEntries: (entries) => set({ entries, tags: getTagsFromEntries(entries) }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    addEntry: async (newEntry) => {
      const { user } = useUser.getState();
      const firestore = useFirestore.getState();
      if (!user || !firestore) throw new Error("User or Firestore not available");

      const entryData = {
        ...newEntry,
        title: newEntry.title || "Untitled",
        content: newEntry.content,
        tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
        dateCreated: serverTimestamp(),
        dateModified: serverTimestamp(),
      };
      
      const userEntriesCol = collection(firestore, 'users', user.uid, 'diaryEntries');
      const docRef = await addDocumentNonBlocking(userEntriesCol, entryData);
      return docRef.id;
    },
    updateEntry: (updatedEntry) => {
      const { user } = useUser.getState();
      const firestore = useFirestore.getState();
      if (!user || !firestore) return;
      
      const { id, ...data } = updatedEntry;

      const entryData = {
          ...data,
          tags: Array.isArray(updatedEntry.tags) ? updatedEntry.tags : updatedEntry.tags.toString().split(',').map(t => t.trim()).filter(Boolean),
          dateModified: serverTimestamp(),
      };

      const docRef = doc(firestore, 'users', user.uid, 'diaryEntries', id);
      updateDocumentNonBlocking(docRef, entryData);
    },
    deleteEntry: (id) => {
      const { user } = useUser.getState();
      const firestore = useFirestore.getState();
      if (!user || !firestore) return;

      const docRef = doc(firestore, 'users', user.uid, 'diaryEntries', id);
      deleteDocumentNonBlocking(docRef);
    },
    setSearchTerm: (term) => set({ searchTerm: term }),
    setSelectedDate: (date) => set({ selectedDate: date }),
  },
}));


export const useSyncDiaryStore = () => {
  const { user } = useUser();
  const firestore = useFirestore();
  const { setEntries, setLoading, setError } = useDiaryStore(state => state.actions);

  const entriesQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return collection(firestore, 'users', user.uid, 'diaryEntries');
  }, [user, firestore]);

  const { data: entries, isLoading, error } = useCollection<Omit<DiaryEntry, 'id'>>(entriesQuery);

  useEffect(() => {
    if (entries) {
      const formattedEntries = entries.map(e => ({
        ...e,
        date: e.dateCreated?.toDate().toISOString() || new Date().toISOString(),
      })) as DiaryEntry[];
      setEntries(formattedEntries);
    }
    setLoading(isLoading);
    setError(error);
  }, [entries, isLoading, error, setEntries, setLoading, setError]);
};


export const useFilteredEntries = () => {
  useSyncDiaryStore();
  const { entries, searchTerm, selectedDate } = useDiaryStore();

  return entries
    .filter((entry) => {
      const searchLower = searchTerm.toLowerCase();
      const titleMatch = entry.title.toLowerCase().includes(searchLower);
      const contentMatch = entry.content.toLowerCase().includes(searchLower);
      const tagMatch = entry.tags?.some(tag => tag.toLowerCase().includes(searchLower));
      const dateMatch = !selectedDate || isSameDay(parseISO(entry.date), selectedDate);

      return (titleMatch || contentMatch || tagMatch) && dateMatch;
    })
    .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
};
