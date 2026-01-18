export interface Exercise {
  id: string;
  name: string;
  notes?: string;
  order: number;
  suggestedWeight?: number;
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
  skipped?: boolean;
}

export interface Session {
  date: string;
  entries: TrainingEntry[];
  dateInterpolated?: boolean;
}

export interface AppSettings {
  trainingGoal?: string;
  legalNotice?: string;
  notes?: string;
  googleSheetImportStatus?: {
    url?: string;
    authenticated?: boolean;
    source?: "drive-api" | "public-download";
    success?: boolean;
    lastImportedAt?: number;
  };
  importedFile?: {
    name: string;
    data: string;
    lastModified: number;
    size: number;
  };
}

export interface PreviousTraining {
  exerciseId: string;
  lastWeight: number;
  lastReps: number;
  date: string;
}
