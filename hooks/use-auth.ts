import { useCallback } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { api, saveToken, clearToken } from '@/lib/api';
import type { User } from '@/types/database';

export function useAuth() {
  const { token, user, isLoading, setAuth, clear } = useAuthStore();

  const signIn = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.post<{ access_token: string }>('/auth/login', {
      email,
      password,
    });
    await saveToken(access_token);
    const profile = await api.get<User>('/user/me');
    setAuth(access_token, profile);
  }, [setAuth]);

  const signUp = useCallback(async (email: string, password: string) => {
    const { access_token } = await api.post<{ access_token: string }>('/auth/register', {
      email,
      password,
    });
    await saveToken(access_token);
    const profile = await api.get<User>('/user/me');
    setAuth(access_token, profile);
  }, [setAuth]);

  const signOut = useCallback(async () => {
    await clearToken();
    clear();
  }, [clear]);

  return { token, user, isLoading, signIn, signUp, signOut };
}
