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

export function useWebSpeech(onFinalTranscript: (text: string) => void): VoiceProviderState {
  const recognition = useRef<SpeechRecognitionLike | null>(null);
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

  const start = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setSupported(false);
      setError("이 브라우저에서는 음성 입력을 바로 사용할 수 없어 텍스트 입력으로 이어갈게요.");
      return;
    }
    const instance = new Recognition();
    recognition.current = instance;
    instance.lang = "ko-KR";
    instance.interimResults = true;
    instance.continuous = true;
    instance.onstart = () => { setListening(true); setSeconds(0); setError(""); };
    instance.onend = () => setListening(false);
    instance.onerror = (event) => {
      setListening(false);
      setError(event.error === "not-allowed" ? "마이크 권한이 꺼져 있어요. 텍스트로도 바로 이어갈 수 있어요." : "음성이 잠시 불안정해요. 말한 내용을 텍스트로 적어도 괜찮아요.");
    };
    instance.onresult = (event) => {
      let finalText = "";
      let interimText = "";
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const transcript = event.results[index][0].transcript;
        if (event.results[index].isFinal) finalText += transcript;
        else interimText += transcript;
      }
      setInterimTranscript(interimText);
      if (finalText.trim()) onFinalTranscript(finalText.trim());
    };
    instance.start();
  };

  return {
    supported,
    listening,
    interimTranscript,
    seconds,
    error,
    start,
    stop: () => recognition.current?.stop(),
    cancel: () => { recognition.current?.abort(); setInterimTranscript(""); setListening(false); },
  };
}
