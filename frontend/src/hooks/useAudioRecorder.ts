import { useState, useRef, useCallback } from 'react';
import type { RecordingState } from '../types/consultation.types';

export interface UseAudioRecorderReturn {
  state: RecordingState;
  elapsedSeconds: number;
  audioBlob: Blob | null;
  startRecording: () => Promise<void>;
  pauseRecording: () => void;
  resumeRecording: () => void;
  stopRecording: () => void;
  resetRecording: () => void;
  error: string | null;
}

const MAX_RECORDING_SECONDS = 600; // 10 minutes

export function useAudioRecorder(): UseAudioRecorderReturn {
  const [state, setState] = useState<RecordingState>('idle');
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => {
        if (prev >= MAX_RECORDING_SECONDS) {
          stopTimer();
          mediaRecorderRef.current?.stop();
          return prev;
        }
        return prev + 1;
      });
    }, 1000);
  }, [stopTimer]);

  const startRecording = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000,
          channelCount: 1,
        },
      });

      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        stopTimer();
        setState('done');
      };

      recorder.start(1000); // Capture in 1-second chunks for streaming potential
      setState('recording');
      startTimer();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone access denied');
      setState('error');
    }
  }, [startTimer, stopTimer]);

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause();
      stopTimer();
      setState('paused');
    }
  }, [stopTimer]);

  const resumeRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume();
      startTimer();
      setState('recording');
    }
  }, [startTimer]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setState('processing');
    }
  }, []);

  const resetRecording = useCallback(() => {
    stopTimer();
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    mediaRecorderRef.current = null;
    chunksRef.current = [];
    setAudioBlob(null);
    setElapsedSeconds(0);
    setError(null);
    setState('idle');
  }, [stopTimer]);

  return {
    state,
    elapsedSeconds,
    audioBlob,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    resetRecording,
    error,
  };
}
