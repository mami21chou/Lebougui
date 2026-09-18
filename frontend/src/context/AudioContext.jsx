import React, { createContext, useContext, useRef, useState, useCallback } from 'react';

const AudioContext = createContext(null);

export const useAudio = () => {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error('useAudio doit être utilisé dans un AudioProvider');
  return ctx;
};

export function AudioProvider({ children }) {
  const audioRef = useRef(null);
  const [currentId, setCurrentId] = useState(null);

  const getAudio = useCallback(() => {
    if (!audioRef.current) {
      const a = new Audio();
      a.addEventListener('ended', () => setCurrentId(null));
      audioRef.current = a;
    }
    return audioRef.current;
  }, []);

  const play = useCallback(
    (id, url) => {
      const audio = getAudio();

      // Si on reclique sur le même audio qui joue → pause
      if (currentId === id && !audio.paused) {
        audio.pause();
        setCurrentId(null);
        return;
      }

      // Change la source si nécessaire
      if (audio.src !== url) {
        audio.src = url;
      }
      audio.currentTime = 0;

      audio
        .play()
        .then(() => setCurrentId(id))
        .catch((err) => {
          console.warn('Lecture audio impossible:', err);
          setCurrentId(null);
        });
    },
    [currentId, getAudio]
  );

  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setCurrentId(null);
  }, []);

  return (
    <AudioContext.Provider value={{ currentId, play, pause }}>
      {children}
    </AudioContext.Provider>
  );
}

export default AudioContext;