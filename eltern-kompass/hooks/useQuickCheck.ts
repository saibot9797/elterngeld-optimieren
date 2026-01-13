"use client";

import { useState, useCallback, useEffect } from "react";
import type { QuickCheckData, EmploymentType, Bundesland } from "@/types";

const STORAGE_KEY = "eltern-kompass-quick-check";

const initialData: QuickCheckData = {
  dueDate: null,
  employment: null,
  monthlyNetIncome: 0,
  hasPartner: null,
  bundesland: null,
};

export function useQuickCheck() {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<QuickCheckData>(initialData);
  const [isLoaded, setIsLoaded] = useState(false);

  const totalSteps = 5;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          // Convert date string back to Date object
          if (parsed.dueDate) {
            parsed.dueDate = new Date(parsed.dueDate);
          }
          setData(parsed);
        } catch {
          // Ignore parse errors
        }
      }
      setIsLoaded(true);
    }
  }, []);

  // Save to localStorage on data change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoaded]);

  const setDueDate = useCallback((date: Date | null) => {
    setData((prev) => ({ ...prev, dueDate: date }));
  }, []);

  const setEmployment = useCallback((employment: EmploymentType) => {
    setData((prev) => ({ ...prev, employment }));
  }, []);

  const setMonthlyNetIncome = useCallback((income: number) => {
    setData((prev) => ({ ...prev, monthlyNetIncome: income }));
  }, []);

  const setHasPartner = useCallback((hasPartner: boolean) => {
    setData((prev) => ({ ...prev, hasPartner }));
  }, []);

  const setBundesland = useCallback((bundesland: Bundesland) => {
    setData((prev) => ({ ...prev, bundesland }));
  }, []);

  const nextStep = useCallback(() => {
    setCurrentStep((prev) => Math.min(prev + 1, totalSteps - 1));
  }, []);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setData(initialData);
    setCurrentStep(0);
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const isStepValid = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 0:
          return data.dueDate !== null;
        case 1:
          return data.employment !== null;
        case 2:
          return data.monthlyNetIncome >= 0;
        case 3:
          return data.hasPartner !== null;
        case 4:
          return data.bundesland !== null;
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

  const updateData = useCallback((newData: Partial<QuickCheckData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  }, []);

  return {
    currentStep,
    totalSteps,
    progress,
    data,
    isLoaded,
    setDueDate,
    setEmployment,
    setMonthlyNetIncome,
    setHasPartner,
    setBundesland,
    updateData,
    nextStep,
    prevStep,
    reset,
    isCurrentStepValid,
    isComplete,
  };
}
