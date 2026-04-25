import { z } from 'zod';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type TaskType = 'daily' | 'weekly' | 'one_time';

export interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  level: number;
  xp: number;
  streak: number;
  lastCompletionDate: string | null;
  createdAt: string;
}

export interface Task {
  id: string;
  title: string;
  type: TaskType;
  difficulty: Difficulty;
  stepGoal: number | null;
  userId: string;
  createdAt: string;
}

export interface TaskWithCompletion extends Task {
  completed_today: boolean;
  month_completions?: number;
}

export interface CompleteTaskResult {
  earnedXp: number;
  user: User;
}

export const createTaskSchema = z.object({
  title: z
    .string()
    .min(1, 'Título é obrigatório')
    .max(100, 'Título muito longo'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    message: 'Selecione a dificuldade',
  }),
  type: z.enum(['daily', 'weekly', 'one_time']).default('daily'),
  stepGoal: z.number().int().positive().optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;

export const updateTaskSchema = z.object({
  title: z.string().min(1, 'Título é obrigatório').max(100).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
  type: z.enum(['daily', 'weekly', 'one_time']).optional(),
  stepGoal: z.number().int().positive().nullable().optional(),
});

export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
