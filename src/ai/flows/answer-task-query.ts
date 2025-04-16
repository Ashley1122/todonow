'use server';

/**
 * @fileOverview Answers questions about the user's pending tasks.
 *
 * - answerTaskQuery - A function that answers questions about the user's tasks.
 * - AnswerTaskQueryInput - The input type for the answerTaskQuery function.
 * - AnswerTaskQueryOutput - The return type for the answerTaskQuery function.
 */

import {ai} from '@/ai/ai-instance';
import {z} from 'genkit';

const AnswerTaskQueryInputSchema = z.object({
  query: z.string().describe('The question about the user\'s tasks.'),
  tasks: z.array(z.object({
    id: z.string(),
    description: z.string(),
    dueDate: z.string(),
    dueTime: z.string(),
    completed: z.boolean(),
  })).describe('The user\'s tasks.'),
});
export type AnswerTaskQueryInput = z.infer<typeof AnswerTaskQueryInputSchema>;

const AnswerTaskQueryOutputSchema = z.object({
  answer: z.string().describe('The answer to the user\'s question about their tasks.'),
});
export type AnswerTaskQueryOutput = z.infer<typeof AnswerTaskQueryOutputSchema>;

export async function answerTaskQuery(input: AnswerTaskQueryInput): Promise<AnswerTaskQueryOutput> {
  return answerTaskQueryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'answerTaskQueryPrompt',
  input: {
    schema: z.object({
      query: z.string().describe('The question about the user\'s tasks.'),
      tasks: z.array(z.object({
        id: z.string(),
        description: z.string(),
        dueDate: z.string(),
        dueTime: z.string(),
        completed: z.boolean(),
      })).describe('The user\'s tasks.'),
    }),
  },
  output: {
    schema: z.object({
      answer: z.string().describe('The answer to the user\'s question about their tasks.'),
    }),
  },
  prompt: `You are a helpful assistant that answers questions about the user's tasks.

Here are the user's tasks:
{{#each tasks}}
- Description: {{description}}, Due Date: {{dueDate}}, Completed: {{completed}}
{{/each}}

Convert the due date to a human readable date such as April 14, 2025 10:00 AM
Question: {{{query}}}`,
});

const answerTaskQueryFlow = ai.defineFlow<
  typeof AnswerTaskQueryInputSchema,
  typeof AnswerTaskQueryOutputSchema
>({
  name: 'answerTaskQueryFlow',
  inputSchema: AnswerTaskQueryInputSchema,
  outputSchema: AnswerTaskQueryOutputSchema,
}, async input => {
  const {output} = await prompt(input);
  return output!;
});
