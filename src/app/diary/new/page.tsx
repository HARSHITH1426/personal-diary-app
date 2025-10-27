
"use client";

import React, { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  BrainCircuit, Loader2, Save, Image as ImageIcon, X, 
  Smile, Frown, Meh, Sparkles, Cloudy, Sun, Zap, Snowflake, CloudRain
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

import { useDiaryStore, useSyncDiaryStore } from '@/hooks/use-diary-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { getWritingPromptAction } from '@/app/actions';
import { cn } from '@/lib/utils';
import { DiaryEntry } from '@/lib/types';

const moodOptions = {
  happy: { icon: Smile, label: 'Happy' },
  sad: { icon: Frown, label: 'Sad' },
  neutral: { icon: Meh, label: 'Neutral' },
  excited: { icon: Sparkles, label: 'Excited' },
  tired: { icon: Frown, label: 'Tired' }, // Re-using Frown for simplicity
};

const weatherOptions = {
  sunny: { icon: Sun, label: 'Sunny' },
  cloudy: { icon: Cloudy, label: 'Cloudy' },
  rainy: { icon: CloudRain, label: 'Rainy' },
  stormy: { icon: Zap, label: 'Stormy' },
  snowy: { icon: Snowflake, label: 'Snowy' },
};

const formSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  content: z.string().min(1, 'Content cannot be empty.'),
  tags: z.string().optional(),
  imageUrl: z.string().url().optional().or(z.literal('')),
  mood: z.enum(['happy', 'sad', 'neutral', 'excited', 'tired']).optional(),
  weather: z.enum(['sunny', 'cloudy', 'rainy', 'stormy', 'snowy']).optional(),
});

export default function NewEntryPage() {
  useSyncDiaryStore();
  const router = useRouter();
  const { actions, entries } = useDiaryStore(state => ({ actions: state.actions, entries: state.entries }));
  const { toast } = useToast();
  const [isSaving, startSaveTransition] = useTransition();
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

  async function handleCreateEntry(values: z.infer<typeof formSchema>) {
    startSaveTransition(async () => {
      try {
        const newEntryId = await actions.addEntry({
          title: values.title,
          content: values.content,
          tags: values.tags || '',
          imageUrl: values.imageUrl,
          mood: values.mood,
          weather: values.weather,
        });
        toast({
          title: 'Entry saved!',
          description: 'Your new diary entry has been successfully created.',
        });
        router.push(`/diary/edit/${newEntryId}`);
      } catch (error) {
        toast({
          variant: "destructive",
          title: 'Failed to save entry',
          description: 'An error occurred while saving your entry.',
        });
      }
    });
  }
  
  const getAIWritingSuggestion = () => {
    startPromptGeneration(async () => {
        const pastEntriesText = entries
            .slice(0, 5) // Use recent 5 entries for context
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

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline text-2xl">New Diary Entry</CardTitle>
          <CardDescription>Capture your thoughts, feelings, and experiences.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateEntry)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="mood"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mood</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.entries(moodOptions).map(([key, { icon: Icon, label }]) => (
                            <Button
                              key={key}
                              type="button"
                              variant={field.value === key ? 'secondary' : 'outline'}
                              size="icon"
                              onClick={() => field.onChange(field.value === key ? undefined : key)}
                              className="w-14 h-14 flex-col gap-1"
                              title={label}
                            >
                              <Icon className={cn("h-6 w-6", field.value === key && "text-primary")} />
                              <span className="text-xs">{label}</span>
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="weather"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weather</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2 flex-wrap">
                          {Object.entries(weatherOptions).map(([key, { icon: Icon, label }]) => (
                            <Button
                              key={key}
                              type="button"
                              variant={field.value === key ? 'secondary' : 'outline'}
                              size="icon"
                              onClick={() => field.onChange(field.value === key ? undefined : key)}
                              className="w-14 h-14 flex-col gap-1"
                              title={label}
                            >
                              <Icon className={cn("h-6 w-6", field.value === key && "text-primary")} />
                              <span className="text-xs">{label}</span>
                            </Button>
                          ))}
                        </div>
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

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
                          className="cursor-pointer flex items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/30 rounded-md hover:bg-muted/50 transition-colors"
                        >
                          {field.value ? (
                             <div className="relative w-full h-full">
                               <Image src={field.value} alt="Uploaded preview" layout="fill" objectFit="contain" className="rounded-md p-2" />
                               <Button
                                 type="button"
                                 variant="ghost"
                                 size="icon"
                                 className="absolute top-1 right-1 h-6 w-6 bg-black/50 hover:bg-black/75"
                                 onClick={(e) => {
                                    e.preventDefault();
                                    form.setValue('imageUrl', '');
                                 }}
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
                <Button type="button" variant="outline" onClick={getAIWritingSuggestion} disabled={isGeneratingPrompt}>
                    {isGeneratingPrompt ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
                    Get a Writing Suggestion
                </Button>
                <div className="flex gap-2">
                   <Link href="/diary" passHref>
                    <Button variant="outline">Cancel</Button>
                   </Link>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
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

    