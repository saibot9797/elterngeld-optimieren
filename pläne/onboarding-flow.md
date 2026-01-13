# Onboarding Flow: Premium Optimierer

## Übersicht

User Flow mit **"Invest First, Pay Later"**-Strategie: User füllen umfangreich aus, laden Dokumente hoch (KI-Scan), sehen ihre personalisierte Berechnung - und DANN kommt die Paywall vor der Strategie-Empfehlung.

**Psychologie:** Sunk Cost + IKEA-Effekt = höhere Conversion

---

## User Flow Diagramm

```
┌─────────────────┐
│   Quick-Check   │
│   (5 Fragen)    │
└────────┬────────┘
         ▼
┌─────────────────────────────────────────────┐
│            Ergebnis-Seite                   │
│  "Optimierung starten → 2.450 € Potenzial"  │
└────────┬────────────────────────────────────┘
         ▼
┌─────────────────┐
│  Registrierung  │
│  E-Mail + PW    │
└────────┬────────┘
         ▼
┌─────────────────────────────────────────────┐
│      Onboarding Step 1: Basisdaten          │
│  ├─ Vorausgefüllt: Bundesland, ET           │
│  ├─ Namen (Mutter)                          │
│  └─ Partner anlegen (Name, Rolle)           │
│                                             │
│  [████████░░░░░░░░░░░░] 25% vollständig     │
└────────┬────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────┐
│      Onboarding Step 2: Einkommen           │
│  ├─ Beschäftigungsart (angestellt/selbst.)  │
│  ├─ Monatliches Netto                       │
│  └─ Steuerklasse                            │
│                                             │
│  [████████████░░░░░░░░] 50% vollständig     │
└────────┬────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────┐
│      Onboarding Step 3: Dokumente (opt.)    │
│  ├─ Lohnabrechnung hochladen                │
│  │     → KI extrahiert: Brutto, StKl, KiSt  │
│  ├─ Steuerbescheid (Selbständige)           │
│  ├─ Mutterpass                              │
│  └─ Mutterschaftsgeld-Bescheid              │
│                                             │
│  [████████████████░░░░] 75% vollständig     │
└────────┬────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────┐
│      Onboarding Step 4: Elternzeit-Plan     │
│  ├─ Wer nimmt wie viele Monate?             │
│  ├─ Teilzeit während Elternzeit?            │
│  └─ Partnerschaftsbonus gewünscht?          │
│                                             │
│  [████████████████████] 100% vollständig    │
└────────┬────────────────────────────────────┘
         ▼
┌─────────────────────────────────────────────┐
│      Deine Berechnung ist fertig!           │
│  ┌─────────────────────────────────────┐    │
│  │  Ohne Optimierung:    14.234 €      │    │
│  │  Mit Optimierung:     16.580 €      │    │
│  │  ─────────────────────────────      │    │
│  │  Dein Potenzial:      +2.346 €      │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  PAYWALL                            │    │
│  │  "Deine personalisierte Strategie   │    │
│  │   freischalten"                     │    │
│  │                                     │    │
│  │  [Strategie ansehen – 79 €]         │    │
│  └─────────────────────────────────────┘    │
└────────┬────────────────────────────────────┘
         ▼ (nach Zahlung)
┌─────────────────────────────────────────────┐
│         Premium Dashboard                   │
│  • Optimale Steuerklassen-Strategie         │
│  • Basis vs. Plus Aufteilung                │
│  • Monatsgenauer Bezugsplan                 │
│  • PDF-Export für Arbeitgeber               │
└─────────────────────────────────────────────┘
```

---

## 1. CTA-Button Änderung

**Datei**: `eltern-kompass/app/ergebnis/page.tsx`

**Aktuell**:
```tsx
<Button size="lg" className="px-8" disabled>
  Premium-Optimierer starten – 79 €
</Button>
```

**Neu**:
```tsx
<Button size="lg" className="px-8" onClick={() => router.push('/registrieren')}>
  Optimierung starten → {formatCurrency(result.optimizationPotential)} Potenzial
  <ArrowRight className="ml-2 h-5 w-5" />
</Button>
```

---

## 2. Registrierung

**Route**: `eltern-kompass/app/registrieren/page.tsx`

| Feld | Typ | Required |
|------|-----|----------|
| E-Mail | email | Ja |
| Passwort | password (min 8) | Ja |

Nach Registrierung → Weiterleitung zu `/portal/onboarding`

---

## 3. Onboarding Flow (4 Schritte)

**Route**: `eltern-kompass/app/portal/onboarding/page.tsx`

### Step 1: Basisdaten (25%)

| Feld | Vorausgefüllt | Quelle |
|------|---------------|--------|
| Bundesland | Ja | Quick-Check |
| Errechneter Termin (ET) | Ja | Quick-Check |
| Vorname | | Neu |
| Nachname | | Neu |
| **Partner anlegen** | | |
| Partner Vorname | | Neu |
| Partner Nachname | | Neu |
| Beziehung zum Kind | | Dropdown: Vater/Mutter/Adoptiv |

### Step 2: Einkommen (50%)

**Für jeden Elternteil:**

| Feld | Optionen |
|------|----------|
| Beschäftigungsart | Angestellt / Selbständig / Beamte / Mischeinkommen |
| Monatliches Netto | Zahl (EUR) |
| Steuerklasse | 1-6 |
| Kirchensteuerpflichtig | Ja / Nein |

### Step 3: Dokumente hochladen (75%) - OPTIONAL

**KI-gestützter Dokumenten-Scan:**

| Dokument | Was KI extrahiert | Für wen relevant |
|----------|-------------------|------------------|
| **Lohnabrechnung** | Brutto, Netto, Steuerklasse, Kirchensteuer, Sozialabgaben | Alle Angestellten |
| **Steuerbescheid** | Jahreseinkommen, Gewinn aus Selbständigkeit | Selbständige, Mischeinkommen |
| **Mutterpass** | ET-Datum, Mehrlinge, ggf. Frühgeburt-Hinweise | Optional |
| **Mutterschaftsgeld-Bescheid** | Täglicher Betrag (max 13 EUR), Zeitraum | Nach Antrag bei KK |

**UX für Dokument-Upload:**
1. User lädt PDF/Foto hoch
2. Ladeanimation: "Dokument wird analysiert..."
3. KI zeigt extrahierte Daten zur Bestätigung
4. User korrigiert ggf. falsche Werte
5. Daten werden in Profil übernommen

### Step 4: Elternzeit-Plan (100%)

| Feld | Optionen |
|------|----------|
| Monate Mutter | 0-14 (Basis) + Plus-Monate |
| Monate Partner | 0-14 (Basis) + Plus-Monate |
| Teilzeit während Elternzeit? | Ja/Nein, wenn ja: Stunden/Woche |
| Partnerschaftsbonus gewünscht? | Ja/Nein (erklärt was das ist) |

---

## 4. Paywall-Screen

**Route**: `eltern-kompass/app/portal/ergebnis/page.tsx`

Nach Abschluss des Onboardings sieht User:

```
┌─────────────────────────────────────────────────────┐
│  Deine Berechnung ist fertig!                       │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │                                               │  │
│  │   Ohne Optimierung      Mit Optimierung      │  │
│  │   ══════════════════    ═══════════════      │  │
│  │   14.234 €         →    16.580 €             │  │
│  │                                               │  │
│  │   ════════════════════════════════════════   │  │
│  │   Dein Potenzial: +2.346 €                   │  │
│  │                                               │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
│  Deine personalisierte Strategie enthält:           │
│  - Optimale Steuerklassen-Kombination               │
│  - Beste Aufteilung Basis vs. ElterngeldPlus        │
│  - Monatsgenauer Bezugsplan für beide Eltern        │
│  - Partnerschaftsbonus-Empfehlung                   │
│  - PDF-Export für Arbeitgeber & Elterngeldstelle    │
│                                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  [Strategie freischalten – 79 €]              │  │
│  │                                               │  │
│  │  100% Geld-zurück-Garantie                    │  │
│  │  wenn Ersparnis < 500 €                       │  │
│  └───────────────────────────────────────────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 5. Premium Dashboard (nach Zahlung)

**Route**: `eltern-kompass/app/portal/strategie/page.tsx`

### Inhalte:
- **Steuerklassen-Empfehlung**: Wann wechseln, welche Kombination
- **Bezugsplan-Visualisierung**: Timeline mit Monaten, Beträgen, wer wann
- **Basis vs. Plus Strategie**: Konkrete Empfehlung mit Begründung
- **Checkliste**: Was wann zu tun ist
- **PDF-Export**: Für Arbeitgeber, Elterngeldstelle

---

## 6. Frontend-Dateien

```
eltern-kompass/
├── app/
│   ├── registrieren/page.tsx
│   └── portal/
│       ├── layout.tsx              # Auth-Check, Sidebar
│       ├── onboarding/page.tsx     # 4-Step Wizard
│       ├── ergebnis/page.tsx       # Paywall-Screen
│       └── strategie/page.tsx      # Premium (nach Zahlung)
├── components/
│   └── portal/
│       ├── OnboardingWizard.tsx
│       ├── ProgressBar.tsx
│       ├── DocumentUpload.tsx
│       ├── DocumentAnalysisResult.tsx
│       └── PaywallCard.tsx
├── hooks/
│   ├── useAuth.ts
│   └── useOnboarding.ts
└── lib/
    └── xano/
        ├── auth.ts
        └── documents.ts
```

---

## 7. Datenfluss

```
Quick-Check (localStorage)
    │
    ├── dueDate, employment, monthlyNetIncome, hasPartner, bundesland
    │
    ▼
Registrierung → Xano: users Tabelle
    │
    ▼
Onboarding Step 1-4 → Xano: parents, pregnancies, documents Tabellen
    │
    ▼
Berechnung → Xano: calculate_elterngeld Function
    │
    ▼
Paywall-Screen (zeigt Potenzial)
    │
    ▼ (Zahlung via Stripe)
    │
    ▼
Premium Dashboard (volle Strategie)
```

---

## 8. Implementierungs-Reihenfolge

1. [ ] CTA-Button auf Ergebnis-Seite aktualisieren
2. [ ] Registrierungsseite + Xano Auth
3. [ ] Portal-Layout mit Auth-Check
4. [ ] Onboarding Step 1: Basisdaten
5. [ ] Onboarding Step 2: Einkommen
6. [ ] Onboarding Step 3: Dokument-Upload + KI-Analyse
7. [ ] Onboarding Step 4: Elternzeit-Plan
8. [ ] Paywall-Screen mit Berechnung
9. [ ] Stripe Integration
10. [ ] Premium Dashboard
