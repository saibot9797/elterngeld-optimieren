"use client";

import { useState, useCallback, useEffect } from "react";
import type { Bundesland, EmploymentType } from "@/types";

export type ParentRole = "mutter" | "vater" | "adoptiv";

export interface ParentData {
  vorname: string;
  nachname: string;
  rolle: ParentRole;
  beschaeftigungsart: EmploymentType | null;
  monatlichesNetto: number;
  steuerklasse: 1 | 2 | 3 | 4 | 5 | 6 | null;
  kirchensteuerpflichtig: boolean | null;
}

export interface ElternzeitPlan {
  monateMutter: number;
  monatePartner: number;
  teilzeitMutter: boolean;
  teilzeitStundenMutter: number;
  teilzeitPartner: boolean;
  teilzeitStundenPartner: number;
  partnerschaftsbonus: boolean;
}

export interface OnboardingData {
  // Step 1: Basisdaten
  bundesland: Bundesland | null;
  errechneterTermin: Date | null;
  mutter: ParentData;
  partner: ParentData | null;
  hatPartner: boolean;

  // Step 3: Dokumente (IDs der hochgeladenen Dokumente)
  dokumenteIds: string[];

  // Step 4: Elternzeit-Plan
  elternzeitPlan: ElternzeitPlan;
}

const STORAGE_KEY = "eltern-kompass-onboarding";

const initialParentData: ParentData = {
  vorname: "",
  nachname: "",
  rolle: "mutter",
  beschaeftigungsart: null,
  monatlichesNetto: 0,
  steuerklasse: null,
  kirchensteuerpflichtig: null,
};

const initialElternzeitPlan: ElternzeitPlan = {
  monateMutter: 12,
  monatePartner: 2,
  teilzeitMutter: false,
  teilzeitStundenMutter: 0,
  teilzeitPartner: false,
  teilzeitStundenPartner: 0,
  partnerschaftsbonus: false,
};

const initialOnboardingData: OnboardingData = {
  bundesland: null,
  errechneterTermin: null,
  mutter: { ...initialParentData, rolle: "mutter" },
  partner: null,
  hatPartner: false,
  dokumenteIds: [],
  elternzeitPlan: initialElternzeitPlan,
};

export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(initialOnboardingData);
  const [isLoaded, setIsLoaded] = useState(false);

  const totalSteps = 4;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Lade Quick-Check Daten und gespeicherte Onboarding-Daten
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Versuche gespeicherte Onboarding-Daten zu laden
      const storedOnboarding = localStorage.getItem(STORAGE_KEY);
      if (storedOnboarding) {
        try {
          const parsed = JSON.parse(storedOnboarding);
          if (parsed.errechneterTermin) {
            parsed.errechneterTermin = new Date(parsed.errechneterTermin);
          }
          setData(parsed);
        } catch {
          // Ignore parse errors
        }
      }

      // Übernehme Quick-Check Daten falls vorhanden
      const quickCheckData = localStorage.getItem("eltern-kompass-quick-check");
      if (quickCheckData) {
        try {
          const quickCheck = JSON.parse(quickCheckData);
          setData((prev) => ({
            ...prev,
            bundesland: prev.bundesland || quickCheck.bundesland,
            errechneterTermin:
              prev.errechneterTermin ||
              (quickCheck.dueDate ? new Date(quickCheck.dueDate) : null),
            hatPartner: prev.hatPartner || quickCheck.hasPartner || false,
            mutter: {
              ...prev.mutter,
              monatlichesNetto:
                prev.mutter.monatlichesNetto || quickCheck.monthlyNetIncome || 0,
              beschaeftigungsart:
                prev.mutter.beschaeftigungsart || quickCheck.employment,
            },
          }));
        } catch {
          // Ignore parse errors
        }
      }

      setIsLoaded(true);
    }
  }, []);

  // Speichere Onboarding-Daten
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const updateData = useCallback((newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  const updateMutter = useCallback((newData: Partial<ParentData>) => {
    setData((prev) => ({
      ...prev,
      mutter: { ...prev.mutter, ...newData },
    }));
  }, []);

  const updatePartner = useCallback((newData: Partial<ParentData>) => {
    setData((prev) => ({
      ...prev,
      partner: prev.partner
        ? { ...prev.partner, ...newData }
        : { ...initialParentData, rolle: "vater", ...newData },
    }));
  }, []);

  const updateElternzeitPlan = useCallback((newData: Partial<ElternzeitPlan>) => {
    setData((prev) => ({
      ...prev,
      elternzeitPlan: { ...prev.elternzeitPlan, ...newData },
    }));
  }, []);

  const addPartner = useCallback(() => {
    setData((prev) => ({
      ...prev,
      hatPartner: true,
      partner: { ...initialParentData, rolle: "vater" },
    }));
  }, []);

  const removePartner = useCallback(() => {
    setData((prev) => ({
      ...prev,
      hatPartner: false,
      partner: null,
    }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const goToStep = useCallback((step: number) => {
    setCurrentStep(Math.max(0, Math.min(step, totalSteps - 1)));
  }, []);

  const isStepValid = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0: // Basisdaten
          return (
            data.bundesland !== null &&
            data.errechneterTermin !== null &&
            data.mutter.vorname.length > 0 &&
            data.mutter.nachname.length > 0
          );
        case 1: // Einkommen
          const mutterValid =
            data.mutter.beschaeftigungsart !== null &&
            data.mutter.steuerklasse !== null;
          if (!data.hatPartner) return mutterValid;
          return (
            mutterValid &&
            data.partner !== null &&
            data.partner.beschaeftigungsart !== null &&
            data.partner.steuerklasse !== null
          );
        case 2: // Dokumente (optional)
          return true;
        case 3: // Elternzeit-Plan
          return (
            data.elternzeitPlan.monateMutter >= 0 &&
            data.elternzeitPlan.monatePartner >= 0
          );
        default:
          return false;
      }
    },
    [data]
  );

  const isCurrentStepValid = isStepValid(currentStep);
  const isComplete = Array.from({ length: totalSteps }, (_, i) => i).every(
    isStepValid
  );

  const reset = useCallback(() => {
    setData(initialOnboardingData);
    setCurrentStep(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  return {
    currentStep,
    totalSteps,
    progress,
    data,
    isLoaded,
    updateData,
    updateMutter,
    updatePartner,
    updateElternzeitPlan,
    addPartner,
    removePartner,
    nextStep,
    prevStep,
    goToStep,
    isStepValid,
    isCurrentStepValid,
    isComplete,
    reset,
  };
}
