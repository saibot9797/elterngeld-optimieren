"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MapPin, User, UserPlus, X } from "lucide-react";
import { BUNDESLAENDER, BUNDESLAND_NAMES, type Bundesland } from "@/types";
import type { OnboardingData, ParentData, ParentRole } from "@/hooks/useOnboarding";

interface Step1Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
  updateMutter: (data: Partial<ParentData>) => void;
  updatePartner: (data: Partial<ParentData>) => void;
  addPartner: () => void;
  removePartner: () => void;
}

export function Step1Basisdaten({
  data,
  updateData,
  updateMutter,
  updatePartner,
  addPartner,
  removePartner,
}: Step1Props) {
  const formatDateForInput = (date: Date | null) => {
    if (!date) return "";
    return date.toISOString().split("T")[0];
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Basisdaten</h2>
        <p className="text-muted-foreground">
          Beginnen wir mit den grundlegenden Informationen
        </p>
      </div>

      {/* Geburt & Ort */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Geburt & Wohnort
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="et">Errechneter Termin (ET)</Label>
              <Input
                id="et"
                type="date"
                value={formatDateForInput(data.errechneterTermin)}
                onChange={(e) =>
                  updateData({
                    errechneterTermin: e.target.value
                      ? new Date(e.target.value)
                      : null,
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bundesland">Bundesland</Label>
              <Select
                value={data.bundesland || undefined}
                onValueChange={(value) =>
                  updateData({ bundesland: value as Bundesland })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Bundesland wählen" />
                </SelectTrigger>
                <SelectContent>
                  {BUNDESLAENDER.map((bl) => (
                    <SelectItem key={bl} value={bl}>
                      {BUNDESLAND_NAMES[bl]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mutter-Daten */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Deine Daten
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="mutterVorname">Vorname</Label>
              <Input
                id="mutterVorname"
                placeholder="Dein Vorname"
                value={data.mutter.vorname}
                onChange={(e) => updateMutter({ vorname: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mutterNachname">Nachname</Label>
              <Input
                id="mutterNachname"
                placeholder="Dein Nachname"
                value={data.mutter.nachname}
                onChange={(e) => updateMutter({ nachname: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Partner */}
      {!data.hatPartner ? (
        <Button
          variant="outline"
          className="w-full py-6 border-dashed"
          onClick={addPartner}
        >
          <UserPlus className="mr-2 h-5 w-5" />
          Partner hinzufügen
        </Button>
      ) : (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Partner-Daten
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={removePartner}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="partnerVorname">Vorname</Label>
                <Input
                  id="partnerVorname"
                  placeholder="Vorname des Partners"
                  value={data.partner?.vorname || ""}
                  onChange={(e) => updatePartner({ vorname: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="partnerNachname">Nachname</Label>
                <Input
                  id="partnerNachname"
                  placeholder="Nachname des Partners"
                  value={data.partner?.nachname || ""}
                  onChange={(e) => updatePartner({ nachname: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="partnerRolle">Beziehung zum Kind</Label>
              <Select
                value={data.partner?.rolle || "vater"}
                onValueChange={(value) =>
                  updatePartner({ rolle: value as ParentRole })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vater">Vater</SelectItem>
                  <SelectItem value="mutter">Mutter</SelectItem>
                  <SelectItem value="adoptiv">Adoptivelternteil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
