import { useState, useEffect, useCallback, useRef } from 'react';

interface VoiceOptions {
  onResult?: (transcript: string) => void;
  onError?: (error: string) => void;
  onStart?: () => void;
  onEnd?: () => void;
  language?: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useVoice({
  onResult,
  onError,
  onStart,
  onEnd,
  language = 'en-US'
}: VoiceOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const voicesLoadedRef = useRef(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const speakQueueRef = useRef<string[]>([]);
  const isSpeakingRef = useRef(false);
  const isInitializedRef = useRef(false);
  const isStoppingRef = useRef(false);

  // Initialize speech recognition and synthesis
  useEffect(() => {
    if (isInitializedRef.current) return;
    isInitializedRef.current = true;

    try {
      // Check for browser support
      if (typeof window === 'undefined') {
        setIsSupported(false);
        return;
      }

      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const synthesis = window.speechSynthesis;

      if (!SpeechRecognition || !synthesis) {
        setIsSupported(false);
        return;
      }

      setIsSupported(true);
      synthesisRef.current = synthesis;

      // Initialize speech recognition
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onstart = () => {
        setIsListening(true);
        onStart?.();
      };

      recognition.onend = () => {
        setIsListening(false);
        onEnd?.();
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onResult?.(transcript);
      };

      recognition.onerror = (event: any) => {
        if (event.error !== 'aborted' && event.error !== 'no-speech') {
          console.error('Speech recognition error:', event);
          onError?.(event.error);
        }
        setIsListening(false);
      };

      recognitionRef.current = recognition;

      // Load voices
      const loadVoices = () => {
        const voices = synthesis.getVoices();
        if (voices.length > 0) {
          voicesRef.current = voices;
          voicesLoadedRef.current = true;
        }
      };

      // Initial voice load attempt
      loadVoices();

      // Handle voice changes
      synthesis.addEventListener('voiceschanged', loadVoices);

      // Handle page visibility changes
      const handleVisibilityChange = () => {
        if (document.hidden) {
          stopSpeaking();
          if (isListening) {
            stopListening();
          }
        }
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);

      // Cleanup
      return () => {
        synthesis.removeEventListener('voiceschanged', loadVoices);
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        stopSpeaking();
        if (isListening) {
          recognition.abort();
          setIsListening(false);
        }
      };
    } catch (error) {
      console.error('Speech initialization error:', error);
      setIsSupported(false);
    }
  }, [language, onResult, onError, onStart, onEnd, isListening]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListening || !isSupported) return;

    try {
      stopSpeaking();
      recognitionRef.current.start();
    } catch (error) {
      console.error('Start listening error:', error);
      onError?.('Failed to start listening');
      setIsListening(false);
    }
  }, [isListening, onError, isSupported]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current || !isListening) return;

    try {
      recognitionRef.current.abort();
      setIsListening(false);
    } catch (error) {
      console.error('Stop listening error:', error);
    }
  }, [isListening]);

  const processNextInQueue = useCallback(() => {
    if (!synthesisRef.current || !isSupported || isSpeakingRef.current || speakQueueRef.current.length === 0 || isStoppingRef.current) {
      return;
    }

    try {
      const text = speakQueueRef.current[0];
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      // Select voice
      const voices = synthesisRef.current.getVoices();
      const preferredVoice = voices.find(voice => 
        voice.lang.includes(language) && 
        (voice.name.includes('Google') || voice.name.includes('Natural'))
      ) || voices.find(voice => voice.lang.includes(language));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        isSpeakingRef.current = true;
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        // Only process next if we're not in the process of stopping
        if (!isStoppingRef.current) {
          isSpeakingRef.current = false;
          setIsSpeaking(false);
          speakQueueRef.current.shift();
          setTimeout(() => processNextInQueue(), 100);
        }
      };

      utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
        // Log the error for debugging
        console.debug('Speech synthesis event:', event);

        // Handle interruption gracefully
        if (event.error === 'interrupted' || event.error === 'cancelled') {
          console.debug('Speech synthesis interrupted or cancelled');
          // Don't propagate interruption as an error
        } else {
          console.error('Speech synthesis error:', event);
          onError?.('Speech playback failed');
        }

        isSpeakingRef.current = false;
        setIsSpeaking(false);
        speakQueueRef.current.shift();

        // Only process next if we're not stopping
        if (!isStoppingRef.current) {
          setTimeout(() => processNextInQueue(), 100);
        }
      };

      utteranceRef.current = utterance;

      // Ensure synthesis is ready
      if (synthesisRef.current.speaking) {
        synthesisRef.current.cancel();
      }
      synthesisRef.current.resume();

      // Small delay to ensure the synthesis is ready
      setTimeout(() => {
        if (synthesisRef.current && !isStoppingRef.current) {
          synthesisRef.current.speak(utterance);
        }
      }, 50);

    } catch (error) {
      console.error('Speech synthesis error:', error);
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      speakQueueRef.current.shift();
      if (!isStoppingRef.current) {
        setTimeout(() => processNextInQueue(), 100);
      }
    }
  }, [language, onError, isSupported]);

  const speak = useCallback((text: string) => {
    if (!synthesisRef.current || !isSupported) {
      onError?.('Speech synthesis not available');
      return;
    }

    if (!text.trim()) {
      console.warn('Empty text provided to speak function');
      return;
    }

    try {
      isStoppingRef.current = false;
      // Add to queue
      speakQueueRef.current.push(text);

      // If not speaking, process queue
      if (!isSpeakingRef.current) {
        setTimeout(() => processNextInQueue(), 100);
      }
    } catch (error) {
      console.error('Speech synthesis error:', error);
      onError?.('Failed to start speech');
    }
  }, [isSupported, onError, processNextInQueue]);

  const stopSpeaking = useCallback(() => {
    try {
      isStoppingRef.current = true;
      if (synthesisRef.current) {
        synthesisRef.current.cancel();
      }
      speakQueueRef.current = [];
      isSpeakingRef.current = false;
      setIsSpeaking(false);
      utteranceRef.current = null;
      // Reset stopping flag after a short delay
      setTimeout(() => {
        isStoppingRef.current = false;
      }, 100);
    } catch (error) {
      console.error('Stop speaking error:', error);
      isStoppingRef.current = false;
    }
  }, []);

  return {
    isListening,
    isSpeaking,
    isSupported,
    startListening,
    stopListening,
    speak,
    stopSpeaking
  };
}