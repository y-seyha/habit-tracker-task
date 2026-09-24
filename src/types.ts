export type Habit = {
  id: number;
  user_id: string;
  name: string;
  description: string;
  completed: boolean;
  created_at: string;
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
