import { useState, useRef, useEffect } from 'react';

export function useBgmPlayer() {
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('sutda_bgm_muted') === 'true');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio('/sfx/' + encodeURIComponent('main_bgm.mp3'));
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = 0.4;
    audioRef.current = audio;

    const muted = localStorage.getItem('sutda_bgm_muted') === 'true';
    if (!muted) {
      audio.play().catch(() => {
        // 브라우저 자동재생 정책으로 실패 시 첫 인터랙션 후 재시도
        const onFirstInteraction = () => {
          if (localStorage.getItem('sutda_bgm_muted') !== 'true') {
            audio.play().catch(() => {});
          }
          document.removeEventListener('click', onFirstInteraction);
          document.removeEventListener('touchstart', onFirstInteraction);
          document.removeEventListener('keydown', onFirstInteraction);
        };
        document.addEventListener('click', onFirstInteraction, { once: true });
        document.addEventListener('touchstart', onFirstInteraction, { once: true });
        document.addEventListener('keydown', onFirstInteraction, { once: true });
      });
    }

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('sutda_bgm_muted', String(next));
      const audio = audioRef.current;
      if (audio) {
        if (next) {
          audio.pause();
        } else {
          audio.play().catch(() => {});
        }
      }
      return next;
    });
  };

  const stopBgm = () => {
    audioRef.current?.pause();
  };

  const startBgm = () => {
    if (localStorage.getItem('sutda_bgm_muted') !== 'true') {
      audioRef.current?.play().catch(() => {});
    }
  };

  return { isMuted, toggleMute, stopBgm, startBgm };
}
