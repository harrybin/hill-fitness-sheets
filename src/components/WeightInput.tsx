import { Button } from "@/components/ui/button";

interface WeightInputProps {
  value: number;
  onChange: (value: number) => void;
  size?: "large" | "small";
}

export function WeightInput({
  value,
  onChange,
  size = "large",
}: WeightInputProps) {
  const adjustWeight = (delta: number) => {
    onChange(Math.max(0, value + delta));
  };

  const textSize = size === "large" ? "text-5xl" : "text-3xl";

  return (
    <div className="flex items-center justify-center gap-2">
      <Button
        size="sm"
        variant="outline"
        onClick={() => adjustWeight(-5)}
        className="h-11 w-11 p-0 text-xs"
      >
        -5
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => adjustWeight(-1)}
        className="h-11 w-11 p-0 text-xs"
      >
        -1
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => adjustWeight(-0.5)}
        className="h-11 w-11 p-0 text-xs"
      >
        -0.5
      </Button>

      <div className="flex-1 max-w-[140px]">
        <div
          className={`text-center font-mono font-bold ${textSize} text-primary`}
        >
          {value}
        </div>
        <div className="text-center text-xs text-muted-foreground mt-0.5">
          kg
        </div>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={() => adjustWeight(0.5)}
        className="h-11 w-11 p-0 text-xs"
      >
        +0.5
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => adjustWeight(1)}
        className="h-11 w-11 p-0 text-xs"
      >
        +1
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={() => adjustWeight(5)}
        className="h-11 w-11 p-0 text-xs"
      >
        +5
      </Button>
    </div>
  );
}
