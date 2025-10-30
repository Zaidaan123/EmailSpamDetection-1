'use server';

/**
 * @fileOverview Provides an AI-powered security coach to answer user questions.
 *
 * - securityCoach - A function that answers cybersecurity-related questions.
 * - SecurityCoachInput - The input type for the securityCoach function.
 * - SecurityCoachOutput - The return type for the securityCoach function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SecurityCoachInputSchema = z.object({
  question: z.string().describe('The user\'s cybersecurity-related question.'),
  history: z.array(z.object({
    role: z.enum(['user', 'model']),
    content: z.string(),
  })).optional().describe('The conversation history.'),
});
export type SecurityCoachInput = z.infer<typeof SecurityCoachInputSchema>;

const SecurityCoachOutputSchema = z.object({
  answer: z
    .string()
    .describe('A helpful and informative answer to the user\'s question.'),
});
export type SecurityCoachOutput = z.infer<typeof SecurityCoachOutputSchema>;

export async function securityCoach(
  input: SecurityCoachInput
): Promise<SecurityCoachOutput> {
  return securityCoachFlow(input);
}

const securityCoachPrompt = ai.definePrompt({
  name: 'securityCoachPrompt',
  input: {schema: SecurityCoachInputSchema},
  output: {schema: SecurityCoachOutputSchema},
  prompt: `You are "Guardian," a friendly and knowledgeable AI cybersecurity coach for an app called GuardianMail. Your role is to help users understand email security concepts and stay safe online.

  - Keep your answers concise, clear, and easy to understand for non-technical users.
  - Use markdown for formatting (bolding, lists) to improve readability.
  - If a user asks a question that is not related to cybersecurity, email, or online safety, gently decline to answer and guide them back to appropriate topics.
  - Do not provide personal opinions or information that is not publicly verifiable.

  Conversation History:
  {{#each history}}
  - **{{role}}**: {{{content}}}
  {{/each}}
  
  New User Question: {{{question}}}

  Your Answer:
  `,
});

const securityCoachFlow = ai.defineFlow(
  {
    name: 'securityCoachFlow',
    inputSchema: SecurityCoachInputSchema,
    outputSchema: SecurityCoachOutputSchema,
  },
  async input => {
    const {output} = await securityCoachPrompt(input);
    return output!;
  }
);
