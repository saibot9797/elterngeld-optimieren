# Phase 0: Kritische BEEG-Fixes

**Status:** OFFEN
**Prioritaet:** KRITISCH
**Geschaetzter Aufwand:** 2-3 Stunden
**Betroffene Dateien:**
- `eltern-kompass/lib/calculations/constants.ts`
- `eltern-kompass/lib/calculations/elterngeld-quick.ts`

---

## 1. Zusammenfassung der Fehler

| # | Fehler | Aktuell | Korrekt | BEEG-Referenz | Impact |
|---|--------|---------|---------|---------------|--------|
| 1 | Ersatzrate-Grenze | 1.240 EUR | **1.200 EUR** | Paragraph 2 Abs. 2 BEEG | Falsche Berechnung bei Einkommen 1.200-1.240 EUR |
| 2 | Ersatzrate 1000-1200 EUR | Gestaffelt 65%-67% | **Konstant 67%** | Paragraph 2 Abs. 2 BEEG | Zu niedriges Elterngeld in diesem Bereich |
| 3 | Sozialabgaben-Pauschale | Nicht definiert (implizit ~20.4%) | **21%** | Paragraph 2f BEEG | Falsches Netto, falsches Elterngeld |
| 4 | Kirchensteuer | Bundesland-abhaengig 9% | **Einheitlich 8%** | Paragraph 2e Abs. 5 BEEG | Zu hohe Steuerabzuege |
| 5 | Einkommensgrenze | Keine Validierung | **175.000 EUR** | Paragraph 1 Abs. 8 BEEG | Kein Ausschluss bei hohem Einkommen |

---

## 2. Fix 1: Ersatzrate-Grenze (Paragraph 2 Abs. 2 BEEG)

### Problem

Die Grenze fuer die 67%-Ersatzrate ist auf 1.240 EUR gesetzt, muss aber 1.200 EUR sein.

### Datei

`/Users/tobias/Coding_experimente/elterngeld-optimieren/eltern-kompass/lib/calculations/constants.ts`

### Code VORHER

```typescript
// Ersatzraten
export const REPLACEMENT_RATE_HIGH = 0.65; // 65% bei Einkommen > 1240€
export const REPLACEMENT_RATE_MEDIUM = 0.67; // 67% bei Einkommen 1000-1240€
export const REPLACEMENT_RATE_LOW_THRESHOLD = 1000; // € Schwelle für erhöhte Ersatzrate
export const REPLACEMENT_RATE_MEDIUM_THRESHOLD = 1240; // € Schwelle für 67%
```

### Code NACHHER

```typescript
// Ersatzraten nach §2 Abs. 2 BEEG
export const REPLACEMENT_RATE_HIGH = 0.65;    // 65% Minimum bei Einkommen > 1.200€
export const REPLACEMENT_RATE_MEDIUM = 0.67;  // 67% Standard-Ersatzrate
export const REPLACEMENT_RATE_MAX = 1.0;      // 100% Maximum bei Geringverdienern
export const REPLACEMENT_RATE_LOW_THRESHOLD = 1000;    // € Grenze für Geringverdiener-Bonus
export const REPLACEMENT_RATE_MEDIUM_THRESHOLD = 1200; // § Grenze für Besserverdiener-Abschlag
```

### BEEG-Referenz

> **Paragraph 2 Abs. 2 BEEG:**
> "In den Faellen, in denen das Einkommen aus Erwerbstaetigkeit vor der Geburt geringer als 1.000 Euro war, erhoeht sich der Prozentsatz von 67 Prozent um 0,1 Prozentpunkte fuer je 2 Euro, um die dieses Einkommen den Betrag von 1.000 Euro unterschreitet, auf bis zu 100 Prozent. In den Faellen, in denen das Einkommen aus Erwerbstaetigkeit vor der Geburt hoeher als **1.200 Euro** war, sinkt der Prozentsatz von 67 Prozent um 0,1 Prozentpunkte fuer je 2 Euro, um die dieses Einkommen den Betrag von 1.200 Euro uebersteigt, auf bis zu 65 Prozent."

---

## 3. Fix 2: Ersatzrate-Berechnung (Paragraph 2 Abs. 2 BEEG)

### Problem

Die aktuelle Implementierung berechnet zwischen 1.000 EUR und 1.200 EUR (bzw. faelschlicherweise 1.240 EUR) eine Staffelung. Laut BEEG ist die Ersatzrate in diesem Bereich **konstant 67%**.

### Korrekte Formel laut BEEG

| Netto-Einkommen | Ersatzrate | Formel |
|-----------------|------------|--------|
| < 1.000 EUR | 67% bis 100% | `67% + (1000 - Einkommen) / 2 * 0,1%` |
| 1.000 - 1.200 EUR | **KONSTANT 67%** | `67%` |
| > 1.200 EUR | 65% bis 67% | `67% - (Einkommen - 1200) / 2 * 0,1%` |

### Datei

`/Users/tobias/Coding_experimente/elterngeld-optimieren/eltern-kompass/lib/calculations/elterngeld-quick.ts`

### Code VORHER

```typescript
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
```

### Code NACHHER

```typescript
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
} from "./constants";

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
```

### Erklaerung der Aenderungen

1. **Zeile 23-25 (VORHER):** Falsche Staffelung zwischen 1000-1240 EUR
2. **Zeile 23-25 (NACHHER):** Konstant 67% zwischen 1000-1200 EUR
3. **Konstante:** `REPLACEMENT_RATE_MEDIUM_THRESHOLD` von 1240 auf 1200 geaendert
4. **Neue Konstante:** `REPLACEMENT_RATE_MAX = 1.0` fuer maximale Ersatzrate

---

## 4. Fix 3: Sozialabgaben-Pauschale (Paragraph 2f BEEG)

### Problem

Das BEEG verwendet **feste Pauschalen** fuer Sozialabgaben, NICHT die tatsaechlichen Arbeitnehmer-Beitragssaetze!

### BEEG-Pauschalen (Paragraph 2f Abs. 1 BEEG)

| Sozialversicherung | BEEG-Pauschale | Tatsaechlicher AN-Satz 2024 |
|--------------------|----------------|----------------------------|
| Kranken- und Pflegeversicherung | **9%** | ~9,8% (7,3% + 2,5% PV) |
| Rentenversicherung | **10%** | 9,3% |
| Arbeitslosenversicherung | **2%** | 1,3% |
| **GESAMT** | **21%** | ~20,4% |

### Datei

`/Users/tobias/Coding_experimente/elterngeld-optimieren/eltern-kompass/lib/calculations/constants.ts`

### Code VORHER

```typescript
// (Keine Sozialabgaben-Konstanten vorhanden)
```

### Code NACHHER (hinzufuegen am Ende der Datei)

```typescript
// Sozialabgaben-Pauschalen nach §2f BEEG
// WICHTIG: Dies sind BEEG-Pauschalen, NICHT tatsächliche AN-Sätze!
export const SOCIAL_INSURANCE_HEALTH_CARE_RATE = 0.09;  // 9% KV/PV (§2f Abs. 1 Nr. 1)
export const SOCIAL_INSURANCE_PENSION_RATE = 0.10;      // 10% RV (§2f Abs. 1 Nr. 2)
export const SOCIAL_INSURANCE_UNEMPLOYMENT_RATE = 0.02; // 2% AV (§2f Abs. 1 Nr. 3)
export const SOCIAL_INSURANCE_TOTAL_RATE = 0.21;        // 21% Gesamt (9% + 10% + 2%)
```

### BEEG-Referenz

> **Paragraph 2f Abs. 1 BEEG:**
> "Bei der Ermittlung der Abzuege fuer Sozialabgaben werden pauschaliert
> 1. fuer die Beitraege zur Sozialversicherung nach dem Fuenften und Elften Buch Sozialgesetzbuch ein Abzug von **9 Prozent** vorgenommen;
> 2. fuer die Beitraege zur Sozialversicherung nach dem Sechsten Buch Sozialgesetzbuch ein Abzug von **10 Prozent** vorgenommen;
> 3. fuer die Beitraege zur Sozialversicherung nach dem Dritten Buch Sozialgesetzbuch ein Abzug von **2 Prozent** vorgenommen."

---

## 5. Fix 4: Kirchensteuer (Paragraph 2e Abs. 5 BEEG)

### Problem

Das BEEG verwendet einheitlich **8%** Kirchensteuer, unabhaengig vom Bundesland. Die tatsaechlichen Saetze (8% in Bayern/BW, 9% in anderen Bundeslaendern) sind fuer die Elterngeld-Berechnung NICHT relevant.

### Datei

`/Users/tobias/Coding_experimente/elterngeld-optimieren/eltern-kompass/lib/calculations/constants.ts`

### Code VORHER

```typescript
// (Keine Kirchensteuer-Konstante vorhanden)
```

### Code NACHHER (hinzufuegen am Ende der Datei)

```typescript
// Steuerabzüge nach §2e BEEG
export const CHURCH_TAX_RATE_BEEG = 0.08;  // 8% Kirchensteuer (§2e Abs. 5 BEEG)
// HINWEIS: BEEG verwendet einheitlich 8%, NICHT bundeslandabhängig 9%!
```

### BEEG-Referenz

> **Paragraph 2e Abs. 5 BEEG:**
> "Fuer die Ermittlung der Kirchensteuer wird ein Steuersatz von **8 Prozent** angewendet."

---

## 6. Fix 5: Einkommensgrenze 175.000 EUR (Paragraph 1 Abs. 8 BEEG)

### Problem

Es fehlt eine Validierung der Einkommensgrenze. Bei Ueberschreitung besteht KEIN Anspruch auf Elterngeld.

### Regelung

| Geburtszeitraum | Einkommensgrenze | BEEG-Referenz |
|-----------------|------------------|---------------|
| 01.04.2024 - 31.03.2025 | **200.000 EUR** | Paragraph 28 Abs. 5 (Uebergangsregel) |
| Ab 01.04.2025 | **175.000 EUR** | Paragraph 1 Abs. 8 |

### Datei

`/Users/tobias/Coding_experimente/elterngeld-optimieren/eltern-kompass/lib/calculations/constants.ts`

### Code VORHER

```typescript
// Einkommensgrenzen
export const INCOME_LIMIT_COUPLE = 175000; // € zu versteuerndes Einkommen (Paare)
export const INCOME_LIMIT_SINGLE = 175000; // € zu versteuerndes Einkommen (Alleinerziehende)
```

### Code NACHHER

```typescript
// Einkommensgrenzen nach §1 Abs. 8 BEEG
// Bei Überschreitung besteht KEIN Anspruch auf Elterngeld!
export const INCOME_LIMIT_STANDARD = 175000;       // €  Ab 01.04.2025
export const INCOME_LIMIT_TRANSITION = 200000;     // € Übergangsregel 01.04.2024 - 31.03.2025
export const INCOME_LIMIT_TRANSITION_START = '2024-04-01';
export const INCOME_LIMIT_TRANSITION_END = '2025-03-31';
```

### Neue Validierungsfunktion (in elterngeld-quick.ts)

```typescript
import {
  INCOME_LIMIT_STANDARD,
  INCOME_LIMIT_TRANSITION,
  INCOME_LIMIT_TRANSITION_START,
  INCOME_LIMIT_TRANSITION_END,
} from "./constants";

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
```

### UI-Integration (Warnung anzeigen)

Die Warnung sollte im Quick-Check und Onboarding angezeigt werden, wenn:
- `isValid === false`
- Der Nutzer sein zu versteuerndes Einkommen eingibt

---

## 7. Testfaelle

### Testfall 1: Geringverdiener (800 EUR Netto)

```typescript
// Input
const netIncome = 800;

// Berechnung
const below1000 = 1000 - 800; // = 200
const increase = Math.floor(200 / 2) * 0.001; // = 100 * 0.001 = 0.10
const rate = 0.67 + 0.10; // = 0.77 (77%)

// Erwartetes Ergebnis
expect(calculateReplacementRate(800)).toBe(0.77);
expect(calculateMonthlyElterngeld(800)).toBe(616); // 800 * 0.77 = 616
```

### Testfall 2: Normalverdiener (1100 EUR Netto)

```typescript
// Input
const netIncome = 1100;

// Berechnung: Zwischen 1000-1200€ = KONSTANT 67%
const rate = 0.67;

// Erwartetes Ergebnis
expect(calculateReplacementRate(1100)).toBe(0.67);
expect(calculateMonthlyElterngeld(1100)).toBe(737); // 1100 * 0.67 = 737
```

### Testfall 3: Besserverdiener (1500 EUR Netto)

```typescript
// Input
const netIncome = 1500;

// Berechnung
const above1200 = 1500 - 1200; // = 300
const decrease = Math.floor(300 / 2) * 0.001; // = 150 * 0.001 = 0.15
const rate = 0.67 - 0.15; // = 0.52 -> ABER Minimum 0.65 greift!
const actualRate = Math.max(0.65, 0.52); // = 0.65

// Erwartetes Ergebnis
expect(calculateReplacementRate(1500)).toBe(0.65);
expect(calculateMonthlyElterngeld(1500)).toBe(975); // 1500 * 0.65 = 975
```

### Testfall 4: Hochverdiener (3000 EUR Netto)

```typescript
// Input
const netIncome = 3000;

// Berechnung
const above1200 = 3000 - 1200; // = 1800
const decrease = Math.floor(1800 / 2) * 0.001; // = 900 * 0.001 = 0.90
const rate = 0.67 - 0.90; // = -0.23 -> Minimum 0.65 greift!
const actualRate = Math.max(0.65, -0.23); // = 0.65

// Erwartetes Ergebnis
expect(calculateReplacementRate(3000)).toBe(0.65);
expect(calculateMonthlyElterngeld(3000)).toBe(1800); // 3000 * 0.65 = 1950 -> Max 1800!
```

### Testfall 5: Grenzfall 1000 EUR

```typescript
// Input: Genau an der Grenze
const netIncome = 1000;

// Erwartetes Ergebnis: 67% (nicht erhöht, nicht gesenkt)
expect(calculateReplacementRate(1000)).toBe(0.67);
```

### Testfall 6: Grenzfall 1200 EUR

```typescript
// Input: Genau an der Grenze
const netIncome = 1200;

// Erwartetes Ergebnis: 67% (noch nicht gesenkt)
expect(calculateReplacementRate(1200)).toBe(0.67);
```

### Testfall 7: Grenzfall 1202 EUR

```typescript
// Input: Knapp über der Grenze
const netIncome = 1202;

// Berechnung: 2€ über 1200€ = 1 * 0,1% Absenkung
const rate = 0.67 - 0.001; // = 0.669

// Erwartetes Ergebnis
expect(calculateReplacementRate(1202)).toBeCloseTo(0.669, 3);
```

---

## 8. Vollstaendige korrigierte constants.ts

```typescript
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
```

---

## 9. Vollstaendige korrigierte elterngeld-quick.ts

```typescript
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
  if (netIncome <= 0) return ELTERNGELD_MIN;

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

/**
 * Exportiere Ersatzrate-Funktion für Tests
 */
export { calculateReplacementRate };
```

---

## 10. Verifikation

Nach Implementierung der Fixes:

```bash
cd eltern-kompass

# 1. TypeScript-Kompilierung prüfen
npm run build

# 2. Linting prüfen
npm run lint

# 3. Manuelle Tests durchführen
npm run dev
# Dann im Browser testen:
# - Quick-Check mit 800€ Netto -> Erwarte ~77% Ersatzrate
# - Quick-Check mit 1100€ Netto -> Erwarte exakt 67% Ersatzrate
# - Quick-Check mit 3000€ Netto -> Erwarte 65% Ersatzrate, max 1800€
```

---

## 11. Checkliste vor Deployment

- [ ] `REPLACEMENT_RATE_MEDIUM_THRESHOLD` von 1240 auf 1200 geaendert
- [ ] Ersatzrate-Berechnung: 1000-1200 EUR konstant 67%
- [ ] Neue Konstante `REPLACEMENT_RATE_MAX = 1.0` hinzugefuegt
- [ ] Sozialabgaben-Pauschalen (21% gesamt) hinzugefuegt
- [ ] Kirchensteuer-Konstante (8%) hinzugefuegt
- [ ] Einkommensgrenze-Validierung implementiert
- [ ] Uebergangsregel (200.000 EUR) beruecksichtigt
- [ ] TypeScript-Build erfolgreich
- [ ] Linting ohne Fehler
- [ ] Testfaelle manuell verifiziert

---

## 12. Referenzen

- **BEEG Gesetzestext:** `/BEEG Gesetz/beeg_gesetz.html`
- **Berechnungsformeln:** `/BEEG Gesetz/beeg-berechnungsformeln.md`
- **Paragraph 2 Abs. 2:** Ersatzraten-Staffelung
- **Paragraph 2e Abs. 5:** Kirchensteuer 8%
- **Paragraph 2f Abs. 1:** Sozialabgaben-Pauschalen
- **Paragraph 1 Abs. 8:** Einkommensgrenze
- **Paragraph 28 Abs. 5:** Uebergangsregelung Einkommensgrenze
