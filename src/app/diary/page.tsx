
"use client";

import React from "react";
import Link from "next/link";
import { format, parseISO } from "date-fns";
import { 
  BookOpen, PlusCircle, Loader2,
  Smile, Frown, Meh, Sparkles, Cloudy, Sun, Zap, Snowflake, CloudRain
} from "lucide-react";
import Image from "next/image";

import { useFilteredEntries, useDiaryStore } from "@/hooks/use-diary-store";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DiaryEntry } from "@/lib/types";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const moodIcons = {
  happy: Smile,
  sad: Frown,
  neutral: Meh,
  excited: Sparkles,
  tired: Frown,
};

const weatherIcons = {
  sunny: Sun,
  cloudy: Cloudy,
  rainy: CloudRain,
  stormy: Zap,
  snowy: Snowflake,
};

function EntryCard({ entry }: { entry: DiaryEntry }) {
  const contentSnippet = entry.content.substring(0, 150);
  const entryDate = entry.date ? parseISO(entry.date) : new Date();

  const MoodIcon = entry.mood ? moodIcons[entry.mood] : null;
  const WeatherIcon = entry.weather ? weatherIcons[entry.weather] : null;

  return (
    <Link href={`/diary/edit/${entry.id}`} className="block group">
      <Card className="hover:shadow-xl transition-shadow duration-300 h-full flex flex-col break-inside-avoid-column bg-card/80 dark:bg-card/50 backdrop-blur-sm">
        {entry.imageUrl && (
            <div className="overflow-hidden rounded-t-lg aspect-[4/3] relative">
                <Image
                    src={entry.imageUrl}
                    alt={entry.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
            </div>
        )}
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="font-headline text-xl">{entry.title}</CardTitle>
              <CardDescription>{format(entryDate, "MMMM d, yyyy 'at' h:mm a")}</CardDescription>
            </div>
            <div className="flex gap-2 text-muted-foreground">
              <TooltipProvider>
                {MoodIcon && entry.mood && (
                  <Tooltip>
                    <TooltipTrigger>
                      <MoodIcon className="h-5 w-5" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
                {WeatherIcon && entry.weather && (
                  <Tooltip>
                    <TooltipTrigger>
                      <WeatherIcon className="h-5 w-5" />
                    </TooltipTrigger>
                    <TooltipContent>
                       <p>{entry.weather.charAt(0).toUpperCase() + entry.weather.slice(1)}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </TooltipProvider>
            </div>
          </div>
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
      <div className="text-center flex flex-col items-center justify-center h-full rounded-lg border-2 border-dashed border-muted-foreground/30 bg-card/50 p-8">
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
    <div className="columns-1 md:columns-2 lg:columns-3 gap-6 space-y-6">
      {filteredEntries.map((entry) => (
        <EntryCard key={entry.id} entry={entry} />
      ))}
    </div>
  );
}

    