"use client";

import { Button } from "@/components/ui/button";
import { Users, User } from "lucide-react";

interface PartnerQuestionProps {
  value: boolean | null;
  onChange: (hasPartner: boolean) => void;
}

export function PartnerQuestion({ value, onChange }: PartnerQuestionProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">
          Wird der andere Elternteil auch Elternzeit nehmen?
        </h2>
        <p className="text-muted-foreground">
          Wenn beide Eltern mindestens 2 Monate Elternzeit nehmen, gibt es 14 statt 12 Monate Elterngeld.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Button
          variant={value === true ? "default" : "outline"}
          className={`h-auto py-6 flex-col gap-3 ${
            value === true ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
          onClick={() => onChange(true)}
        >
          <Users className="h-8 w-8" />
          <span className="font-semibold">Ja, beide Eltern</span>
          <span className="text-xs opacity-70">14 Monate Elterngeld</span>
        </Button>

        <Button
          variant={value === false ? "default" : "outline"}
          className={`h-auto py-6 flex-col gap-3 ${
            value === false ? "ring-2 ring-primary ring-offset-2" : ""
          }`}
          onClick={() => onChange(false)}
        >
          <User className="h-8 w-8" />
          <span className="font-semibold">Nein, nur ich</span>
          <span className="text-xs opacity-70">12 Monate Elterngeld</span>
        </Button>
      </div>

      <div className="text-center space-y-2 text-sm text-muted-foreground">
        <p>
          <strong>Ehe ist nicht nötig!</strong> Die Partnermonate stehen auch unverheirateten Paaren zu.
        </p>
        <p>
          Bei Alleinerziehenden können unter bestimmten Voraussetzungen auch 14 Monate möglich sein.
        </p>
      </div>
    </div>
  );
}
