'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Mic,
  MicOff,
  Square,
  AlertCircle,
  Globe,
  Sparkles,
  Volume2,
} from 'lucide-react';

export type VoiceStatus = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'STOPPED' | 'ERROR';

interface VoiceDictationProps {
  onTranscriptReady: (transcriptText: string) => void;
  currentText: string;
}

// Browser Web Speech Recognition typing
interface IWindowSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
}

export function VoiceDictation({ onTranscriptReady, currentText }: VoiceDictationProps) {
  const [status, setStatus] = useState<VoiceStatus>('IDLE');
  const [language, setLanguage] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [interimText, setInterimText] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState<boolean>(true);

  const recognitionRef = useRef<IWindowSpeechRecognition | null>(null);
  const isListeningRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognitionConstructor =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognitionConstructor) {
        setIsSupported(false);
      }
    }
  }, []);

  const startListening = () => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionConstructor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionConstructor) {
      setIsSupported(false);
      setStatus('ERROR');
      setErrorMessage('Voice recognition is not supported in this browser. Please type your symptoms instead.');
      return;
    }

    try {
      // Stop any existing session
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch (_) {}
      }

      const recognition: IWindowSpeechRecognition = new SpeechRecognitionConstructor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = language;

      recognition.onstart = () => {
        isListeningRef.current = true;
        setStatus('LISTENING');
        setInterimText('');
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let finalChunk = '';
        let interimChunk = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += transcript + ' ';
          } else {
            interimChunk += transcript;
          }
        }

        if (finalChunk.trim()) {
          const updated = currentText.trim()
            ? `${currentText.trim()} ${finalChunk.trim()}`
            : finalChunk.trim();
          onTranscriptReady(updated);
        }

        setInterimText(interimChunk);
      };

      recognition.onerror = (event: any) => {
        const errType = event.error || 'speech_recognition_error';
        isListeningRef.current = false;
        setStatus('ERROR');

        switch (errType) {
          case 'not-allowed':
          case 'permission-denied':
            setErrorMessage('Microphone access was denied. Please allow microphone permissions in your browser or type your symptoms.');
            break;
          case 'no-speech':
            setErrorMessage('No speech was detected. Please tap the microphone and speak again.');
            break;
          case 'audio-capture':
            setErrorMessage('No microphone was found on this device. Please connect a microphone or use keyboard input.');
            break;
          case 'network':
            setErrorMessage('Network error during speech recognition. You can continue typing manually.');
            break;
          default:
            setErrorMessage('Voice recognition encountered an issue. You can continue typing manually.');
            break;
        }
      };

      recognition.onend = () => {
        isListeningRef.current = false;
        setInterimText('');
        setStatus((prev) => (prev === 'LISTENING' ? 'STOPPED' : prev));
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.error('[VoiceDictation] Failed to initialize speech recognition:', err);
      setStatus('ERROR');
      setErrorMessage('Unable to start voice input. Please type your symptoms.');
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListeningRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (_) {}
    }
    isListeningRef.current = false;
    setStatus('STOPPED');
    setInterimText('');
  };

  // Unsupported browser banner
  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-600">
        <MicOff className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span>
          Voice dictation is not supported in this browser. Please type your symptoms manually.
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-3 bg-white border border-slate-200/90 rounded-xl p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Left: Status & Action Control */}
        <div className="flex items-center gap-3">
          {status === 'LISTENING' ? (
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={stopListening}
              className="gap-2 font-semibold shadow-sm animate-pulse"
              aria-label="Stop recording voice symptoms"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Recording</span>
            </Button>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={startListening}
              className="gap-2 font-semibold text-teal-700 border-teal-300 hover:bg-teal-50 shadow-sm"
              aria-label="Start recording voice symptoms"
            >
              <Mic className="w-4 h-4 text-teal-600" />
              <span>Speak Your Symptoms</span>
            </Button>
          )}

          {/* Real-time State Badge */}
          {status === 'LISTENING' && (
            <div className="flex items-center gap-2 text-xs font-semibold text-rose-600">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>Listening... Speak clearly</span>
            </div>
          )}

          {status === 'STOPPED' && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
              <Volume2 className="w-3.5 h-3.5" />
              <span>Transcript recorded. You can edit text anytime.</span>
            </div>
          )}
        </div>

        {/* Right: Language Selector */}
        <div className="flex items-center gap-2 text-xs">
          <Globe className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-500 font-medium">Voice Language:</span>
          <select
            value={language}
            onChange={(e) => {
              const selected = e.target.value as 'en-IN' | 'hi-IN';
              setLanguage(selected);
              if (status === 'LISTENING') {
                stopListening();
              }
            }}
            disabled={status === 'LISTENING'}
            className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-teal-500"
            aria-label="Select voice dictation language"
          >
            <option value="en-IN">English (India)</option>
            <option value="hi-IN">Hindi (हिंदी)</option>
          </select>
        </div>
      </div>

      {/* Live Interim Transcript Feedback */}
      {status === 'LISTENING' && interimText && (
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-lg text-xs text-teal-900 flex items-start gap-2 italic">
          <Sparkles className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold not-italic text-teal-950 block text-[11px] uppercase tracking-wider">
              Hearing:
            </span>
            &ldquo;{interimText}&rdquo;
          </div>
        </div>
      )}

      {/* Error Message Display */}
      {status === 'ERROR' && errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={startListening}
            className="text-xs h-7 px-2 border-rose-300 text-rose-800 hover:bg-rose-100"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
