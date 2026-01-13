# Eltern-Kompass Landing Page - Implementierungsplan

## Ziel
Landing Page für den Elterngeld-Optimierer mit Quick-Check, Mutterschutz-Rechner und E-Mail-Signup.

## Tech-Stack
- **Frontend:** Next.js 14 (App Router) + Tailwind CSS + **shadcn/ui**
- **Backend:** Xano (XanoScript)
- **E-Mail:** Über Xano oder Resend

### shadcn/ui Komponenten (zu installieren)
```bash
npx shadcn@latest init
npx shadcn@latest add button input card progress select radio-group form label
npx shadcn@latest add dialog accordion calendar separator
```

---

## Projektstruktur

```
eltern-kompass/
├── app/
│   ├── layout.tsx              # Root Layout
│   ├── page.tsx                # Landing Page
│   ├── globals.css
│   ├── quick-check/
│   │   └── page.tsx            # Quick-Check Wizard
│   ├── ergebnis/
│   │   └── page.tsx            # Ergebnis nach Quick-Check
│   ├── rechner/
│   │   └── mutterschutz/
│   │       └── page.tsx        # SEO Mutterschutz-Rechner
│   └── (legal)/
│       ├── datenschutz/page.tsx
│       └── impressum/page.tsx
│
├── components/
│   ├── ui/                     # shadcn/ui Komponenten (auto-generiert)
│   ├── landing/                # Hero, Problem, HowItWorks, FAQ, CTA
│   ├── quick-check/            # Wizard, Fragen-Komponenten
│   ├── rechner/                # MutterschutzRechner
│   └── signup/                 # EmailSignupForm, LeadMagnetModal
│
├── lib/
│   ├── calculations/
│   │   ├── elterngeld-quick.ts # Vereinfachte Berechnung
│   │   ├── mutterschutz.ts     # Mutterschutz-Berechnung
│   │   └── constants.ts        # BEEG-Konstanten
│   └── xano/
│       └── client.ts           # Xano API Client
│
├── hooks/
│   └── useQuickCheck.ts        # Wizard State Management
│
└── types/
    └── index.ts                # TypeScript Types
```

---

## Implementierung in 4 Schritten

### Schritt 1: Projekt-Setup + Landing Page

**Aufgaben:**
1. Next.js 14 Projekt erstellen (`npx create-next-app@latest`)
2. shadcn/ui initialisieren (`npx shadcn@latest init`)
3. Benötigte shadcn-Komponenten installieren (Button, Card, Input, etc.)
4. Landing Page Sektionen:
   - **Hero:** "Wie viel Elterngeld verschenkst du?" + CTA
   - **Problem:** 3 Pain Points (Komplexität, Fristen, versteckte Optimierungen)
   - **How It Works:** 3 Schritte (Fragen → Berechnung → Ergebnis)
   - **FAQ:** 4-5 häufige Fragen
   - **CTA:** Finaler Call-to-Action

**Dateien:**
- `app/page.tsx`
- `app/layout.tsx`
- `components/ui/*.tsx` (auto-generiert durch shadcn)
- `components/landing/*.tsx`

---

### Schritt 2: Quick-Check Wizard (5 Fragen)

**Die 5 Fragen:**

| # | Frage | Komponente | Eingabe |
|---|-------|------------|---------|
| 1 | "Wann ist dein errechneter Geburtstermin?" | DueDateQuestion | DatePicker |
| 2 | "Wie bist du beschäftigt?" | EmploymentQuestion | Radio (Angestellt/Selbstständig/Beamtet/Nicht erwerbstätig) |
| 3 | "Monatliches Netto-Einkommen?" | IncomeQuestion | Slider oder Input (0-7.000€) |
| 4 | "Kind mit Partner?" | PartnerQuestion | Ja/Nein Toggle |
| 5 | "Bundesland?" | BundeslandQuestion | Dropdown (16 Länder) |

**Aufgaben:**
1. `useQuickCheck` Hook für State Management
2. `QuickCheckWizard` Komponente mit Progress-Bar
3. 5 Fragen-Komponenten
4. LocalStorage-Persistenz
5. Ergebnis-Seite mit Disclaimer

**Dateien:**
- `app/quick-check/page.tsx`
- `app/ergebnis/page.tsx`
- `components/quick-check/*.tsx`
- `hooks/useQuickCheck.ts`

---

### Schritt 3: Elterngeld-Berechnung (vereinfacht)

**BEEG-Formeln für Quick-Check:**

```typescript
// lib/calculations/elterngeld-quick.ts

const ELTERNGELD_MIN = 300;   // €/Monat
const ELTERNGELD_MAX = 1800;  // €/Monat

function calculateQuickElterngeld(nettoEinkommen: number): number {
  if (nettoEinkommen <= 0) return ELTERNGELD_MIN;

  let ersatzrate: number;
  if (nettoEinkommen < 1000) {
    // Geringverdiener: bis 100% (gestaffelt)
    ersatzrate = 1.0 - ((nettoEinkommen / 1000) * 0.33);
  } else if (nettoEinkommen <= 1240) {
    ersatzrate = 0.67;  // 67%
  } else {
    ersatzrate = 0.65;  // 65%
  }

  const elterngeld = nettoEinkommen * ersatzrate;
  return Math.max(ELTERNGELD_MIN, Math.min(elterngeld, ELTERNGELD_MAX));
}

// Monate: 12 (allein) oder 14 (mit Partner)
```

**Wichtig:** Disclaimer auf jeder Ergebnis-Seite:
> "Dies ist eine vereinfachte Schätzung. Die tatsächliche Höhe wird von der Elterngeldstelle berechnet."

**Dateien:**
- `lib/calculations/elterngeld-quick.ts`
- `lib/calculations/constants.ts`

---

### Schritt 4: Mutterschutz-Rechner + E-Mail-Signup

**Mutterschutz-Rechner:**
- Input: Geburtstermin, Mehrling?, Frühgeburt?
- Output: Start/Ende Schutzfrist, Anzahl Tage
- SEO-optimiert für "mutterschutz rechner" (KD 1, 6.200 Suchvolumen)

**E-Mail-Signup:**
- Lead Magnet: "Deine persönliche Fristen-Timeline" (PDF)
- Formular: E-Mail + DSGVO-Checkbox
- Speichern in Xano

**Xano Endpunkte:**
| Endpoint | Methode | Beschreibung |
|----------|---------|--------------|
| `/leads` | POST | Lead speichern |
| `/quick-check` | POST | Quick-Check Ergebnis speichern |

**Xano Tabelle `leads`:**
```
id, email, due_date, bundesland, quick_check_data,
consent_marketing, created_at
```

**Dateien:**
- `app/rechner/mutterschutz/page.tsx`
- `components/rechner/MutterschutzRechner.tsx`
- `components/signup/EmailSignupForm.tsx`
- `lib/xano/client.ts`

---

## Kritische Dateien

1. **`lib/calculations/elterngeld-quick.ts`** - Kernlogik Elterngeld-Berechnung
2. **`components/quick-check/QuickCheckWizard.tsx`** - Wizard-Steuerung
3. **`app/page.tsx`** - Landing Page (Conversion-kritisch)
4. **`lib/xano/client.ts`** - Backend-Anbindung

---

## Verifizierung

Nach Implementierung testen:

1. **Landing Page:**
   - [ ] Alle Sektionen rendern korrekt
   - [ ] CTA führt zu /quick-check
   - [ ] Mobile responsive

2. **Quick-Check:**
   - [ ] Alle 5 Fragen durchlaufen
   - [ ] Progress-Bar aktualisiert sich
   - [ ] Zurück-Navigation funktioniert
   - [ ] Ergebnis wird korrekt berechnet

3. **Berechnung:**
   - [ ] 0€ Einkommen → 300€ Elterngeld
   - [ ] 1.000€ Einkommen → ~670€ Elterngeld
   - [ ] 3.000€ Einkommen → 1.800€ (Maximum)
   - [ ] Disclaimer wird angezeigt

4. **E-Mail-Signup:**
   - [ ] Lead wird in Xano gespeichert
   - [ ] DSGVO-Checkbox ist Pflicht

5. **Mutterschutz-Rechner:**
   - [ ] Berechnung korrekt (6 Wochen vor, 8 nach)
   - [ ] SEO Metadata vorhanden

---

## Nicht im Scope (später)

- Vollständige BEEG-Berechnung mit allen Sonderfällen
- Stripe-Integration / Paywall
- Premium-Features
- PDF-Export
- Detaillierte Optimierungsvorschläge

---

*Plan erstellt: Januar 2026*
