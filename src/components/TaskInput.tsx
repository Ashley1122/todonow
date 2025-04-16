'use client';

import { Plus, Mic, MicOff } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

import { useTasks } from '@/hooks/use-tasks';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { extractDateTime } from '@/ai/flows/extract-date-time';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';
import { format } from 'date-fns';

function TaskInput() {
  const [description, setDescription] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const { speak } = useSpeechSynthesis();
  let autoSubmitTimeout: NodeJS.Timeout | null = null;

  useEffect(() => {
    const SpeechRecognition =
      (typeof window !== 'undefined' && (window.SpeechRecognition || (window as any).webkitSpeechRecognition));

    if (SpeechRecognition) {
      const newRecognition = new SpeechRecognition() as SpeechRecognition;
      newRecognition.continuous = false;
      newRecognition.interimResults = false;

      newRecognition.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription(transcript);
        handleSubmit(transcript);
      };

      newRecognition.onstart = () => setIsListening(true);
      newRecognition.onend = () => setIsListening(false);

      newRecognition.onerror = (event: any) => console.error('Speech recognition error:', event);
      recognitionRef.current = newRecognition;
    }
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);
  const { addTask } = useTasks();

  const handleVoiceInput = (): void => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (autoSubmitTimeout) {
        clearTimeout(autoSubmitTimeout);
        autoSubmitTimeout = null;
      }
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  }

  const handleSubmit = async (e?: React.FormEvent | string) => {
    if (e && typeof e !== 'string') {
      e.preventDefault();
    }
    const value = typeof e === 'string' ? e.trim() : description.trim();
    if (value === '') {
      console.log(value);
      return;
    }
    else {
      try {
        speak(`added ${value}`);
      } catch (error) {
        console.error('Error in speak function:', error);
      }
    }

    const currentDate = new Date().toISOString().split('T')[0];
    const dateTimeInfo = await extractDateTime({
      taskDescription: description || value,
      currentDate: currentDate
    });
    addTask({ description: description.trim() || value, ...dateTimeInfo });

    setDescription('');
  };

  return (
    <form
      onSubmit={handleSubmit}
      className='flex flex-col gap-4'
    >
      <Textarea
        id='description'
        placeholder='Task description'
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className='w-full rounded-md shadow-sm'
      />
      <Button
        type='button'
        variant='outline'
        onClick={handleVoiceInput}
      >
        {isListening ? <MicOff className='mr-2 h-4 w-4' /> : <Mic className='mr-2 h-4 w-4' />}
        {isListening ? 'Stop Listening' : 'Start Listening'}
      </Button>

      <Button
        type='submit'
        className='bg-accent text-white flex items-center'
      >
        Add Task
      </Button>
    </form>
  );
}

export default TaskInput;