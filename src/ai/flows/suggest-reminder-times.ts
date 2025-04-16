'use server';
/**
 * @fileOverview Suggests optimal reminder times based on the task description and daily schedule.
 *
 * - suggestReminderTimes - A function that suggests reminder times.
 * - SuggestReminderTimesInput - The input type for the suggestReminderTimes function.
 * - SuggestReminderTimesOutput - The return type for the suggestReminderTimes function.
 */

import {ai} from '@/ai/ai-instance';
import {getDailySchedule} from '@/services/schedule';
import {z} from 'genkit';

const SuggestReminderTimesInputSchema = z.object({
  taskDescription: z.string().describe('The description of the task.'),
  dueDate: z.string().describe('The due date of the task (ISO format).'),
});
export type SuggestReminderTimesInput = z.infer<typeof SuggestReminderTimesInputSchema>;

const SuggestReminderTimesOutputSchema = z.object({
  suggestedReminderTimes: z.array(z.string()).describe('An array of suggested reminder times (24-hour format).'),
});
export type SuggestReminderTimesOutput = z.infer<typeof SuggestReminderTimesOutputSchema>;

export async function suggestReminderTimes(input: SuggestReminderTimesInput): Promise<SuggestReminderTimesOutput> {
  return suggestReminderTimesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestReminderTimesPrompt',
  input: {
    schema: z.object({
      taskDescription: z.string().describe('The description of the task.'),
      dueDate: z.string().describe('The due date of the task (ISO format).'),
      timeSlots: z.array(z.string()).describe('Array of time slots from user schedule (24-hour format, e.g., \"09:00\").'),
      activities: z.array(z.string()).describe('Array of activities corresponding to time slots.'),
    }),
  },
  output: {
    schema: z.object({
      suggestedReminderTimes: z.array(z.string()).describe('An array of suggested reminder times (24-hour format).'),
    }),
  },
  prompt: `You are an AI assistant that suggests optimal reminder times for tasks based on their description and the user's daily schedule.

  Task Description: {{{taskDescription}}}
  Due Date: {{{dueDate}}}

  Consider the user's typical daily schedule to avoid suggesting times when they are likely busy. Here is the schedule:

  {{#each timeSlots}}
    - Time: {{{this}}}, Activity: {{lookup ../activities @index}}
  {{/each}}

  Suggest at least 3 reminder times that would be optimal for the user to remember to do the task. Return the times in 24-hour format.
  Do not suggest times that conflict with the user's schedule.
  Times: `,
});

const suggestReminderTimesFlow = ai.defineFlow<
  typeof SuggestReminderTimesInputSchema,
  typeof SuggestReminderTimesOutputSchema
>({
  name: 'suggestReminderTimesFlow',
  inputSchema: SuggestReminderTimesInputSchema,
  outputSchema: SuggestReminderTimesOutputSchema,
}, async input => {
  const schedule = await getDailySchedule();
  const {output} = await prompt({
    ...input,
    timeSlots: schedule.timeSlots,
    activities: schedule.activities,
  });
  return output!;
});
