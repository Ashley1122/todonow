import { getDatabase, ref, push, set, remove, get } from 'firebase/database';
import { app } from './config';
import { Task } from '@/hooks/use-tasks';

const database = getDatabase(app);

export const addTask = async (userId: string, task: Omit<Task, 'id'>): Promise<Task> => {
  const tasksRef = ref(database, `tasks/${userId}`);
  const newTaskRef = push(tasksRef);
  const newTaskId = newTaskRef.key as string;
  
  // Create the complete task with ID
  const newTask: Task = {
    id: newTaskId,
    ...task
  };
  
  // Save the task without the id field in Firebase
  await set(newTaskRef, task);
  
  // Return the complete task with id
  return newTask;
};

export const updateTask = async (userId: string, taskId: string, task: Partial<Omit<Task, 'id'>>) => {
  const taskRef = ref(database, `tasks/${userId}/${taskId}`);
  await set(taskRef, task);
};

export const deleteTask = async (userId: string, taskId: string) => {
  const taskRef = ref(database, `tasks/${userId}/${taskId}`);
  await remove(taskRef);
};

export const getTasks = async (userId: string): Promise<Task[]> => {
  const tasksRef = ref(database, `tasks/${userId}`);
  const snapshot = await get(tasksRef);
  const data = snapshot.val();
  if (data) {
    return Object.keys(data).map((key) => ({
      id: key,
      ...data[key],
    }));
  } else {
    return [];
  }
};