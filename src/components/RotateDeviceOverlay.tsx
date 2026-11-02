import { useEffect, useState } from 'react';
import { Maximize2 } from 'lucide-react';
import { lockLandscapeOrientation, useFullscreenState } from '../utils/fullscreen';

interface RotateDeviceOverlayProps {
  onPortraitChange?: (isPortrait: boolean) => void;
}

export function RotateDeviceOverlay({ onPortraitChange }: RotateDeviceOverlayProps) {
  const { isFullscreen, supported: fullscreenSupported, toggleFullscreen } = useFullscreenState();
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth;
  });

  useEffect(() => {
    const evaluateOrientation = () => {
      const portrait = window.innerHeight > window.innerWidth;
      setIsPortrait(portrait);
      onPortraitChange?.(portrait);
    };

    evaluateOrientation();
    void lockLandscapeOrientation();

    window.addEventListener('resize', evaluateOrientation);
    window.addEventListener('orientationchange', evaluateOrientation);
    return () => {
      window.removeEventListener('resize', evaluateOrientation);
      window.removeEventListener('orientationchange', evaluateOrientation);
    };
  }, [onPortraitChange]);

  if (!isPortrait) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Rotate your device to landscape"
      className="fixed inset-0 z-[100] bg-[#11161B] text-[#F3EFE6] flex flex-col items-center justify-center p-8 text-center select-none"
    >
      {/* Subtle warm lantern radial backdrop */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(245,158,11,0.22),rgba(16,185,129,0.08)_45%,transparent_72%)] opacity-45" />

      <div className="relative max-w-xs space-y-6 flex flex-col items-center">
        {/* Animated Cozy Phone Rotation Illustration */}
        <div className="relative w-28 h-28 rounded-3xl bg-[#1B222B] border border-amber-400/30 flex items-center justify-center shadow-2xl">
          <svg
            viewBox="0 0 80 80"
            className="w-20 h-20 text-emerald-300 animate-phone-tilt"
          >
            {/* Device outline */}
            <rect
              x="24"
              y="12"
              width="32"
              height="56"
              rx="6"
              fill="#131820"
              stroke="currentColor"
              strokeWidth="3"
            />
            {/* Speaker notch & home indicator */}
            <line x1="36" y1="17" x2="44" y2="17" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
            <circle cx="40" cy="62" r="2" fill="#F59E0B" />
            {/* Tiny sprout icon inside screen */}
            <path
              d="M40 44 V35 M40 36 C35 34 33 38 38 39 M40 35 C45 33 47 37 42 38"
              stroke="#4ADE80"
              strokeWidth="2.2"
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Curved rotation cue arrow */}
          <div className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.4">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 3v5h5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="text-xs font-medium text-amber-300">
            16:9 Landscape Experience
          </div>
          <h2 className="font-display text-2xl font-bold text-white">
            Please Rotate Your Device
          </h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Moss &amp; Lantern is crafted for horizontal widescreen play so your dual-thumb controls and crypt view stay wide and unobstructed.
          </p>
        </div>

        {fullscreenSupported && !isFullscreen && (
          <button
            type="button"
            onClick={toggleFullscreen}
            className="min-h-[44px] px-5 py-2.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-semibold text-xs inline-flex items-center gap-2 transition-transform active:scale-96 cursor-pointer"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Enter Full Screen Landscape</span>
          </button>
        )}

        <div className="text-xs text-emerald-300/90 font-mono">
          Game Paused Until Landscape
        </div>
      </div>
    </div>
  );
}
