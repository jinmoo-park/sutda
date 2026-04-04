import { useState, useRef } from 'react';

const SFX_MAP: Record<string, string> = {
  'shuffle': 'shuffle.mp3',
  'giri': 'giri.mp3',
  'deal': 'deal.mp3',
  'flip': 'flip.mp3',
  'chip': 'chip.mp3',
  'bet-check': 'bet-check.mp3',
  'bet-call': 'bet-call.mp3',
  'bet-raise': 'bet-raise.mp3',
  'bet-die': 'bet-die.mp3',
  'card-reveal': 'card-reveal.mp3',
  'win-normal': 'win-normal.mp3',
  'win-ddaeng': 'win-ddaeng.mp3',
  'lose-normal': 'lose-normal.mp3',
  'lose-ddaeng-penalty': 'lose-ddaeng-penalty.mp3',
  'lose-ddaeng-but-lost': 'lose-ddaeng-but-lost.mp3',
  'school-go': 'school-go.mp3',
  'school-proxy': 'school-proxy.mp3',
};

export function useSfxPlayer() {
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('sutda_sfx_muted') === 'true');
  const audioCache = useRef<Map<string, HTMLAudioElement>>(new Map());

  const play = (key: string) => {
    if (localStorage.getItem('sutda_sfx_muted') === 'true') return;
    const filename = SFX_MAP[key];
    if (!filename) return;

    const url = '/sfx/' + encodeURIComponent(filename);
    let audio = audioCache.current.get(key);

    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    } else {
      audio = new Audio(url);
      audio.volume = 0.7;
      audioCache.current.set(key, audio);
      audio.play().catch(() => {});
    }
  };

  const toggleMute = () => {
    setIsMuted(prev => {
      const next = !prev;
      localStorage.setItem('sutda_sfx_muted', String(next));
      return next;
    });
  };

  return { play, isMuted, toggleMute };
}
