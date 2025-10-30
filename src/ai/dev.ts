'use server';
import { config } from 'dotenv';
config();

import '@/ai/flows/phishing-email-detection.ts';
import '@/ai/flows/url-risk-assessment.ts';
import '@/ai/flows/ai-assisted-reply.ts';
import '@/ai/flows/summarize-email.ts';
import '@/ai/flows/security-briefing.ts';
import '@/ai/flows/security-coach.ts';
