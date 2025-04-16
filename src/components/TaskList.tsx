'use client';
import { useState, useEffect, useRef } from 'react';
import { useTasks } from '@/hooks/use-tasks';
import { Check, Edit, X } from 'lucide-react';
import { format } from 'date-fns';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';

const TaskList = () => {
  const { tasks, updateTask, deleteTask } = useTasks();

  const { toast } = useToast();
  const { speak } = useSpeechSynthesis();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false); // Local state for audio playback
  const [open, setOpen] = useState(false); // State to control the edit dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false); // New state for delete dialog
  const [taskToDelete, setTaskToDelete] = useState<string | null>(null); // Track which task to delete
  const [editTask, setEditTask] = useState<{
    id: string;
    description: string;
  }>({ id: '', description: '' });

  useEffect(() => {
    const timeouts: number[] = [];

    tasks.forEach(task => {
      if (task.dueDate) {
        const taskDueDate = new Date(task.dueDate);
        const now = new Date();

        if (taskDueDate > now && !task.completed) {
          const timeUntilTask = taskDueDate.getTime() - now.getTime();

          const timeoutId = setTimeout(() => {
            // Show toast notification with task details
            toast({
              title: 'Task Due!',
              description:
                `<strong>${task.description}</strong><br/>Due: ${format(
                  taskDueDate,
                  'PPP h:mm a'
                )}`,
              duration: 0, // Keep open until dismissed
            });

            // Play audio and show Stop Audio button
            if (audioRef.current) {
              audioRef.current.play().then(() => {
                setIsPlaying(true);
              }).catch(error => {
                console.error("Error playing alarm:", error);
              });
            } else {
              console.log("No audioRef");
            }
          }, timeUntilTask);

          timeouts.push(timeoutId as unknown as number);
        }
      }
    });

    return () => {
      timeouts.forEach(clearTimeout);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      console.log("Cleanup: Audio stopped, isPlaying set to false");
    };
  }, [tasks, toast, audioRef]);

  const handleComplete = (id: string) => {
    updateTask(id, (task) => {
      const updatedTask = { ...task, completed: !task.completed };
      console.log("Task completed state after update:", updatedTask.completed);
      return updatedTask;
    });
    speak(`marked task as ${!tasks.find(t => t.id === id)?.completed ? 'completed' : 'incomplete'}`);
  };

  const handleEdit = (task: { id: string; description: string }) => {
    setEditTask({ id: task.id, description: task.description });
    setOpen(true);
  };

  const handleSave = () => {
    if (editTask.id) {
      updateTask(editTask.id, (task) => ({
        ...task,
        description: editTask.description
      }));
      speak(`updated ${editTask.description}`);
    }
    setOpen(false);
    setEditTask({ id: '', description: '' });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditTask({ ...editTask, [e.target.name]: e.target.value });
  };

  const handleDeleteClick = (taskId: string) => {
    setTaskToDelete(taskId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (taskToDelete) {
      const taskDescription = tasks.find(t => t.id === taskToDelete)?.description || '';
      deleteTask(taskToDelete);
      toast({
        title: 'Task Deleted',
        description: `${taskDescription} has been deleted.`,
        duration: 3000,
      });
      speak(`deleted ${taskDescription}`);
      setDeleteDialogOpen(false);
      setTaskToDelete(null);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    console.log("Stop Audio clicked, isPlaying set to false");
  };

  return (
    <div>
      <h2 className="text-xl font-bold mt-6 mb-2">Task List</h2>
      <ul className="list-none p-0">
        {tasks.length === 0 ? (
          <li>No tasks yet!</li>
        ) : (
          tasks.map((task) => (
            <li
              key={task.id}
              className="flex items-center justify-between py-2 border-b border-gray-200 p-2 flex-col sm:flex-row"
            >
              <div>
                <div className="flex items-center space-x-2 flex-col md:flex-row md:items-center">
                  <div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleComplete(task.id)}
                      className='mr-2'
                    >
                      {task.completed ? (
                        <X className="h-4 w-4 text-green-500" />
                      ) : (
                        <Check
                          className={`h-4 w-4 ${task.completed ? 'text-green-500' : 'text-gray-400'
                            }`}
                        />
                      )}
                    </Button>
                    <span
                      className={task.completed ? 'line-through text-gray-500' : ''}
                    >
                      {task.description}
                    </span>
                  </div>
                  <div className="flex flex-col md:ml-4">
                    {task.dueDate && task.dueTime && (
                      <div className="text-sm text-gray-500">
                        Due: {format(new Date(`${task.dueDate}T${task.dueTime}`), 'PPP h:mm a') || "Invalid Date"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEdit({ id: task.id, description: task.description })}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteClick(task.id)}
                >
                  Delete
                </Button>
              </div>

            </li>
          ))
        )}
      </ul>
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50">
        {isPlaying && (
          <Button
            onClick={stopAudio}
            className="bg-black text-white opacity-50 hover:bg-black hover:opacity-75 transition-opacity"
          >
            Stop Audio
          </Button>
        )}
      </div>
      <audio ref={audioRef} src="/alarm.mp3" />

      {/* Edit Task Dialog */}
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Task</AlertDialogTitle>
            <AlertDialogDescription>
              Make changes to your task here.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label
                htmlFor="description"
                className="text-right text-sm font-semibold"
              >
                Description
              </label>
              <input
                id="description"
                name="description"
                value={editTask.description}
                onChange={handleInputChange}
                className="col-span-3"
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Task Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              task from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TaskList;