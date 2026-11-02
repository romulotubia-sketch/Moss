import { useEffect, useState } from 'react';

interface VendorDocument extends Document {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenEnabled?: boolean;
}

interface VendorElement extends HTMLElement {
  webkitRequestFullscreen?: () => Promise<void> | void;
}

export function isCurrentlyFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as VendorDocument;
  return Boolean(doc.fullscreenElement || doc.webkitFullscreenElement);
}

export function canUseFullscreen(): boolean {
  if (typeof document === 'undefined') return false;
  const doc = document as VendorDocument;
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
}

export async function lockLandscapeOrientation(): Promise<void> {
  try {
    const orientationApi = screen.orientation as ScreenOrientation & {
      lock?: (mode: string) => Promise<void>;
    };
    if (orientationApi && typeof orientationApi.lock === 'function') {
      await orientationApi.lock('landscape');
    }
  } catch {
    // Safe no-op when browser restricts orientation lock outside installed/fullscreen contexts
  }
}

export async function toggleFullscreenLandscape(): Promise<boolean> {
  if (typeof document === 'undefined') return false;
  const doc = document as VendorDocument;
  const root = document.documentElement as VendorElement;

  try {
    if (!isCurrentlyFullscreen()) {
      if (root.requestFullscreen) {
        await root.requestFullscreen();
      } else if (root.webkitRequestFullscreen) {
        await root.webkitRequestFullscreen();
      }
      await lockLandscapeOrientation();
      return true;
    } else {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
      }
      return false;
    }
  } catch {
    return isCurrentlyFullscreen();
  }
}

export function useFullscreenState(): {
  isFullscreen: boolean;
  supported: boolean;
  toggleFullscreen: () => void;
} {
  const [isFullscreen, setIsFullscreen] = useState<boolean>(() => isCurrentlyFullscreen());
  const supported = canUseFullscreen();

  useEffect(() => {
    const sync = () => setIsFullscreen(isCurrentlyFullscreen());
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync);
    return () => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync);
    };
  }, []);

  const toggleFullscreen = () => {
    void toggleFullscreenLandscape();
  };

  return { isFullscreen, supported, toggleFullscreen };
}
