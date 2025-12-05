import React, { useEffect, useRef, useState } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { Mic, MicOff, PhoneOff, Activity, Volume2 } from 'lucide-react';
import { createPcmBlob, decodeBase64, decodeAudioData } from '../services/audioUtils';

interface LiveCallProps {
  onEndCall: () => void;
}

export const LiveCall: React.FC<LiveCallProps> = ({ onEndCall }) => {
  const [isActive, setIsActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Audio Context Refs
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  
  // Session Logic
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const currentSessionRef = useRef<any>(null); // To store the resolved session for closing

  useEffect(() => {
    startSession();
    return () => stopSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startSession = async () => {
    try {
      setIsActive(true);
      setError(null);

      // Initialize Audio Contexts
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      inputAudioContextRef.current = new AudioContextClass({ sampleRate: 16000 });
      outputAudioContextRef.current = new AudioContextClass({ sampleRate: 24000 });
      
      // Get User Media
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // Initialize GenAI
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const config = {
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
            systemInstruction: 'You are a helpful, conversational AI assistant.',
        }
      };

      // Connect Live API
      sessionPromiseRef.current = ai.live.connect({
        ...config,
        callbacks: {
          onopen: () => {
            console.log("Live Session Opened");
            setupAudioInput();
          },
          onmessage: async (message: LiveServerMessage) => {
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData) {
              await playAudioChunk(audioData);
            }
          },
          onclose: () => {
            console.log("Live Session Closed");
            setIsActive(false);
          },
          onerror: (err) => {
            console.error("Live Session Error", err);
            setError("Connection error");
            setIsActive(false);
          }
        }
      });
      
      // Store session reference for clean cleanup
      sessionPromiseRef.current.then(session => {
        currentSessionRef.current = session;
      });

    } catch (err: any) {
      console.error(err);
      setError("Failed to access microphone or connect.");
      setIsActive(false);
    }
  };

  const setupAudioInput = () => {
    if (!inputAudioContextRef.current || !streamRef.current || !sessionPromiseRef.current) return;

    const ctx = inputAudioContextRef.current;
    sourceRef.current = ctx.createMediaStreamSource(streamRef.current);
    
    // Processor for raw PCM
    processorRef.current = ctx.createScriptProcessor(4096, 1, 1);
    
    processorRef.current.onaudioprocess = (e) => {
      if (isMuted) return; // Simple mute implementation

      const inputData = e.inputBuffer.getChannelData(0);
      
      // Visualizer fake logic
      let sum = 0;
      for(let i=0; i<inputData.length; i+=100) sum += Math.abs(inputData[i]);
      setVolumeLevel(sum / (inputData.length/100) * 100);

      const pcmBlob = createPcmBlob(inputData);
      
      sessionPromiseRef.current?.then((session) => {
         session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    sourceRef.current.connect(processorRef.current);
    processorRef.current.connect(ctx.destination);
  };

  const playAudioChunk = async (base64Audio: string) => {
    if (!outputAudioContextRef.current) return;
    
    const ctx = outputAudioContextRef.current;
    const audioBytes = decodeBase64(base64Audio);
    const audioBuffer = await decodeAudioData(audioBytes, ctx, 24000, 1);
    
    const source = ctx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(ctx.destination);
    
    const currentTime = ctx.currentTime;
    // Schedule seamlessly
    const startTime = Math.max(currentTime, nextStartTimeRef.current);
    source.start(startTime);
    nextStartTimeRef.current = startTime + audioBuffer.duration;
  };

  const stopSession = () => {
    if (processorRef.current) {
        processorRef.current.disconnect();
        processorRef.current.onaudioprocess = null;
    }
    if (sourceRef.current) sourceRef.current.disconnect();
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    if (inputAudioContextRef.current) inputAudioContextRef.current.close();
    if (outputAudioContextRef.current) outputAudioContextRef.current.close();
    
    // Close live session
    if (currentSessionRef.current) {
        currentSessionRef.current.close(); // Assuming close method exists on session object from SDK
    }
  };

  const handleEndCall = () => {
    stopSession();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-gray-900 to-gray-800 text-white flex flex-col items-center justify-between py-12 px-6">
      <div className="flex flex-col items-center gap-4 mt-10">
        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center relative">
          <Activity size={40} className="text-emerald-400" />
          {isActive && (
             <div 
               className="absolute inset-0 rounded-full border-2 border-emerald-400 opacity-50 animate-ping"
               style={{ animationDuration: `${Math.max(0.5, 2 - volumeLevel)}s` }}
             ></div>
          )}
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Gemini Live</h2>
          <p className="text-gray-400 mt-1">{isActive ? 'Connected • 24kHz' : 'Connecting...'}</p>
        </div>
      </div>

      {error && (
          <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg">
              {error}
          </div>
      )}

      {/* Visualizer bars */}
      <div className="flex gap-2 h-16 items-center">
          {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="w-2 bg-emerald-400 rounded-full transition-all duration-100 ease-in-out"
                style={{ height: `${Math.max(10, Math.random() * volumeLevel * 50)}%` }}
              />
          ))}
      </div>

      <div className="flex items-center gap-8 mb-8">
        <button 
          onClick={() => setIsMuted(!isMuted)}
          className={`p-4 rounded-full transition-colors ${isMuted ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30'}`}
        >
          {isMuted ? <MicOff size={28} /> : <Mic size={28} />}
        </button>
        
        <button 
            className="p-4 rounded-full bg-white/20 hover:bg-white/30"
            title="Speaker"
        >
             <Volume2 size={28} />
        </button>

        <button 
          onClick={handleEndCall}
          className="p-6 rounded-full bg-red-500 hover:bg-red-600 shadow-lg transform hover:scale-105 transition-all"
        >
          <PhoneOff size={32} />
        </button>
      </div>
    </div>
  );
};