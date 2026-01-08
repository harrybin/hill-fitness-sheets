/**
 * Body Part Icon Mapping
 * Maps German exercise/muscle group names to body part icons
 * Used for exercise list visualization
 */

export type BodyPart =
  | "legs"
  | "quads"
  | "hamstrings"
  | "calves"
  | "chest"
  | "back"
  | "lats"
  | "shoulders"
  | "arms"
  | "biceps"
  | "triceps"
  | "forearms"
  | "abs"
  | "core"
  | "glutes"
  | "trapezius";

export interface BodyPartIcon {
  name: BodyPart;
  germanTerms: string[];
  icon: string; // Tabler icon name (e.g., "leg-2", "muscle-2")
  description: string;
}

// Comprehensive mapping of German exercise/muscle terms to body parts
// IMPORTANT: Order matters! More specific terms should come before general terms.
// The function returns the first match, so "bizeps" must come before "arm"
// Icons are Tabler icon names: https://tabler-icons.io
const BODY_PART_MAPPINGS: BodyPartIcon[] = [
  // Most specific terms first
  {
    name: "biceps",
    germanTerms: ["bizeps", "biceps", "unterarm-curl", "unterarmcurl"],
    icon: "muscle-2",
    description: "Biceps",
  },
  {
    name: "triceps",
    germanTerms: [
      "trizeps",
      "triceps",
      "dips",
      "dip",
      "extension",
      "pushdown",
      "kickback",
    ],
    icon: "muscle-2",
    description: "Triceps",
  },
  {
    name: "lats",
    germanTerms: ["latissimus", "latzug", "latz", "lat"],
    icon: "muscle-2",
    description: "Latissimus",
  },
  {
    name: "quads",
    germanTerms: ["beinstrecken", "quadrizeps"],
    icon: "leg-2",
    description: "Quadriceps",
  },
  {
    name: "hamstrings",
    germanTerms: ["hamstring", "beuger", "beincurl"],
    icon: "leg-2",
    description: "Hamstrings",
  },
  {
    name: "calves",
    germanTerms: ["waden", "wader"],
    icon: "leg-2",
    description: "Calves",
  },
  {
    name: "chest",
    germanTerms: [
      "brust",
      "bankdrücken",
      "brustpresse",
      "fliegende",
      "butterfly",
      "crossover",
      "pec",
    ],
    icon: "muscle-2",
    description: "Chest",
  },
  {
    name: "back",
    germanTerms: ["rücken", "rudern", "klimmzug", "pulldown", "hyperextension"],
    icon: "muscle-2",
    description: "Back",
  },
  {
    name: "abs",
    germanTerms: ["bauchpresse", "bauch", "abdominal", "crunch", "sit-up"],
    icon: "muscle-2",
    description: "Abs",
  },
  {
    name: "shoulders",
    germanTerms: [
      "schulter",
      "seitheben",
      "schulterpresse",
      "schulterdrücken",
      "deltoid",
      "raise",
      "press",
    ],
    icon: "muscle-2",
    description: "Shoulders",
  },
  {
    name: "forearms",
    germanTerms: ["unterarm", "forearm", "underarm"],
    icon: "muscle-2",
    description: "Forearms",
  },
  {
    name: "trapezius",
    germanTerms: ["trapez", "nacken", "shrugs"],
    icon: "muscle-2",
    description: "Trapezius",
  },
  {
    name: "core",
    germanTerms: ["core", "rumpf", "stabilisation", "stabilization"],
    icon: "muscle-2",
    description: "Core",
  },
  {
    name: "glutes",
    germanTerms: ["gesäß", "gluteal", "po", "hüfte", "hip"],
    icon: "leg-2",
    description: "Glutes",
  },
  // General terms last (fallback)
  {
    name: "arms",
    germanTerms: ["arm", "curl", "hantel"],
    icon: "muscle-2",
    description: "Arms",
  },
  {
    name: "legs",
    germanTerms: ["bein", "knie", "beinpresse", "beinbeuger", "beinanheben"],
    icon: "leg-2",
    description: "Legs",
  },
];

/**
 * Maps an exercise name (German) to its primary body part
 * @param exerciseName - The German exercise name
 * @returns The matching body part or undefined if no match found
 */
export function mapExerciseToBodyPart(
  exerciseName: string
): BodyPart | undefined {
  if (!exerciseName) return undefined;

  const lowerName = exerciseName.toLowerCase();

  for (const mapping of BODY_PART_MAPPINGS) {
    for (const term of mapping.germanTerms) {
      if (lowerName.includes(term.toLowerCase())) {
        return mapping.name;
      }
    }
  }

  return undefined;
}

/**
 * Get icon details for a body part
 * @param bodyPart - The body part
 * @returns The icon details or undefined if not found
 */
export function getBodyPartIcon(bodyPart: BodyPart): BodyPartIcon | undefined {
  return BODY_PART_MAPPINGS.find((m) => m.name === bodyPart);
}

/**
 * Get all body parts and their mappings
 * @returns Array of all body part mappings
 */
export function getAllBodyPartMappings(): BodyPartIcon[] {
  return [...BODY_PART_MAPPINGS];
}

/**
 * Get icon emoji for an exercise name
 * @param exerciseName - The German exercise name
 * @returns The emoji icon or undefined
 */
export function getExerciseIcon(exerciseName: string): string | undefined {
  const bodyPart = mapExerciseToBodyPart(exerciseName);
  if (!bodyPart) return undefined;
  return getBodyPartIcon(bodyPart)?.icon;
}
