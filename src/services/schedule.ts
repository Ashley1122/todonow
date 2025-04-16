import { Task } from "@/hooks/use-tasks";
/**
 * Represents a daily schedule with time slots and corresponding activities.
 */
export interface DailySchedule {
  /**
   * An array of time slots in 24-hour format (e.g., "09:00", "14:30").
   */
  timeSlots: string[];
  /**
   * An array of activities corresponding to the time slots. Should have the same length as timeSlots.
   */
  activities: string[];
}

/**
 * Asynchronously retrieves the user's daily schedule.
 *
 * @returns A promise that resolves to a DailySchedule object.
 */
export async function getDailySchedule(tasks: Task[]): Promise<DailySchedule> {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    tasks.forEach(task => {
        // Extract the hour and minute from the dueDate string
        const [taskHour, taskMinute] = task.dueDate.split(':').map(Number);

        // Check if the dueDate has already passed or is happening now
        const isDue = (
            taskHour < currentHour ||
            (taskHour === currentHour && taskMinute <= currentMinute)
        );

        // If the task is due and not completed, play the audio and show the notification
        if (isDue && !task.completed) {
            // const audio = new Audio('/alarm.mp3');
            // audio.play().catch(error => {
            //     console.error("Failed to play audio:", error);
            // });

            if ("Notification" in window) {
                Notification.requestPermission().then(permission => {
                    if (permission === "granted") {
                        new Notification("Task Reminder", {
                            body: `It's time for: ${task.description}`,
                        });
                    }
                });
            }
        }
    });

    return {
        timeSlots: tasks.map(task => task.dueDate), // Use dueDate here
        activities: tasks.map(task => task.description), // Use description here
    };
}
