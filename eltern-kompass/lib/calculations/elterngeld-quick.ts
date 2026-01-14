import {
  ELTERNGELD_MIN,
  ELTERNGELD_MAX,
  REPLACEMENT_RATE_HIGH,
  REPLACEMENT_RATE_MEDIUM,
  REPLACEMENT_RATE_MAX,
  REPLACEMENT_RATE_LOW_THRESHOLD,
  REPLACEMENT_RATE_MEDIUM_THRESHOLD,
  MONTHS_SINGLE_PARENT,
  MONTHS_WITH_PARTNER,
  INCOME_LIMIT_STANDARD,
  INCOME_LIMIT_TRANSITION,
  INCOME_LIMIT_TRANSITION_START,
  INCOME_LIMIT_TRANSITION_END,
  OPTIMIZATION_MIN_DISPLAY,
  OPTIMIZATION_MAX_DISPLAY,
  OPTIMIZATION_TAX_CLASS_HIGH,
  OPTIMIZATION_TAX_CLASS_LOW,
  OPTIMIZATION_TAX_CLASS_HIGH_FACTOR,
  OPTIMIZATION_TAX_CLASS_LOW_FACTOR,
  OPTIMIZATION_PLUS_PARTNER_MAX,
  OPTIMIZATION_PLUS_SINGLE_MAX,
  OPTIMIZATION_PLUS_PARTNER_FACTOR,
  OPTIMIZATION_PLUS_SINGLE_FACTOR,
  OPTIMIZATION_PARTNERSHIP_BONUS_FACTOR,
  OPTIMIZATION_PARTNERSHIP_BONUS_MONTHS,
  OPTIMIZATION_HIGH_INCOME_THRESHOLD,
} from "./constants";
import type { QuickCheckData, QuickCheckResult } from "@/types";

/**
 * Berechnet die Ersatzrate basierend auf dem Netto-Einkommen
 * nach §2 Abs. 2 BEEG
 *
 * BEEG-Formel:
 * - < 1.000€: 67% + ((1.000 - Einkommen) / 2) * 0,1% => max 100%
 * - 1.000€ - 1.200€: KONSTANT 67%
 * - > 1.200€: 67% - ((Einkommen - 1.200) / 2) * 0,1% => min 65%
 */
function calculateReplacementRate(netIncome: number): number {
  if (netIncome < REPLACEMENT_RATE_LOW_THRESHOLD) {
    // Geringverdiener-Bonus (§2 Abs. 2 Satz 1 BEEG)
    // Erhöhung um 0,1% für je 2€ unter 1.000€
    const below1000 = REPLACEMENT_RATE_LOW_THRESHOLD - netIncome;
    const increase = Math.floor(below1000 / 2) * 0.001; // 0,1% = 0.001
    return Math.min(REPLACEMENT_RATE_MAX, REPLACEMENT_RATE_MEDIUM + increase);
  } else if (netIncome <= REPLACEMENT_RATE_MEDIUM_THRESHOLD) {
    // Standard-Ersatzrate (§2 Abs. 1 BEEG)
    // Zwischen 1.000€ und 1.200€: KONSTANT 67%
    return REPLACEMENT_RATE_MEDIUM;
  } else {
    // Besserverdiener-Abschlag (§2 Abs. 2 Satz 2 BEEG)
    // Absenkung um 0,1% für je 2€ über 1.200€
    const above1200 = netIncome - REPLACEMENT_RATE_MEDIUM_THRESHOLD;
    const decrease = Math.floor(above1200 / 2) * 0.001; // 0,1% = 0.001
    return Math.max(REPLACEMENT_RATE_HIGH, REPLACEMENT_RATE_MEDIUM - decrease);
  }
}

/**
 * Berechnet das monatliche Elterngeld (vereinfacht für Quick-Check)
 */
export function calculateMonthlyElterngeld(netIncome: number): number {
  if (netIncome <= 0 || !Number.isFinite(netIncome)) return ELTERNGELD_MIN;

  const replacementRate = calculateReplacementRate(netIncome);
  const elterngeld = netIncome * replacementRate;

  return Math.round(Math.max(ELTERNGELD_MIN, Math.min(elterngeld, ELTERNGELD_MAX)));
}

/**
 * Prüft ob die Einkommensgrenze überschritten wird (§1 Abs. 8 BEEG)
 *
 * @param taxableIncome - Zu versteuerndes Einkommen (zvE)
 * @param partnerTaxableIncome - zvE des Partners (bei Paaren)
 * @param birthDate - Erwartetes/tatsächliches Geburtsdatum
 * @returns Objekt mit Validierungsergebnis und ggf. Warnung
 */
export function validateIncomeLimit(
  taxableIncome: number,
  partnerTaxableIncome: number | null,
  birthDate: Date
): { isValid: boolean; warning?: string; limit: number } {
  // Validate inputs
  if (!Number.isFinite(taxableIncome) || taxableIncome < 0) {
    return { isValid: false, warning: 'Ungültiges Einkommen angegeben.', limit: 0 };
  }
  if (partnerTaxableIncome !== null && (!Number.isFinite(partnerTaxableIncome) || partnerTaxableIncome < 0)) {
    return { isValid: false, warning: 'Ungültiges Partner-Einkommen angegeben.', limit: 0 };
  }
  if (isNaN(birthDate.getTime())) {
    return { isValid: false, warning: 'Ungültiges Geburtsdatum angegeben.', limit: 0 };
  }

  // Bestimme anwendbare Grenze
  const birthDateStr = birthDate.toISOString().split('T')[0];
  const isTransitionPeriod =
    birthDateStr >= INCOME_LIMIT_TRANSITION_START &&
    birthDateStr <= INCOME_LIMIT_TRANSITION_END;

  const limit = isTransitionPeriod ? INCOME_LIMIT_TRANSITION : INCOME_LIMIT_STANDARD;

  // Prüfe Einzelperson
  if (taxableIncome > limit) {
    return {
      isValid: false,
      warning: `Ihr zu versteuerndes Einkommen (${taxableIncome.toLocaleString('de-DE')} €) überschreitet die Grenze von ${limit.toLocaleString('de-DE')} €. Es besteht kein Anspruch auf Elterngeld.`,
      limit,
    };
  }

  // Prüfe Paar (§1 Abs. 8 Nr. 2 BEEG)
  if (partnerTaxableIncome !== null) {
    const combinedIncome = taxableIncome + partnerTaxableIncome;
    if (combinedIncome > limit) {
      return {
        isValid: false,
        warning: `Ihr gemeinsames zu versteuerndes Einkommen (${combinedIncome.toLocaleString('de-DE')} €) überschreitet die Grenze von ${limit.toLocaleString('de-DE')} €. Es besteht kein Anspruch auf Elterngeld.`,
        limit,
      };
    }
  }

  return { isValid: true, limit };
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
  if (hasPartner && netIncome > OPTIMIZATION_HIGH_INCOME_THRESHOLD) {
    // Bei höherem Einkommen mehr Potenzial durch Steuerklasse 3
    potential += Math.min(OPTIMIZATION_TAX_CLASS_HIGH, netIncome * OPTIMIZATION_TAX_CLASS_HIGH_FACTOR);
  } else if (hasPartner) {
    potential += Math.min(OPTIMIZATION_TAX_CLASS_LOW, netIncome * OPTIMIZATION_TAX_CLASS_LOW_FACTOR);
  }

  // ElterngeldPlus vs. Basis Optimierung
  if (hasPartner) {
    potential += Math.min(OPTIMIZATION_PLUS_PARTNER_MAX, monthlyElterngeld * OPTIMIZATION_PLUS_PARTNER_FACTOR);
  } else {
    potential += Math.min(OPTIMIZATION_PLUS_SINGLE_MAX, monthlyElterngeld * OPTIMIZATION_PLUS_SINGLE_FACTOR);
  }

  // Partnerschaftsbonus (4 extra Monate möglich)
  if (hasPartner) {
    potential += monthlyElterngeld * OPTIMIZATION_PARTNERSHIP_BONUS_FACTOR * OPTIMIZATION_PARTNERSHIP_BONUS_MONTHS;
  }

  // Mindestens OPTIMIZATION_MIN_DISPLAY zeigen für "Wow-Effekt", max OPTIMIZATION_MAX_DISPLAY
  return Math.round(Math.max(OPTIMIZATION_MIN_DISPLAY, Math.min(potential, OPTIMIZATION_MAX_DISPLAY)));
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

/**
 * Exportiere Ersatzrate-Funktion für Tests
 */
export { calculateReplacementRate };
