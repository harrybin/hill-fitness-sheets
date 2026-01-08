/**
 * React hook and component utilities for rendering body part icons
 * Supports both Tabler Icons (recommended) and Phosphor Icons fallback
 */

import React from "react";
import { Muscle2, Leg2, Dumbbell } from "@phosphor-icons/react";
import { mapExerciseToBodyPart, getBodyPartIcon } from "./bodyPartIcons";

export interface BodyPartIconProps {
  exerciseName?: string;
  bodyPart?: string;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Renders a Phosphor icon for a body part
 * Falls back to Dumbbell if icon cannot be matched
 */
export const BodyPartIconComponent: React.FC<BodyPartIconProps> = ({
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

  if (!targetBodyPart) {
    // Fallback icon
    return (
      <Dumbbell
        size={size}
        className={className}
        title={title || "Exercise"}
        weight="duotone"
      />
    );
  }

  const iconDetails = getBodyPartIcon(targetBodyPart);

  // Map body part names to Phosphor icons
  // These are actual Phosphor icons that match the body parts well
  const iconMap: Record<string, React.ReactNode> = {
    legs: <Leg2 size={size} className={className} weight="duotone" />,
    quads: <Leg2 size={size} className={className} weight="duotone" />,
    hamstrings: <Leg2 size={size} className={className} weight="duotone" />,
    calves: <Leg2 size={size} className={className} weight="duotone" />,
    glutes: <Leg2 size={size} className={className} weight="duotone" />,
    chest: <Muscle2 size={size} className={className} weight="duotone" />,
    back: <Muscle2 size={size} className={className} weight="duotone" />,
    lats: <Muscle2 size={size} className={className} weight="duotone" />,
    shoulders: <Muscle2 size={size} className={className} weight="duotone" />,
    trapezius: <Muscle2 size={size} className={className} weight="duotone" />,
    arms: <Muscle2 size={size} className={className} weight="duotone" />,
    biceps: <Muscle2 size={size} className={className} weight="duotone" />,
    triceps: <Muscle2 size={size} className={className} weight="duotone" />,
    forearms: <Muscle2 size={size} className={className} weight="duotone" />,
    abs: <Muscle2 size={size} className={className} weight="duotone" />,
    core: <Muscle2 size={size} className={className} weight="duotone" />,
  };

  const icon = iconMap[targetBodyPart];
  const title_text = title || iconDetails?.description;

  return (
    <span title={title_text} className={className}>
      {icon || <Dumbbell size={size} weight="duotone" />}
    </span>
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
