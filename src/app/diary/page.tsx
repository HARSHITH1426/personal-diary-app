
"use client";

import React from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { BookOpen, PlusCircle, Loader2 } from "lucide-react";
import Image from "next/image";

import { useFilteredEntries, useDiaryStore } from "@/hooks/use-diary-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiaryEntry } from "@/lib/types";

function EntryCard({ entry }: { entry: DiaryEntry }) {
  const contentSnippet = entry.content.substring(0, 150);
  const entryDate = entry.date ? parseISO(entry.date) : new Date();

  return (
    <Link href={`/diary/edit/${entry.id}`} className="block group">
      <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col break-inside-avoid-column">
        {entry.imageUrl && (
            <div className="overflow-hidden rounded-t-lg">
                <Image
                    src={entry.imageUrl}
                    alt={entry.title}
                    width={400}
                    height={300}
                    className="w-full h-auto object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
        )}
        <CardHeader>
          <CardTitle className="font-headline">{entry.title}</CardTitle>
          <CardDescription>{format(entryDate, "MMMM d, yyyy 'at' h:mm a")}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <p className="text-sm text-muted-foreground">{contentSnippet}{entry.content.length > 150 ? "..." : ""}</p>
        </CardContent>
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

export default function DiaryPage() {
  const filteredEntries = useFilteredEntries();
  const { isLoading } = useDiaryStore();

  if (isLoading) {
    return (
        <div className="flex h-full w-full items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
    )
  }

  if (filteredEntries.length === 0) {
    return (
      <div className="text-center flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20 p-8">
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

  return (
    <div className="columns-1 md:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6">
      {filteredEntries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
