// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Assesses the risk level of URLs found in emails.
 *
 * - assessUrlRisk - Analyzes a URL and returns a risk score and justification.
 * - UrlRiskAssessmentInput - The input type for the assessUrlRisk function.
 * - UrlRiskAssessmentOutput - The return type for the assessUrlRisk function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const UrlRiskAssessmentInputSchema = z.object({
  url: z.string().url().describe('The URL to assess.'),
});
export type UrlRiskAssessmentInput = z.infer<typeof UrlRiskAssessmentInputSchema>;

const UrlRiskAssessmentOutputSchema = z.object({
  riskScore: z.number().describe('A score between 0 and 1 indicating the risk level of the URL, where 0 is low risk and 1 is high risk.'),
  justification: z.string().describe('A detailed explanation of why the URL is considered risky or safe.'),
});
export type UrlRiskAssessmentOutput = z.infer<typeof UrlRiskAssessmentOutputSchema>;

export async function assessUrlRisk(input: UrlRiskAssessmentInput): Promise<UrlRiskAssessmentOutput> {
  return assessUrlRiskFlow(input);
}

const assessUrlRiskPrompt = ai.definePrompt({
  name: 'assessUrlRiskPrompt',
  input: {schema: UrlRiskAssessmentInputSchema},
  output: {schema: UrlRiskAssessmentOutputSchema},
  prompt: `You are an expert in cybersecurity, specializing in identifying phishing and malicious URLs.

  Analyze the provided URL and determine its risk level based on various factors, including domain age, reputation, presence on blocklists, URL structure, and content.

  Provide a risk score between 0 and 1, where 0 indicates a very low risk and 1 indicates a very high risk.

  Also, provide a detailed justification for the assigned risk score, explaining the factors that contribute to the assessment.

  URL: {{{url}}}`, // Make sure that the URL is valid before passing it to the prompt
});

const assessUrlRiskFlow = ai.defineFlow(
  {
    name: 'assessUrlRiskFlow',
    inputSchema: UrlRiskAssessmentInputSchema,
    outputSchema: UrlRiskAssessmentOutputSchema,
  },
  async input => {
    const {output} = await assessUrlRiskPrompt(input);
    return output!;
  }
);
