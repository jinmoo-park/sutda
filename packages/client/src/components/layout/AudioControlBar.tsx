import { useBgmPlayer } from '@/hooks/useBgmPlayer';
import { useSfxPlayer } from '@/hooks/useSfxPlayer';

export function AudioControlBar() {
  const { isMuted: bgmMuted, toggleMute: toggleBgm } = useBgmPlayer();
  const { isMuted: sfxMuted, toggleMute: toggleSfx } = useSfxPlayer();

  return (
    <div className="hidden md:flex fixed bottom-4 right-4 z-50 gap-2">
      <button
        onClick={toggleBgm}
        title={bgmMuted ? 'BGM 켜기' : 'BGM 끄기'}
        className={`h-8 w-8 flex items-center justify-center rounded text-xs font-semibold transition-opacity bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70 ${bgmMuted ? 'opacity-40' : 'opacity-80'}`}
      >
        {bgmMuted ? '🔇' : '🎵'}
      </button>
      <button
        onClick={toggleSfx}
        title={sfxMuted ? 'SFX 켜기' : 'SFX 끄기'}
        className={`h-8 w-8 flex items-center justify-center rounded text-xs font-semibold transition-opacity bg-black/50 backdrop-blur-sm border border-white/20 hover:bg-black/70 ${sfxMuted ? 'opacity-40' : 'opacity-80'}`}
      >
        {sfxMuted ? '🔕' : '🔔'}
      </button>
    </div>
  );
}
