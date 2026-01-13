// BEEG (Bundeselterngeld- und Elternzeitgesetz) Konstanten

export const ELTERNGELD_MIN = 300; // €/Monat (Mindestbetrag)
export const ELTERNGELD_MAX = 1800; // €/Monat (Höchstbetrag)
export const ELTERNGELD_PLUS_MAX = 900; // €/Monat (ElterngeldPlus Maximum)

// Einkommensgrenzen
export const INCOME_LIMIT_COUPLE = 175000; // € zu versteuerndes Einkommen (Paare)
export const INCOME_LIMIT_SINGLE = 175000; // € zu versteuerndes Einkommen (Alleinerziehende)

// Ersatzraten
export const REPLACEMENT_RATE_HIGH = 0.65; // 65% bei Einkommen > 1240€
export const REPLACEMENT_RATE_MEDIUM = 0.67; // 67% bei Einkommen 1000-1240€
export const REPLACEMENT_RATE_LOW_THRESHOLD = 1000; // € Schwelle für erhöhte Ersatzrate
export const REPLACEMENT_RATE_MEDIUM_THRESHOLD = 1240; // € Schwelle für 67%

// Bezugsdauer
export const MONTHS_SINGLE_PARENT = 12; // Monate Alleinerziehend
export const MONTHS_WITH_PARTNER = 14; // Monate mit Partner (12+2)
export const MONTHS_PARTNERSHIP_BONUS = 4; // Zusätzliche Monate bei Partnerschaftsbonus

// Mutterschutz
export const MUTTERSCHUTZ_WEEKS_BEFORE = 6; // Wochen vor Geburt
export const MUTTERSCHUTZ_WEEKS_AFTER = 8; // Wochen nach Geburt (normal)
export const MUTTERSCHUTZ_WEEKS_AFTER_PREMATURE = 12; // Wochen nach Geburt (Frühgeburt)
export const MUTTERSCHUTZ_WEEKS_AFTER_TWINS = 12; // Wochen nach Geburt (Mehrlinge)

// Geschwisterbonus
export const SIBLING_BONUS_RATE = 0.10; // 10% Zuschlag
export const SIBLING_BONUS_MIN = 75; // € Mindestbetrag

// Mehrlingszuschlag
export const MULTIPLE_BIRTH_BONUS = 300; // € pro weiterem Kind
