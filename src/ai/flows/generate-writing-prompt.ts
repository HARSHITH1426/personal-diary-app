'use server';

/**
 * @fileOverview This flow generates a writing prompt based on the user's past diary entries.
 *
 * - generateWritingPrompt - A function that generates a writing prompt.
 * - GenerateWritingPromptInput - The input type for the generateWritingPrompt function.
 * - GenerateWritingPromptOutput - The return type for the generateWritingPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateWritingPromptInputSchema = z.object({
  pastEntries: z
    .string()
    .describe('A string containing all the user\'s past diary entries.'),
});
export type GenerateWritingPromptInput = z.infer<typeof GenerateWritingPromptInputSchema>;

const GenerateWritingPromptOutputSchema = z.object({
  prompt: z
    .string()
    .describe(
      'A writing prompt that takes into account the user\'s past entries.'
    ),
});
export type GenerateWritingPromptOutput = z.infer<typeof GenerateWritingPromptOutputSchema>;

export async function generateWritingPrompt(
  input: GenerateWritingPromptInput
): Promise<GenerateWritingPromptOutput> {
  return generateWritingPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateWritingPromptPrompt',
  input: {schema: GenerateWritingPromptInputSchema},
  output: {schema: GenerateWritingPromptOutputSchema},
  prompt: `You are a helpful assistant designed to generate writing prompts for a diary. You will take into account the user's past entries and generate a writing prompt that is relevant to their experiences.

Past Entries: {{{pastEntries}}}

Writing Prompt: `,
});

const generateWritingPromptFlow = ai.defineFlow(
  {
    name: 'generateWritingPromptFlow',
    inputSchema: GenerateWritingPromptInputSchema,
    outputSchema: GenerateWritingPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
