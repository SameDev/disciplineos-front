import { create } from 'zustand';
import type { User } from '@/types/database';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setAuth: (token: string, user: User) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isLoading: true,
  setAuth: (token, user) => set({ token, user, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
  clear: () => set({ token: null, user: null, isLoading: false }),
}));
