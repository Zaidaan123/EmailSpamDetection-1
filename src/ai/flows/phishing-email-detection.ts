'use server';

/**
 * @fileOverview A phishing email detection AI agent.
 *
 * - detectPhishingEmail - A function that handles the phishing email detection process.
 * - DetectPhishingEmailInput - The input type for the detectPhishingEmail function.
 * - DetectPhishingEmailOutput - The return type for the detectPhishingEmail function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DetectPhishingEmailInputSchema = z.object({
  emailBody: z.string().describe('The content of the email to analyze.'),
  senderDomain: z.string().describe('The domain of the sender email address.'),
  emailSubject: z.string().describe('The subject line of the email.'),
  senderIp: z.string().optional().describe('The IP address of the sender.'),
  urlList: z.array(z.string()).optional().describe('List of urls found in the email'),
  sensitivity: z.number().min(0).max(1).default(0.5).describe('The user-defined sensitivity for detection. 0.0 is less strict, 1.0 is more strict.'),
});
export type DetectPhishingEmailInput = z.infer<typeof DetectPhishingEmailInputSchema>;

const DetectPhishingEmailOutputSchema = z.object({
  isPhishing: z.boolean().describe('Whether or not the email is classified as phishing based on the user\'s sensitivity level.'),
  phishingScore: z.number().min(0).max(1).describe('A score from 0 (very safe) to 1 (very malicious) indicating the likelihood of the email being a phishing attempt.'),
  riskFactors: z.array(z.string()).describe('A list of specific factors contributing to the phishing risk (e.g., "Suspicious URL", "Urgent Language").'),
  justification: z.string().describe('A brief explanation of why the email was flagged (or not flagged) as phishing.'),
});
export type DetectPhishingEmailOutput = z.infer<typeof DetectPhishingEmailOutputSchema>;

export async function detectPhishingEmail(input: DetectPhishingEmailInput): Promise<DetectPhishingEmailOutput> {
  return detectPhishingEmailFlow(input);
}

const detectPhishingEmailPrompt = ai.definePrompt({
  name: 'detectPhishingEmailPrompt',
  input: {schema: DetectPhishingEmailInputSchema},
  output: {schema: DetectPhishingEmailOutputSchema},
  prompt: `You are an expert cybersecurity analyst specializing in advanced phishing detection. Analyze the provided email data to determine if it is a phishing attempt.

Your analysis must be thorough. Evaluate the following factors and synthesize them into a final phishing score and a list of identified risk factors.

1.  **Sender Analysis:**
    *   **Domain Legitimacy:** Is the sender domain ('{{{senderDomain}}}') known for phishing? Does it impersonate a legitimate brand (e.g., "g00gle.com" instead of "google.com")?
    *   **IP Address Reputation:** (If provided: '{{{senderIp}}}') Is the sender IP associated with spam or malicious activity?

2.  **Content Analysis:**
    *   **Urgency and Threats:** Does the email body ('{{{emailBody}}}') or subject ('{{{emailSubject}}}') create a sense of urgency, fear, or threaten negative consequences?
    *   **Generic Salutations:** Does it use generic greetings like "Dear Valued Customer" instead of a personal name?
    *   **Grammar and Spelling:** Are there noticeable grammatical errors or spelling mistakes?
    *   **Suspicious Attachments:** Does it mention attachments that are unexpected or have dangerous file types?

3.  **URL and Link Analysis:**
    *   **Link Obfuscation:** Are the URLs ('{{#each urlList}}{{{this}}} {{/each}}') hidden with URL shorteners (like bit.ly) or use misleading anchor text?
    *   **Destination Mismatch:** Do the visible link texts match the actual destination URLs? (Analyze the raw HTML in the body).
    *   **Non-Standard TLDs:** Do the URLs use unusual top-level domains?

**Scoring and Decision Logic:**
*   Calculate a 'phishingScore' from 0.0 (definitively safe) to 1.0 (definitively malicious).
*   Identify the top 2-4 most significant 'riskFactors' found during your analysis. If no risks are found, return an empty array.
*   The final 'isPhishing' decision should be based on the user's sensitivity setting ('{{{sensitivity}}}'). An email is considered phishing if \`phishingScore > (1 - sensitivity)\`. For example, if sensitivity is 0.7, flag anything with a score over 0.3. If sensitivity is 0.5 (default), flag anything over 0.5.
*   Provide a brief 'justification' for your final decision, summarizing the key evidence.

Output ONLY the JSON object.
`,
});

const detectPhishingEmailFlow = ai.defineFlow(
  {
    name: 'detectPhishingEmailFlow',
    inputSchema: DetectPhishingEmailInputSchema,
    outputSchema: DetectPhishingEmailOutputSchema,
  },
  async input => {
    const {output} = await detectPhishingEmailPrompt(input);
    return output!;
  }
);
