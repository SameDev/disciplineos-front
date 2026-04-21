import { create } from 'zustand';
import type { SpotifyPlaybackState } from '@/lib/spotify';

interface SpotifyStore {
  isConnected: boolean;
  displayName: string | null;
  playback: SpotifyPlaybackState | null;
  setConnected: (name: string) => void;
  setPlayback: (playback: SpotifyPlaybackState | null) => void;
  disconnect: () => void;
}

export const useSpotifyStore = create<SpotifyStore>((set) => ({
  isConnected: false,
  displayName: null,
  playback: null,
  setConnected: (displayName) => set({ isConnected: true, displayName }),
  setPlayback: (playback) => set({ playback }),
  disconnect: () => set({ isConnected: false, displayName: null, playback: null }),
}));
