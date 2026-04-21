import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import type { User } from '@/types/database';

interface UpdateProfileInput {
  name?: string;
  email?: string;
  avatarUrl?: string;
  currentPassword?: string;
  newPassword?: string;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  const token = useAuthStore((s) => s.token);

  return useMutation({
    mutationFn: (data: UpdateProfileInput) => api.patch<User>('/user/me', data),
    onSuccess: (updated) => {
      queryClient.setQueryData(['profile'], updated);
      if (token) setAuth(token, updated);
    },
  });
}
