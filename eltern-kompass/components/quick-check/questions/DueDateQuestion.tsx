"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DueDateQuestionProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export function DueDateQuestion({ value, onChange }: DueDateQuestionProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const dateValue = e.target.value;
    if (dateValue) {
      onChange(new Date(dateValue));
    } else {
      onChange(null);
    }
  };

  const formattedValue = value
    ? value.toISOString().split("T")[0]
    : "";

  // Calculate min date (today) and max date (1 year from now)
  const today = new Date();
  const minDate = today.toISOString().split("T")[0];
  const maxDate = new Date(today.setFullYear(today.getFullYear() + 1))
    .toISOString()
    .split("T")[0];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          Wann ist dein errechneter Geburtstermin?
        </h2>
        <p className="text-muted-foreground">
          Der ET steht im Mutterpass oder auf dem Ultraschallbild.
        </p>
      </div>

      <div className="max-w-xs mx-auto">
        <Label htmlFor="dueDate" className="sr-only">
          Errechneter Geburtstermin
        </Label>
        <Input
          id="dueDate"
          type="date"
          value={formattedValue}
          onChange={handleChange}
          min={minDate}
          max={maxDate}
          className="text-center text-lg h-14"
        />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Der Termin hilft uns, Fristen wie Mutterschutz und Steuerklassenwechsel
        zu berechnen.
      </p>
    </div>
  );
}
