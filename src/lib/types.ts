export type DiaryEntry = {
  id: string;
  date: string; // ISO 8601 format
  title: string;
  content: string;
  tags: string[];
};
