"use client";

import { useEffect, useRef, useState } from "react";
import { VoiceProviderState } from "../types";

type SpeechRecognitionEventLike = Event & { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> };
type SpeechRecognitionErrorLike = Event & { error?: string };
type SpeechRecognitionLike = EventTarget & {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
};

declare global { interface Window { SpeechRecognition?: new () => SpeechRecognitionLike; webkitSpeechRecognition?: new () => SpeechRecognitionLike } }

// `continuous: true` does not actually guarantee an unbroken session in
// every browser — Chrome/Android and others still fire `onend` after a
// couple of seconds of silence mid-conversation, even though the user
// hasn't finished talking. We treat that as "the browser paused on us" and
// restart automatically unless the user (or the silence timeout below)
// asked to stop, so a natural pause between sentences doesn't require
// pressing the mic button again.
//
// This is the one intentional stop-on-silence: no new speech for this long
// (counted from either the button press or the last result, whichever is
// later) ends listening so the mic doesn't stay hot forever. Kept as a
// named constant since the right value will need tuning against real
// devices/browsers.
const SILENCE_TIMEOUT_MS = 3000;

// Errors that mean retrying won't help — don't auto-restart on these, and
// tell the user plainly instead of pretending it'll fix itself.
const FATAL_ERRORS = new Set(["not-allowed", "service-not-allowed", "audio-capture"]);

export function useWebSpeech(onFinalTranscript: (text: string) => void): VoiceProviderState {
  const recognition = useRef<SpeechRecognitionLike | null>(null);
  const shouldContinueRef = useRef(false);
  const silenceTimerRef = useRef<number | null>(null);
  const [supported, setSupported] = useState(true);
  const [listening, setListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState("");
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    setSupported(typeof window !== "undefined" && Boolean(window.SpeechRecognition || window.webkitSpeechRecognition));
  }, []);

  useEffect(() => {
    if (!listening) return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [listening]);

  const clearSilenceTimer = () => {
    if (silenceTimerRef.current !== null) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  };

  const armSilenceTimer = () => {
    clearSilenceTimer();
    silenceTimerRef.current = window.setTimeout(() => {
      shouldContinueRef.current = false;
      recognition.current?.stop();
    }, SILENCE_TIMEOUT_MS);
  };

  const startRecognitionInstance = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      setError("이 브라우저에서는 음성 입력을 바로 사용할 수 없어 텍스트 입력으로 이어갈게요.");
      shouldContinueRef.current = false;
      return;
    }
    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = "ko-KR";
    instance.interimResults = true;
    instance.continuous = true;
    instance.onstart = () => {
      setListening(true);
      setError("");
      armSilenceTimer();
    };
    instance.onend = () => {
      if (shouldContinueRef.current) {
        // Give the browser a tick to release the previous session before
        // asking for a new one — starting again in the same frame can throw
        // in some implementations.
        window.setTimeout(() => {
          if (shouldContinueRef.current) startRecognitionInstance();
        }, 0);
        return;
      }
      clearSilenceTimer();
      setListening(false);
      setInterimTranscript("");
    };
    instance.onerror = (event) => {
      if (event.error && FATAL_ERRORS.has(event.error)) {
        shouldContinueRef.current = false;
        setError(
          event.error === "audio-capture"
            ? "마이크를 사용할 수 없어요. 텍스트로도 바로 이어갈 수 있어요."
            : "마이크 권한이 꺼져 있어요. 텍스트로도 바로 이어갈 수 있어요.",
        );
        return;
      }
      // Transient errors (no-speech, network, ...) — onend fires right
      // after this and decides whether to restart. Just surface a soft,
      // non-blocking notice rather than treating it as a hard failure.
      setError("음성이 잠시 불안정해요. 말한 내용을 텍스트로 적어도 괜찮아요.");
    };
    instance.onresult = (event) => {
      armSilenceTimer();
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterimTranscript(interimText);
      // Recognized text only ever lands in the composer draft (see the
      // caller) — never auto-submitted, so a misheard word can be fixed
      // before sending.
      if (finalText.trim()) onFinalTranscript(finalText.trim());
    };
    try {
      instance.start();
    } catch (startError) {
      console.error("[use-web-speech] failed to start recognition", startError);
      setListening(false);
    }
  };

  const start = () => {
    shouldContinueRef.current = true;
    setSeconds(0);
    startRecognitionInstance();
  };

  const stop = () => {
    shouldContinueRef.current = false;
    clearSilenceTimer();
    recognition.current?.stop();
  };

  const cancel = () => {
    shouldContinueRef.current = false;
    clearSilenceTimer();
    recognition.current?.abort();
    setInterimTranscript("");
    setListening(false);
  };

  // Without this, navigating away (or resetting the session) while
  // listening would leave shouldContinueRef true — the next time the
  // browser ends the recognition session it would restart itself with no
  // UI left to stop it again.
  useEffect(
    () => () => {
      shouldContinueRef.current = false;
      clearSilenceTimer();
      recognition.current?.abort();
    },
    [],
  );

  return { supported, listening, interimTranscript, seconds, error, start, stop, cancel };
}
