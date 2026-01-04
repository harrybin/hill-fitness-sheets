export interface Exercise {
  id: string;
  name: string;
  notes?: string;
  order: number;
}

export interface TrainingSet {
  setNumber: number;
  weight: number;
  reps: number;
}

export interface TrainingEntry {
  id: string;
  exerciseId: string;
  date: string;
  sets: TrainingSet[];
}

export interface Session {
  date: string;
  entries: TrainingEntry[];
}

export interface AppSettings {
  defaultSetsPerExercise: number;
  googleSheetId?: string;
  trainingGoal?: string;
  legalNotice?: string;
  notes?: string;
}

export interface PreviousTraining {
  exerciseId: string;
  lastWeight: number;
  lastReps: number;
  date: string;
}
