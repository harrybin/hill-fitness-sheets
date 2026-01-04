import { Button } from "@/components/ui/button";
import { Plus, Minus } from "@phosphor-icons/react";

interface SetInputProps {
  setNumber: number;
  reps: number;
  onRepsChange: (newReps: number) => void;
}

export function SetInput({ setNumber, reps, onRepsChange }: SetInputProps) {
  const adjustReps = (delta: number) => {
    onRepsChange(Math.max(0, reps + delta));
  };

  return (
    <div>
      <label className="text-sm font-semibold text-muted-foreground mb-2 block uppercase tracking-wide">
        Satz {setNumber}
      </label>
      <div className="flex items-center justify-center gap-1">
        <Button
          size="lg"
          variant="outline"
          onClick={() => adjustReps(-1)}
          className="h-12 w-12 rounded-full p-0"
        >
          <Minus size={20} weight="bold" />
        </Button>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => onRepsChange(Math.max(0, reps - 2))}
          className="h-11 w-11 p-0 text-3xl font-bold text-primary"
        >
          {Math.max(0, reps - 2)}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onRepsChange(Math.max(0, reps - 1))}
          className="h-11 w-11 p-0 text-3xl font-bold text-primary"
        >
          {Math.max(0, reps - 1)}
        </Button>

        <div className="flex-1 max-w-[120px]">
          <div className="text-center font-mono font-bold text-4xl text-primary">
            {reps}
          </div>
          <div className="text-center text-xs text-muted-foreground mt-0.5">
            Wdh.
          </div>
        </div>

        <Button
          size="sm"
          variant="secondary"
          onClick={() => onRepsChange(reps + 1)}
          className="h-11 w-11 p-0 text-3xl font-bold text-primary"
        >
          {reps + 1}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => onRepsChange(reps + 2)}
          className="h-11 w-11 p-0 text-3xl font-bold text-primary"
        >
          {reps + 2}
        </Button>

        <Button
          size="lg"
          variant="outline"
          onClick={() => adjustReps(1)}
          className="h-12 w-12 rounded-full p-0"
        >
          <Plus size={20} weight="bold" />
        </Button>
      </div>
    </div>
  );
}
