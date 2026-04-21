import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types/database';

export function useProfile() {
  const token = useAuthStore((s) => s.token);

  return useQuery<User>({
    queryKey: ['profile'],
    queryFn: () => api.get<User>('/user/me'),
    enabled: !!token,
  });
}
