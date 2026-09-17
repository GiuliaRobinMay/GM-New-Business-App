"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Records audio with MediaRecorder and, where the browser offers it, runs
 * the Web Speech API alongside for a live transcript.
 *
 * Chrome (desktop + Android) and Safari (macOS + iOS 14.5+) both expose
 * SpeechRecognition. Firefox does not — there you still get the audio, and
 * the text box to type into. The transcript is always editable afterwards;
 * treat it as a draft, not a record.
 */

interface SpeechRecognitionLike extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }>;
}

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export type VoiceState = "idle" | "requesting" | "recording" | "stopping";

export interface VoiceResult {
  blob: Blob | null;
  mimeType: string;
  durationSec: number;
  transcript: string;
}

export function useVoiceCapture(lang = "en-US") {
  const [state, setState] = useState<VoiceState>("idle");
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [supportsTranscript, setSupportsTranscript] = useState(false);

  // Refs mirror the transcript state so stop() can read the latest value
  // without going through a render.
  const finalRef = useRef("");
  const interimRef = useRef("");

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const keepListeningRef = useRef(false);
  const startedAtRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const resolveStopRef = useRef<((r: VoiceResult) => void) | null>(null);

  useEffect(() => {
    setSupportsTranscript(getRecognitionCtor() !== null);
  }, []);

  const clearTimer = () => {
    if (timerRef.current != null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startRecognition = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;
    rec.onresult = (ev) => {
      let interim = "";
      let finalChunk = "";
      for (let i = ev.resultIndex; i < ev.results.length; i++) {
        const r = ev.results[i];
        const text = r[0]?.transcript ?? "";
        if (r.isFinal) finalChunk += text + " ";
        else interim += text;
      }
      if (finalChunk) {
        finalRef.current += finalChunk;
        setFinalText(finalRef.current);
      }
      interimRef.current = interim;
      setInterimText(interim);
    };
    rec.onerror = (ev) => {
      // "no-speech" and "aborted" are normal; anything else is worth surfacing.
      if (ev.error !== "no-speech" && ev.error !== "aborted") {
        setError(`Transcription: ${ev.error}`);
      }
    };
    rec.onend = () => {
      // Browsers stop recognition on their own after a pause. Restart while
      // the user is still recording so long dumps are not cut off.
      if (keepListeningRef.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      }
    };
    recognitionRef.current = rec;
    try {
      rec.start();
    } catch {
      /* ignore */
    }
  }, [lang]);

  const start = useCallback(async () => {
    if (state !== "idle") return;
    setError(null);
    finalRef.current = "";
    interimRef.current = "";
    setFinalText("");
    setInterimText("");
    setElapsedSec(0);
    setState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];
      const mimeType = pickMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType });
        const durationSec = Math.round((Date.now() - startedAtRef.current) / 1000);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        recorderRef.current = null;
        clearTimer();
        setState("idle");
        resolveStopRef.current?.({
          blob: blob.size > 0 ? blob : null,
          mimeType: recorder.mimeType,
          durationSec,
          transcript: "", // filled in by stop()
        });
        resolveStopRef.current = null;
      };
      recorderRef.current = recorder;
      startedAtRef.current = Date.now();
      recorder.start(1000);
      keepListeningRef.current = true;
      startRecognition();
      timerRef.current = window.setInterval(() => {
        setElapsedSec(Math.round((Date.now() - startedAtRef.current) / 1000));
      }, 500);
      setState("recording");
    } catch (e) {
      setState("idle");
      setError(e instanceof Error ? e.message : "Could not access the microphone.");
    }
  }, [state, startRecognition]);

  const stop = useCallback((): Promise<VoiceResult> => {
    return new Promise((resolve) => {
      keepListeningRef.current = false;
      recognitionRef.current?.stop();
      recognitionRef.current = null;
      const recorder = recorderRef.current;
      if (!recorder || recorder.state === "inactive") {
        setState("idle");
        resolve({ blob: null, mimeType: "", durationSec: 0, transcript: "" });
        return;
      }
      setState("stopping");
      resolveStopRef.current = (r) => {
        // Give recognition a beat to flush its last final result.
        window.setTimeout(() => {
          const transcript = (finalRef.current + " " + interimRef.current).replace(/\s+/g, " ").trim();
          resolve({ ...r, transcript });
        }, 250);
      };
      recorder.stop();
    });
  }, []);

  const cancel = useCallback(() => {
    keepListeningRef.current = false;
    recognitionRef.current?.abort();
    recognitionRef.current = null;
    const recorder = recorderRef.current;
    resolveStopRef.current = null;
    if (recorder && recorder.state !== "inactive") recorder.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    clearTimer();
    finalRef.current = "";
    interimRef.current = "";
    setFinalText("");
    setInterimText("");
    setElapsedSec(0);
    setState("idle");
  }, []);

  useEffect(() => () => cancel(), [cancel]);

  return {
    state,
    liveText: (finalText + " " + interimText).replace(/\s+/g, " ").trim(),
    elapsedSec,
    error,
    supportsTranscript,
    start,
    stop,
    cancel,
  };
}

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg;codecs=opus"];
  return candidates.find((c) => MediaRecorder.isTypeSupported(c));
}

export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
