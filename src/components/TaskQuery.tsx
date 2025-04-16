'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Mic, MicOff} from 'lucide-react';
import { useTasks } from '@/hooks/use-tasks';
import {useToast} from '@/hooks/use-toast';
import {answerTaskQuery} from '@/ai/flows/answer-task-query';
import { useSpeechSynthesis } from '@/hooks/use-speech-synthesis';

const SPEECH_RECOGNITION_NOT_SUPPORTED_MSG = 'Speech recognition is not supported in this browser.';
const TIMEOUT_DURATION = 2000;
const TaskQuery = () => {
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [speechStarted, setSpeechStarted] = useState(false);
  const {tasks} = useTasks();
  const [typing, setTyping] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { speak } = useSpeechSynthesis();
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const recognitionRef = useRef(recognition);
  const {toast} = useToast();
   const checkMicrophonePermission = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // Stop the stream immediately
      // Microphone permission granted
    } catch (err: any) {
      console.error('Error requesting microphone permission:', err);
      throw new Error('Microphone permission is needed');
    }
  };
  useEffect(() => {
    if (typeof window === 'undefined') {
        return;
    }    if (typeof window !== 'undefined') {
      if (!(window as any).SpeechRecognition && !(window as any).webkitSpeechRecognition) {
        console.error({
          title: 'Speech Recognition Error',
          description: SPEECH_RECOGNITION_NOT_SUPPORTED_MSG,
        });
      }
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const newRecognition = new SpeechRecognition();
        newRecognition.continuous = false;

        newRecognition.interimResults = false;

        newRecognition.onresult = (event) => {
          let transcript = '';
          if (event.results && event.results[0] && event.results[0][0]) {
            transcript = event.results[0][0].transcript;
          }

          setQuery(transcript)
        };

        newRecognition.onstart = () => {
          setIsListening(true);
          setSpeechStarted(true);
        };

        newRecognition.onend = () => {
          setIsListening(false);
          setSpeechStarted(false);

        };

        newRecognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setSpeechStarted(false);
          if (event.error !== 'no-speech') { // Check for 'no-speech' error
            console.error(`Speech recognition error: ${event.error} (${event.code})`);
          }
        };
        setRecognition(newRecognition);
        recognitionRef.current = newRecognition;
      } else {
        console.error({
          title: 'Speech Recognition Error',
          description: SPEECH_RECOGNITION_NOT_SUPPORTED_MSG,
        });
      }
      if (recognitionRef.current) {
          recognitionRef.current.stop();
      }
    }
  }, []);

  const getAnswer = useCallback(async () => {
    setIsLoading(true);
   try {
      const response = await answerTaskQuery({query: query, tasks: tasks});
      setAnswer(response.answer);
      speak(`${response.answer}`);
      setQuery("");
    } catch (error: any) {
      console.error('Error querying tasks:', error);
      setAnswer(`Error: ${error.message || 'Failed to get answer.'}`);
    } finally {
      setIsLoading(false);
      setTyping(false)
    }
  }, [query, tasks]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if ((query && !typing) || (query && isListening && speechStarted)) {
      timeoutId = setTimeout(getAnswer, TIMEOUT_DURATION);    }    return () => clearTimeout(timeoutId);  }, [query, isListening, getAnswer, typing, speechStarted]);


  const handleVoiceInput = async () => {
    if (!recognitionRef.current) {
      console.error({ title: 'Speech Recognition Error', description: 'Speech recognition not initialized.', });

        return;
      } try { await checkMicrophonePermission();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, });
      return;
    }    

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      if (
        recognitionRef.current &&
        recognitionRef.current.state !== 'listening'      ) {  recognitionRef.current.start()
           }
      setIsListening(true);
      setTyping(false)
    }
  };

  return (
    <div>
      <div className="mb-4">
        <Input
          type="text"
          placeholder="Ask about your tasks"
          value={query}
          onChange={(e) => {setQuery(e.target.value); setTyping(true)}}
          className="w-full rounded-md shadow-sm"
        />
        <div className="flex items-center space-x-2 mt-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleVoiceInput}
          >
            {isListening ? <MicOff className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
            {isListening ? 'Stop Listening' : 'Start Listening'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={getAnswer}
            disabled={isLoading}
            ref={buttonRef}
            className="ml-2"
          >
            {isLoading ? 'Loading...' : 'Get Answer'}
          </Button>
        </div>
      </div>
      {answer && (
        <div className="mt-4 p-4 border rounded-md shadow-sm">
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
};
export default TaskQuery;