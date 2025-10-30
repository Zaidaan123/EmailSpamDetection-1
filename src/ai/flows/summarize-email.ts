'use server';

/**
 * @fileOverview Provides an AI-powered email summarization tool.
 *
 * - summarizeEmail - A function that generates a concise summary of an email.
 * - SummarizeEmailInput - The input type for the summarizeEmail function.
 * - SummarizeEmailOutput - The return type for the summarizeEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeEmailInputSchema = z.object({
  emailBody: z.string().describe('The full HTML content of the email to be summarized.'),
});
export type SummarizeEmailInput = z.infer<typeof SummarizeEmailInputSchema>;

const SummarizeEmailOutputSchema = z.object({
  summary: z
    .string()
    .describe('A concise, bullet-point summary of the key points of the email.'),
});
export type SummarizeEmailOutput = z.infer<typeof SummarizeEmailOutputSchema>;

export async function summarizeEmail(
  input: SummarizeEmailInput
): Promise<SummarizeEmailOutput> {
  return summarizeEmailFlow(input);
}

const summarizeEmailPrompt = ai.definePrompt({
  name: 'summarizeEmailPrompt',
  input: {schema: SummarizeEmailInputSchema},
  output: {schema: SummarizeEmailOutputSchema},
  prompt: `You are an AI assistant designed to be an expert at summarizing emails.

  Analyze the following email content and generate a concise summary of its key points. The summary should be presented as a bulleted list.

  Email Content:
  {{{emailBody}}}
  `,
});

const summarizeEmailFlow = ai.defineFlow(
  {
    name: 'summarizeEmailFlow',
    inputSchema: SummarizeEmailInputSchema,
    outputSchema: SummarizeEmailOutputSchema,
  },
  async input => {
    const {output} = await summarizeEmailPrompt(input);
    return output!;
  }
);
