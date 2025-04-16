'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { addTask as addTaskToDb, getTasks, updateTask as updateTaskInDb, deleteTask as deleteTaskFromDb } from '@/firebase/database';
import { useAuth, type AuthContext } from '@/firebase/auth';

export interface Task {
  id: string;
  description: string;
  dueDate?: string;
  dueTime?: string;
  completed?: boolean;
}

const useTasksProvider = () => {
  const [tasks, setTasks] = useState<Task[]>(() => {
    if (typeof window !== 'undefined') {
      const storedTasks = localStorage.getItem('tasks');
      return storedTasks ? JSON.parse(storedTasks) : [];
    }
    return [];
  });

  const { user, loading: authLoading }: AuthContext = useAuth();
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const loadTasks = async () => {
      if (user && !authLoading) {
        try {
          const userTasks: Task[] = await getTasks(user.uid);
          setTasks(userTasks);
        } catch (error) {
          console.error("Error fetching tasks from Firebase:", error);
          // Handle error appropriately, e.g., display a toast
        }
      } else if (!user && !authLoading) {
        setTasks([]); // Clear tasks if no user is logged in
      }
    };

    loadTasks();
  }, [user, authLoading]);

  const addTask = async (task: Omit<Task, 'id'>) => {
    if (user) {
      const newTask = await addTaskToDb(user.uid, task);
      setTasks((prevTasks) => [...prevTasks, newTask]);
    }
  };

  const updateTask = useCallback((id: string, updateFn: (task: Task) => Task) => {
    setTasks((prevTasks) => {
      const updatedTasks = prevTasks.map((task) => {
        if (task.id === id) {
          const updatedTask = updateFn(task);
          if (user) {
            // Extract task data without the ID for Firebase
            const { id, ...taskData } = updatedTask;
            updateTaskInDb(user.uid, id, taskData);
          }
          return updatedTask;
        }
        return task;
      });
      return updatedTasks;
    });
  }, [user]);

  const deleteTask = useCallback((id: string) => {
    if (user) {
      // First delete from Firebase
      deleteTaskFromDb(user.uid, id)
        .then(() => {
          // Then update local state if successful
          setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
        })
        .catch(error => {
          console.error("Error deleting task from Firebase:", error);
        });
    } else {
      // If no user, just update local state
      setTasks(prevTasks => prevTasks.filter(task => task.id !== id));
    }
  }, [user]);

  return { tasks, addTask, updateTask, deleteTask };
};

export type TasksContextType = ReturnType<typeof useTasksProvider>;
const TasksContext = createContext<TasksContextType | undefined>(undefined);
export const TasksProvider = ({ children }: { children: React.ReactNode }) => {
  const taskContextValue = useTasksProvider();

  return (
    <TasksContext.Provider value={taskContextValue}>
    { children }
    </TasksContext.Provider>
  );
};

export const useTasks = () => useContext(TasksContext)!;