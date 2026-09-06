import { useEffect, useRef, useState } from 'react';
import type { Track } from '../lib/types';

function formatTime(sec: number) {
  if (!Number.isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function TrackPlayer({ track }: { track: Track }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrent(audio.currentTime);
    const onMeta = () => setDuration(audio.duration || 0);
    const onEnd = () => setIsPlaying(false);
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('ended', onEnd);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('ended', onEnd);
    };
  }, [track.audio_url]);

  function toggle() {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      audio.play();
      setIsPlaying(true);
    }
  }

  const progress = duration > 0 ? (current / duration) * 100 : 0;

  return (
    <div className="w-full rounded-2xl border border-white/[0.09] bg-white/[0.045] p-4 backdrop-blur-md">
      <audio ref={audioRef} src={track.audio_url} preload="metadata" />
      <div className="flex items-center gap-3">
        <div className="h-14 w-14 flex-none overflow-hidden rounded-xl bg-gradient-to-br from-white/10 to-white/[0.03]">
          {track.cover_url && <img src={track.cover_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="min-w-0 flex-1 text-left">
          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--accent-gold)]">
            Now Playing
          </p>
          <p className="truncate text-[13px] font-semibold text-white">{track.title}</p>
          <p className="truncate text-[11px] text-white/45">{track.artist}</p>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-linear-to-br from-[var(--accent-red)] to-[var(--accent-gold)] text-white hover:brightness-110 active:scale-95"
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <rect x="6" y="5" width="4" height="14" />
              <rect x="14" y="5" width="4" height="14" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className="w-8 flex-none text-[10px] text-white/40">{formatTime(current)}</span>
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-linear-to-r from-[var(--accent-red)] to-[var(--accent-gold)]"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="w-8 flex-none text-right text-[10px] text-white/40">{formatTime(duration)}</span>
      </div>
    </div>
  );
}
