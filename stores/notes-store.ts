import { create } from 'zustand';
import { api } from '@/lib/api';

export type NoteType = 'daily' | 'weekly' | 'monthly';

export interface Note {
  id: string;
  key: string;
  type: NoteType;
  content: string;
  updatedAt: string;
}

interface NotesStore {
  notes: Record<string, Note>;
  loaded: boolean;
  load: () => Promise<void>;
  upsert: (type: NoteType, key: string, content: string) => Promise<void>;
}

export const useNotesStore = create<NotesStore>((set, get) => ({
  notes: {},
  loaded: false,

  load: async () => {
    try {
      const list = await api.get<Note[]>('/notes');
      const map: Record<string, Note> = {};
      for (const n of list) map[n.key] = n;
      set({ notes: map, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },

  upsert: async (type, key, content) => {
    // optimistic
    const prev = get().notes[key];
    set((s) => ({
      notes: {
        ...s.notes,
        [key]: { id: prev?.id ?? '', key, type, content, updatedAt: new Date().toISOString() },
      },
    }));
    try {
      const updated = await api.put<Note>('/notes', { type, key, content });
      set((s) => ({ notes: { ...s.notes, [key]: updated } }));
    } catch {
      // revert
      set((s) => {
        const notes = { ...s.notes };
        if (prev) notes[key] = prev;
        else delete notes[key];
        return { notes };
      });
    }
  },
}));
