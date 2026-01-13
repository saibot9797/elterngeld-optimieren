export type EmploymentType =
  | "angestellt"
  | "selbststaendig"
  | "beamtet"
  | "nicht_erwerbstaetig";

export const EMPLOYMENT_TYPES: { value: EmploymentType; label: string }[] = [
  { value: "angestellt", label: "Angestellt" },
  { value: "selbststaendig", label: "Selbstständig" },
  { value: "beamtet", label: "Beamtet" },
  { value: "nicht_erwerbstaetig", label: "Nicht erwerbstätig" },
];

export type Bundesland =
  | "BW" | "BY" | "BE" | "BB" | "HB" | "HH"
  | "HE" | "MV" | "NI" | "NW" | "RP" | "SL"
  | "SN" | "ST" | "SH" | "TH";

export const BUNDESLAENDER: Bundesland[] = [
  "BW", "BY", "BE", "BB", "HB", "HH",
  "HE", "MV", "NI", "NW", "RP", "SL",
  "SN", "ST", "SH", "TH"
];

export interface QuickCheckData {
  dueDate: Date | null;
  employment: EmploymentType | null;
  monthlyNetIncome: number;
  hasPartner: boolean | null;
  bundesland: Bundesland | null;
}

export interface QuickCheckResult {
  monthlyElterngeld: number;
  totalElterngeld: number;
  months: number;
  optimizationPotential: number;
}

export interface Lead {
  email: string;
  dueDate?: Date;
  bundesland?: Bundesland;
  quickCheckData?: QuickCheckData;
  consentMarketing: boolean;
}

export interface MutterschutzResult {
  startDate: Date;
  endDate: Date;
  daysBeforeBirth: number;
  daysAfterBirth: number;
  totalDays: number;
}

export const BUNDESLAND_NAMES: Record<Bundesland, string> = {
  BW: "Baden-Württemberg",
  BY: "Bayern",
  BE: "Berlin",
  BB: "Brandenburg",
  HB: "Bremen",
  HH: "Hamburg",
  HE: "Hessen",
  MV: "Mecklenburg-Vorpommern",
  NI: "Niedersachsen",
  NW: "Nordrhein-Westfalen",
  RP: "Rheinland-Pfalz",
  SL: "Saarland",
  SN: "Sachsen",
  ST: "Sachsen-Anhalt",
  SH: "Schleswig-Holstein",
  TH: "Thüringen",
};
