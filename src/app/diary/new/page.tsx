"use client";

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { BrainCircuit, Loader2, Save } from 'lucide-react';
import Link from 'next/link';

import { useDiaryStore } from '@/hooks/use-diary-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getWritingPromptAction } from '@/app/actions';

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content cannot be empty.'),
  tags: z.string().optional(),
});

export default function NewEntryPage() {
  const router = useRouter();
  const { actions, entries } = useDiaryStore(state => ({ actions: state.actions, entries: state.entries }));
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isPromptLoading, startPromptTransition] = useTransition();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: '',
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    startTransition(() => {
      const newEntryId = actions.addEntry({
        title: values.title,
        content: values.content,
        tags: values.tags || '',
      });
      toast({
        title: 'Entry saved!',
        description: 'Your new diary entry has been successfully created.',
      });
      router.push(`/diary/edit/${newEntryId}`);
    });
  }
  
  const handleGeneratePrompt = () => {
    startPromptTransition(async () => {
        const pastEntriesText = entries
            .slice(0, 5) // Use recent 5 entries for context
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

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">New Diary Entry</CardTitle>
          <CardDescription>Capture your thoughts, feelings, and experiences.</CardDescription>
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
                      <Input placeholder="What's the title of your entry?" {...field} />
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
                      <Textarea
                        placeholder="Let your thoughts flow..."
                        className="min-h-[300px]"
                        {...field}
                      />
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
                      <Input placeholder="e.g., work, travel, reflection (comma-separated)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-wrap gap-2 justify-between items-center">
                <Button type="button" variant="outline" onClick={handleGeneratePrompt} disabled={isPromptLoading}>
                    {isPromptLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    Get a Writing Prompt
                </Button>
                <div className="flex gap-2">
                   <Link href="/diary" passHref>
                    <Button variant="outline">Cancel</Button>
                   </Link>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Entry
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
