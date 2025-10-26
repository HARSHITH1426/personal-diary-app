"use client";

import React from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { BookOpen, PlusCircle, Loader2 } from "lucide-react";

import { useFilteredEntries, useDiaryStore } from "@/hooks/use-diary-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiaryEntry } from "@/lib/types";

/**
 * EntryCard is a presentational component responsible for rendering a single
 * diary entry in a list. It's designed to be clickable, leading the user
 * to the detail/edit page for that specific entry.
 * @param {DiaryEntry} entry - The full diary entry object to display.
 */
function EntryCard({ entry }: { entry: DiaryEntry }) {
  // We create a short summary of the content to avoid cluttering the UI.
  // This makes the main diary page scannable.
  const contentSnippet = entry.content.substring(0, 150);
  
  // The date from Firestore might be a string, so we parse it into a Date object
  // to ensure consistent formatting. We provide a fallback to the current date
  // just in case the entry date is missing.
  const entryDate = entry.date ? parseISO(entry.date) : new Date();

  return (
    <Link href={`/diary/edit/${entry.id}`} className="block">
      <Card className="hover:shadow-md transition-shadow duration-200 h-full flex flex-col">
        <CardHeader>
          <CardTitle className="font-headline">{entry.title}</CardTitle>
          <CardDescription>{format(entryDate, "MMMM d, yyyy 'at' h:mm a")}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground">{contentSnippet}{entry.content.length > 150 ? "..." : ""}</p>
        </CardContent>
        {/* We only render the footer for tags if there are any, keeping the card clean. */}
        {entry.tags && entry.tags.length > 0 && (
          <CardFooter>
            <div className="flex flex-wrap gap-2">
              {entry.tags.map((tag) => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
              ))}
            </div>
          </CardFooter>
        )}
      </Card>
    </Link>
  );
}


/**
 * This is the main page for the diary. It displays a grid of all diary entries
 * that match the current filters (search term and selected date). It also handles
 * the loading state and shows a prompt to create a new entry if none exist.
 */
export default function DiaryPage() {
  // This custom hook handles the logic of filtering and sorting entries based on global state.
  // By abstracting this logic, our component stays clean and focused on rendering.
  const filteredEntries = useFilteredEntries();
  const { isLoading } = useDiaryStore();

  // While data is being fetched from Firestore, we show a loading spinner
  // to give the user feedback that something is happening in the background.
  if (isLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

  // This is the "empty state" of the page. It's important for good UX to guide
  // the user on what to do next when there's no data to show.
  if (filteredEntries.length === 0) {
    return (
      <div className="text-center flex flex-col items-center justify-center h-full">
        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium font-headline">No Entries Yet</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Your story begins here. Create your first entry.
        </p>
        <div className="mt-6">
          <Link href="/diary/new" passHref>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              New Entry
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // The main view: a responsive grid that maps over the filtered entries
  // and renders an EntryCard for each one.
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {filteredEntries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
