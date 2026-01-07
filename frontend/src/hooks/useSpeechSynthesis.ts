import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  voice?: SpeechSynthesisVoice | null;
}

interface UseSpeechSynthesisReturn {
  speak: (text: string) => void;
  cancel: () => void;
  pause: () => void;
  resume: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isSupported: boolean;
  voices: SpeechSynthesisVoice[];
  rate: number;
  setRate: (rate: number) => void;
  selectedVoice: SpeechSynthesisVoice | null;
  setSelectedVoice: (voice: SpeechSynthesisVoice | null) => void;
}

const STORAGE_KEY = 'gramgrab_speech_settings';

function loadSettings(): { rate: number; voiceURI: string | null } {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {}
  return { rate: 1, voiceURI: null };
}

function saveSettings(rate: number, voiceURI: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ rate, voiceURI }));
  } catch {}
}

export function useSpeechSynthesis(options: SpeechOptions = {}): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [rate, setRateState] = useState(() => loadSettings().rate);
  const [selectedVoice, setSelectedVoiceState] = useState<SpeechSynthesisVoice | null>(null);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const isSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Load voices
  useEffect(() => {
    if (!isSupported) return;

    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);

      // Restore saved voice
      const savedSettings = loadSettings();
      if (savedSettings.voiceURI && availableVoices.length > 0) {
        const savedVoice = availableVoices.find(v => v.voiceURI === savedSettings.voiceURI);
        if (savedVoice) {
          setSelectedVoiceState(savedVoice);
        }
      }

      // Default to first English voice if none selected
      if (!selectedVoice && availableVoices.length > 0) {
        const englishVoice = availableVoices.find(v => v.lang.startsWith('en'));
        if (englishVoice) {
          setSelectedVoiceState(englishVoice);
        }
      }
    };

    loadVoices();

    // Chrome loads voices asynchronously
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [isSupported]);

  const setRate = useCallback((newRate: number) => {
    const clampedRate = Math.max(0.5, Math.min(2, newRate));
    setRateState(clampedRate);
    saveSettings(clampedRate, selectedVoice?.voiceURI || null);
  }, [selectedVoice]);

  const setSelectedVoice = useCallback((voice: SpeechSynthesisVoice | null) => {
    setSelectedVoiceState(voice);
    saveSettings(rate, voice?.voiceURI || null);
  }, [rate]);

  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = options.rate ?? rate;
    utterance.pitch = options.pitch ?? 1;
    utterance.volume = options.volume ?? 1;

    if (options.voice || selectedVoice) {
      utterance.voice = options.voice || selectedVoice;
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
      setIsPaused(false);
    };

    utterance.onend = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utterance.onerror = () => {
      setIsSpeaking(false);
      setIsPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, options, rate, selectedVoice]);

  const cancel = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    setIsPaused(false);
  }, [isSupported]);

  const pause = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.pause();
    setIsPaused(true);
  }, [isSupported]);

  const resume = useCallback(() => {
    if (!isSupported) return;
    window.speechSynthesis.resume();
    setIsPaused(false);
  }, [isSupported]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isSupported) {
        window.speechSynthesis.cancel();
      }
    };
  }, [isSupported]);

  return {
    speak,
    cancel,
    pause,
    resume,
    isSpeaking,
    isPaused,
    isSupported,
    voices,
    rate,
    setRate,
    selectedVoice,
    setSelectedVoice,
  };
}
