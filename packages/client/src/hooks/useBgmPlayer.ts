import { useState, useEffect } from 'react';

// 모듈 레벨 싱글톤 — 여러 컴포넌트가 훅을 호출해도 Audio 인스턴스는 하나만 생성됨
let _audio: HTMLAudioElement | null = null;
let _currentSrc = 'main_bgm.mp3';
const _subscribers = new Set<(muted: boolean) => void>();

function getAudio(): HTMLAudioElement {
  if (!_audio) {
    const audio = new Audio('/sfx/' + encodeURIComponent('main_bgm.mp3'));
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = 0.1;
    _audio = audio;

    const muted = localStorage.getItem('sutda_bgm_muted') === 'true';
    if (!muted) {
      audio.play().catch(() => {
        // 브라우저 자동재생 정책으로 실패 시 첫 인터랙션 후 재시도
        const onFirstInteraction = () => {
          if (localStorage.getItem('sutda_bgm_muted') !== 'true') {
            audio.play().catch(() => {});
          }
        };
        document.addEventListener('click', onFirstInteraction, { once: true });
        document.addEventListener('touchstart', onFirstInteraction, { once: true });
        document.addEventListener('keydown', onFirstInteraction, { once: true });
      });
    }
  }
  return _audio;
}

export function useBgmPlayer() {
  const [isMuted, setIsMuted] = useState(() => localStorage.getItem('sutda_bgm_muted') === 'true');

  useEffect(() => {
    getAudio(); // 싱글톤 초기화 보장

    const handler = (muted: boolean) => setIsMuted(muted);
    _subscribers.add(handler);
    return () => {
      _subscribers.delete(handler);
    };
  }, []);

  const toggleMute = () => {
    const next = localStorage.getItem('sutda_bgm_muted') !== 'true';
    localStorage.setItem('sutda_bgm_muted', String(next));
    const audio = getAudio();
    if (next) {
      audio.pause();
    } else {
      audio.play().catch(() => {});
    }
    // 모든 구독자(컴포넌트)에게 상태 변경 전파
    _subscribers.forEach(fn => fn(next));
  };

  const stopBgm = () => {
    _audio?.pause();
  };

  const startBgm = () => {
    if (localStorage.getItem('sutda_bgm_muted') !== 'true') {
      getAudio().play().catch(() => {});
    }
  };

  const switchBgm = (filename: string) => {
    _currentSrc = filename;
    const audio = getAudio();
    audio.src = '/sfx/' + encodeURIComponent(filename);
    audio.loop = true;
    if (localStorage.getItem('sutda_bgm_muted') !== 'true') {
      audio.play().catch(() => {});
    }
  };

  const restoreBgm = () => {
    if (_currentSrc === 'main_bgm.mp3') return;
    switchBgm('main_bgm.mp3');
  };

  return { isMuted, toggleMute, stopBgm, startBgm, switchBgm, restoreBgm };
}
