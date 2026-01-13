"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { ProgressBar } from "@/components/portal/ProgressBar";
import { Step1Basisdaten } from "@/components/portal/steps/Step1Basisdaten";
import { Step2Einkommen } from "@/components/portal/steps/Step2Einkommen";
import { Step3Dokumente } from "@/components/portal/steps/Step3Dokumente";
import { Step4ElternzeitPlan } from "@/components/portal/steps/Step4ElternzeitPlan";

const STEP_LABELS = ["Basisdaten", "Einkommen", "Dokumente", "Elternzeit"];

export default function OnboardingPage() {
  const router = useRouter();
  const {
    currentStep,
    totalSteps,
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
    isCurrentStepValid,
    isComplete,
  } = useOnboarding();

  const handleNext = () => {
    if (currentStep === totalSteps - 1) {
      // Onboarding abgeschlossen - zur Ergebnis-Seite
      router.push("/portal/ergebnis");
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
        return (
          <Step1Basisdaten
            data={data}
            updateData={updateData}
            updateMutter={updateMutter}
            updatePartner={updatePartner}
            addPartner={addPartner}
            removePartner={removePartner}
          />
        );
      case 1:
        return (
          <Step2Einkommen
            data={data}
            updateMutter={updateMutter}
            updatePartner={updatePartner}
          />
        );
      case 2:
        return <Step3Dokumente data={data} updateData={updateData} />;
      case 3:
        return (
          <Step4ElternzeitPlan
            data={data}
            updateElternzeitPlan={updateElternzeitPlan}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-6 lg:py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Progress Bar */}
        <ProgressBar
          currentStep={currentStep}
          totalSteps={totalSteps}
          stepLabels={STEP_LABELS}
        />

        {/* Step Content */}
        <div className="mb-8">{renderStep()}</div>

        {/* Navigation */}
        <div className="flex justify-between gap-4 sticky bottom-4 lg:static bg-white lg:bg-transparent p-4 lg:p-0 rounded-xl shadow-lg lg:shadow-none border lg:border-0">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 0}
            className="flex-1 lg:flex-none"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück
          </Button>

          <Button
            onClick={handleNext}
            disabled={!isCurrentStepValid && currentStep !== 2} // Step 3 (Dokumente) ist optional
            className="flex-1 lg:flex-none"
          >
            {currentStep === totalSteps - 1 ? (
              <>
                Berechnung starten
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            ) : (
              <>
                Weiter
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
