'use server';

/**
 * @fileOverview Provides an AI-assisted writing tool to suggest safe and professional email replies.
 *
 * - aiAssistedReply - A function that generates safe and professional replies to emails.
 * - AiAssistedReplyInput - The input type for the aiAssistedReply function.
 * - AiAssistedReplyOutput - The return type for the aiAssistedReply function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AiAssistedReplyInputSchema = z.object({
  emailContent: z
    .string()
    .describe('The content of the email to be replied to.'),
  threatSignals: z
    .string()
    .optional()
    .describe(
      'Detected threat signals in the email, used to tailor the reply to avoid sensitive topics.'
    ),
});
export type AiAssistedReplyInput = z.infer<typeof AiAssistedReplyInputSchema>;

const AiAssistedReplyOutputSchema = z.object({
  safeReply: z
    .string()
    .describe(
      'A suggested safe and professional reply to the email, considering any threat signals.'
    ),
});
export type AiAssistedReplyOutput = z.infer<typeof AiAssistedReplyOutputSchema>;

export async function aiAssistedReply(
  input: AiAssistedReplyInput
): Promise<AiAssistedReplyOutput> {
  return aiAssistedReplyFlow(input);
}

const aiAssistedReplyPrompt = ai.definePrompt({
  name: 'aiAssistedReplyPrompt',
  input: {schema: AiAssistedReplyInputSchema},
  output: {schema: AiAssistedReplyOutputSchema},
  prompt: `You are an AI assistant designed to generate safe and professional email replies.

  Based on the email content and any detected threat signals, suggest a reply that avoids potentially sensitive topics and minimizes the risk of engaging with phishing attempts.

  Email Content: {{{emailContent}}}
  Threat Signals: {{#if threatSignals}}{{{threatSignals}}}{{else}}No threat signals detected.{{/if}}

  Suggested Reply:`,
});

const aiAssistedReplyFlow = ai.defineFlow(
  {
    name: 'aiAssistedReplyFlow',
    inputSchema: AiAssistedReplyInputSchema,
    outputSchema: AiAssistedReplyOutputSchema,
  },
  async input => {
    const {output} = await aiAssistedReplyPrompt(input);
    return output!;
  }
);
