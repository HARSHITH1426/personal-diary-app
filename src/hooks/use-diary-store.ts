"use client";

import { create } from 'zustand';
import { DiaryEntry } from '@/lib/types';
import { produce } from 'immer';
import { isSameDay, parseISO } from 'date-fns';
import { collection, doc, getDocs, writeBatch, getFirestore, onSnapshot } from 'firebase/firestore';
import { 
  addDocumentNonBlocking,
  deleteDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type DiaryState = {
  entries: DiaryEntry[];
  initialized: boolean;
  searchTerm: string;
  selectedDate: Date | undefined;
  tags: string[];
};

type DiaryActions = {
  initialize: (userId: string) => () => void; // Returns unsubscribe function
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
    initialize: (userId) => {
        if (get().initialized) return () => {};
        const db = getFirestore();
        const entriesCol = collection(db, `users/${userId}/diaryEntries`);
      
        const unsubscribe = onSnapshot(
          entriesCol,
          (snapshot) => {
            const entries = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as DiaryEntry));
            const tags = getTagsFromEntries(entries);
            set({ entries, tags, initialized: true });
          },
          (err) => {
            console.error("Error in onSnapshot:", err);
            const contextualError = new FirestorePermissionError({
              operation: 'list',
              path: entriesCol.path,
            });
            errorEmitter.emit('permission-error', contextualError);
          }
        );
      
        return unsubscribe;
      },
    addEntry: (newEntry, userId) => {
      const db = getFirestore();
      const docRef = doc(collection(db, `users/${userId}/diaryEntries`));
      const id = docRef.id;

      const entry: DiaryEntry = {
        ...newEntry,
        id,
        date: new Date().toISOString(),
        tags: newEntry.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

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
    importEntries: (newEntries, userId) => {
        const db = getFirestore();
        const validEntries = newEntries.filter(e => e.id && e.date && e.title && typeof e.content !== 'undefined');
        
        const batch = writeBatch(db);
        validEntries.forEach(entry => {
            const docRef = doc(db, `users/${userId}/diaryEntries`, entry.id);
            // Here we just stage the write. The commit will be where the error could happen.
            batch.set(docRef, entry, { merge: true });
        });
        
        batch.commit().then(() => {
            // This part only runs on success
            const updatedEntries = [...get().entries, ...validEntries];
            const uniqueEntries = Array.from(new Map(updatedEntries.map(e => [e.id, e])).values());
            const tags = getTagsFromEntries(uniqueEntries);
            set({ entries: uniqueEntries, tags });
        }).catch(error => {
            // On failure, we construct and emit a contextual error for the batch write.
            // We can't know which exact document failed, so we report a general 'write' on the collection.
            const contextualError = new FirestorePermissionError({
                operation: 'write', // Batch writes are generic 'write' operations
                path: `users/${userId}/diaryEntries`, // Path to the collection
                requestResourceData: validEntries.map(e => ({id: e.id, ...e})) // Include all data that was attempted
            });
            errorEmitter.emit('permission-error', contextualError);
        });
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
