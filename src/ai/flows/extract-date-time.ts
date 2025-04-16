'use server';

/**
 * @fileOverview Extracts date and time from a task description.
 *
 * - extractDateTime - A function that extracts date and time.
 * - ExtractDateTimeInput - The input type for the extractDateTime function.
 * - ExtractDateTimeOutput - The return type for the extractDateTime function.
 */

import { ai } from '@/ai/ai-instance';
import { z } from 'genkit';

// Schema for input
const ExtractDateTimeInputSchema = z.object({
  taskDescription: z.string().describe('The description of the task, which may contain a date and time.'),
  currentDate: z.string().describe('Current local date in YYYY-MM-DD format.'),
});
export type ExtractDateTimeInput = z.infer<typeof ExtractDateTimeInputSchema>;

// Schema for output
const ExtractDateTimeOutputSchema = z.object({
  dueDate: z.string().optional().describe('The extracted due date in ISO format, or undefined if no date is found.'),
  dueTime: z.string().optional().describe('The extracted due time in 24-hour format (HH:MM), or undefined if no time is found.'),
  completed: z.boolean().optional().describe('Whether the task is completed. Defaults to false.')
});
export type ExtractDateTimeOutput = z.infer<typeof ExtractDateTimeOutputSchema>;

// Main function
export async function extractDateTime(input: ExtractDateTimeInput): Promise<ExtractDateTimeOutput> {
  return extractDateTimeFlow(input);
}

// Prompt definition
const prompt = ai.definePrompt({
  name: 'extractDateTimePrompt',
  input: {
    schema: z.object({
      taskDescription: z.string(),
      currentDate: z.string(),
    }),
  },
  output: {
    schema: z.object({
      dueDate: z.string().optional(),
      dueTime: z.string().optional(),
      completed: z.boolean().optional()
    }),
  },
  prompt: `
You are a helpful assistant that extracts date and time information from task descriptions.

Today's date is: {{{currentDate}}}

Given a task description, extract:
- the due date (in YYYY-MM-DD format)
- the due time (in HH:MM 24-hour format)

Rules:
- If the description uses words like "today", "tomorrow", or "yesterday":
  - "today" = {{{currentDate}}}
  - "tomorrow" = one day after {{{currentDate}}}
  - "yesterday" = one day before {{{currentDate}}}

- If no year is mentioned, use the year from {{{currentDate}}}.
- If no date or time is found, return undefined for that field.
- If neither is found, return: {"dueDate": undefined, "dueTime": undefined}

Task Description: {{{taskDescription}}}
`,
});

// Flow definition
const extractDateTimeFlow = ai.defineFlow<
  typeof ExtractDateTimeInputSchema,
  typeof ExtractDateTimeOutputSchema
>({
  name: 'extractDateTimeFlow',
  inputSchema: ExtractDateTimeInputSchema,
  outputSchema: ExtractDateTimeOutputSchema,
}, async input => {
  const { output } = await prompt(input);
  return {
    ...output,
    completed: output?.completed ?? false,
  };
});
