"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Briefcase, Euro, User } from "lucide-react";
import { EMPLOYMENT_TYPES, type EmploymentType } from "@/types";
import type { OnboardingData, ParentData } from "@/hooks/useOnboarding";

interface Step2Props {
  data: OnboardingData;
  updateMutter: (data: Partial<ParentData>) => void;
  updatePartner: (data: Partial<ParentData>) => void;
}

const STEUERKLASSEN = [1, 2, 3, 4, 5, 6] as const;

function ParentIncomeForm({
  title,
  icon,
  parent,
  onUpdate,
}: {
  title: string;
  icon: React.ReactNode;
  parent: ParentData;
  onUpdate: (data: Partial<ParentData>) => void;
}) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Beschäftigungsart */}
        <div className="space-y-3">
          <Label>Beschäftigungsart</Label>
          <RadioGroup
            value={parent.beschaeftigungsart || undefined}
            onValueChange={(value) =>
              onUpdate({ beschaeftigungsart: value as EmploymentType })
            }
            className="grid grid-cols-2 gap-3"
          >
            {EMPLOYMENT_TYPES.map((type) => (
              <div key={type.value}>
                <RadioGroupItem
                  value={type.value}
                  id={`${title}-${type.value}`}
                  className="peer sr-only"
                />
                <Label
                  htmlFor={`${title}-${type.value}`}
                  className="flex items-center justify-center rounded-lg border-2 border-muted bg-popover p-3 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all text-sm"
                >
                  {type.label}
                </Label>
              </div>
            ))}
          </RadioGroup>
        </div>

        {/* Einkommen & Steuerklasse */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`${title}-netto`}>Monatliches Netto (ca.)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id={`${title}-netto`}
                type="number"
                placeholder="2.500"
                className="pl-9"
                value={parent.monatlichesNetto || ""}
                onChange={(e) =>
                  onUpdate({ monatlichesNetto: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${title}-steuerklasse`}>Steuerklasse</Label>
            <Select
              value={parent.steuerklasse?.toString() || undefined}
              onValueChange={(value) =>
                onUpdate({
                  steuerklasse: Number(value) as 1 | 2 | 3 | 4 | 5 | 6,
                })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Wählen" />
              </SelectTrigger>
              <SelectContent>
                {STEUERKLASSEN.map((sk) => (
                  <SelectItem key={sk} value={sk.toString()}>
                    Steuerklasse {sk}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kirchensteuer */}
        <div className="space-y-3">
          <Label>Kirchensteuerpflichtig?</Label>
          <RadioGroup
            value={
              parent.kirchensteuerpflichtig === null
                ? undefined
                : parent.kirchensteuerpflichtig
                ? "ja"
                : "nein"
            }
            onValueChange={(value) =>
              onUpdate({ kirchensteuerpflichtig: value === "ja" })
            }
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ja" id={`${title}-kirche-ja`} />
              <Label htmlFor={`${title}-kirche-ja`}>Ja</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="nein" id={`${title}-kirche-nein`} />
              <Label htmlFor={`${title}-kirche-nein`}>Nein</Label>
            </div>
          </RadioGroup>
        </div>
      </CardContent>
    </Card>
  );
}

export function Step2Einkommen({
  data,
  updateMutter,
  updatePartner,
}: Step2Props) {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Einkommen</h2>
        <p className="text-muted-foreground">
          Diese Daten benötigen wir für die Elterngeld-Berechnung
        </p>
      </div>

      {/* Mutter */}
      <ParentIncomeForm
        title={data.mutter.vorname || "Deine Angaben"}
        icon={<User className="h-5 w-5 text-primary" />}
        parent={data.mutter}
        onUpdate={updateMutter}
      />

      {/* Partner */}
      {data.hatPartner && data.partner && (
        <ParentIncomeForm
          title={data.partner.vorname || "Partner"}
          icon={<Briefcase className="h-5 w-5 text-primary" />}
          parent={data.partner}
          onUpdate={updatePartner}
        />
      )}

      {/* Tipp */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-800">
          <strong>Tipp:</strong> Für eine genauere Berechnung kannst du im
          nächsten Schritt deine Lohnabrechnungen hochladen. Unsere KI liest die
          relevanten Daten automatisch aus.
        </p>
      </div>
    </div>
  );
}
