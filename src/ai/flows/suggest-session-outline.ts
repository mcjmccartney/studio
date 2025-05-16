// Implemented the Genkit flow for suggesting session outlines based on client notes.

'use server';

/**
 * @fileOverview Provides an AI-generated outline for the next session's behavior training.
 *
 * - suggestSessionOutline - A function that generates a session outline.
 * - SuggestSessionOutlineInput - The input type for the suggestSessionOutline function.
 * - SuggestSessionOutlineOutput - The return type for the suggestSessionOutline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestSessionOutlineInputSchema = z.object({
  clientNotes: z
    .string()
    .describe('Client notes from previous sessions, including observations and progress.'),
});
export type SuggestSessionOutlineInput = z.infer<typeof SuggestSessionOutlineInputSchema>;

const SuggestSessionOutlineOutputSchema = z.object({
  sessionOutline: z.string().describe('An outline for the next session, including goals, exercises, and techniques.'),
});
export type SuggestSessionOutlineOutput = z.infer<typeof SuggestSessionOutlineOutputSchema>;

export async function suggestSessionOutline(input: SuggestSessionOutlineInput): Promise<SuggestSessionOutlineOutput> {
  return suggestSessionOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestSessionOutlinePrompt',
  input: {schema: SuggestSessionOutlineInputSchema},
  output: {schema: SuggestSessionOutlineOutputSchema},
  prompt: `You are an expert dog behaviorist. Based on the client notes from previous sessions, create an outline for the next session's behavior training, including goals, exercises, and techniques.

Client Notes:
{{{clientNotes}}}`,
});

const suggestSessionOutlineFlow = ai.defineFlow(
  {
    name: 'suggestSessionOutlineFlow',
    inputSchema: SuggestSessionOutlineInputSchema,
    outputSchema: SuggestSessionOutlineOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
