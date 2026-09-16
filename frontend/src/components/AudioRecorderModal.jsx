import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, Mic, RotateCcw, Camera } from 'lucide-react';

export default function AudioRecorderModal({ onAudioCaptured, onCancel, onFinishAndAddPhoto }) {
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      stopStream();
    };
  }, []);

  const startTimer = () => {
    stopTimer();
    setSeconds(0);
    timerRef.current = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  const startRecording = async () => {
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      startTimer();
    } catch (err) {
      alert("Accès au microphone requis pour l'enregistrement.");
    }
  };

  const stopAndCapture = (callback) => {
    stopTimer();
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        stopStream();
        setIsRecording(false);
        callback(blob, url);
      };
      mediaRecorderRef.current.stop();
    }
  };

  const handleFinishAudioOnly = () => {
    stopAndCapture((blob, url) => {
      onAudioCaptured(blob, url);
    });
  };

  const handleFinishAndPhoto = () => {
    stopAndCapture((blob, url) => {
      if (onFinishAndAddPhoto) {
        onFinishAndAddPhoto(blob, url);
      } else {
        onAudioCaptured(blob, url);
      }
    });
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins} : ${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F4EF] flex flex-col justify-between p-6 max-w-md mx-auto text-slate-800">
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">ÉTAPE 1 SUR 2</p>
          <h2 className="text-sm font-bold text-slate-900">Enregistrement vocal Wolof</h2>
        </div>
        <button onClick={onCancel} className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200">
          <X size={18} className="text-slate-600" />
        </button>
      </div>

      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${isRecording ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
          {isRecording ? 'Micro actif • Réduction de bruit' : 'Micro en pause'}
        </div>
      </div>

      <div className="flex flex-col items-center justify-center space-y-6 my-auto">
        {/* Clic sur l'icône micro pour arrêter l'enregistrement vocal */}
        <button 
          onClick={handleFinishAudioOnly}
          className="relative flex items-center justify-center group active:scale-95 transition-transform"
        >
          <div className="absolute w-44 h-44 rounded-full bg-orange-500/10 animate-ping"></div>
          <div className="absolute w-36 h-36 rounded-full bg-orange-500/20"></div>
          <div className="relative w-28 h-28 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex flex-col items-center justify-center text-white shadow-xl shadow-orange-500/30">
            <Mic size={36} />
            <span className="text-[10px] font-black uppercase mt-1 tracking-wider">
              {isRecording ? 'STOPPER' : 'WOLOF'}
            </span>
          </div>
        </button>

        <div className="text-4xl font-black tracking-wider text-slate-900">
          {formatTime(seconds)}
        </div>

        <p className="text-xs text-slate-500 text-center max-w-xs leading-relaxed px-4">
          Cliquez sur le micro pour stopper le vocal, ou sur le bouton ci-dessous pour passer à la photo.
        </p>
      </div>

      <div className="space-y-3 pb-2">
        <button
          onClick={handleFinishAndPhoto}
          
          className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          
        >
          <span>Terminer l'audio et Ajouter la photo</span>
          <Camera size={16} />
        </button>

        <button
          onClick={() => {
            stopTimer();
            startRecording();
            
          }}
          className="w-full text-center text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:text-slate-900"
         
        >
          <RotateCcw size={14} />
          <span>Recommencer l'audio</span>
        </button>
      </div>
    </div>
  );
}