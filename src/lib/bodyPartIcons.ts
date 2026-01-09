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
  // Special-case: Leg raises (Beinheben) often written with "Dip-Station" and
  // would otherwise match the generic "dip" term in triceps. Place this early.
  {
    name: "abs",
    germanTerms: [
      "beinheben",
      "beinhebung",
      "bein anheben",
      "beinanheben",
      "hängendes beinheben",
      "hanging leg raise",
      "leg raise",
      "leg raises",
      "leg-raise",
    ],
    icon: "muscle-2",
    description: "Abs (Leg Raises)",
  },
  {
    name: "biceps",
    germanTerms: [
      "bizeps",
      "biceps",
      "biceps brachii",
      "armmuskel",
      "oberarmmuskel",
      "hantelcurl",
      "langhantel curl",
      "kurzhantel curl",
      "maschinen curl",
      "scott curl",
      "scott-bank",
    ],
    icon: "muscle-2",
    description: "Bizeps",
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
      "triceps brachii",
      "dreiköpfiger",
      "triceps maschine",
      "seilzug triceps",
      "hantel triceps",
      "kurzhantel triceps",
      "bänder triceps",
      "kopfzug",
    ],
    icon: "muscle",
    description: "Trizeps",
  },
  {
    name: "lats",
    germanTerms: [
      "latissimus",
      "latzug",
      "latz",
      "lat",
      "latissimus dorsi",
      "breiter rückenmuskel",
      "rückenbreiter",
      "breitziehen",
      "breitzug",
      "latzugmaschine",
      "engriefiger latzug",
      "weiter latzug",
      "reverse grip latzug",
    ],
    icon: "muscle-2",
    description: "Latissimus",
  },
  {
    name: "quads",
    germanTerms: [
      "beinstrecken",
      "quadrizeps",
      "beinpresse",
      "leg press",
      "legpress",
      "rectus femoris",
      "vastus",
      "oberschenkelmuskel",
      "vierköpfiger",
      "kniebeuge",
      "kniebeugen",
      "langhantel kniebeuge",
      "kurzhantel kniebeuge",
      "hack squat",
      "hack-kniebeuge",
      "smith machine squat",
      "smith-kniebeuge",
      "v-kniebeuge",
      "goblet squat",
      "goblet-kniebeuge",
      "pistol squat",
      "pistolen-kniebeuge",
      "beinstreckmaschine",
      "beinstreckungs-maschine",
      "leg extension",
      "schrägpresse",
      "pendel-beinpresse",
    ],
    icon: "leg-2",
    description: "Quadriceps",
  },
  {
    name: "hamstrings",
    germanTerms: [
      "hamstring",
      "beuger",
      "beincurl",
      "leg curl",
      "legcurl",
      "semitendinosus",
      "semimembranosus",
      "biceps femoris",
      "rückseite oberschenkel",
      "oberschenkelbeuger",
      "beinbeuger",
      "beinbeugen",
      "beinbeuger-maschine",
      "lying leg curl",
      "liegende beincurl",
      "sitzende beincurl",
      "stehende beincurl",
      "rumänisches kreuzheben",
      "rumänischer deadlift",
      "rumänisches heben",
    ],
    icon: "leg-2",
    description: "Hamstrings",
  },
  {
    name: "calves",
    germanTerms: [
      "waden",
      "wader",
      "wadenheben",
      "calf raise",
      "calfheben",
      "gastrocnemius",
      "soleus",
      "wadenmuskel",
      "fersenhebers",
      "fersenhebeübung",
      "wadenmaschine",
      "stehende wadenheben",
      "sitzende wadenheben",
      "maschinen wadenheben",
      "wadendrücken",
    ],
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
      "chest press",
      "incline",
      "decline",
      "pectoralis",
      "pectoralis major",
      "pectoralis minor",
      "brustmuskel",
      "hantel bankdrücken",
      "kurzhantel bankdrücken",
      "langhantel bankdrücken",
      "flachbank",
      "schrägbank",
      "negative bank",
      "smith machine bankdrücken",
      "smith-bankdrücken",
      "brustmaschine",
      "brustpresse-maschine",
      "pec deck",
      "pec-deck-maschine",
      "kabel crossover",
      "seilzug fliege",
      "schrägbank drücken",
      "schräg-bankdrücken",
      "negativ-bankdrücken",
    ],
    icon: "muscle-2",
    description: "Chest",
  },
  {
    name: "back",
    germanTerms: [
      "rücken",
      "rudern",
      "klimmzug",
      "pulldown",
      "hyperextension",
      "kreuzheben",
      "deadlift",
      "t-bar",
      "rhomboid",
      "serratus",
      "rückenmuskel",
      "rueckenstrecker",
      "rückenstrecker",
      "rückenstrecken",
      "ruderbewegung",
      "langhantel rudern",
      "kurzhantel rudern",
      "rudermaschine",
      "ruderzug",
      "seilzug rudern",
      "t-bar rudern",
      "seal row",
      "klimmzüge",
      "wide grip klimmzug",
      "enger grip klimmzug",
      "inverse reihe",
      "rückenmuskulatur-training",
      "rückenstrecker-maschine",
      "hyperextension-bank",
      "back extension",
      "rückenstreckung",
    ],
    icon: "muscle-2",
    description: "Back",
  },
  {
    name: "abs",
    germanTerms: [
      "bauchpresse",
      "bauch",
      "abdominal",
      "crunch",
      "sit-up",
      "ab roller",
      "hanging leg",
      "rectus abdominis",
      "bauchmuskel",
      "rumpf",
      "oblique",
      "schräge",
      "bauchmaschine",
      "bauchpresse-maschine",
      "gewichteter crunch",
      "kabel crunch",
      "maschinen crunch",
      "decline sit-ups",
      "hängende beinhebung",
      "decline crunches",
      "russian twist",
      "pallof press",
      "landmine rotation",
      "seite planke",
      "dead bug",
      "bird dog",
      "ab wheel",
      "bauchrad",
    ],
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
      "lateral raise",
      "front raise",
      "reverse pec",
      "deltoideus",
      "schultermuskel",
      "schulterheber",
      "military press",
      "arnold press",
      "kabel seitheben",
      "schulterhebung",
      "schulterheben-maschine",
      "seitenheben",
      "vorderheben",
      "rückwärtiger fliege",
      "reverse pec deck",
      "hintere schulter",
      "schulterkomplex",
    ],
    icon: "muscle-2",
    description: "Shoulders",
  },
  {
    name: "forearms",
    germanTerms: [
      "unterarm",
      "forearm",
      "underarm",
      "wrist curl",
      "handgelenk",
      "unterarmmuskel",
      "flexor",
      "extensor",
      "unterarm-curl",
      "hantelcurl unterarm",
      "handgelenks-curl",
      "langhantel curl",
      "kurzhantel curl",
      "unterarm training",
    ],
    icon: "muscle-2",
    description: "Forearms",
  },
  {
    name: "trapezius",
    germanTerms: [
      "trapez",
      "nacken",
      "shrugs",
      "schulterzucken",
      "trapezius",
      "trapezmuskeln",
      "nackenmuskeln",
      "schulterzuckbewegung",
      "langhantel zuckung",
      "kurzhantel zuckung",
      "maschinen zuckung",
      "seilzug zuckung",
      "schulterhebung",
    ],
    icon: "muscle-2",
    description: "Trapezius",
  },
  {
    name: "core",
    germanTerms: [
      "core",
      "rumpf",
      "stabilisation",
      "stabilization",
      "planke",
      "plank",
      "rumpfmuskulatur",
      "rumpftraining",
      "stabilitätstraining",
      "core-training",
    ],
    icon: "muscle-2",
    description: "Core",
  },
  {
    name: "glutes",
    germanTerms: [
      "gesäß",
      "gluteal",
      "po",
      "hüfte",
      "hip",
      "glute bridge",
      "hip thrust",
      "leg kickback",
      "gluteus maximus",
      "gluteus medius",
      "gesäßmuskel",
      "hüftmuskel",
      "hüftstoß",
      "hüftstreckung",
      "abduktion",
      "adduktion",
      "abduktor-maschine",
      "adduktor-maschine",
      "beinabhebung",
      "beinanführung",
    ],
    icon: "leg-2",
    description: "Glutes",
  },
  // General terms last (fallback)
  {
    name: "arms",
    germanTerms: [
      "arm",
      "curl",
      "hantel",
      "armmuskulatur",
      "oberarm",
      "unterarm",
    ],
    icon: "muscle-2",
    description: "Arms",
  },
  {
    name: "legs",
    germanTerms: [
      "bein",
      "knie",
      "beinpresse",
      "beinbeuger",
      "beinanheben",
      "beinmuskulatur",
      "oberschenkel",
      "unterschenkel",
      "femur",
    ],
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
 * Get exercise icon emoji for an exercise name
 * @param exerciseName - The German exercise name
 * @returns The emoji icon or undefined
 */
export function getExerciseIcon(exerciseName: string): string | undefined {
  const bodyPart = mapExerciseToBodyPart(exerciseName);
  if (!bodyPart) return undefined;
  return getBodyPartIcon(bodyPart)?.icon;
}

/**
 * FUTURE EXERCISES TO IMPLEMENT
 *
 * These exercises are imagined but not yet added to the mappings.
 * They can be implemented by adding them to BODY_PART_MAPPINGS.
 *
 * CHEST EXERCISES:
 * - Smith Machine Bankdrücken (Chest)
 * - Incline Hantel Bankdrücken (Chest, Shoulders)
 * - Cable Chest Fly (Chest)
 * - Machine Brustpresse (Chest)
 * - Dips (Chest, Triceps)
 * - Machine Chest Press (Chest)
 * - Brust-Dips (Chest, Shoulders)
 *
 * BACK EXERCISES:
 * - Barbell Rudern (Back, Lats)
 * - Klimmzug weiter Griff (Back, Lats)
 * - Klimmzug enger Griff (Back, Biceps)
 * - T-Bar Rudern (Back, Lats)
 * - Seal Row (Back, Lats)
 * - Hyperextension (Lower Back)
 * - Good Morning (Back, Hamstrings)
 * - Rückenstrecker (Lower Back, Core)
 * - Pendulum Rudern (Back, Lats)
 *
 * SHOULDER EXERCISES:
 * - Military Press (Shoulders, Triceps)
 * - Arnold Press (Shoulders)
 * - Cable Lateral Raise (Shoulders)
 * - Plate Raises (Shoulders)
 * - Pike Push-ups (Shoulders, Chest, Triceps)
 * - Machine Shoulder Press (Shoulders)
 * - Upright Row (Shoulders, Trapezius)
 * - Dumbbell Shoulder Press (Shoulders, Triceps)
 *
 * ARM EXERCISES:
 * - Barbell Curl (Biceps)
 * - Preacher Curl (Biceps)
 * - Concentration Curl (Biceps)
 * - Cable Curl (Biceps)
 * - Machine Curl (Biceps)
 * - Dumbbell Triceps Extension (Triceps)
 * - Cable Triceps Extension (Triceps)
 * - Close Grip Bankdrücken (Triceps, Chest)
 * - Skull Crushers (Triceps)
 * - Overhead Triceps Extension (Triceps, Shoulders)
 *
 * LEG EXERCISES:
 * - Barbell Back Squat (Legs, Quads, Glutes)
 * - Front Squat (Quads, Core)
 * - Bulgarian Split Squat (Legs, Glutes, Quads)
 * - Hack Squat (Quads, Glutes)
 * - Pendulum Squat (Quads, Glutes)
 * - Smith Machine Squat (Quads, Glutes)
 * - Romanian Deadlift (Hamstrings, Glutes, Back)
 * - Hack Machine Beinpresse (Quads, Glutes)
 * - Leg Extension (Quads)
 * - Lying Leg Curl (Hamstrings)
 * - Seated Leg Curl (Hamstrings)
 * - Standing Calf Raise (Calves)
 * - Seated Calf Raise (Calves)
 * - Machine Calf Raise (Calves)
 * - Hip Adductor Machine (Glutes, Inner Thighs)
 * - Hip Abductor Machine (Glutes, Outer Thighs)
 * - Walking Lunges (Legs, Quads, Glutes, Hamstrings)
 * - Bulgarian Squats (Quads, Glutes)
 *
 * CORE EXERCISES:
 * - Weighted Crunch (Abs)
 * - Cable Crunch (Abs)
 * - Machine Crunch (Abs)
 * - Ab Wheel Rollout (Abs, Core)
 * - Decline Sit-ups (Abs)
 * - Hanging Leg Raise (Abs, Hip Flexors)
 * - Decline Crunches (Abs)
 * - Russian Twist (Core, Obliques)
 * - Pallof Press (Core, Obliques)
 * - Landmine Rotations (Core, Obliques)
 * - Side Plank (Core, Obliques)
 * - Dead Bug (Core)
 * - Bird Dog (Core, Back)
 *
 * COMPOUND EXERCISES:
 * - Deadlift (Back, Glutes, Hamstrings, Legs, Core)
 * - Clean and Press (Full Body)
 * - Snatch (Full Body, Legs, Shoulders)
 * - Front Squat (Quads, Core, Legs)
 * - Back Squat (Legs, Back, Core)
 * - Bench Press (Chest, Triceps, Shoulders)
 * - Incline Bench (Chest, Shoulders, Triceps)
 *
 * ISOLATION EXERCISES NOT YET MAPPED:
 * - Pec Deck / Butterfly Machine (Chest)
 * - Leg Curl Maschine (Hamstrings)
 * - Beinstreckungs-Maschine (Quads)
 * - Bauchmaschine (Abs)
 * - Rudermaschine (Back, Lats)
 * - Langhantel Rudern (Back, Lats)
 *
 * FUNCTIONAL / EXPLOSIVE EXERCISES:
 * - Box Jump (Legs, Glutes)
 * - Burpees (Full Body)
 * - Push-ups (Chest, Triceps, Shoulders, Core)
 * - Pull-ups (Back, Biceps, Lats)
 * - Dips (Chest, Triceps, Shoulders)
 * - Medicine Ball Throws (Full Body, Core)
 */
