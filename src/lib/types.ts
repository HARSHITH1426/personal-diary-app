
import { Timestamp } from "firebase/firestore";

export type DiaryEntry = {
  id: string;
  date: string; // ISO 8601 format string for client-side rendering
  dateCreated: Timestamp | Date; // Firestore Timestamp or Date
  dateModified: Timestamp | Date;
  title: string;
  content: string;
  tags: string[];
  imageUrl?: string; // Optional field for the image URL
};
