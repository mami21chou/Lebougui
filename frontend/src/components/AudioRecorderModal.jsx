/**
 * AudioRecorderModal.jsx
 * 
 * Modal plein écran d'enregistrement vocal Wolof.
 * Utilise la MediaRecorder API du navigateur.
 * 
 * Produit en sortie : un Blob audio (format webm/opus) transmis au parent
 * via les callbacks `onAudioCaptured` ou `onFinishAndAddPhoto`.
 */

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, X, Mic, RotateCcw, Camera } from 'lucide-react';


export default function AudioRecorderModal({ onAudioCaptured, onCancel, onFinishAndAddPhoto }) {

  // ─── States (déclenchent un re-render) ───
  const [isRecording, setIsRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);

  // ─── Refs (valeurs techniques, pas de re-render) ───
  const mediaRecorderRef = useRef(null);   // instance MediaRecorder
  const audioChunksRef = useRef([]);       // morceaux audio collectés
  const timerRef = useRef(null);           // ID du timer
  const mimeTypeRef = useRef('audio/webm'); // format audio retenu

  // ─── Cycle de vie : démarrage auto + cleanup ───
  useEffect(() => {
    startRecording();
    return () => {
      stopTimer();
      stopStream();     // libère le micro au démontage
    };
  }, []);

  // ─────────────────────────────────────────
  // TIMER
  // ─────────────────────────────────────────
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

  // ─────────────────────────────────────────
  // MICRO
  // ─────────────────────────────────────────
  /** Libère le flux micro (éteint la pastille du navigateur). */
  const stopStream = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
    }
  };

  /**
   * Demande l'accès au micro, choisit un codec compatible
   * et démarre l'enregistrement.
   */
  const startRecording = async () => {
    audioChunksRef.current = [];

    try {
      // Options d'optimisation audio (améliorent la transcription)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,   // annule l'écho
          noiseSuppression: true,   // réduit le bruit ambiant
          channelCount: 1,          // mono (exigé par le modèle ASR)
        },
      });

      // Choix du codec : du meilleur au moins bon selon le navigateur
      const candidates = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
      ];
      const mimeType =
        candidates.find((t) => MediaRecorder.isTypeSupported(t)) || '';
      mimeTypeRef.current = mimeType || 'audio/webm';

      const options = mimeType ? { mimeType } : undefined;
      mediaRecorderRef.current = new MediaRecorder(stream, options);

      // Collecte des chunks (on ignore les vides pour ne pas casser l'en-tête WebM)
      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      // start() sans timeslice → un seul chunk complet à stop() (plus fiable)
      mediaRecorderRef.current.start();
      setIsRecording(true);
      startTimer();
    } catch (err) {
      console.error('Erreur micro :', err);
      alert("Accès au microphone requis pour l'enregistrement.");
    }
  };

  /**
   * Stoppe l'enregistrement et renvoie le Blob via la callback.
   * Force l'émission de la dernière chunk avant stop().
   */
  const stopAndCapture = (callback) => {
    stopTimer();
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording) return;

    // Force la libération de la dernière chunk (contournement bug navigateur)
    try {
      if (recorder.state === 'recording') recorder.requestData();
    } catch (e) {
      console.warn('requestData non supporté :', e);
    }

    // Au stop : création du Blob + remontée au parent
    recorder.onstop = () => {
      const type = recorder.mimeType || mimeTypeRef.current || 'audio/webm';
      const blob = new Blob(audioChunksRef.current, { type });
      const url = URL.createObjectURL(blob);
      stopStream();
      setIsRecording(false);
      callback(blob, url);
    };

    recorder.stop();
  };

  // ─────────────────────────────────────────
  // HANDLERS DES BOUTONS
  // ─────────────────────────────────────────
  /** Bouton central : terminer l'audio seul. */
  const handleFinishAudioOnly = () => {
    stopAndCapture((blob, url) => {
      onAudioCaptured(blob, url);
    });
  };

  /** Bouton bas : terminer l'audio et ouvrir le sélecteur photo. */
  const handleFinishAndPhoto = () => {
    stopAndCapture((blob, url) => {
      if (onFinishAndAddPhoto) {
        onFinishAndAddPhoto(blob, url);
      } else {
        onAudioCaptured(blob, url);
      }
    });
  };

  /** Formate un nombre de secondes en "MM : SS". */
  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60).toString().padStart(2, '0');
    const secs = (totalSec % 60).toString().padStart(2, '0');
    return `${mins} : ${secs}`;
  };

  // ─────────────────────────────────────────
  // RENDU
  // ─────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-50 bg-[#F7F4EF] flex flex-col justify-between p-6 max-w-md mx-auto text-slate-800">

      {/* Barre supérieure */}
      <div className="flex items-center justify-between">
        <button onClick={onCancel} className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200">
          <ChevronLeft size={18} className="text-slate-600" />
        </button>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-widest text-teal-600 uppercase">
            ÉTAPE 1 SUR 2
          </p>
          <h2 className="text-sm font-bold text-slate-900">
            Enregistrement vocal Wolof
          </h2>
        </div>
        <button onClick={onCancel} className="p-2.5 rounded-full bg-white shadow-sm border border-slate-200">
          <X size={18} className="text-slate-600" />
        </button>
      </div>

      {/* Bouton central + timer */}
      <div className="flex flex-col items-center justify-center space-y-6 my-auto">
        <button onClick={handleFinishAudioOnly} className="relative flex items-center justify-center group active:scale-95 transition-transform">
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
          Cliquez sur le micro pour stopper le vocal, ou sur le bouton
          ci-dessous pour passer à la photo.
        </p>
      </div>

      {/* Actions bas */}
      <div className="space-y-3 pb-2">
        <button onClick={handleFinishAndPhoto} className="w-full py-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-bold text-xs rounded-2xl shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
          <span>Terminer l'audio et Ajouter la photo</span>
          <Camera size={16} />
        </button>

        <button onClick={() => { stopTimer(); startRecording(); }} className="w-full text-center text-xs font-semibold text-slate-600 flex items-center justify-center gap-1.5 hover:text-slate-900">
          <RotateCcw size={14} />
          <span>Recommencer l'audio</span>
        </button>
      </div>
    </div>
  );
}