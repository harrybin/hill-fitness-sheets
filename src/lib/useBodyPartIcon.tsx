/**
 * React hook and component utilities for rendering body part silhouettes
 * Highlights target muscles using react-body-highlighter
 */

import type { FC } from "react";
import BodyHighlighter from "react-body-highlighter";
import {
  mapExerciseToBodyPart,
  getBodyPartIcon,
  type BodyPart,
} from "./bodyPartIcons";

type BodyHighlighterData = {
  name: string;
  muscles: string[];
  frequency?: number;
};

export interface BodyPartIconProps {
  exerciseName?: string;
  bodyPart?: string;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Renders a minimal body silhouette with the target muscle highlighted
 */
export const BodyPartIconComponent: FC<BodyPartIconProps> = ({
  exerciseName,
  bodyPart,
  size = 24,
  className = "",
  title,
}) => {
  // Determine which body part to use
  const targetBodyPart =
    bodyPart ||
    (exerciseName ? mapExerciseToBodyPart(exerciseName) : undefined);

  const iconDetails = targetBodyPart ? getBodyPartIcon(targetBodyPart) : null;

  const muscleMap: Partial<Record<BodyPart, BodyHighlighterData>> = {
    legs: {
      name: "legs",
      muscles: ["quadriceps", "hamstring", "calves", "adductor"],
    },
    quads: { name: "quads", muscles: ["quadriceps"] },
    hamstrings: { name: "hamstrings", muscles: ["hamstring"] },
    calves: { name: "calves", muscles: ["calves"] },
    glutes: { name: "glutes", muscles: ["gluteal"] },
    chest: { name: "chest", muscles: ["chest"] },
    back: {
      name: "back",
      muscles: ["upper-back", "lower-back", "trapezius", "back-deltoids"],
    },
    lats: { name: "lats", muscles: ["upper-back"] },
    shoulders: {
      name: "shoulders",
      muscles: ["front-deltoids", "back-deltoids"],
    },
    trapezius: { name: "trapezius", muscles: ["trapezius"] },
    arms: { name: "arms", muscles: ["biceps", "triceps", "forearm"] },
    biceps: { name: "biceps", muscles: ["biceps"] },
    triceps: { name: "triceps", muscles: ["triceps"] },
    forearms: { name: "forearms", muscles: ["forearm"] },
    abs: { name: "abs", muscles: ["abs"] },
    core: { name: "core", muscles: ["abs", "obliques"] },
  };

  const highlight = targetBodyPart ? muscleMap[targetBodyPart] : undefined;
  const title_text = title || iconDetails?.description || "Exercise";

  const isPosterior = targetBodyPart
    ? ["back", "lats", "trapezius", "hamstrings", "glutes", "calves"].includes(
        targetBodyPart
      )
    : false;

  const data: BodyHighlighterData[] | null = highlight ? [highlight] : null;

  return (
    <div
      className={className}
      title={title_text}
      style={{ width: size, height: size }}
    >
      <BodyHighlighter
        data={data}
        type={isPosterior ? "posterior" : "anterior"}
        bodyColor="oklch(0.50 0 0)"
        highlightedColors={["#f97316"]}
        hoverColor="#f97316"
        style={{ width: "100%", height: "100%" }}
      />
    </div>
  );
};

/**
 * Hook to get body part icon name and details
 */
export function useBodyPartIcon(exerciseName: string) {
  const bodyPart = mapExerciseToBodyPart(exerciseName);
  const iconDetails = bodyPart ? getBodyPartIcon(bodyPart) : undefined;

  return {
    bodyPart,
    icon: iconDetails?.icon,
    description: iconDetails?.description,
    component: (
      <BodyPartIconComponent
        exerciseName={exerciseName}
        title={iconDetails?.description}
      />
    ),
  };
}

/**
 * Get CSS class or color for a body part category
 * Useful for visual grouping in UI
 */
export function getBodyPartColor(bodyPart: string | undefined): string {
  if (!bodyPart) return "text-gray-500";

  // Group body parts by color
  const colorMap: Record<string, string> = {
    // Legs - blue
    legs: "text-blue-600",
    quads: "text-blue-600",
    hamstrings: "text-blue-600",
    calves: "text-blue-600",
    glutes: "text-blue-600",
    // Upper Body - orange
    chest: "text-orange-600",
    back: "text-orange-600",
    lats: "text-orange-600",
    shoulders: "text-orange-600",
    trapezius: "text-orange-600",
    // Arms - red
    arms: "text-red-600",
    biceps: "text-red-600",
    triceps: "text-red-600",
    forearms: "text-red-600",
    // Core - yellow
    abs: "text-yellow-600",
    core: "text-yellow-600",
  };

  return colorMap[bodyPart] || "text-gray-500";
}
