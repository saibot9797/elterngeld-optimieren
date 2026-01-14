# Premium Chat-Berater: Implementierungsplan

## Übersicht

Ein Chat-basierter Berater für Premium-User, der wie ein persönlicher Elterngeld-Experte durch alle relevanten Fragen führt.

**User Flow:**
```
Registrierung → Basis-Onboarding (gratis) → Dashboard/Paywall
→ Premium kaufen → Auswahl "Für wen starten?" → Chat-Berater
```

---

## Architektur

### Frontend (Next.js)

```
eltern-kompass/
├── app/portal/
│   └── berater/
│       └── page.tsx              # Chat-Berater Hauptseite
│
├── components/berater/
│   ├── ChatContainer.tsx         # Container mit Messages + Input
│   ├── ChatMessage.tsx           # Einzelne Nachricht (Bot/User)
│   ├── ChatInput.tsx             # Eingabefeld unten für Rückfragen
│   ├── inputs/
│   │   ├── ButtonGroup.tsx       # Antwort-Buttons (halbrunde Bubbles)
│   │   ├── SliderInput.tsx       # Schieberegler (z.B. Monate)
│   │   ├── CurrencyInput.tsx     # Geld-Eingabe (mit €-Symbol)
│   │   ├── DateInput.tsx         # Datum-Picker
│   │   ├── SelectInput.tsx       # Dropdown-Auswahl
│   │   └── TextInput.tsx         # Freitext-Eingabe
│   └── PersonSelector.tsx        # "Mit wem starten?" Auswahl
│
├── lib/berater/
│   ├── decision-tree.ts          # Entscheidungsbaum-Logik
│   ├── questions.ts              # Alle Fragen definiert
│   ├── xano-client.ts            # API-Calls zu Xano
│   └── types.ts                  # TypeScript-Typen
│
└── hooks/
    └── useBerater.ts             # State-Management für Chat
```

### Backend (Xano)

```
functions/
├── ai_ask_question.json          # Gemini 2.5 Flash via Xano AI
└── process_chat_answer.json      # Antwort verarbeiten & speichern

apis/
├── berater/
│   ├── ask.json                  # POST /berater/ask - Rückfrage an AI
│   ├── answer.json               # POST /berater/answer - Antwort speichern
│   └── state.json                # GET /berater/state - Chat-Status laden

tables/
├── chat_sessions.json            # Chat-Session pro User
└── chat_messages.json            # Alle Nachrichten
```

---

## Datenmodell

### TypeScript (Frontend)

```typescript
// lib/berater/types.ts

type InputType =
  | 'buttons'      // Auswahl-Bubbles (halbrund)
  | 'slider'       // Schieberegler
  | 'number'       // Zahl eingeben
  | 'currency'     // Geld-Betrag (€)
  | 'date'         // Datum
  | 'select'       // Dropdown
  | 'text'         // Freitext
  | 'confirm'      // Ja/Nein

interface Question {
  id: string
  phase: number
  text: string
  subtext?: string           // Erklärungstext
  inputType: InputType
  options?: Option[]         // Für buttons/select
  validation?: {
    min?: number
    max?: number
    required?: boolean
  }
  condition?: (answers: Record<string, any>) => boolean
  next: string | ((answer: any, answers: Record<string, any>) => string)
}

interface ChatMessage {
  id: string
  type: 'bot' | 'user' | 'system'
  content: string
  timestamp: Date
  questionId?: string
  inputConfig?: {
    type: InputType
    options?: Option[]
    validation?: any
  }
}

interface BeraterState {
  sessionId: string
  currentPerson: 'mutter' | 'partner'
  messages: ChatMessage[]
  currentQuestionId: string
  answers: Record<string, any>
  phase: number
  isComplete: boolean
}
```

### Xano Tabellen

```json
// tables/chat_sessions.json
{
  "name": "chat_sessions",
  "fields": [
    { "name": "id", "type": "integer", "auto_increment": true },
    { "name": "user_id", "type": "integer", "foreign_key": "users.id" },
    { "name": "current_person", "type": "enum", "values": ["mutter", "partner"] },
    { "name": "current_question_id", "type": "text" },
    { "name": "phase", "type": "integer", "default": 1 },
    { "name": "answers", "type": "json" },
    { "name": "is_complete", "type": "boolean", "default": false },
    { "name": "created_at", "type": "timestamp" },
    { "name": "updated_at", "type": "timestamp" }
  ]
}

// tables/chat_messages.json
{
  "name": "chat_messages",
  "fields": [
    { "name": "id", "type": "integer", "auto_increment": true },
    { "name": "session_id", "type": "integer", "foreign_key": "chat_sessions.id" },
    { "name": "type", "type": "enum", "values": ["bot", "user", "system"] },
    { "name": "content", "type": "text" },
    { "name": "question_id", "type": "text", "nullable": true },
    { "name": "created_at", "type": "timestamp" }
  ]
}
```

---

## Xano AI Integration (Gemini 2.5 Flash)

### Funktion: ai_ask_question

```javascript
// functions/ai_ask_question.json
// Nutzt Xano's eingebaute AI-Funktion mit Gemini

// Input
input = {
  question: "Was ist der Unterschied zwischen Basiselterngeld und ElterngeldPlus?",
  context: {
    currentQuestion: "Q50_elternzeit_typ",
    answers: { ... },
    person: "mutter"
  }
}

// Xano AI Call
ai_response = $xano.ai.generate({
  model: "gemini-2.5-flash",
  system_prompt: `
Du bist ein freundlicher Elterngeld-Berater für deutsche Eltern.
Du hilfst bei Fragen zum Elterngeld (BEEG).

Wichtige Regeln:
- Antworte kurz und verständlich (max 3-4 Sätze)
- Nutze einfache Sprache, keine Juristendeutsch
- Verweise auf offizielle Stellen bei komplexen Fragen
- Nenne konkrete Zahlen nur wenn du sicher bist (z.B. 300€ min, 1.800€ max)
- Bei Unsicherheit: "Das hängt von deiner individuellen Situation ab..."

Kontext der aktuellen Beratung:
- Aktuelle Frage: ${input.context.currentQuestion}
- Person: ${input.context.person}
- Bisherige Angaben: ${JSON.stringify(input.context.answers)}
`,
  prompt: input.question,
  max_tokens: 500,
  temperature: 0.7
})

// Output
return {
  answer: ai_response.text,
  tokens_used: ai_response.usage.total_tokens
}
```

### API: POST /berater/ask

```javascript
// apis/berater/ask.json

// 1. Auth prüfen
user = $auth.getUser()
if (!user.is_premium) {
  return $error(403, "Premium erforderlich")
}

// 2. Rate Limiting (max 20 Fragen pro Stunde)
rate_limit = $db.query("chat_messages")
  .where("session_id", body.session_id)
  .where("type", "user")
  .where("created_at", ">", $time.subtract(1, "hour"))
  .count()

if (rate_limit >= 20) {
  return $error(429, "Zu viele Anfragen. Bitte warte eine Stunde.")
}

// 3. AI Antwort generieren
ai_result = $fn.ai_ask_question({
  question: body.question,
  context: body.context
})

// 4. Nachrichten speichern
$db.insert("chat_messages", {
  session_id: body.session_id,
  type: "user",
  content: body.question
})

$db.insert("chat_messages", {
  session_id: body.session_id,
  type: "bot",
  content: ai_result.answer
})

// 5. Response
return {
  answer: ai_result.answer
}
```

---

## Entscheidungsbaum (BEEG-konform)

**WICHTIG:** Der Chat führt EINE Person nach der anderen durch alle Fragen.
Nicht beide gleichzeitig, außer bei gemeinsamen Fragen (Phase 1-3).

---

### Phase 1: Grundsituation (Gemeinsam)
```
Q1_kind_geboren (Ja/Nein)
  → IF Ja: Q2a_geburtsdatum (Date)
  → IF Nein: Q2b_errechneter_termin (Date)

Q3_fruehgeburt (nur wenn geboren)
  → IF Ja: Q3b_wochen_vor_et (Slider 6-16+) [§4 Abs. 5]

Q4_mehrlinge (Nein/Zwillinge/Drillinge+) [§2a Abs. 4]

Q5_bundesland (Select)

Q6_wohnsitz [§1 Abs. 1]
  → "In Deutschland" / "Ausland, aber DE-Sozialversicherung" / "Ausland"
  → IF Ausland ohne DE-SV: WARNUNG - kein Anspruch!

Q7_adoption [§1 Abs. 3]
  → IF Ja: Q7b_aufnahmedatum (Date) - ersetzt Geburtsdatum

Q8_partner_vorhanden (Ja/Nein)
  → IF Nein: Q9_alleinerziehend [§4c]
    → "Entlastungsbetrag §24b EStG?" (Ja/Nein)
```

### Phase 2: Einkommensgrenze (Gemeinsam) [§1 Abs. 8]
```
Q10_einkommensgrenze
  → "Ist euer gemeinsames zu versteuerndes Einkommen über 175.000 €?"
  → IF Ja: Q10b_genauer_betrag (Currency)
  → IF > 175.000 €: WARNUNG - kein Anspruch!

// Übergangsregelung §28: 200.000 € für Geburten 01.04.2024-31.03.2025
```

### Phase 3: Geschwister (Gemeinsam) [§2a Abs. 1-3]
```
Q15_geschwister_vorhanden (Ja/Nein)
  → IF Ja: Q15b_anzahl_geschwister (Number)
  → Q15c_geburtsdaten_geschwister (Multi-Date)
  → Q15d_kind_mit_behinderung (Ja/Nein) [verlängerte Frist bis 14 Jahre]

// Bonus-Check:
// - 2 Kinder: beide < 3 Jahre → +10% (min 75€)
// - 3+ Kinder: alle < 6 Jahre → +10% (min 75€)
```

---

## AB HIER: PRO PERSON (erst Mutter, dann Partner)

**Hinweis Bemessungszeitraum [§2b]:**
- Mutter: 12 Monate vor MUTTERSCHUTZFRIST (nicht Geburt!)
- Partner: 12 Monate vor GEBURT

---

### Phase 4: Beschäftigungssituation [§2c, §2d]
```
Q20_beschaeftigung
  → "Angestellt (Vollzeit/Teilzeit)"
  → "Selbständig / Freiberuflich"
  → "Beamtin/Beamter"
  → "Minijob (bis 538 €)"
  → "Midijob (538-2.000 €)"
  → "Nicht erwerbstätig"
  → "Mehrere Jobs / Kombination"
```

### Phase 4a: Angestellte [§2c]
```
Q21_brutto_aktuell (Currency)
  → "Wie hoch ist dein aktuelles monatliches Bruttogehalt?"

Q22_gehalt_konstant (Ja/Nein)
  → "War dein Gehalt in den letzten 12 Monaten konstant?"
  → IF Nein: Q22b_gehalt_pro_monat (12x Currency oder Dokument-Upload)
    → "Bitte gib dein Brutto für jeden der letzten 12 Monate an"

Q23_sonderzahlungen (Ja/Nein) [§2c Abs. 1 Satz 2 - NICHT berücksichtigt!]
  → IF Ja: Q23b_sonderzahlungen_art (Multi-Select)
    → Weihnachtsgeld / 13. Gehalt / Urlaubsgeld / Prämien / Tantieme
  → Q23c_sonderzahlungen_betrag (Currency pro Auswahl)
  → HINWEIS: "Diese Zahlungen werden NICHT für Elterngeld berücksichtigt"

Q24_steuerklasse (1-6) [§2e Abs. 3]
  → Steuerklasse VI wird NICHT berücksichtigt!

Q24b_steuerklasse_geaendert (Ja/Nein)
  → IF Ja: Q24c_wann_geaendert (Date)
  → Q24d_vorherige_steuerklasse (1-6)
  → CHECK: Wechsel muss 7 Monate vor Ende Bemessungszeitraum gewesen sein!

Q25_kirchensteuer (Ja/Nein) [§2e Abs. 5]
  → BEEG: Einheitlich 8% (nicht 9%!)

Q26_mehrere_jobs (Ja/Nein)
  → IF Ja: Q26b_zweitjob_art
    → "Minijob (pauschal versteuert)" → wird NICHT berücksichtigt
    → "Mit Lohnsteuer (Steuerklasse VI)" → wird NICHT berücksichtigt

Q27_sozialversicherung [§2f]
  → "Gesetzlich versichert (GKV)"
  → "Privat versichert (PKV)"
  → IF GKV: Pauschale 9% KV/PV + 10% RV + 2% AV = 21%
  → IF PKV: Q27b_rentenversicherung (Ja/Nein)
    → IF Ja RV: 10% RV + 2% AV = 12%
    → IF Nein RV: nur 2% AV

Q28_midijob_check (nur wenn Brutto 538-2.000 €) [§2f Abs. 2 Satz 3]
  → Übergangsbereich: reduzierte AN-Beiträge beachten
```

### Phase 4b: Selbständige [§2d]
```
Q30_selbstaendig_art
  → "Freiberuflich (§18 EStG)"
  → "Gewerbetreibend (§15 EStG)"
  → "Land- und Forstwirtschaft (§13 EStG)"

Q31_steuerbescheid_vorhanden (Ja/Nein) [§2d Abs. 2]
  → IF Ja: Q31b_gewinn_steuerbescheid (Currency)
  → Q31c_steuerbescheid_jahr (Year)
  → IF Nein: Q31d_geschaetzter_gewinn (Currency)
    → Betriebsausgaben-Pauschale: 25% der Einnahmen [§2d Abs. 3]

Q32_voraussichtlicher_gewinn (Currency)
  → "Erwarteter Gewinn im Jahr vor der Geburt?"

Q33_kirchensteuer (Ja/Nein) [§2e Abs. 5 - 8%]

Q34_sozialversicherung_selbst
  → "GKV freiwillig" / "PKV" / "Künstlersozialkasse"

Q34b_rentenversicherung (Ja/Nein)
  → Pflichtversichert (z.B. Handwerker, Künstler)?

Q35_arbeitslosenversicherung (Ja/Nein)
  → Freiwillig versichert? → 2% Pauschale
```

### Phase 4c: Beamte [§2f - KEINE Sozialabgaben]
```
Q40_dienstbezuege_brutto (Currency)

Q41_steuerklasse (1-6)

Q42_kirchensteuer (Ja/Nein) [8%]

Q43_beihilfe_pkv (Ja/Nein)
  → Beamte: KEINE Sozialabgaben-Pauschale!
  → Nur Steuerabzüge relevant
```

### Phase 4d: Minijob [§2f Abs. 2 - nicht SV-pflichtig]
```
Q45_minijob_betrag (Currency, max 538 €)
  → Minijobs sind NICHT sozialversicherungspflichtig
  → Werden für Elterngeld-Berechnung berücksichtigt

Q46_weitere_einkuenfte (Ja/Nein)
  → IF Ja: Verzweigung zu Angestellt/Selbständig
```

### Phase 4e: Nicht erwerbstätig
```
Q50_grund_nicht_erwerbstaetig
  → "Student/in" / "Hausfrau/-mann" / "Arbeitslos" / "Erwerbsgemindert"

Q50b_alg1_bezug (nur wenn arbeitslos) [§3 Abs. 1 Nr. 5]
  → IF Ja: Q50c_alg1_betrag (Currency)
  → HINWEIS: ALG1 wird teilweise angerechnet (außer 300€ Sockelbetrag)
```

### Phase 5: Ausklammerbare Monate [§2b Abs. 1 Satz 2]
```
Q55_ausklammerung_elterngeld (Ja/Nein)
  → "Hast du im Bemessungszeitraum Elterngeld für ein älteres Kind bezogen?"
  → IF Ja: Q55b_welche_monate (Multi-Month-Select)

Q56_ausklammerung_mutterschutz (Ja/Nein)
  → "Warst du im Bemessungszeitraum im Mutterschutz für ein älteres Kind?"
  → IF Ja: Q56b_welche_monate (Multi-Month-Select)

Q57_ausklammerung_krankheit (Ja/Nein)
  → "Hattest du im Bemessungszeitraum eine schwangerschaftsbedingte Krankheit?"
  → IF Ja: Q57b_welche_monate (Multi-Month-Select)

// Diese Monate werden durch FRÜHERE Monate ersetzt!
```

### Phase 6: Mutterschaftsgeld (nur Mutter) [§3 Abs. 1]
```
Q60_mutterschaftsgeld_anspruch (Ja/Nein/Weiß nicht)
  → GKV-versichert? → Anspruch auf Mutterschaftsgeld

Q60b_mutterschaftsgeld_betrag
  → IF GKV: Max 13 €/Tag = 390 €/Monat
  → IF PKV: Einmalzahlung 210 € vom Bund

Q60c_arbeitgeber_zuschuss (Ja/Nein) [§3 Abs. 1 Nr. 1b]
  → IF Ja: Wird berechnet aus (Netto/30 - 13€) × 30
  → WICHTIG: Mutterschaftsgeld + AG-Zuschuss wird VOLL angerechnet!
  → Kein anrechnungsfreier Sockelbetrag!

Q60d_weitere_anrechnungen [§3]
  → "Beziehst du weitere Lohnersatzleistungen?"
  → Krankengeld / Verletztengeld / Übergangsgeld
  → Diese werden teilweise angerechnet (300€ Sockelbetrag frei)
```

### Phase 7: Elternzeit-Planung [§4, §4a, §4b]
```
Q70_elternzeit_monate (Slider 0-36)
  → "Wie viele Monate Elternzeit planst du insgesamt?"

Q71_elterngeld_variante
  → "Nur Basiselterngeld" (max 14 Monate Paar, 12 pro Person)
  → "Nur ElterngeldPlus" (doppelte Dauer, halber Betrag)
  → "Kombination" (1 Basis = 2 Plus)

Q71b_kombination_aufteilung (wenn Kombination)
  → "Wie viele Monate Basiselterngeld?"
  → "Wie viele Monate ElterngeldPlus?"

Q72_teilzeit_geplant (Ja/Nein) [§1 Abs. 6 - max 32h/Woche]
  → IF Ja: Q72b_teilzeit_stunden (Slider 1-32)
  → Q72c_teilzeit_netto_erwartet (Currency)
  → WICHTIG: Bei Teilzeit-Einkommen ändert sich die Berechnung! [§2 Abs. 3]
  → Deckelung Vorgeburt-Einkommen auf 2.770 €

Q73_gleichzeitiger_bezug (Ja/Nein) [§4 Abs. 6]
  → IF Ja + Basiselterngeld: Q73b_welcher_monat (Select 1-12)
  → WARNUNG: Basiselterngeld gleichzeitig NUR in 1 Monat erlaubt!
  → Ausnahme: Mehrlinge, Frühgeburt, Kind mit Behinderung

Q74_partnerschaftsbonus_interesse (Ja/Nein) [§4b]
  → IF Ja: Q74b_beide_24_32_stunden (Ja/Nein)
  → Bedingung: BEIDE Eltern 24-32h/Woche gleichzeitig
  → Dauer: 2-4 Monate pro Person
  → Betrag: ElterngeldPlus-Höhe
```

---

### Phase 8: OPTIMIERUNG (nach beiden Personen)
```
Nach Abschluss aller Fragen für BEIDE Personen:

OPT1_steuerklassen_analyse
  → Prüfe ob Steuerklassenwechsel noch möglich
  → 7 Monate vor Ende Bemessungszeitraum = Deadline
  → Zeige: "Mit Wechsel zu III/V: +X € mehr Elterngeld"

OPT2_basis_vs_plus_vergleich
  → Berechne beide Varianten
  → Zeige: "Basiselterngeld: X € | ElterngeldPlus: Y € | Differenz: Z €"
  → Empfehlung bei Teilzeit: ElterngeldPlus oft vorteilhafter!

OPT3_partnerschaftsbonus_potential
  → Prüfe ob beide 24-32h arbeiten könnten
  → Zeige: "Mit Partnerschaftsbonus: +X € zusätzlich"

OPT4_optimale_aufteilung
  → Wer sollte wie viele Monate nehmen?
  → Berücksichtige: Wer verdient mehr? → mehr Elterngeld bei Pause
  → Partnermonate-Bedingung: Einkommensminderung in 2 Monaten

OPT5_fruehgeburt_zusatzmonate (wenn relevant)
  → 6+ Wochen vor ET: +1 Monat
  → 8+ Wochen: +2 Monate
  → 12+ Wochen: +3 Monate
  → 16+ Wochen: +4 Monate

OPT6_geschwisterbonus_check
  → Prüfe Altersgrenzen der Geschwister
  → Zeige: "Geschwisterbonus aktiv bis: [Datum]"
```

---

## Fragen-Definition (Vollständig BEEG-konform)

```typescript
// lib/berater/questions.ts

export const QUESTIONS: Question[] = [
  // ═══════════════════════════════════════════════════════════
  // PHASE 1: GRUNDSITUATION (Gemeinsam)
  // ═══════════════════════════════════════════════════════════

  {
    id: 'Q1_kind_geboren',
    phase: 1,
    text: 'Ist euer Kind schon geboren?',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, bereits geboren' },
      { value: 'nein', label: 'Nein, noch nicht' }
    ],
    next: (answer) => answer === 'ja' ? 'Q2a_geburtsdatum' : 'Q2b_errechneter_termin'
  },
  {
    id: 'Q2a_geburtsdatum',
    phase: 1,
    text: 'Wann wurde euer Kind geboren?',
    inputType: 'date',
    validation: { required: true },
    next: 'Q3_fruehgeburt'
  },
  {
    id: 'Q2b_errechneter_termin',
    phase: 1,
    text: 'Wann ist der errechnete Geburtstermin (ET)?',
    inputType: 'date',
    validation: { required: true },
    next: 'Q4_mehrlinge'
  },
  {
    id: 'Q3_fruehgeburt',
    phase: 1,
    text: 'War es eine Frühgeburt?',
    subtext: 'Mind. 6 Wochen vor dem errechneten Termin → Zusätzliche Elterngeld-Monate! (§4 Abs. 5 BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'nein', label: 'Nein' },
      { value: 'ja', label: 'Ja, Frühgeburt' }
    ],
    next: (answer) => answer === 'ja' ? 'Q3b_wochen_vor_et' : 'Q4_mehrlinge'
  },
  {
    id: 'Q3b_wochen_vor_et',
    phase: 1,
    text: 'Wie viele Wochen vor dem errechneten Termin?',
    subtext: '6+ Wochen: +1 Monat | 8+: +2 | 12+: +3 | 16+: +4 Monate',
    inputType: 'slider',
    options: { min: 6, max: 20, default: 6, step: 1, unit: 'Wochen' },
    next: 'Q4_mehrlinge'
  },
  {
    id: 'Q4_mehrlinge',
    phase: 1,
    text: 'Erwartet ihr Mehrlinge?',
    subtext: 'Mehrlingszuschlag: +300 € pro weiterem Kind (§2a Abs. 4 BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'nein', label: 'Nein, Einling' },
      { value: 'zwillinge', label: 'Zwillinge (+300 €)' },
      { value: 'drillinge', label: 'Drillinge (+600 €)' },
      { value: 'mehr', label: 'Vierlinge oder mehr' }
    ],
    next: 'Q5_bundesland'
  },
  {
    id: 'Q5_bundesland',
    phase: 1,
    text: 'In welchem Bundesland wohnt ihr?',
    inputType: 'select',
    options: BUNDESLAENDER,
    next: 'Q6_wohnsitz'
  },
  {
    id: 'Q6_wohnsitz',
    phase: 1,
    text: 'Wo ist euer Wohnsitz?',
    subtext: 'Für Elterngeld muss mind. ein Elternteil in Deutschland wohnen (§1 Abs. 1 BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'deutschland', label: 'In Deutschland' },
      { value: 'ausland_de_sv', label: 'Ausland, aber deutschem Sozialversicherungsrecht unterliegend' },
      { value: 'ausland', label: 'Ausland ohne DE-Bezug' }
    ],
    next: (answer) => {
      if (answer === 'ausland') return 'WARNUNG_KEIN_ANSPRUCH'
      return 'Q7_adoption'
    }
  },
  {
    id: 'Q7_adoption',
    phase: 1,
    text: 'Handelt es sich um eine Adoption?',
    subtext: 'Bei Adoption gilt das Aufnahmedatum statt Geburtsdatum (§1 Abs. 3 BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'nein', label: 'Nein' },
      { value: 'ja', label: 'Ja, Adoption' }
    ],
    next: (answer) => answer === 'ja' ? 'Q7b_aufnahmedatum' : 'Q8_partner'
  },
  {
    id: 'Q7b_aufnahmedatum',
    phase: 1,
    text: 'Wann wurde das Kind bei euch aufgenommen?',
    subtext: 'Dieses Datum ersetzt das Geburtsdatum für die Berechnung',
    inputType: 'date',
    validation: { required: true },
    next: 'Q8_partner'
  },
  {
    id: 'Q8_partner',
    phase: 1,
    text: 'Gibt es einen Partner/eine Partnerin?',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein, alleinerziehend' }
    ],
    next: (answer) => answer === 'nein' ? 'Q9_alleinerziehend' : 'Q10_einkommensgrenze'
  },
  {
    id: 'Q9_alleinerziehend',
    phase: 1,
    text: 'Hast du Anspruch auf den Entlastungsbetrag für Alleinerziehende?',
    subtext: 'Steuerklasse II = Entlastungsbetrag nach §24b EStG. Wichtig für volle 14 Monate! (§4c BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, Steuerklasse II' },
      { value: 'nein', label: 'Nein / Weiß nicht' }
    ],
    next: 'Q15_geschwister'
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 2: EINKOMMENSGRENZE (§1 Abs. 8 BEEG)
  // ═══════════════════════════════════════════════════════════

  {
    id: 'Q10_einkommensgrenze',
    phase: 2,
    text: 'Liegt euer gemeinsames zu versteuerndes Einkommen über 175.000 €?',
    subtext: 'Maßgeblich ist der letzte Steuerbescheid. Über 175.000 € = kein Anspruch! (§1 Abs. 8 BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'unter', label: 'Unter 175.000 €' },
      { value: 'ueber', label: 'Über 175.000 €' },
      { value: 'weiss_nicht', label: 'Weiß nicht genau' }
    ],
    next: (answer) => {
      if (answer === 'ueber') return 'Q10b_genauer_betrag'
      if (answer === 'weiss_nicht') return 'Q10b_genauer_betrag'
      return 'Q15_geschwister'
    }
  },
  {
    id: 'Q10b_genauer_betrag',
    phase: 2,
    text: 'Wie hoch ist euer gemeinsames zu versteuerndes Einkommen?',
    subtext: 'Steht im letzten Steuerbescheid. Übergangsregel: 200.000 € für Geburten bis 31.03.2025',
    inputType: 'currency',
    validation: { min: 0, max: 1000000 },
    next: 'CHECK_EINKOMMENSGRENZE'
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 3: GESCHWISTER (§2a Abs. 1-3 BEEG)
  // ═══════════════════════════════════════════════════════════

  {
    id: 'Q15_geschwister',
    phase: 3,
    text: 'Habt ihr bereits Kinder, die mit im Haushalt leben?',
    subtext: 'Geschwisterbonus: +10% (min. 75 €) bei 2 Kindern <3 Jahre oder 3+ Kindern <6 Jahre',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein, erstes Kind' }
    ],
    next: (answer) => answer === 'ja' ? 'Q15b_anzahl' : 'PERSON_START'
  },
  {
    id: 'Q15b_anzahl',
    phase: 3,
    text: 'Wie viele Kinder leben bereits im Haushalt?',
    inputType: 'slider',
    options: { min: 1, max: 6, default: 1, step: 1, unit: 'Kind(er)' },
    next: 'Q15c_geburtsdaten'
  },
  {
    id: 'Q15c_geburtsdaten',
    phase: 3,
    text: 'Wann sind die Geschwister geboren?',
    subtext: 'Wichtig für Geschwisterbonus-Berechnung (Altersgrenzen)',
    inputType: 'multi_date',
    validation: { required: true },
    next: 'Q15d_behinderung'
  },
  {
    id: 'Q15d_behinderung',
    phase: 3,
    text: 'Hat eines der Kinder eine Behinderung?',
    subtext: 'Kinder mit Behinderung: Geschwisterbonus bis 14. Lebensjahr',
    inputType: 'buttons',
    options: [
      { value: 'nein', label: 'Nein' },
      { value: 'ja', label: 'Ja' }
    ],
    next: 'PERSON_START'
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 4: BESCHÄFTIGUNG (Pro Person)
  // ═══════════════════════════════════════════════════════════

  {
    id: 'Q20_beschaeftigung',
    phase: 4,
    text: 'Was beschreibt deine Arbeitssituation am besten?',
    inputType: 'buttons',
    options: [
      { value: 'angestellt', label: 'Angestellt (Vollzeit/Teilzeit)' },
      { value: 'selbstaendig', label: 'Selbständig / Freiberuflich' },
      { value: 'beamte', label: 'Beamte/Beamter' },
      { value: 'minijob', label: 'Minijob (bis 538 €)' },
      { value: 'midijob', label: 'Midijob (538-2.000 €)' },
      { value: 'nicht_erwerbstaetig', label: 'Nicht erwerbstätig' },
      { value: 'kombination', label: 'Mehrere Jobs / Kombination' }
    ],
    next: (answer) => {
      switch(answer) {
        case 'angestellt': return 'Q21_brutto'
        case 'selbstaendig': return 'Q30_selbstaendig_art'
        case 'beamte': return 'Q40_dienstbezuege'
        case 'minijob': return 'Q45_minijob_betrag'
        case 'midijob': return 'Q21_brutto' // wie Angestellte, mit Midijob-Flag
        case 'nicht_erwerbstaetig': return 'Q50_grund'
        case 'kombination': return 'Q21_brutto' // Hauptjob zuerst
      }
    }
  },

  // ── ANGESTELLTE (§2c BEEG) ──

  {
    id: 'Q21_brutto',
    phase: 4,
    text: 'Wie hoch ist dein aktuelles monatliches Bruttogehalt?',
    inputType: 'currency',
    validation: { min: 0, max: 50000 },
    next: 'Q22_gehalt_konstant'
  },
  {
    id: 'Q22_gehalt_konstant',
    phase: 4,
    text: 'War dein Gehalt in den letzten 12 Monaten konstant?',
    subtext: 'Bei Gehaltsänderungen oder variablem Einkommen brauchen wir die einzelnen Monate',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, konstant' },
      { value: 'nein', label: 'Nein, hat sich verändert' }
    ],
    next: (answer) => answer === 'nein' ? 'Q22b_gehalt_monate' : 'Q23_sonderzahlungen'
  },
  {
    id: 'Q22b_gehalt_monate',
    phase: 4,
    text: 'Bitte gib dein Bruttogehalt für jeden der letzten 12 Monate an:',
    subtext: 'Oder lade deine Lohnabrechnungen hoch für automatische Erkennung',
    inputType: 'monthly_currency', // Spezial-Input für 12 Monate
    validation: { required: true },
    next: 'Q23_sonderzahlungen'
  },
  {
    id: 'Q23_sonderzahlungen',
    phase: 4,
    text: 'Hast du in den letzten 12 Monaten Sonderzahlungen erhalten?',
    subtext: '⚠️ WICHTIG: Weihnachtsgeld, 13. Gehalt, Boni werden NICHT für Elterngeld berücksichtigt! (§2c Abs. 1 S. 2)',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein' }
    ],
    next: (answer) => answer === 'ja' ? 'Q23b_sonderzahlungen_art' : 'Q24_steuerklasse'
  },
  {
    id: 'Q23b_sonderzahlungen_art',
    phase: 4,
    text: 'Welche Sonderzahlungen hast du erhalten?',
    subtext: 'Diese müssen vom Brutto abgezogen werden!',
    inputType: 'multiselect',
    options: [
      { value: 'weihnachtsgeld', label: 'Weihnachtsgeld' },
      { value: '13_gehalt', label: '13. Monatsgehalt' },
      { value: 'urlaubsgeld', label: 'Urlaubsgeld (Einmalzahlung)' },
      { value: 'praemie', label: 'Prämien / Boni' },
      { value: 'tantieme', label: 'Tantieme' },
      { value: 'abfindung', label: 'Abfindung' }
    ],
    next: 'Q23c_sonderzahlungen_betrag'
  },
  {
    id: 'Q23c_sonderzahlungen_betrag',
    phase: 4,
    text: 'Wie hoch waren die Sonderzahlungen insgesamt?',
    inputType: 'currency',
    validation: { min: 0 },
    next: 'Q24_steuerklasse'
  },
  {
    id: 'Q24_steuerklasse',
    phase: 4,
    text: 'Welche Steuerklasse hast du aktuell?',
    subtext: '⚠️ Steuerklasse VI (Zweitjob) wird NICHT berücksichtigt!',
    inputType: 'buttons',
    options: [
      { value: '1', label: 'I - Ledig' },
      { value: '2', label: 'II - Alleinerziehend' },
      { value: '3', label: 'III - Verheiratet (höheres Einkommen)' },
      { value: '4', label: 'IV - Verheiratet (gleich)' },
      { value: '5', label: 'V - Verheiratet (niedrigeres Einkommen)' }
    ],
    next: 'Q24b_steuerklasse_gewechselt'
  },
  {
    id: 'Q24b_steuerklasse_gewechselt',
    phase: 4,
    text: 'Hast du die Steuerklasse in den letzten 12 Monaten gewechselt?',
    subtext: '⚠️ Wechsel muss 7 Monate VOR Ende des Bemessungszeitraums erfolgt sein!',
    inputType: 'buttons',
    options: [
      { value: 'nein', label: 'Nein' },
      { value: 'ja', label: 'Ja, gewechselt' }
    ],
    next: (answer) => answer === 'ja' ? 'Q24c_wechsel_datum' : 'Q25_kirchensteuer'
  },
  {
    id: 'Q24c_wechsel_datum',
    phase: 4,
    text: 'Wann hast du die Steuerklasse gewechselt?',
    inputType: 'date',
    validation: { required: true },
    next: 'Q24d_vorherige_steuerklasse'
  },
  {
    id: 'Q24d_vorherige_steuerklasse',
    phase: 4,
    text: 'Welche Steuerklasse hattest du vorher?',
    inputType: 'buttons',
    options: [
      { value: '1', label: 'I' },
      { value: '3', label: 'III' },
      { value: '4', label: 'IV' },
      { value: '5', label: 'V' }
    ],
    next: 'Q25_kirchensteuer'
  },
  {
    id: 'Q25_kirchensteuer',
    phase: 4,
    text: 'Bist du kirchensteuerpflichtig?',
    subtext: 'BEEG rechnet einheitlich mit 8% Kirchensteuer (§2e Abs. 5)',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein' }
    ],
    next: 'Q26_mehrere_jobs'
  },
  {
    id: 'Q26_mehrere_jobs',
    phase: 4,
    text: 'Hast du mehrere Jobs?',
    inputType: 'buttons',
    options: [
      { value: 'nein', label: 'Nein, nur einen' },
      { value: 'ja', label: 'Ja, mehrere' }
    ],
    next: (answer) => answer === 'ja' ? 'Q26b_zweitjob' : 'Q27_sozialversicherung'
  },
  {
    id: 'Q26b_zweitjob',
    phase: 4,
    text: 'Wie ist der Zweitjob versteuert?',
    subtext: 'Pauschal versteuerter Minijob = wird nicht berücksichtigt. Steuerklasse VI = wird nicht berücksichtigt.',
    inputType: 'buttons',
    options: [
      { value: 'minijob_pauschal', label: 'Minijob (pauschal versteuert)' },
      { value: 'steuerklasse_6', label: 'Steuerklasse VI' }
    ],
    next: 'Q27_sozialversicherung'
  },
  {
    id: 'Q27_sozialversicherung',
    phase: 4,
    text: 'Wie bist du krankenversichert?',
    subtext: 'GKV: Pauschale 9% KV/PV | PKV: andere Berechnung (§2f BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'gkv', label: 'Gesetzlich (GKV)' },
      { value: 'pkv', label: 'Privat (PKV)' }
    ],
    next: (answer, answers) => {
      if (answer === 'pkv') return 'Q27b_rentenversicherung'
      // Midijob-Check bei Brutto 538-2000€
      const brutto = answers.Q21_brutto || 0
      if (brutto > 538 && brutto <= 2000) return 'Q28_midijob_check'
      return 'Q55_ausklammerung'
    }
  },
  {
    id: 'Q27b_rentenversicherung',
    phase: 4,
    text: 'Bist du rentenversicherungspflichtig?',
    subtext: 'PKV + RV-pflichtig: 10% RV + 2% AV = 12% Sozialabgaben',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, rentenversicherungspflichtig' },
      { value: 'nein', label: 'Nein (z.B. befreit)' }
    ],
    next: (answer, answers) => {
      const brutto = answers.Q21_brutto || 0
      if (brutto > 538 && brutto <= 2000) return 'Q28_midijob_check'
      return 'Q55_ausklammerung'
    }
  },
  {
    id: 'Q28_midijob_check',
    phase: 4,
    text: 'Du bist im Übergangsbereich (Midijob). Wie werden deine Sozialabgaben berechnet?',
    subtext: 'Im Übergangsbereich (538-2.000€) zahlen AN reduzierte Beiträge. Diese reduzierten Sätze werden für Elterngeld verwendet! (§2f Abs. 2 S. 3)',
    inputType: 'buttons',
    options: [
      { value: 'standard', label: 'Normale Abzüge auf Lohnabrechnung' },
      { value: 'reduziert', label: 'Reduzierte Midijob-Abzüge' },
      { value: 'weiss_nicht', label: 'Weiß nicht' }
    ],
    next: 'Q55_ausklammerung'
  },

  // ── SELBSTÄNDIGE (§2d BEEG) ──

  {
    id: 'Q30_selbstaendig_art',
    phase: 4,
    text: 'Welche Art von Selbständigkeit übst du aus?',
    subtext: 'Wichtig für die Gewinnermittlung (§2d BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'freiberuflich', label: 'Freiberuflich (§18 EStG)' },
      { value: 'gewerbe', label: 'Gewerbetreibend (§15 EStG)' },
      { value: 'landwirtschaft', label: 'Land- und Forstwirtschaft (§13 EStG)' }
    ],
    next: 'Q31_steuerbescheid'
  },
  {
    id: 'Q31_steuerbescheid',
    phase: 4,
    text: 'Liegt ein Steuerbescheid für das Vorjahr vor?',
    subtext: 'Der Gewinn aus dem Steuerbescheid ist Grundlage der Berechnung (§2d Abs. 2)',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, Steuerbescheid vorhanden' },
      { value: 'nein', label: 'Nein, noch nicht' }
    ],
    next: (answer) => answer === 'ja' ? 'Q31b_gewinn' : 'Q31d_schaetzung'
  },
  {
    id: 'Q31b_gewinn',
    phase: 4,
    text: 'Wie hoch war dein Gewinn laut Steuerbescheid?',
    subtext: 'Einkünfte aus selbständiger Arbeit / Gewerbebetrieb',
    inputType: 'currency',
    validation: { min: 0 },
    next: 'Q31c_jahr'
  },
  {
    id: 'Q31c_jahr',
    phase: 4,
    text: 'Für welches Jahr ist der Steuerbescheid?',
    inputType: 'select',
    options: [
      { value: '2025', label: '2025' },
      { value: '2024', label: '2024' },
      { value: '2023', label: '2023' }
    ],
    next: 'Q32_voraussichtlich'
  },
  {
    id: 'Q31d_schaetzung',
    phase: 4,
    text: 'Wie hoch schätzt du deinen Jahresgewinn?',
    subtext: 'Einnahmen minus Betriebsausgaben. Pauschale: 25% der Einnahmen (§2d Abs. 3)',
    inputType: 'currency',
    validation: { min: 0 },
    next: 'Q32_voraussichtlich'
  },
  {
    id: 'Q32_voraussichtlich',
    phase: 4,
    text: 'Wie hoch wird dein voraussichtlicher Gewinn im Jahr vor der Geburt sein?',
    subtext: 'Bei Abweichung vom Vorjahr kann ein anderer Betrag angesetzt werden',
    inputType: 'currency',
    validation: { min: 0 },
    next: 'Q33_kirchensteuer_selbst'
  },
  {
    id: 'Q33_kirchensteuer_selbst',
    phase: 4,
    text: 'Bist du kirchensteuerpflichtig?',
    subtext: 'BEEG rechnet einheitlich mit 8% Kirchensteuer (§2e Abs. 5)',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein' }
    ],
    next: 'Q34_sv_selbst'
  },
  {
    id: 'Q34_sv_selbst',
    phase: 4,
    text: 'Wie bist du sozialversichert?',
    subtext: 'Selbständige: Nur tatsächliche Pflichtbeiträge werden berücksichtigt',
    inputType: 'buttons',
    options: [
      { value: 'gkv_freiwillig', label: 'GKV freiwillig versichert' },
      { value: 'pkv', label: 'Privat versichert (PKV)' },
      { value: 'ksk', label: 'Künstlersozialkasse (KSK)' }
    ],
    next: 'Q34b_rv_selbst'
  },
  {
    id: 'Q34b_rv_selbst',
    phase: 4,
    text: 'Bist du rentenversicherungspflichtig?',
    subtext: 'Z.B. Handwerker, Künstler/Publizisten, Lehrer, Hebammen',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, pflichtversichert' },
      { value: 'nein', label: 'Nein' }
    ],
    next: 'Q35_av_selbst'
  },
  {
    id: 'Q35_av_selbst',
    phase: 4,
    text: 'Bist du freiwillig arbeitslosenversichert?',
    subtext: 'Freiwillige Arbeitslosenversicherung → 2% Pauschale (§2f)',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein' }
    ],
    next: 'Q55_ausklammerung'
  },

  // ── BEAMTE (§2f - KEINE Sozialabgaben) ──

  {
    id: 'Q40_dienstbezuege',
    phase: 4,
    text: 'Wie hoch sind deine monatlichen Brutto-Dienstbezüge?',
    inputType: 'currency',
    validation: { min: 0 },
    next: 'Q41_steuerklasse_beamte'
  },
  {
    id: 'Q41_steuerklasse_beamte',
    phase: 4,
    text: 'Welche Steuerklasse hast du?',
    inputType: 'buttons',
    options: [
      { value: '1', label: 'I - Ledig' },
      { value: '2', label: 'II - Alleinerziehend' },
      { value: '3', label: 'III - Verheiratet (höheres Einkommen)' },
      { value: '4', label: 'IV - Verheiratet (gleich)' },
      { value: '5', label: 'V - Verheiratet (niedrigeres Einkommen)' }
    ],
    next: 'Q42_kirchensteuer_beamte'
  },
  {
    id: 'Q42_kirchensteuer_beamte',
    phase: 4,
    text: 'Bist du kirchensteuerpflichtig?',
    subtext: 'BEEG: Einheitlich 8% Kirchensteuer',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein' }
    ],
    next: 'Q43_beihilfe'
  },
  {
    id: 'Q43_beihilfe',
    phase: 4,
    text: 'Hast du Beihilfeanspruch und PKV?',
    subtext: '⚠️ WICHTIG: Beamte zahlen KEINE Sozialabgaben → keine Pauschale! (§2f)',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, Beihilfe + PKV' },
      { value: 'nein', label: 'Nein, GKV' }
    ],
    next: 'Q55_ausklammerung'
  },

  // ── MINIJOB (§2f Abs. 2 - nicht SV-pflichtig) ──

  {
    id: 'Q45_minijob_betrag',
    phase: 4,
    text: 'Wie hoch ist dein monatlicher Minijob-Verdienst?',
    subtext: 'Minijobs bis 538 €/Monat sind nicht sozialversicherungspflichtig',
    inputType: 'currency',
    validation: { min: 0, max: 538 },
    next: 'Q46_weitere_einkuenfte'
  },
  {
    id: 'Q46_weitere_einkuenfte',
    phase: 4,
    text: 'Hast du neben dem Minijob weitere Einkünfte?',
    subtext: 'Z.B. Hauptjob, Selbständigkeit',
    inputType: 'buttons',
    options: [
      { value: 'angestellt', label: 'Ja, Hauptjob (angestellt)' },
      { value: 'selbstaendig', label: 'Ja, Selbständigkeit' },
      { value: 'nein', label: 'Nein, nur Minijob' }
    ],
    next: (answer) => {
      switch(answer) {
        case 'angestellt': return 'Q21_brutto'
        case 'selbstaendig': return 'Q30_selbstaendig_art'
        default: return 'Q55_ausklammerung'
      }
    }
  },

  // ── NICHT ERWERBSTÄTIG ──

  {
    id: 'Q50_grund',
    phase: 4,
    text: 'Was beschreibt deine Situation am besten?',
    inputType: 'buttons',
    options: [
      { value: 'student', label: 'Student/in' },
      { value: 'hausfrau', label: 'Hausfrau/-mann' },
      { value: 'arbeitslos', label: 'Arbeitslos (mit/ohne ALG)' },
      { value: 'erwerbsgemindert', label: 'Erwerbsgemindert' }
    ],
    next: (answer) => answer === 'arbeitslos' ? 'Q50b_alg' : 'Q55_ausklammerung'
  },
  {
    id: 'Q50b_alg',
    phase: 4,
    text: 'Beziehst du Arbeitslosengeld I?',
    subtext: 'ALG I wird teilweise auf Elterngeld angerechnet (§3 Abs. 1 Nr. 5). Der Mindestbetrag von 300€ bleibt frei.',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, ALG I' },
      { value: 'nein', label: 'Nein (ALG II / Bürgergeld / kein Bezug)' }
    ],
    next: (answer) => answer === 'ja' ? 'Q50c_alg_betrag' : 'Q55_ausklammerung'
  },
  {
    id: 'Q50c_alg_betrag',
    phase: 4,
    text: 'Wie hoch ist dein monatliches Arbeitslosengeld I?',
    inputType: 'currency',
    validation: { min: 0 },
    next: 'Q55_ausklammerung'
  }

  // ═══════════════════════════════════════════════════════════
  // PHASE 5: AUSKLAMMERBARE MONATE (§2b Abs. 1 S. 2)
  // ═══════════════════════════════════════════════════════════

  {
    id: 'Q55_ausklammerung',
    phase: 5,
    text: 'Hast du im Bemessungszeitraum (letzte 12 Monate) eines der folgenden?',
    subtext: 'Diese Monate können ausgeklammert und durch frühere ersetzt werden!',
    inputType: 'multiselect',
    options: [
      { value: 'elterngeld', label: 'Elterngeld für älteres Kind bezogen' },
      { value: 'mutterschutz', label: 'Mutterschutz für älteres Kind' },
      { value: 'krankheit', label: 'Schwangerschaftsbedingte Krankheit' },
      { value: 'wehrdienst', label: 'Wehrdienst / Zivildienst' },
      { value: 'nichts', label: 'Nichts davon' }
    ],
    next: (answers) => {
      if (answers.includes('nichts') || answers.length === 0) {
        return 'Q60_mutterschaftsgeld'
      }
      return 'Q55b_ausklammerung_monate'
    }
  },
  {
    id: 'Q55b_ausklammerung_monate',
    phase: 5,
    text: 'In welchen Monaten war das?',
    subtext: 'Wähle alle betroffenen Monate aus',
    inputType: 'multi_month_select',
    validation: { required: true },
    next: 'Q60_mutterschaftsgeld'
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 6: MUTTERSCHAFTSGELD (nur Mutter) (§3 Abs. 1)
  // ═══════════════════════════════════════════════════════════

  {
    id: 'Q60_mutterschaftsgeld',
    phase: 6,
    condition: (answers) => answers.currentPerson === 'mutter',
    text: 'Hast du Anspruch auf Mutterschaftsgeld?',
    subtext: 'GKV-Versicherte: max. 13 €/Tag von der Krankenkasse',
    inputType: 'buttons',
    options: [
      { value: 'ja_gkv', label: 'Ja (GKV-versichert)' },
      { value: 'ja_pkv', label: 'Ja, aber PKV (210 € Einmalzahlung)' },
      { value: 'nein', label: 'Nein / Weiß nicht' }
    ],
    next: (answer) => {
      if (answer === 'ja_gkv') return 'Q60b_mutterschaftsgeld_betrag'
      if (answer === 'ja_pkv') return 'Q60c_arbeitgeber_zuschuss'
      return 'Q70_elternzeit'
    }
  },
  {
    id: 'Q60b_mutterschaftsgeld_betrag',
    phase: 6,
    text: 'Wie hoch ist dein Mutterschaftsgeld pro Tag?',
    subtext: 'Maximum: 13 €/Tag (ca. 390 €/Monat)',
    inputType: 'currency',
    validation: { min: 0, max: 13 },
    next: 'Q60c_arbeitgeber_zuschuss'
  },
  {
    id: 'Q60c_arbeitgeber_zuschuss',
    phase: 6,
    text: 'Bekommst du einen Arbeitgeber-Zuschuss zum Mutterschaftsgeld?',
    subtext: '⚠️ WICHTIG: Mutterschaftsgeld + AG-Zuschuss werden VOLL auf Elterngeld angerechnet (kein Sockelbetrag!)',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja' },
      { value: 'nein', label: 'Nein (z.B. arbeitslos)' }
    ],
    next: 'Q60d_weitere_anrechnungen'
  },
  {
    id: 'Q60d_weitere_anrechnungen',
    phase: 6,
    text: 'Beziehst du weitere Lohnersatzleistungen?',
    subtext: 'Diese werden teilweise angerechnet (300 € Sockelbetrag bleibt frei)',
    inputType: 'multiselect',
    options: [
      { value: 'krankengeld', label: 'Krankengeld' },
      { value: 'alg1', label: 'Arbeitslosengeld I' },
      { value: 'verletztengeld', label: 'Verletztengeld' },
      { value: 'uebergangsgeld', label: 'Übergangsgeld' },
      { value: 'nichts', label: 'Nichts davon' }
    ],
    next: 'Q70_elternzeit'
  },

  // ═══════════════════════════════════════════════════════════
  // PHASE 7: ELTERNZEIT-PLANUNG (§4, §4a, §4b)
  // ═══════════════════════════════════════════════════════════

  {
    id: 'Q70_elternzeit',
    phase: 7,
    text: 'Wie viele Monate Elternzeit planst du?',
    inputType: 'slider',
    options: { min: 0, max: 36, default: 12, step: 1, unit: 'Monate' },
    next: 'Q71_elterngeld_variante'
  },
  {
    id: 'Q71_elterngeld_variante',
    phase: 7,
    text: 'Welche Elterngeld-Variante möchtest du nutzen?',
    subtext: 'Basiselterngeld: max 1.800 € | ElterngeldPlus: max 900 €, dafür doppelt so lang',
    inputType: 'buttons',
    options: [
      { value: 'basis', label: 'Nur Basiselterngeld' },
      { value: 'plus', label: 'Nur ElterngeldPlus' },
      { value: 'kombi', label: 'Kombination (1 Basis = 2 Plus)' }
    ],
    next: (answer) => answer === 'kombi' ? 'Q71b_kombination' : 'Q72_teilzeit'
  },
  {
    id: 'Q71b_kombination',
    phase: 7,
    text: 'Wie möchtest du aufteilen?',
    subtext: '1 Monat Basiselterngeld = 2 Monate ElterngeldPlus',
    inputType: 'dual_slider',
    options: {
      slider1: { label: 'Basiselterngeld', min: 0, max: 12 },
      slider2: { label: 'ElterngeldPlus', min: 0, max: 24 }
    },
    next: 'Q72_teilzeit'
  },
  {
    id: 'Q72_teilzeit',
    phase: 7,
    text: 'Planst du während der Elternzeit in Teilzeit zu arbeiten?',
    subtext: 'Max. 32 Stunden/Woche für Elterngeld-Anspruch (§1 Abs. 6 BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'nein', label: 'Nein, komplett pausieren' },
      { value: 'ja', label: 'Ja, Teilzeit' }
    ],
    next: (answer) => answer === 'ja' ? 'Q72b_teilzeit_stunden' : 'Q73_gleichzeitig'
  },
  {
    id: 'Q72b_teilzeit_stunden',
    phase: 7,
    text: 'Wie viele Stunden pro Woche planst du zu arbeiten?',
    subtext: 'Max. 32 Stunden im Monatsdurchschnitt',
    inputType: 'slider',
    options: { min: 1, max: 32, default: 20, step: 1, unit: 'Std/Woche' },
    next: 'Q72c_teilzeit_netto'
  },
  {
    id: 'Q72c_teilzeit_netto',
    phase: 7,
    text: 'Wie hoch wird dein monatliches Netto in Teilzeit sein?',
    subtext: '⚠️ Bei Einkommen im Bezug: Vorgeburt-Einkommen wird auf 2.770 € gedeckelt (§2 Abs. 3)',
    inputType: 'currency',
    validation: { min: 0 },
    next: 'Q73_gleichzeitig'
  },
  {
    id: 'Q73_gleichzeitig',
    phase: 7,
    condition: (answers) => answers.Q8_partner === 'ja',
    text: 'Plant ihr gleichzeitig Elterngeld zu beziehen?',
    subtext: '⚠️ Basiselterngeld gleichzeitig nur in EINEM Monat erlaubt! (§4 Abs. 6) Ausnahme: Mehrlinge, Frühgeburt',
    inputType: 'buttons',
    options: [
      { value: 'nein', label: 'Nein, nacheinander' },
      { value: 'ja', label: 'Ja, gleichzeitig' }
    ],
    next: (answer, answers) => {
      if (answer === 'ja' && answers.Q71_elterngeld_variante === 'basis') {
        return 'Q73b_gleichzeitig_monat'
      }
      return 'Q74_partnerschaftsbonus'
    }
  },
  {
    id: 'Q73b_gleichzeitig_monat',
    phase: 7,
    text: 'In welchem Lebensmonat wollt ihr gleichzeitig Basiselterngeld beziehen?',
    subtext: 'Nur 1 Monat erlaubt (außer bei Mehrlinge/Frühgeburt)',
    inputType: 'slider',
    options: { min: 1, max: 14, default: 1, step: 1, unit: '. Lebensmonat' },
    next: 'Q74_partnerschaftsbonus'
  },
  {
    id: 'Q74_partnerschaftsbonus',
    phase: 7,
    condition: (answers) => answers.Q8_partner === 'ja',
    text: 'Interessiert euch der Partnerschaftsbonus?',
    subtext: '2-4 zusätzliche Monate ElterngeldPlus, wenn BEIDE gleichzeitig 24-32 Std/Woche arbeiten (§4b BEEG)',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, interessiert uns' },
      { value: 'nein', label: 'Nein / Nicht relevant' }
    ],
    next: (answer) => answer === 'ja' ? 'Q74b_partnerschaftsbonus_moeglich' : 'FERTIG_PERSON'
  },
  {
    id: 'Q74b_partnerschaftsbonus_moeglich',
    phase: 7,
    text: 'Könnten beide Elternteile gleichzeitig 24-32 Stunden/Woche arbeiten?',
    subtext: 'Voraussetzung: Beide müssen im gleichen Zeitraum Teilzeit arbeiten',
    inputType: 'buttons',
    options: [
      { value: 'ja', label: 'Ja, ist möglich' },
      { value: 'nein', label: 'Nein, nicht machbar' }
    ],
    next: 'FERTIG_PERSON'
  }
]
```

---

## UI-Komponenten

### ChatContainer.tsx
```tsx
export function ChatContainer() {
  const { messages, currentQuestion, sendAnswer, askQuestion } = useBerater()

  return (
    <div className="flex flex-col h-[100dvh]">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(msg => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Aktuelle Frage mit Input */}
        {currentQuestion && (
          <QuestionInput
            question={currentQuestion}
            onAnswer={sendAnswer}
          />
        )}
      </div>

      {/* Input für Rückfragen */}
      <ChatInput onSend={askQuestion} />
    </div>
  )
}
```

### ChatMessage.tsx
```tsx
export function ChatMessage({ message }: { message: ChatMessage }) {
  const isBot = message.type === 'bot'

  return (
    <div className={cn(
      "flex",
      isBot ? "justify-start" : "justify-end"
    )}>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3",
        isBot
          ? "bg-gray-100 rounded-tl-sm"
          : "bg-primary text-white rounded-tr-sm"
      )}>
        {message.content}
      </div>
    </div>
  )
}
```

### ButtonGroup.tsx (Antwort-Bubbles)
```tsx
export function ButtonGroup({ options, onSelect }: ButtonGroupProps) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className="px-5 py-2.5 rounded-full border-2 border-primary
                     text-primary font-medium
                     hover:bg-primary hover:text-white
                     active:scale-95 transition-all"
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
```

### ChatInput.tsx
```tsx
export function ChatInput({ onSend }: { onSend: (msg: string) => void }) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (value.trim()) {
      onSend(value)
      setValue('')
    }
  }

  return (
    <div className="border-t bg-white p-4 safe-area-bottom">
      <div className="flex gap-2 max-w-2xl mx-auto">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Eine Frage stellen..."
          className="flex-1"
        />
        <Button onClick={handleSend} size="icon">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
```

---

## Zu ändernde Dateien

### Frontend
1. **`app/portal/layout.tsx`** - Menüpunkt "Berater" (nur Premium)
2. **`app/portal/ergebnis/page.tsx`** - Nach Bezahlung → Redirect zu /portal/berater

### Backend (Xano)
1. **Tabellen:** `chat_sessions`, `chat_messages`
2. **Funktionen:** `ai_ask_question`
3. **APIs:** `/berater/ask`, `/berater/answer`, `/berater/state`

---

## Implementierungsreihenfolge

### Sprint 1: Basis-Chat (ohne AI)
1. Chat-Komponenten erstellen (Container, Message, Input)
2. Input-Komponenten (Buttons, Slider, Currency, Date)
3. Fragen-Definition (questions.ts)
4. useBerater Hook
5. Berater-Seite (/portal/berater)

### Sprint 2: Xano Integration
1. Tabellen in Xano erstellen
2. APIs erstellen (state, answer)
3. Frontend mit Xano verbinden
4. Antworten speichern

### Sprint 3: AI Rückfragen
1. Xano AI Funktion (Gemini 2.5 Flash)
2. API /berater/ask
3. ChatInput mit AI-Anbindung
4. Rate Limiting

### Sprint 4: Polish & Testing
1. Mobile-Optimierung
2. Edge Cases testen
3. Payment-Flow anpassen
4. Fehlerbehandlung

---

## Verifikation

### 1. BEEG-Compliance Checkliste

| Paragraph | Anforderung | Im Chat abgefragt? |
|-----------|-------------|-------------------|
| §1 Abs. 1 | Wohnsitz DE | ✅ Q6_wohnsitz |
| §1 Abs. 3 | Adoption | ✅ Q7_adoption |
| §1 Abs. 6 | Max 32h/Woche | ✅ Q72b_teilzeit_stunden |
| §1 Abs. 8 | Einkommensgrenze 175.000€ | ✅ Q10_einkommensgrenze |
| §2 Abs. 3 | Deckelung 2.770€ bei Teilzeit | ✅ In Berechnung |
| §2a Abs. 1-3 | Geschwisterbonus | ✅ Q15_geschwister |
| §2a Abs. 4 | Mehrlingszuschlag | ✅ Q4_mehrlinge |
| §2b Abs. 1 | Bemessungszeitraum | ✅ Berechnung Mutter vs Partner |
| §2b Abs. 1 S.2 | Ausklammerbare Monate | ✅ Q55_ausklammerung |
| §2c | Nichtselbständige | ✅ Q21-Q27 |
| §2c Abs. 1 S.2 | Sonstige Bezüge ausschließen | ✅ Q23_sonderzahlungen |
| §2d | Selbständige | ✅ Q30-Q35 |
| §2e Abs. 3 | Steuerklasse (nicht VI) | ✅ Q24_steuerklasse |
| §2e Abs. 5 | Kirchensteuer 8% | ✅ Q25_kirchensteuer |
| §2f | Sozialabgaben-Pauschalen (21%) | ✅ Q27_sozialversicherung |
| §2f Abs. 2 | Midijob/Übergangsbereich (538-2.000€) | ✅ Q28_midijob_check |
| §3 Abs. 1 | Mutterschaftsgeld-Anrechnung | ✅ Q60_mutterschaftsgeld |
| §4 Abs. 5 | Frühgeburten-Zusatzmonate | ✅ Q3_fruehgeburt |
| §4 Abs. 6 | Gleichzeitiger Bezug (nur 1 Monat Basis) | ✅ Q73_gleichzeitig |
| §4a | Basiselterngeld vs ElterngeldPlus | ✅ Q71_elterngeld_variante |
| §4b | Partnerschaftsbonus (24-32h) | ✅ Q74_partnerschaftsbonus |
| §4c | Alleinerziehende | ✅ Q9_alleinerziehend |
| §28 | Übergangsregelung 200.000€ | ✅ In Berechnung |

### 2. Manuell testen

**Flow pro Person:**
- [ ] Angestellte → alle Fragen Q21-Q27
- [ ] Selbständige → alle Fragen Q30-Q35
- [ ] Beamte → alle Fragen Q40-Q43
- [ ] Minijob → Q45-Q46
- [ ] Nicht erwerbstätig → Q50

**Edge Cases:**
- [ ] Alleinerziehende → 14 Monate allein (§4c)
- [ ] Einkommensgrenze > 175.000€ → Warnung
- [ ] Einkommensgrenze 175-200k + Geburt vor 01.04.2025 → OK (Übergangsregel)
- [ ] Mehrlinge → Zusatzmonate + Mehrlingszuschlag
- [ ] Frühgeburt ≥6 Wochen → +1-4 Monate
- [ ] Steuerklassenwechsel < 7 Monate vor Bemessungsende → WARNUNG
- [ ] Gleichzeitiger Basis-Bezug > 1 Monat → WARNUNG (außer Ausnahmen)
- [ ] Midijob (538-2000€) → Q28_midijob_check mit reduzierten Sozialabgaben
- [ ] PKV → keine KV-Pauschale

### 3. Berechnung validieren

```
Testfall 1: Standard-Angestellte
- Brutto: 3.500 €/Monat
- Steuerklasse IV, kirchensteuerpflichtig, GKV
- Erwartetes Netto vor Geburt: ca. 2.200 €
- Ersatzrate: 65% (da > 1.200€)
- Basiselterngeld: ca. 1.430 €

Testfall 2: Geringverdiener
- Netto: 800 €
- Ersatzrate: 67% + (1000-800)×0,05% = 77%
- Basiselterngeld: 616 €

Testfall 3: Selbständige mit Teilzeit
- Gewinn VJ: 36.000 € = 3.000 €/Monat
- Teilzeit während Bezug: 1.500 € Netto
- Berechnung mit §2 Abs. 3 (Deckelung 2.770€)

Testfall 4: Midijob (Übergangsbereich)
- Brutto: 1.200 €/Monat (im Übergangsbereich 538-2.000€)
- Reduzierte Sozialabgaben (§2f Abs. 2 S. 3)
- GKV, Steuerklasse I, keine Kirchensteuer
- Prüfung: Q28_midijob_check wird angezeigt

Testfall 5: Beamte
- Dienstbezüge Brutto: 4.000 €/Monat
- Steuerklasse III, kirchensteuerpflichtig
- KEINE Sozialabgaben-Pauschale (§2f)!
- Nur Steuerabzüge relevant
- Erwartetes Elterngeld-Netto: höher als bei Angestellten mit gleichem Brutto
```

### 4. TypeScript Checks

```bash
cd eltern-kompass
npm run build    # Keine Fehler
npm run lint     # Keine Warnungen
```
