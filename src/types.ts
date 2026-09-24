export type Habit = {
  id: number;
  user_id: string;
  name: string;
  description: string;
  completed: boolean;
  created_at: string;
};

export type Profile = {
  id: string;
  avatar_url: string | null;
  updated_at?: string;
};

export type HabitForm = {
  name: string;
  description: string;
  completed: boolean;
};

export const emptyHabitForm: HabitForm = {
  name: "",
  description: "",
  completed: false,
};

export const MAX_AVATAR_SIZE_BYTES = 1024 * 1024;
