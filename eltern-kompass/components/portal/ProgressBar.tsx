"use client";

import { Check } from "lucide-react";

interface ProgressBarProps {
  currentStep: number;
  totalSteps: number;
  stepLabels: string[];
}

export function ProgressBar({
  currentStep,
  totalSteps,
  stepLabels,
}: ProgressBarProps) {
  return (
    <div className="w-full">
      {/* Mobile Progress */}
      <div className="lg:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">
            Schritt {currentStep + 1} von {totalSteps}
          </span>
          <span className="text-sm text-muted-foreground">
            {stepLabels[currentStep]}
          </span>
        </div>
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full gradient-primary transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Desktop Steps */}
      <div className="hidden lg:flex items-center justify-between mb-8">
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium transition-all ${
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isCurrent
                      ? "gradient-primary text-white ring-4 ring-primary/20"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isCurrent
                      ? "text-primary"
                      : isCompleted
                      ? "text-green-600"
                      : "text-gray-500"
                  }`}
                >
                  {label}
                </span>
              </div>

              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div className="flex-1 mx-4 h-1 rounded-full overflow-hidden bg-gray-200">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isCompleted ? "bg-green-500 w-full" : "w-0"
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
