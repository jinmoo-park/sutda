import { useState, useEffect } from 'react';

// 모듈 레벨 싱글톤 — 여러 컴포넌트가 훅을 호출해도 Audio 인스턴스는 하나만 생성됨
let _audio: HTMLAudioElement | null = null;
let _bigpotAudio: HTMLAudioElement | null = null;
let _isBigPotActive = false;
const _subscribers = new Set<(muted: boolean) => void>();

function getAudio(): HTMLAudioElement {
  if (!_audio) {
    const audio = new Audio('/sfx/' + encodeURIComponent('main_bgm.mp3'));
    audio.loop = true;
    audio.preload = 'none';
    audio.volume = 0.1;
    _audio = audio;

    // 빅팟 BGM 미리 로드 — 첫 발동 시 딜레이 방지
    if (!_bigpotAudio) {
      _bigpotAudio = new Audio('/sfx/bgm_bigpot.mp3');
      _bigpotAudio.loop = true;
      _bigpotAudio.preload = 'auto';
      _bigpotAudio.volume = 0.3;
    }

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

/** 빅팟 BGM 전환 — 모듈 레벨 싱글톤 관리 */
export function setBigPot(active: boolean) {
  if (active === _isBigPotActive) return;
  _isBigPotActive = active;

  if (localStorage.getItem('sutda_bgm_muted') === 'true') return;

  if (active) {
    _audio?.pause();
    _bigpotAudio?.play().catch(() => {});
  } else {
    _bigpotAudio?.pause();
    _audio?.play().catch(() => {});
  }
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
      // mute: main + bigpot 모두 정지
      audio.pause();
      _bigpotAudio?.pause();
    } else {
      // unmute: 빅팟 활성 상태에 따라 적절한 BGM 재생
      if (_isBigPotActive) {
        _bigpotAudio?.play().catch(() => {});
      } else {
        audio.play().catch(() => {});
      }
    }
    // 모든 구독자(컴포넌트)에게 상태 변경 전파
    _subscribers.forEach(fn => fn(next));
  };

  const stopBgm = () => {
    _audio?.pause();
    _bigpotAudio?.pause();
  };

  const startBgm = () => {
    if (localStorage.getItem('sutda_bgm_muted') !== 'true') {
      if (_isBigPotActive) {
        _bigpotAudio?.play().catch(() => {});
      } else {
        getAudio().play().catch(() => {});
      }
    }
  };

  return { isMuted, toggleMute, stopBgm, startBgm, setBigPot };
}
