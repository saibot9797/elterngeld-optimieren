import {
  MUTTERSCHUTZ_WEEKS_BEFORE,
  MUTTERSCHUTZ_WEEKS_AFTER,
  MUTTERSCHUTZ_WEEKS_AFTER_PREMATURE,
  MUTTERSCHUTZ_WEEKS_AFTER_TWINS,
} from "./constants";
import type { MutterschutzResult } from "@/types";

interface MutterschutzInput {
  dueDate: Date;
  isMultipleBirth?: boolean;
  isPremature?: boolean;
}

/**
 * Berechnet den Mutterschutzzeitraum
 * nach dem Mutterschutzgesetz (MuSchG)
 */
export function calculateMutterschutz(input: MutterschutzInput): MutterschutzResult {
  const { dueDate, isMultipleBirth = false, isPremature = false } = input;

  // Tage berechnen
  const daysBeforeBirth = MUTTERSCHUTZ_WEEKS_BEFORE * 7; // 42 Tage

  let weeksAfter = MUTTERSCHUTZ_WEEKS_AFTER;
  if (isMultipleBirth) {
    weeksAfter = MUTTERSCHUTZ_WEEKS_AFTER_TWINS;
  } else if (isPremature) {
    weeksAfter = MUTTERSCHUTZ_WEEKS_AFTER_PREMATURE;
  }
  const daysAfterBirth = weeksAfter * 7;

  // Startdatum: 6 Wochen vor ET
  const startDate = new Date(dueDate);
  startDate.setDate(startDate.getDate() - daysBeforeBirth);

  // Enddatum: 8/12 Wochen nach ET
  const endDate = new Date(dueDate);
  endDate.setDate(endDate.getDate() + daysAfterBirth);

  return {
    startDate,
    endDate,
    daysBeforeBirth,
    daysAfterBirth,
    totalDays: daysBeforeBirth + daysAfterBirth,
  };
}

/**
 * Formatiert ein Datum im deutschen Format
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

/**
 * Formatiert ein Datum mit Wochentag
 */
export function formatDateLong(date: Date): string {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
