'use server';

/**
 * @fileOverview Provides an AI-powered security briefing on phishing trends.
 *
 * - generateSecurityBriefing - A function that generates a security briefing.
 * - SecurityBriefingInput - The input type for the generateSecurityBriefing function.
 * - SecurityBriefingOutput - The return type for the generateSecurityBriefing function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SecurityBriefingInputSchema = z.object({
  recentRiskFactors: z
    .array(z.string())
    .optional()
    .describe('A list of recent risk factors identified in user emails.'),
});
export type SecurityBriefingInput = z.infer<typeof SecurityBriefingInputSchema>;

const SecurityBriefingOutputSchema = z.object({
  briefing: z
    .string()
    .describe(
      'A concise, informative briefing on current phishing trends, optionally tailored to recent user activity.'
    ),
});
export type SecurityBriefingOutput = z.infer<typeof SecurityBriefingOutputSchema>;

export async function generateSecurityBriefing(
  input: SecurityBriefingInput
): Promise<SecurityBriefingOutput> {
  return securityBriefingFlow(input);
}

const securityBriefingPrompt = ai.definePrompt({
  name: 'securityBriefingPrompt',
  input: {schema: SecurityBriefingInputSchema},
  output: {schema: SecurityBriefingOutputSchema},
  prompt: `You are a top-tier cybersecurity analyst. Your task is to provide a proactive security briefing for a user of an email security application.

  Your briefing should be concise, informative, and actionable. It should cover:
  1.  One or two current, high-level phishing trends (e.g., "AI voice scams," "QR code phishing," "Urgent invoice fraud").
  2.  A brief, easy-to-understand explanation of how these trends work.
  3.  Simple advice on how to spot and avoid them.

  Keep the tone professional but accessible. Use markdown for formatting (e.g., headings, bold text, bullet points).

  {{#if recentRiskFactors}}
  The user has recently encountered emails with the following risk factors: {{{recentRiskFactors}}}. If relevant, you can subtly tailor your briefing to address these types of threats.
  {{/if}}

  Generate the security briefing now.`,
});

const securityBriefingFlow = ai.defineFlow(
  {
    name: 'securityBriefingFlow',
    inputSchema: SecurityBriefingInputSchema,
    outputSchema: SecurityBriefingOutputSchema,
  },
  async input => {
    const {output} = await securityBriefingPrompt(input);
    return output!;
  }
);
