"use client";

import React, { useEffect, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BrainCircuit, Loader2, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';

import { useDiaryStore } from '@/hooks/use-diary-store';
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

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content cannot be empty.'),
  tags: z.string().optional(),
});

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const { id } = params;
  const entryId = Array.isArray(id) ? id[0] : id;

  const { entry, actions, entries } = useDiaryStore(state => ({
    entry: state.entries.find(e => e.id === entryId),
    actions: state.actions,
    entries: state.entries,
  }));
  
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isPromptLoading, startPromptTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: '',
    },
  });

  useEffect(() => {
    if (entry) {
      form.reset({
        title: entry.title,
        content: entry.content,
        tags: entry.tags.join(', '),
      });
    } else {
        // If entry is not found (e.g., on direct navigation), redirect
        const timer = setTimeout(() => router.push('/diary'), 1000);
        return () => clearTimeout(timer);
    }
  }, [entry, form, router]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (!entry) return;

    startTransition(() => {
      actions.updateEntry({
        ...entry,
        title: values.title,
        content: values.content,
        tags: values.tags?.split(',').map(t => t.trim()).filter(Boolean) || [],
      });
      toast({
        title: 'Entry updated!',
        description: 'Your changes have been saved.',
      });
      router.push('/diary');
    });
  }

  const handleDelete = () => {
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

  const handleGeneratePrompt = () => {
    startPromptTransition(async () => {
        const pastEntriesText = entries
            .filter(e => e.id !== entryId)
            .slice(0, 5)
            .map(e => `Title: ${e.title}\n${e.content}`)
            .join('\n---\n');
            
        const result = await getWritingPromptAction(pastEntriesText);

        if ('prompt' in result && result.prompt) {
            const currentContent = form.getValues('content');
            form.setValue('content', currentContent ? `${currentContent}\n\n${result.prompt}` : result.prompt);
            toast({
                title: 'Prompt generated!',
                description: 'A new writing prompt has been added to your entry.',
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

  if (!entry) {
    return <div className="text-center p-8">Entry not found. Redirecting...</div>;
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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
                    <Button type="button" variant="outline" onClick={handleGeneratePrompt} disabled={isPromptLoading}>
                        {isPromptLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                        Get Prompt
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
                          <AlertDialogAction onClick={handleDelete}>Continue</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="flex gap-2">
                    <Link href="/diary" passHref>
                        <Button variant="outline">Cancel</Button>
                    </Link>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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
