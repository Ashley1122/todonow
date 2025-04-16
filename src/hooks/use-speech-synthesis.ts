'use client';

import { useEffect, useRef, useState } from 'react';

export const useSpeechSynthesis = () => {
  const synth = useRef<SpeechSynthesis | null>(null);
  const utterance = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if we're in browser environment and if speech synthesis is supported
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.warn('Speech synthesis is not supported in this environment');
      return;
    }

    synth.current = window.speechSynthesis;

    const loadVoices = () => {
      if (!synth.current) return;
      
      const availableVoices = synth.current.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
        setIsReady(true);
        console.log('Speech synthesis voices loaded:', availableVoices.length);
      } else {
        console.warn('No speech synthesis voices available');
      }
    };

    // Initial load attempt
    loadVoices();
    
    // Some browsers may load voices asynchronously
    if (synth.current.onvoiceschanged !== undefined) {
      synth.current.onvoiceschanged = loadVoices;
    }

    return () => {
      if (synth.current && synth.current.speaking) {
        synth.current.cancel();
      }
    };
  }, []);

  const speak = (text: string) => {
    console.log('Attempting to speak:', text);
    
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      console.error('Speech synthesis not supported');
      return;
    }

    if (!synth.current) {
      console.error('Speech synthesis not initialized');
      return;
    }

    // Cancel any ongoing speech
    if (synth.current.speaking) {
      console.log('Canceling previous speech');
      synth.current.cancel();
    }

    try {
      const utter = new SpeechSynthesisUtterance(text);
      
      // Set up event handlers for debugging
      utter.onstart = () => console.log('Speech started');
      utter.onend = () => console.log('Speech ended');
      utter.onerror = (event) => console.error('Speech error:', event);

      // Try to pick a voice if voices are available
      if (voices.length > 0) {
        // Try to pick a voice that sounds female (heuristic)
        const preferredVoice = voices.find(voice =>
          voice.name.toLowerCase().includes('female') ||
          voice.name.toLowerCase().includes('samantha') || // common on macOS
          voice.name.toLowerCase().includes('zira') ||     // common on Windows
          voice.name.toLowerCase().includes('google us english') // on Chrome
        );

        if (preferredVoice) {
          console.log('Using preferred voice:', preferredVoice.name);
          utter.voice = preferredVoice;
        } else {
          console.log('Using default voice');
        }
      } else {
        console.warn('No voices available for speech');
      }

      utterance.current = utter;
      synth.current.speak(utter);
      console.log('Speech queued');
    } catch (error) {
      console.error('Error in speech synthesis:', error);
    }
  };

  return { speak, isReady, voices };
};