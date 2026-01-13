"use client";

import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import type { EmploymentType } from "@/types";

interface EmploymentQuestionProps {
  value: EmploymentType | null;
  onChange: (employment: EmploymentType) => void;
}

const employmentOptions: { value: EmploymentType; label: string; description: string }[] = [
  {
    value: "angestellt",
    label: "Angestellt",
    description: "Festanstellung, auch Teilzeit oder befristet",
  },
  {
    value: "selbststaendig",
    label: "Selbstständig",
    description: "Freiberuflich oder gewerblich tätig",
  },
  {
    value: "beamtet",
    label: "Beamtet",
    description: "Verbeamtet im öffentlichen Dienst",
  },
  {
    value: "nicht_erwerbstaetig",
    label: "Nicht erwerbstätig",
    description: "Studierend, arbeitssuchend oder Hausfrau/-mann",
  },
];

export function EmploymentQuestion({ value, onChange }: EmploymentQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          Wie bist du derzeit beschäftigt?
        </h2>
        <p className="text-muted-foreground">
          Das beeinflusst die Berechnung des Bemessungszeitraums.
        </p>
      </div>

      <RadioGroup
        value={value ?? undefined}
        onValueChange={(v) => onChange(v as EmploymentType)}
        className="grid gap-3"
      >
        {employmentOptions.map((option) => (
          <Label
            key={option.value}
            htmlFor={option.value}
            className="flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all hover:border-primary/50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
          >
            <RadioGroupItem
              value={option.value}
              id={option.value}
              className="mt-0.5"
            />
            <div className="flex-1">
              <span className="font-semibold block">{option.label}</span>
              <span className="text-sm text-muted-foreground">
                {option.description}
              </span>
            </div>
          </Label>
        ))}
      </RadioGroup>
    </div>
  );
}
