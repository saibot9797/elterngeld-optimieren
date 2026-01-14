// BEEG (Bundeselterngeld- und Elternzeitgesetz) Konstanten
// Stand: Januar 2026 (BEEG Fassung vom 22.12.2025)

// ============================================================
// Elterngeld-Beträge
// ============================================================

export const ELTERNGELD_MIN = 300;        // €/Monat (Mindestbetrag, §2 Abs. 4)
export const ELTERNGELD_MAX = 1800;       // €/Monat (Höchstbetrag, §2 Abs. 1)
export const ELTERNGELD_PLUS_MAX = 900;   // €/Monat (ElterngeldPlus Maximum, §4a Abs. 2)
export const ELTERNGELD_PLUS_MIN = 150;   // €/Monat (ElterngeldPlus Minimum)

// ============================================================
// Einkommensgrenzen (§1 Abs. 8 BEEG)
// ============================================================

// Bei Überschreitung besteht KEIN Anspruch auf Elterngeld!
export const INCOME_LIMIT_STANDARD = 175000;           // € ab 01.04.2025
export const INCOME_LIMIT_TRANSITION = 200000;         // € Übergangsregel
export const INCOME_LIMIT_TRANSITION_START = '2024-04-01';
export const INCOME_LIMIT_TRANSITION_END = '2025-03-31';

// Legacy exports for backward compatibility
export const INCOME_LIMIT_COUPLE = INCOME_LIMIT_STANDARD;
export const INCOME_LIMIT_SINGLE = INCOME_LIMIT_STANDARD;

// ============================================================
// Ersatzraten (§2 Abs. 1-2 BEEG)
// ============================================================

export const REPLACEMENT_RATE_HIGH = 0.65;             // 65% Minimum
export const REPLACEMENT_RATE_MEDIUM = 0.67;           // 67% Standard
export const REPLACEMENT_RATE_MAX = 1.0;               // 100% Maximum (Geringverdiener)
export const REPLACEMENT_RATE_LOW_THRESHOLD = 1000;    // € Grenze für Geringverdiener-Bonus
export const REPLACEMENT_RATE_MEDIUM_THRESHOLD = 1200; // € Grenze für Besserverdiener-Abschlag

// ============================================================
// Bezugsdauer (§4 BEEG)
// ============================================================

export const MONTHS_SINGLE_PARENT = 12;                // Monate Alleinerziehend
export const MONTHS_WITH_PARTNER = 14;                 // Monate mit Partner (12+2)
export const MONTHS_PARTNERSHIP_BONUS = 4;             // Zusätzliche Monate Partnerschaftsbonus

// ============================================================
// Mutterschutz
// ============================================================

export const MUTTERSCHUTZ_WEEKS_BEFORE = 6;            // Wochen vor Geburt
export const MUTTERSCHUTZ_WEEKS_AFTER = 8;             // Wochen nach Geburt (normal)
export const MUTTERSCHUTZ_WEEKS_AFTER_PREMATURE = 12;  // Wochen nach Geburt (Frühgeburt)
export const MUTTERSCHUTZ_WEEKS_AFTER_TWINS = 12;      // Wochen nach Geburt (Mehrlinge)

// ============================================================
// Boni (§2a BEEG)
// ============================================================

// Geschwisterbonus (§2a Abs. 1-3)
export const SIBLING_BONUS_RATE = 0.10;                // 10% Zuschlag
export const SIBLING_BONUS_MIN = 75;                   // € Mindestbetrag
export const SIBLING_BONUS_MIN_PLUS = 37.5;            // € Mindestbetrag ElterngeldPlus

// Mehrlingszuschlag (§2a Abs. 4)
export const MULTIPLE_BIRTH_BONUS = 300;               // € pro weiterem Kind
export const MULTIPLE_BIRTH_BONUS_PLUS = 150;          // € pro weiterem Kind (Plus)

// ============================================================
// Sozialabgaben-Pauschalen (§2f BEEG)
// ============================================================

// WICHTIG: Dies sind BEEG-Pauschalen, NICHT tatsächliche AN-Sätze!
export const SOCIAL_INSURANCE_HEALTH_CARE_RATE = 0.09; // 9% KV/PV (§2f Abs. 1 Nr. 1)
export const SOCIAL_INSURANCE_PENSION_RATE = 0.10;     // 10% RV (§2f Abs. 1 Nr. 2)
export const SOCIAL_INSURANCE_UNEMPLOYMENT_RATE = 0.02;// 2% AV (§2f Abs. 1 Nr. 3)
export const SOCIAL_INSURANCE_TOTAL_RATE = 0.21;       // 21% Gesamt

// ============================================================
// Steuerabzüge (§2e BEEG)
// ============================================================

export const CHURCH_TAX_RATE_BEEG = 0.08;              // 8% Kirchensteuer (§2e Abs. 5)
// HINWEIS: BEEG verwendet einheitlich 8%, NICHT bundeslandabhängig 9%!

// ============================================================
// Arbeitnehmer-Pauschbetrag (§2c BEEG, §9a EStG)
// ============================================================

export const EMPLOYEE_LUMP_SUM_ANNUAL = 1230;          // € pro Jahr (2024)
export const EMPLOYEE_LUMP_SUM_MONTHLY = 102.5;        // € pro Monat (1230/12)

// ============================================================
// Einkommensgrenzen bei Teilzeit (§2 Abs. 3 BEEG)
// ============================================================

export const INCOME_CAP_WITH_EMPLOYMENT = 2770;        // € Deckelung bei Teilzeit

// ============================================================
// Optimierungsschätzung (für Quick-Check Lead-Generierung)
// ============================================================

export const OPTIMIZATION_MIN_DISPLAY = 800;           // € Minimum für "Wow-Effekt"
export const OPTIMIZATION_MAX_DISPLAY = 4500;          // € Maximum realistische Schätzung
export const OPTIMIZATION_TAX_CLASS_HIGH = 2500;       // € Max bei Steuerklassenwechsel (Besserverdiener)
export const OPTIMIZATION_TAX_CLASS_LOW = 1200;        // € Max bei Steuerklassenwechsel (Normalverdiener)
export const OPTIMIZATION_TAX_CLASS_HIGH_FACTOR = 0.8; // Faktor für Besserverdiener
export const OPTIMIZATION_TAX_CLASS_LOW_FACTOR = 0.5;  // Faktor für Normalverdiener
export const OPTIMIZATION_PLUS_PARTNER_MAX = 1500;     // € Max ElterngeldPlus Optimierung (mit Partner)
export const OPTIMIZATION_PLUS_SINGLE_MAX = 800;       // € Max ElterngeldPlus Optimierung (Single)
export const OPTIMIZATION_PLUS_PARTNER_FACTOR = 2;     // Faktor für Partner
export const OPTIMIZATION_PLUS_SINGLE_FACTOR = 1.5;    // Faktor für Single
export const OPTIMIZATION_PARTNERSHIP_BONUS_FACTOR = 0.5; // Faktor für Partnerschaftsbonus
export const OPTIMIZATION_PARTNERSHIP_BONUS_MONTHS = 2;   // Geschätzte Extra-Monate
export const OPTIMIZATION_HIGH_INCOME_THRESHOLD = 2000;   // € Grenze für Besserverdiener-Optimierung
