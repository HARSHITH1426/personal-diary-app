"use client";

import React, { useEffect, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BrainCircuit, Loader2, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { useDiaryStore, useSyncDiaryStore } from '@/hooks/use-diary-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { getWritingPromptAction } from '@/app/actions';

// I've defined the form's structure and validation rules here using Zod.
// This ensures that an entry must have a title and content before it can be saved.
const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content cannot be empty.'),
  tags: z.string().optional(),
});

// A helper function to process tags from a string to an array.
// This keeps the logic separate and reusable.
const processTags = (tagsString?: string): string[] => {
  if (!tagsString) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}

export default function EditEntryPage() {
  // This custom hook keeps the local state in sync with Firestore. It's essential
  // for making sure the data loaded on this page is always fresh.
  useSyncDiaryStore();
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const entryId = Array.isArray(id) ? id[0] : id;

  // I'm selecting only the specific data this component needs from the global store.
  // This is a performance optimization: the component only re-renders if this data changes.
  const { entry, actions, entries } = useDiaryStore(state => ({
    entry: state.entries.find(e => e.id === entryId),
    actions: state.actions,
    entries: state.entries,
  }));
  
  const { toast } = useToast();
  // useTransition is a React Hook that lets you update state without blocking the UI.
  // I use it here to show loading spinners on buttons during async operations like saving or deleting.
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isGeneratingPrompt, startPromptGeneration] = useTransition();

  // I'm initializing react-hook-form here. It uses the Zod schema for validation
  // and sets default values for the form fields.
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: '',
    },
  });

  // This `useEffect` hook's purpose is to populate the form fields when the entry data loads.
  // It watches the `entry` object, and when it becomes available, it resets the form with the entry's data.
  useEffect(() => {
    if (entry) {
      form.reset({
        title: entry.title,
        content: entry.content,
        tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : '',
      });
    }
  }, [entry, form]);

  // This function handles the form submission. I've named it to be descriptive of its action.
  function handleUpdateEntry(values: z.infer<typeof formSchema>) {
    if (!entry) return;

    // By wrapping the update logic in `startTransition`, I ensure the UI remains responsive
    // while the update operation is processed in the background.
    startSaveTransition(() => {
      actions.updateEntry({
        ...entry,
        title: values.title,
        content: values.content,
        tags: processTags(values.tags),
      });
      toast({
        title: 'Entry updated!',
        description: 'Your changes have been saved.',
      });
      router.push('/diary'); // After saving, I navigate the user back to the main diary page.
    });
  }

  // This function handles deleting the current entry.
  const handleDeleteEntry = () => {
    if (!entry) return;
    startDeleteTransition(() => {
      actions.deleteEntry(entry.id);
      toast({
        title: 'Entry deleted',
        description: 'The entry has been permanently removed.',
      });
      router.push('/diary');
    });
  };

  // This function calls a server action to get an AI-generated writing suggestion.
  const getAIWritingSuggestion = () => {
    startPromptGeneration(async () => {
        // I collect text from recent past entries to give the AI context.
        const pastEntriesText = entries
            .filter(e => e.id !== entryId)
            .slice(0, 5) // I'm using the 5 most recent entries for context.
            .map(e => `Title: ${e.title}\n${e.content}`)
            .join('\n---\n');
            
        const result = await getWritingPromptAction(pastEntriesText);

        if ('prompt' in result && result.prompt) {
            const currentContent = form.getValues('content');
            // I append the new prompt to the existing content.
            form.setValue('content', currentContent ? `${currentContent}\n\n${result.prompt}` : result.prompt);
            toast({
                title: 'Suggestion added!',
                description: 'A new writing suggestion has been added to your entry.',
            });
        } else if ('error' in result) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: result.error,
            });
        }
    });
  };

  // If the entry data is not yet available (e.g., on a page refresh),
  // I show a clear loading message to the user.
  if (!entry) {
    return <div className="text-center p-8">Loading entry...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Edit Entry</CardTitle>
          <CardDescription>Refine your thoughts and memories.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleUpdateEntry)} className="space-y-8">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <Textarea className="min-h-[300px]" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., work, travel (comma-separated)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={getAIWritingSuggestion} disabled={isGeneratingPrompt}>
                        {isGeneratingPrompt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        Get Suggestion
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" disabled={isDeleting}>
                          {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                          Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your diary entry.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={handleDeleteEntry}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="flex gap-2">
                    <Link href="/diary" passHref>
                        <Button variant="outline">Cancel</Button>
                    </Link>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
