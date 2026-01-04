import { ArrowUp, ArrowDown } from "@phosphor-icons/react";

interface WeightChangeIndicatorProps {
  suggestedWeight: number;
  currentWeight: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

export function WeightChangeIndicator({
  suggestedWeight,
  currentWeight,
  size = 16,
  showLabel = true,
  className = "",
}: WeightChangeIndicatorProps) {
  if (suggestedWeight === currentWeight) {
    return null;
  }

  const isIncrease = suggestedWeight > currentWeight;

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {isIncrease ? (
        <ArrowUp
          size={size}
          weight="bold"
          className="text-orange-500 shrink-0"
        />
      ) : (
        <ArrowDown
          size={size}
          weight="bold"
          className="text-blue-500 shrink-0"
        />
      )}
      {showLabel && (
        <span className="text-sm text-muted-foreground font-mono">
          {suggestedWeight}kg
        </span>
      )}
    </div>
  );
}
