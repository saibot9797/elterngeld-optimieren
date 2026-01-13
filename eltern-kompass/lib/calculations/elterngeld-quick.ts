import {
  ELTERNGELD_MIN,
  ELTERNGELD_MAX,
  REPLACEMENT_RATE_HIGH,
  REPLACEMENT_RATE_MEDIUM,
  REPLACEMENT_RATE_LOW_THRESHOLD,
  REPLACEMENT_RATE_MEDIUM_THRESHOLD,
  MONTHS_SINGLE_PARENT,
  MONTHS_WITH_PARTNER,
} from "./constants";
import type { QuickCheckData, QuickCheckResult } from "@/types";

/**
 * Berechnet die Ersatzrate basierend auf dem Netto-Einkommen
 * nach §2 Abs. 2 BEEG
 */
function calculateReplacementRate(netIncome: number): number {
  if (netIncome < REPLACEMENT_RATE_LOW_THRESHOLD) {
    // Geringverdiener: gestaffelte Erhöhung bis 100%
    const below1000 = REPLACEMENT_RATE_LOW_THRESHOLD - netIncome;
    const increase = Math.floor(below1000 / 2) * 0.001;
    return Math.min(1.0, REPLACEMENT_RATE_MEDIUM + increase);
  } else if (netIncome <= REPLACEMENT_RATE_MEDIUM_THRESHOLD) {
    // Zwischen 1000€ und 1240€: gestaffelt 65%-67%
    const below1240 = REPLACEMENT_RATE_MEDIUM_THRESHOLD - netIncome;
    const increase = Math.floor(below1240 / 2) * 0.001;
    return Math.min(REPLACEMENT_RATE_MEDIUM, REPLACEMENT_RATE_HIGH + increase);
  } else {
    // Über 1240€: Absenkung bis min. 65%
    const above1240 = netIncome - REPLACEMENT_RATE_MEDIUM_THRESHOLD;
    const decrease = Math.floor(above1240 / 2) * 0.001;
    return Math.max(REPLACEMENT_RATE_HIGH, REPLACEMENT_RATE_MEDIUM - decrease);
  }
}

/**
 * Berechnet das monatliche Elterngeld (vereinfacht für Quick-Check)
 */
export function calculateMonthlyElterngeld(netIncome: number): number {
  if (netIncome <= 0) return ELTERNGELD_MIN;

  const replacementRate = calculateReplacementRate(netIncome);
  const elterngeld = netIncome * replacementRate;

  return Math.round(Math.max(ELTERNGELD_MIN, Math.min(elterngeld, ELTERNGELD_MAX)));
}

/**
 * Schätzt das Optimierungspotenzial - CATCHY VERSION für Lead-Generierung
 *
 * Basiert auf realistischen Optimierungen:
 * - Steuerklassenwechsel: 500-3.000€
 * - Optimale Aufteilung Basis/Plus: 500-2.000€
 * - Partnerschaftsbonus: 300-1.500€
 * - Weitere Optimierungen: 200-1.000€
 */
function estimateOptimizationPotential(
  monthlyElterngeld: number,
  hasPartner: boolean,
  netIncome: number
): number {
  // Basis: Je höher das Einkommen, desto mehr Optimierungspotenzial
  let potential = 0;

  // Steuerklassenwechsel-Potenzial (nur bei Paaren sinnvoll)
  if (hasPartner && netIncome > 2000) {
    // Bei höherem Einkommen mehr Potenzial durch Steuerklasse 3
    potential += Math.min(2500, netIncome * 0.8);
  } else if (hasPartner) {
    potential += Math.min(1200, netIncome * 0.5);
  }

  // ElterngeldPlus vs. Basis Optimierung
  if (hasPartner) {
    potential += Math.min(1500, monthlyElterngeld * 2);
  } else {
    potential += Math.min(800, monthlyElterngeld * 1.5);
  }

  // Partnerschaftsbonus (4 extra Monate möglich)
  if (hasPartner) {
    potential += monthlyElterngeld * 0.5 * 2; // ~2 Monate extra geschätzt
  }

  // Mindestens 800€ zeigen für "Wow-Effekt", max 4.500€
  return Math.round(Math.max(800, Math.min(potential, 4500)));
}

/**
 * Führt die vollständige Quick-Check Berechnung durch
 */
export function calculateQuickCheck(data: QuickCheckData): QuickCheckResult {
  const monthlyElterngeld = calculateMonthlyElterngeld(data.monthlyNetIncome);
  const months = data.hasPartner ? MONTHS_WITH_PARTNER : MONTHS_SINGLE_PARENT;
  const totalElterngeld = monthlyElterngeld * months;
  const optimizationPotential = estimateOptimizationPotential(
    monthlyElterngeld,
    data.hasPartner ?? false,
    data.monthlyNetIncome
  );

  return {
    monthlyElterngeld,
    totalElterngeld,
    months,
    optimizationPotential,
  };
}

/**
 * Formatiert einen Geldbetrag in Euro
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}
