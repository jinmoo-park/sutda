import { useState, useRef } from 'react';

interface SfxEntry { file: string; volume: number; }

const SFX_MAP: Record<string, SfxEntry> = {
  'shuffle':              { file: 'shuffle.mp3',              volume: 0.7 },
  'giri':                 { file: 'giri.mp3',                 volume: 0.7 },
  'deal':                 { file: 'deal.mp3',                 volume: 0.7 },
  'flip':                 { file: 'flip.mp3',                 volume: 0.5 },
  'chip':                 { file: 'chip.mp3',                 volume: 0.5 },
  'bet-check':            { file: 'bet-check.mp3',            volume: 0.7 },
  'bet-call':             { file: 'bet-call.mp3',             volume: 0.7 },
  'bet-raise':            { file: 'bet-raise.mp3',            volume: 0.7 },
  'bet-die':              { file: 'bet-die.mp3',              volume: 0.7 },
  'card-reveal':          { file: 'card-reveal.mp3',          volume: 0.6 },
  'win-normal':           { file: 'win-normal.mp3',           volume: 0.2 },
  'win-ddaeng':           { file: 'win-ddaeng.mp3',           volume: 0.6 },
  'win-ddaeng-loser':     { file: 'win-ddaeng.mp3',           volume: 0.3 },
  'lose-normal':          { file: 'lose-normal.mp3',          volume: 0.6 },
  'lose-ddaeng-penalty':  { file: 'lose-ddaeng-penalty.mp3',  volume: 0.6 },
  'lose-ddaeng-but-lost': { file: 'lose-ddaeng-but-lost.mp3', volume: 0.6 },
  'school-go':            { file: 'school-go.mp3',            volume: 0.7 },
  'school-proxy':         { file: 'school-proxy.mp3',         volume: 0.7 },
};

export function useSfxPlayer() {
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('sutda_sfx_muted') === 'true');
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  const play = (key: string) => {
    if (localStorage.getItem('sutda_sfx_muted') === 'true') return;
    const entry = SFX_MAP[key];
    if (!entry) return;

    const url = '/sfx/' + encodeURIComponent(entry.file);
    let audio = audioCache.current.get(key);

    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      audio = new Audio(url);
      audio.volume = entry.volume;
      audioCache.current.set(key, audio);
      audio.play().catch(() => {});
    }
  };

  const stop = (key: string) => {
    const audio = audioCache.current.get(key);
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('sutda_sfx_muted', String(next));
      return next;
    });
  };

  return { play, stop, isMuted, toggleMute };
}
