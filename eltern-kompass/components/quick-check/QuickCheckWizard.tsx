"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useQuickCheck } from "@/hooks/useQuickCheck";
import { DueDateQuestion } from "./questions/DueDateQuestion";
import { EmploymentQuestion } from "./questions/EmploymentQuestion";
import { IncomeQuestion } from "./questions/IncomeQuestion";
import { PartnerQuestion } from "./questions/PartnerQuestion";
import { BundeslandQuestion } from "./questions/BundeslandQuestion";

export function QuickCheckWizard() {
  const router = useRouter();
  const {
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
    nextStep,
    prevStep,
    isCurrentStepValid,
    isComplete,
  } = useQuickCheck();

  const handleNext = () => {
    if (currentStep === totalSteps - 1 && isComplete) {
      router.push("/ergebnis");
    } else {
      nextStep();
    }
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <DueDateQuestion value={data.dueDate} onChange={setDueDate} />;
      case 1:
        return (
          <EmploymentQuestion
            value={data.employment}
            onChange={setEmployment}
          />
        );
      case 2:
        return (
          <IncomeQuestion
            value={data.monthlyNetIncome}
            onChange={setMonthlyNetIncome}
          />
        );
      case 3:
        return (
          <PartnerQuestion value={data.hasPartner} onChange={setHasPartner} />
        );
      case 4:
        return (
          <BundeslandQuestion
            value={data.bundesland}
            onChange={setBundesland}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen gradient-subtle pt-24 pb-8 px-4">
      <div className="max-w-xl mx-auto">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">
              Frage {currentStep + 1} von {totalSteps}
            </span>
            <span className="text-sm font-medium text-primary">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question card */}
        <Card className="mb-6 shadow-lg">
          <CardContent className="pt-8 pb-8">{renderStep()}</CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>

          <Button onClick={handleNext} disabled={!isCurrentStepValid}>
            {currentStep === totalSteps - 1 ? "Ergebnis anzeigen" : "Weiter"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
