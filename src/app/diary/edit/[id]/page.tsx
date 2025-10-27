
"use client";

import React, { useEffect, useTransition } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BrainCircuit, Loader2, Save, Trash2, Image as ImageIcon, X } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

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

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content cannot be empty.'),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
});

const processTags = (tagsString?: string): string[] => {
  if (!tagsString) return [];
  return tagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
}

export default function EditEntryPage() {
  useSyncDiaryStore();
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
  const [isSaving, startSaveTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isGeneratingPrompt, startPromptGeneration] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: '',
      imageUrl: '',
    },
  });

  useEffect(() => {
    if (entry) {
      form.reset({
        title: entry.title,
        content: entry.content,
        tags: Array.isArray(entry.tags) ? entry.tags.join(', ') : '',
        imageUrl: entry.imageUrl || '',
      });
    }
  }, [entry, form]);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('imageUrl', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  function handleUpdateEntry(values: z.infer<typeof formSchema>) {
    if (!entry) return;

    startSaveTransition(() => {
      actions.updateEntry({
        ...entry,
        title: values.title,
        content: values.content,
        tags: processTags(values.tags),
        imageUrl: values.imageUrl,
      });
      toast({
        title: 'Entry updated!',
        description: 'Your changes have been saved.',
      });
      router.push('/diary');
    });
  }

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

  const getAIWritingSuggestion = () => {
    startPromptGeneration(async () => {
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
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image</FormLabel>
                    <FormControl>
                      <div>
                        <Input
                          id="image-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <label
                          htmlFor="image-upload"
                          className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-md hover:bg-muted/50"
                        >
                          {field.value ? (
                            <div className="relative w-full h-full">
                               <Image src={field.value} alt="Uploaded image" layout="fill" objectFit="contain" className="rounded-md" />
                               <Button
                                 type="button"
                                 variant="ghost"
                                 size="icon"
                                 className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/75"
                                 onClick={() => form.setValue('imageUrl', '')}
                               >
                                 <X className="h-4 w-4 text-white" />
                               </Button>
                            </div>
                          ) : (
                            <div className="text-center text-muted-foreground">
                              <ImageIcon className="mx-auto h-8 w-8" />
                              <p className="text-sm mt-1">Click to upload an image</p>
                            </div>
                          )}
                        </label>
                      </div>
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
