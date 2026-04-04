import { useState, useRef } from 'react';

const SFX_MAP: Record<string, string> = {
  'shuffle': '01.셔플.mp3',
  'giri': '02.기리.mp3',
  'deal': '03.카드배분.mp3',
  'flip': '04.카드뒤집기.mp3',
  'chip': '05.칩버튼.mp3',
  'bet-check': '06.베팅-체크.mp3',
  'bet-call': '07.베팅-콜.mp3',
  'bet-raise': '08.베팅-레이즈.mp3',
  'bet-die': '09.베팅-다이.mp3',
  'card-reveal': '10.패공개중.mp3',
  'win-normal': '11.승리-일반.mp3',
  'win-ddaeng': '12.승리-땡으로 승리.mp3',
  'lose-normal': '13.패배-일반.mp3',
  'lose-ddaeng-penalty': '14.패배-땡값.mp3',
  'lose-ddaeng-but-lost': '15.패배-땡이지만 패배.mp3',
  'school-go': '16.학교가기 버튼.mp3',
  'school-proxy': '17.학교대납.mp3',
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
