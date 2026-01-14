# Phase 2: Xano Backend Implementierung

## Inhaltsverzeichnis

1. [Uebersicht](#1-uebersicht)
2. [XanoScript Syntax-Referenz](#2-xanoscript-syntax-referenz)
3. [Phase 2.1: Tabellen erstellen](#3-phase-21-tabellen-erstellen)
4. [Phase 2.2: BEEG-Berechnungsfunktionen](#4-phase-22-beeg-berechnungsfunktionen)
5. [Phase 2.3: Auth-Funktionen](#5-phase-23-auth-funktionen)
6. [Phase 2.4: APIs](#6-phase-24-apis)
7. [Phase 2.5: Scheduled Tasks](#7-phase-25-scheduled-tasks)
8. [Environment Variables](#8-environment-variables)
9. [Implementierungs-Reihenfolge](#9-implementierungs-reihenfolge)
10. [Verifikation](#10-verifikation)

---

## 1. Uebersicht

### Umfang

| Komponente | Anzahl | Beschreibung |
|------------|--------|--------------|
| **Tabellen** | 10 | Datenstruktur fuer Leads, Users, Households, Pregnancies, Parents, Calculations, Optimizations, Reminders, Payments, Household_Invitations |
| **Funktionen** | ~15 | BEEG-Berechnungen, Auth, Optimierungen |
| **APIs** | ~20 | Quick-Check, Auth, Household, Pregnancies, Parents, Calculations, Payments |
| **Scheduled Tasks** | 2 | Reminder-Versand, DSGVO-Cleanup |

### Xano-Konfiguration

```json
{
  "instanceName": "x8ki-letl-twmt",
  "workspaceName": "twilleke",
  "workspaceId": 128864,
  "branch": "v1",
  "paths": {
    "functions": "functions",
    "tables": "tables",
    "apis": "apis",
    "tasks": "tasks"
  }
}
```

### Push-Workflow

```bash
# Aenderungen zu Xano pushen via MCP Tool
push_all_changes_to_xano
```

---

## 2. XanoScript Syntax-Referenz

### Kommentare

```xs
// Kommentar auf eigener Zeile (NICHT innerhalb von Statements!)
var $greeting {
  value = "Hello"
}
```

**WICHTIG:** Kommentare muessen auf einer eigenen Zeile stehen, NICHT innerhalb eines Statements.

### Variablen

```xs
// Variable definieren
var $name {
  value = "Max Mustermann"
}

// Variable aktualisieren
var.update $name {
  value = "Erika Musterfrau"
}

// Objekt
var $user {
  value = {
    name: "Max"
    email: "max@example.com"
  }
}

// Array
var $numbers {
  value = [1, 2, 3, 4, 5]
}
```

### Filter

```xs
// In Inputs
text email filters=trim|lower {
  description = "E-Mail-Adresse"
}

// In Variablen
var $formatted_date {
  value = $timestamp|format_timestamp:"Y-m-d"
}

// Haeufige Filter
// trim - Whitespace entfernen
// lower - Kleinbuchstaben
// min:X - Minimum
// max:X - Maximum
// round:X - Rundung auf X Nachkommastellen
```

### Environment Variables

```xs
// Zugriff auf Umgebungsvariablen
$env.STRIPE_SECRET_KEY
$env.RESEND_API_KEY
$env.APP_URL
```

### Conditionals

```xs
conditional {
  if ($value > 100) {
    // Aktion fuer > 100
  }
  elseif ($value > 50) {
    // Aktion fuer 50-100
  }
  else {
    // Aktion fuer <= 50
  }
}
```

### Loops

```xs
foreach ($items) {
  each as $item {
    // Verarbeitung
  }
}
```

### Datenbank-Operationen

```xs
// Einzelnen Datensatz holen
db.get "users" {
  field_name = "id"
  field_value = 123
} as $user

// Mehrere Datensaetze abfragen
db.query "users" {
  where = $db.users.household_id == 1
  return = {type: "list"}
} as $users

// Datensatz erstellen
db.post "users" {
  data = {
    email: "test@example.com"
    password: "secret123"
  }
} as $new_user

// Datensatz aktualisieren
db.edit "users" {
  field_name = "id"
  field_value = 123
  data = {
    first_name: "Max"
  }
}

// Datensatz loeschen
db.delete "users" {
  field_name = "id"
  field_value = 123
}
```

### Funktionen aufrufen

```xs
function.run "elterngeld/calculate_ersatzrate" {
  input = {
    elterngeld_netto: 2000
  }
} as $ersatzrate
```

---

## 3. Phase 2.1: Tabellen erstellen

### WICHTIG: Reihenfolge beachten!

1. **Schritt 1:** Alle Tabellen OHNE Foreign Keys erstellen
2. **Schritt 2:** Foreign Key Referenzen hinzufuegen
3. **Schritt 3:** `push_all_changes_to_xano` ausfuehren

Xano lehnt Tabellen ab, wenn referenzierte Tabellen noch nicht existieren!

---

### Schritt 1: Tabellen OHNE Foreign Keys

#### a) `tables/households.xs`

```xs
// Haushalt - zentrale Einheit fuer ein Paar
// Premium-Status gilt fuer den gesamten Household
table "households" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Household-ID"
    }

    enum premium_tier?="free" {
      values = ["free", "premium", "premium_plus"]
      description = "Premium-Stufe: free=Basis, premium=79 EUR, premium_plus=149 EUR"
    }

    timestamp premium_purchased_at? {
      description = "Zeitpunkt des Premium-Kaufs"
    }

    timestamp premium_expires_at? {
      description = "Ablaufdatum (NULL = unbegrenzt)"
    }

    text invite_code? filters=trim {
      description = "6-stelliger Einladungscode fuer Partner"
    }

    int lead_id? {
      description = "Urspruenglicher Lead (fuer Tracking)"
    }

    timestamp created_at?=now {
      description = "Erstellungszeitpunkt"
    }

    timestamp updated_at?=now {
      description = "Letzte Aktualisierung"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "invite_code", op: "asc"}]}
    {type: "btree", field: [{name: "premium_tier", op: "asc"}]}
    {type: "btree", field: [{name: "lead_id", op: "asc"}]}
  ]
}
```

#### b) `tables/leads.xs`

```xs
// Leads aus Quick-Check (nicht registrierte Nutzer)
table "leads" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Lead-ID"
    }

    email email filters=trim|lower {
      description = "E-Mail-Adresse des Leads"
      sensitive = true
    }

    date due_date {
      description = "Errechneter Geburtstermin (ET)"
    }

    enum bundesland {
      values = ["BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV", "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH"]
      description = "Bundesland des Wohnsitzes"
    }

    json quick_check_data? {
      description = "JSON mit Antworten des Quick-Checks"
    }

    decimal estimated_elterngeld? filters=min:0 {
      description = "Geschaetztes Elterngeld aus Quick-Check"
    }

    bool consent_marketing?=false {
      description = "Zustimmung zu Marketing-E-Mails"
    }

    bool consent_privacy?=false {
      description = "Zustimmung Datenschutz"
    }

    text utm_source? filters=trim {
      description = "Marketing-Quelle"
    }

    text utm_medium? filters=trim {
      description = "Marketing-Medium"
    }

    text utm_campaign? filters=trim {
      description = "Marketing-Kampagne"
    }

    timestamp created_at?=now {
      description = "Erstellungszeitpunkt"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "email", op: "asc"}]}
    {type: "btree", field: [{name: "due_date", op: "asc"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
  ]
}
```

#### c) `tables/users.xs`

```xs
// Benutzer-Tabelle mit Xano Auth
table "users" {
  auth = true
  schema {
    int id {
      description = "Eindeutige User-ID"
    }

    email email filters=trim|lower {
      description = "E-Mail-Adresse (Login)"
      sensitive = true
    }

    password password {
      description = "Passwort (automatisch gehasht)"
      sensitive = true
    }

    int household_id {
      description = "Referenz zum Household"
    }

    enum household_role?="owner" {
      values = ["owner", "partner"]
      description = "owner = Ersteller, partner = eingeladen"
    }

    text first_name? filters=trim {
      description = "Vorname"
    }

    text last_name? filters=trim {
      description = "Nachname"
      sensitive = true
    }

    bool email_verified?=false {
      description = "E-Mail bestaetigt"
    }

    text email_verification_token? {
      description = "Token fuer Verifizierungs-Link"
      sensitive = true
    }

    timestamp email_verified_at? {
      description = "Zeitpunkt der Bestaetigung"
    }

    text password_reset_token? {
      description = "Token fuer Passwort-Reset (24h gueltig)"
      sensitive = true
    }

    timestamp password_reset_expires_at? {
      description = "Ablaufzeit des Reset-Tokens"
    }

    bool consent_marketing?=false {
      description = "Einwilligung Marketing-E-Mails"
    }

    bool consent_privacy?=true {
      description = "Datenschutz akzeptiert"
    }

    timestamp consent_privacy_at? {
      description = "Zeitpunkt der Datenschutz-Zustimmung"
    }

    timestamp last_login_at? {
      description = "Letzter Login"
    }

    text last_login_ip? {
      description = "IP beim letzten Login"
      sensitive = true
    }

    timestamp created_at?=now {
      description = "Registrierungszeitpunkt"
    }

    timestamp updated_at?=now {
      description = "Letzte Profilaenderung"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "email", op: "asc"}]}
    {type: "btree", field: [{name: "household_id", op: "asc"}]}
    {type: "btree", field: [{name: "email_verification_token", op: "asc"}]}
    {type: "btree", field: [{name: "password_reset_token", op: "asc"}]}
  ]
}
```

#### d) `tables/household_invitations.xs`

```xs
// Partner-Einladungen
table "household_invitations" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Einladungs-ID"
    }

    int household_id {
      description = "Zu welchem Household"
    }

    int invited_by_user_id {
      description = "Wer hat eingeladen (Owner)"
    }

    email invited_email filters=trim|lower {
      description = "E-Mail des Partners"
      sensitive = true
    }

    text token {
      description = "Einzigartiger Token fuer Link"
      sensitive = true
    }

    enum status?="pending" {
      values = ["pending", "accepted", "expired", "cancelled"]
      description = "Status der Einladung"
    }

    timestamp expires_at {
      description = "Ablaufzeitpunkt (7 Tage)"
    }

    timestamp accepted_at? {
      description = "Wann angenommen"
    }

    int accepted_by_user_id? {
      description = "User-ID des neuen Partners"
    }

    timestamp created_at?=now {
      description = "Erstellungszeitpunkt"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree|unique", field: [{name: "token", op: "asc"}]}
    {type: "btree", field: [{name: "household_id", op: "asc"}]}
    {type: "btree", field: [{name: "invited_email", op: "asc"}]}
    {type: "btree", field: [{name: "status", op: "asc"}]}
    {type: "btree", field: [{name: "expires_at", op: "asc"}]}
  ]
}
```

#### e) `tables/pregnancies.xs`

```xs
// Schwangerschaftsdaten
table "pregnancies" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Schwangerschafts-ID"
    }

    int household_id {
      description = "Referenz zum Household - beide Partner haben Zugriff"
    }

    date due_date {
      description = "Errechneter Geburtstermin (ET)"
    }

    date actual_birth_date? {
      description = "Tatsaechliches Geburtsdatum"
    }

    enum bundesland {
      values = ["BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV", "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH"]
      description = "Bundesland des Wohnsitzes"
    }

    bool is_multiple?=false {
      description = "Mehrlingsgeburt (Zwillinge, Drillinge)"
    }

    int multiple_count?=1 filters=min:1|max:5 {
      description = "Anzahl Kinder bei Mehrlingsgeburt"
    }

    bool is_premature?=false {
      description = "Fruehgeburt (vor 37. SSW)"
    }

    date mutterschutz_start? {
      description = "Berechneter Mutterschutz-Beginn"
    }

    date mutterschutz_end? {
      description = "Berechnetes Mutterschutz-Ende"
    }

    int existing_children_under_3?=0 filters=min:0 {
      description = "Kinder unter 3 Jahren (Geschwisterbonus)"
    }

    int existing_children_under_6?=0 filters=min:0 {
      description = "Kinder unter 6 Jahren"
    }

    int existing_children_with_disability?=0 filters=min:0 {
      description = "Kinder mit Behinderung unter 14 Jahren"
    }

    bool is_married?=false {
      description = "Verheiratet oder eingetragene Lebenspartnerschaft"
    }

    bool lives_together?=true {
      description = "Eltern leben zusammen"
    }

    bool is_single_parent?=false {
      description = "Alleinerziehend nach Paragraph 4c BEEG"
    }

    enum single_parent_reason? {
      values = ["tax_relief", "child_welfare", "care_impossible"]
      description = "Grund fuer Alleinerziehenden-Status"
    }

    bool partner_lives_separately?=false {
      description = "Partner lebt nicht im selben Haushalt"
    }

    bool child_welfare_at_risk?=false {
      description = "Kindeswohl bei Betreuung durch anderen Elternteil gefaehrdet"
    }

    bool partner_care_impossible?=false {
      description = "Betreuung durch anderen Elternteil unmoeglich"
    }

    timestamp created_at?=now {
      description = "Erstellungszeitpunkt"
    }

    timestamp updated_at?=now {
      description = "Letzte Aktualisierung"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "household_id", op: "asc"}]}
    {type: "btree", field: [{name: "due_date", op: "asc"}]}
    {type: "btree", field: [{name: "is_single_parent", op: "asc"}]}
  ]
}
```

#### f) `tables/parents.xs`

```xs
// Elternteil-Daten
table "parents" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Elternteil-ID"
    }

    int pregnancy_id {
      description = "Referenz zur Schwangerschaft"
    }

    enum role {
      values = ["mother", "partner"]
      description = "Rolle: Mutter oder Partner"
    }

    text first_name? filters=trim {
      description = "Vorname"
    }

    enum employment_type {
      values = ["angestellt", "selbststaendig", "beamtet", "nicht_erwerbstaetig", "minijob", "arbeitslos", "student", "elternzeit"]
      description = "Art der Beschaeftigung"
    }

    bool has_multiple_jobs?=false {
      description = "Mehrere Beschaeftigungen"
    }

    decimal gross_income_monthly? filters=min:0 {
      description = "Durchschn. Bruttoeinkommen monatlich im Bemessungszeitraum"
    }

    json monthly_incomes? {
      description = "Detaillierte Einkommen der 12 Monate"
    }

    decimal bonus_annual? filters=min:0 {
      description = "Jaehrliche Sonderzahlungen (Weihnachts-/Urlaubsgeld)"
    }

    bool has_commission?=false {
      description = "Hat Provisionen/variable Verguetung"
    }

    decimal commission_average? filters=min:0 {
      description = "Durchschn. monatliche Provision"
    }

    enum tax_class {
      values = ["1", "2", "3", "4", "5", "6"]
      description = "Aktuelle Steuerklasse"
    }

    enum tax_class_assessment? {
      values = ["1", "2", "3", "4", "5", "6"]
      description = "Steuerklasse im Bemessungszeitraum (7 von 12 Monaten)"
    }

    bool church_tax?=false {
      description = "Kirchensteuerpflichtig (immer 8% nach Paragraph 2e Abs. 5 BEEG)"
    }

    enum health_insurance {
      values = ["gkv", "pkv"]
      description = "Krankenversicherung: GKV=9% Pauschale, PKV=keine"
    }

    bool pension_insurance?=true {
      description = "Rentenversicherungspflichtig (10% Pauschale)"
    }

    bool unemployment_insurance?=true {
      description = "Arbeitslosenversicherungspflichtig (2% Pauschale)"
    }

    decimal taxable_income_annual? filters=min:0 {
      description = "Zu versteuerndes Einkommen lt. Steuerbescheid (175.000 EUR Grenze)"
    }

    decimal maternity_benefit_daily?=0 filters=min:0|max:13 {
      description = "Mutterschaftsgeld pro Tag von Krankenkasse (max 13 EUR)"
    }

    decimal employer_supplement_daily?=0 filters=min:0 {
      description = "Arbeitgeberzuschuss zum Mutterschaftsgeld pro Tag"
    }

    date maternity_benefit_start? {
      description = "Beginn Mutterschaftsgeld-Bezug"
    }

    date maternity_benefit_end? {
      description = "Ende Mutterschaftsgeld-Bezug"
    }

    int planned_months_basis?=0 filters=min:0|max:14 {
      description = "Geplante Monate Basiselterngeld"
    }

    int planned_months_plus?=0 filters=min:0|max:28 {
      description = "Geplante Monate ElterngeldPlus"
    }

    int work_hours_during?=0 filters=min:0|max:32 {
      description = "Geplante Arbeitsstunden/Woche waehrend Elternzeit"
    }

    decimal expected_income_during? filters=min:0 {
      description = "Erwartetes Bruttoeinkommen waehrend Teilzeit"
    }

    bool wants_partnership_bonus?=false {
      description = "Partnerschaftsbonus gewuenscht (beide 24-32h)"
    }

    json exclusion_months? {
      description = "Monate die aus Bemessungszeitraum ausgeschlossen werden"
    }

    timestamp created_at?=now {
      description = "Erstellungszeitpunkt"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "pregnancy_id", op: "asc"}]}
    {type: "btree", field: [{name: "role", op: "asc"}]}
  ]
}
```

#### g) `tables/calculations.xs`

```xs
// Berechnungsergebnisse
table "calculations" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Berechnungs-ID"
    }

    int pregnancy_id {
      description = "Referenz zur Schwangerschaft"
    }

    decimal baseline_total?=0 filters=min:0 {
      description = "Elterngeld ohne Optimierung (Summe beider Elternteile)"
    }

    decimal optimized_total?=0 filters=min:0 {
      description = "Elterngeld mit Optimierung (Summe)"
    }

    decimal optimization_potential?=0 filters=min:0 {
      description = "Berechnetes Optimierungspotenzial in EUR"
    }

    json mother_baseline? {
      description = "Berechnung Mutter ohne Optimierung"
    }

    json mother_optimized? {
      description = "Berechnung Mutter mit Optimierung"
    }

    json partner_baseline? {
      description = "Berechnung Partner ohne Optimierung"
    }

    json partner_optimized? {
      description = "Berechnung Partner mit Optimierung"
    }

    json scenarios? {
      description = "Alle berechneten Szenarien zum Vergleich"
    }

    enum best_scenario? {
      values = ["basis_only", "plus_only", "mixed_mother_basis", "mixed_partner_basis", "partnership_bonus", "custom"]
      description = "Empfohlenes Szenario"
    }

    text recommendation_summary? {
      description = "Zusammenfassung der Empfehlung"
    }

    decimal geschwisterbonus?=0 filters=min:0 {
      description = "Berechneter Geschwisterbonus"
    }

    decimal landeserziehungsgeld?=0 filters=min:0 {
      description = "Landeserziehungsgeld (BY/SN/TH)"
    }

    decimal kinderzuschlag_monthly?=0 filters=min:0 {
      description = "Geschaetzter Kinderzuschlag pro Monat"
    }

    decimal wohngeld_monthly?=0 filters=min:0 {
      description = "Geschaetztes Wohngeld pro Monat"
    }

    text calculation_version?="1.0" {
      description = "Version der Berechnungslogik"
    }

    timestamp created_at?=now {
      description = "Erstellungszeitpunkt"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "pregnancy_id", op: "asc"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
  ]
}
```

#### h) `tables/optimizations.xs`

```xs
// Gefundene Optimierungen
table "optimizations" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Optimierungs-ID"
    }

    int calculation_id {
      description = "Referenz zur Berechnung"
    }

    enum type {
      values = ["tax_class_switch", "elterngeld_plus_mother", "elterngeld_plus_partner", "partnership_bonus", "sibling_bonus", "landeserziehungsgeld", "kinderzuschlag", "wohngeld", "timing_optimization", "income_shifting", "exclusion_months"]
      description = "Art der Optimierung"
    }

    decimal potential_gain?=0 filters=min:0 {
      description = "Potenzieller Mehrwert in EUR"
    }

    text title filters=trim {
      description = "Kurztitel der Optimierung"
    }

    text description? {
      description = "Detaillierte Beschreibung"
    }

    text how_to? {
      description = "Schritt-fuer-Schritt Anleitung"
    }

    text requirements? {
      description = "Voraussetzungen"
    }

    text risks? {
      description = "Moegliche Risiken oder Nachteile"
    }

    date deadline? {
      description = "Frist fuer die Umsetzung"
    }

    int priority?=99 filters=min:1 {
      description = "Prioritaet (1 = hoechste)"
    }

    enum difficulty {
      values = ["easy", "medium", "hard"]
      description = "Schwierigkeitsgrad"
    }

    bool completed?=false {
      description = "Optimierung umgesetzt"
    }

    timestamp completed_at? {
      description = "Zeitpunkt der Umsetzung"
    }

    timestamp created_at?=now {
      description = "Erstellungszeitpunkt"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "calculation_id", op: "asc"}]}
    {type: "btree", field: [{name: "type", op: "asc"}]}
    {type: "btree", field: [{name: "priority", op: "asc"}]}
    {type: "btree", field: [{name: "completed", op: "asc"}]}
  ]
}
```

#### i) `tables/reminders.xs`

```xs
// Erinnerungen und Fristen
table "reminders" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Erinnerungs-ID"
    }

    int user_id? {
      description = "Referenz zum User"
    }

    int lead_id? {
      description = "Referenz zum Lead (nicht-registrierte)"
    }

    int pregnancy_id? {
      description = "Referenz zur Schwangerschaft"
    }

    enum reminder_type {
      values = ["steuerklasse_wechsel", "mutterschutz_beginn", "elterngeld_antrag", "kindergeld_antrag", "elternzeit_antrag", "landesleistung_antrag", "geburtsurkunde", "vaterschaftsanerkennung", "custom"]
      description = "Art der Erinnerung"
    }

    date due_date {
      description = "Faelligkeitsdatum"
    }

    int remind_days_before?=7 filters=min:1 {
      description = "Tage vor Faelligkeit erinnern"
    }

    text title filters=trim {
      description = "Titel der Erinnerung"
    }

    text description? {
      description = "Beschreibung"
    }

    text action_url? {
      description = "Link zur Aktion"
    }

    bool email_sent?=false {
      description = "E-Mail-Erinnerung gesendet"
    }

    timestamp email_sent_at? {
      description = "Zeitpunkt des E-Mail-Versands"
    }

    bool push_sent?=false {
      description = "Push-Benachrichtigung gesendet"
    }

    bool completed?=false {
      description = "Aufgabe erledigt"
    }

    timestamp completed_at? {
      description = "Zeitpunkt der Erledigung"
    }

    timestamp created_at?=now {
      description = "Erstellungszeitpunkt"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "user_id", op: "asc"}]}
    {type: "btree", field: [{name: "lead_id", op: "asc"}]}
    {type: "btree", field: [{name: "due_date", op: "asc"}]}
    {type: "btree", field: [{name: "email_sent", op: "asc"}]}
    {type: "btree", field: [{name: "completed", op: "asc"}]}
  ]
}
```

#### j) `tables/payments.xs`

```xs
// Zahlungen (Premium pro Household)
table "payments" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Payment-ID"
    }

    int household_id {
      description = "Household der Premium erhaelt"
    }

    int purchased_by_user_id {
      description = "Welcher User hat gekauft"
    }

    text stripe_payment_id? filters=trim {
      description = "Stripe Payment Intent ID"
      sensitive = true
    }

    text stripe_checkout_session_id? filters=trim {
      description = "Stripe Checkout Session ID"
      sensitive = true
    }

    text stripe_customer_id? filters=trim {
      description = "Stripe Customer ID"
      sensitive = true
    }

    int amount filters=min:0 {
      description = "Betrag in Cent (7900 = 79 EUR)"
    }

    enum currency?="eur" {
      values = ["eur"]
      description = "Waehrung"
    }

    enum status {
      values = ["pending", "processing", "completed", "refunded", "failed", "disputed"]
      description = "Zahlungsstatus"
    }

    enum product {
      values = ["premium", "premium_plus"]
      description = "Gekauftes Produkt"
    }

    json stripe_metadata? {
      description = "Zusaetzliche Metadaten von Stripe"
      sensitive = true
    }

    text refund_reason? {
      description = "Grund fuer Erstattung"
    }

    timestamp created_at?=now {
      description = "Erstellungszeitpunkt"
    }

    timestamp completed_at? {
      description = "Zeitpunkt der erfolgreichen Zahlung"
    }

    timestamp refunded_at? {
      description = "Zeitpunkt der Erstattung"
    }
  }

  index = [
    {type: "primary", field: [{name: "id"}]}
    {type: "btree", field: [{name: "household_id", op: "asc"}]}
    {type: "btree", field: [{name: "purchased_by_user_id", op: "asc"}]}
    {type: "btree|unique", field: [{name: "stripe_payment_id", op: "asc"}]}
    {type: "btree", field: [{name: "status", op: "asc"}]}
    {type: "btree", field: [{name: "created_at", op: "desc"}]}
  ]
}
```

---

### Schritt 2: Foreign Keys hinzufuegen

Nach dem Erstellen aller Tabellen, Foreign Key Referenzen hinzufuegen:

#### `tables/users.xs` - Update

```xs
// In schema, household_id ergaenzen:
int household_id {
  table = "households"
  description = "Referenz zum Household"
}
```

#### `tables/household_invitations.xs` - Update

```xs
int household_id {
  table = "households"
  description = "Zu welchem Household"
}

int invited_by_user_id {
  table = "users"
  description = "Wer hat eingeladen (Owner)"
}

int accepted_by_user_id? {
  table = "users"
  description = "User-ID des neuen Partners"
}
```

#### `tables/pregnancies.xs` - Update

```xs
int household_id {
  table = "households"
  description = "Referenz zum Household"
}
```

#### `tables/parents.xs` - Update

```xs
int pregnancy_id {
  table = "pregnancies"
  description = "Referenz zur Schwangerschaft"
}
```

#### `tables/calculations.xs` - Update

```xs
int pregnancy_id {
  table = "pregnancies"
  description = "Referenz zur Schwangerschaft"
}
```

#### `tables/optimizations.xs` - Update

```xs
int calculation_id {
  table = "calculations"
  description = "Referenz zur Berechnung"
}
```

#### `tables/reminders.xs` - Update

```xs
int user_id? {
  table = "users"
  description = "Referenz zum User"
}

int lead_id? {
  table = "leads"
  description = "Referenz zum Lead"
}

int pregnancy_id? {
  table = "pregnancies"
  description = "Referenz zur Schwangerschaft"
}
```

#### `tables/payments.xs` - Update

```xs
int household_id {
  table = "households"
  description = "Household der Premium erhaelt"
}

int purchased_by_user_id {
  table = "users"
  description = "Welcher User hat gekauft"
}
```

---

## 4. Phase 2.2: BEEG-Berechnungsfunktionen

### a) `functions/elterngeld/calculate_mutterschutz.xs`

```xs
// Berechnet Mutterschutz-Zeitraum nach MuSchG
function "elterngeld/calculate_mutterschutz" {
  description = "Berechnet Mutterschutz-Zeitraum nach MuSchG"

  input {
    date due_date {
      description = "Errechneter Geburtstermin"
    }

    bool is_multiple?=false {
      description = "Mehrlingsgeburt"
    }

    bool is_premature?=false {
      description = "Fruehgeburt"
    }

    bool is_disabled_child?=false {
      description = "Kind mit Behinderung"
    }
  }

  stack {
    // Mutterschutz-Beginn: 6 Wochen vor ET (42 Tage)
    var $mutterschutz_start {
      value = $input.due_date|transform_timestamp:"-42 days"|format_timestamp:"Y-m-d"
    }

    // Standard: 8 Wochen nach Geburt
    var $weeks_after {
      value = 8
    }

    // 12 Wochen bei: Mehrlinge, Fruehgeburt, Kind mit Behinderung
    conditional {
      if ($input.is_multiple == true) {
        var.update $weeks_after {
          value = 12
        }
      }
      elseif ($input.is_premature == true) {
        var.update $weeks_after {
          value = 12
        }
      }
      elseif ($input.is_disabled_child == true) {
        var.update $weeks_after {
          value = 12
        }
      }
    }

    // Tage nach Geburt berechnen
    var $days_after {
      value = $weeks_after|multiply:7
    }

    // Mutterschutz-Ende berechnen
    var $transform_string {
      value = "+" ~ $days_after ~ " days"
    }

    var $mutterschutz_end {
      value = $input.due_date|transform_timestamp:$transform_string|format_timestamp:"Y-m-d"
    }

    // Bemessungszeitraum Mutter: 12 Monate vor Mutterschutz-Beginn
    var $bemessungszeitraum_start {
      value = $mutterschutz_start|transform_timestamp:"-12 months"|format_timestamp:"Y-m-d"
    }

    var $bemessungszeitraum_end {
      value = $mutterschutz_start|transform_timestamp:"-1 day"|format_timestamp:"Y-m-d"
    }

    // Gesamtwochen berechnen
    var $total_weeks {
      value = 6|add:$weeks_after
    }
  }

  response = {
    mutterschutz_start: $mutterschutz_start
    mutterschutz_end: $mutterschutz_end
    weeks_before: 6
    weeks_after: $weeks_after
    total_weeks: $total_weeks
    bemessungszeitraum: {
      start: $bemessungszeitraum_start
      end: $bemessungszeitraum_end
    }
  }
}
```

### b) `functions/elterngeld/calculate_elterngeld_netto.xs`

```xs
// Berechnet Elterngeld-Netto nach BEEG Pauschalabzuegen
// Paragraph 2e + 2f BEEG
function "elterngeld/calculate_elterngeld_netto" {
  description = "Berechnet Elterngeld-Netto nach BEEG Pauschalabzuegen"

  input {
    decimal brutto_monatlich filters=min:0 {
      description = "Durchschnittliches Bruttogehalt im Bemessungszeitraum"
    }

    enum tax_class {
      values = ["1", "2", "3", "4", "5", "6"]
      description = "Steuerklasse im Bemessungszeitraum"
    }

    bool church_tax?=false {
      description = "Kirchensteuerpflichtig"
    }

    bool gkv_insured?=true {
      description = "Gesetzlich krankenversichert"
    }

    bool pension_insured?=true {
      description = "Rentenversicherungspflichtig"
    }

    bool unemployment_insured?=true {
      description = "Arbeitslosenversicherungspflichtig"
    }
  }

  stack {
    // SCHRITT 1: Werbungskostenpauschale abziehen
    // 1.230 EUR jaehrlich / 12 = 102,50 EUR monatlich
    var $werbungskosten {
      value = 102.50
    }

    var $bereinigtes_brutto_raw {
      value = $input.brutto_monatlich|subtract:$werbungskosten
    }

    // Sicherstellen dass nicht negativ
    var $bereinigtes_brutto {
      value = $bereinigtes_brutto_raw
    }

    conditional {
      if ($bereinigtes_brutto_raw < 0) {
        var.update $bereinigtes_brutto {
          value = 0
        }
      }
    }

    // SCHRITT 2: Lohnsteuer nach Steuerklasse
    // Grundfreibetrag 2024: 11.604 EUR jaehrlich = 967 EUR monatlich
    var $grundfreibetrag_monatlich {
      value = 967
    }

    var $lohnsteuer {
      value = 0
    }

    // Steuerklasse 1 und 4: Standard-Tarif
    conditional {
      if ($input.tax_class == "1") {
        var $zu_versteuern_raw {
          value = $bereinigtes_brutto|subtract:$grundfreibetrag_monatlich
        }
        var $zu_versteuern {
          value = $zu_versteuern_raw
        }
        conditional {
          if ($zu_versteuern_raw < 0) {
            var.update $zu_versteuern {
              value = 0
            }
          }
        }
        conditional {
          if ($zu_versteuern <= 1000) {
            var.update $lohnsteuer {
              value = $zu_versteuern|multiply:0.14
            }
          }
          elseif ($zu_versteuern <= 2500) {
            var $teil1 {
              value = $zu_versteuern|subtract:1000
            }
            var $teil2 {
              value = $teil1|multiply:0.24
            }
            var.update $lohnsteuer {
              value = 140|add:$teil2
            }
          }
          else {
            var $teil1 {
              value = $zu_versteuern|subtract:2500
            }
            var $teil2 {
              value = $teil1|multiply:0.42
            }
            var.update $lohnsteuer {
              value = 500|add:$teil2
            }
          }
        }
      }
      elseif ($input.tax_class == "4") {
        var $zu_versteuern_raw {
          value = $bereinigtes_brutto|subtract:$grundfreibetrag_monatlich
        }
        var $zu_versteuern {
          value = $zu_versteuern_raw
        }
        conditional {
          if ($zu_versteuern_raw < 0) {
            var.update $zu_versteuern {
              value = 0
            }
          }
        }
        conditional {
          if ($zu_versteuern <= 1000) {
            var.update $lohnsteuer {
              value = $zu_versteuern|multiply:0.14
            }
          }
          elseif ($zu_versteuern <= 2500) {
            var $teil1 {
              value = $zu_versteuern|subtract:1000
            }
            var $teil2 {
              value = $teil1|multiply:0.24
            }
            var.update $lohnsteuer {
              value = 140|add:$teil2
            }
          }
          else {
            var $teil1 {
              value = $zu_versteuern|subtract:2500
            }
            var $teil2 {
              value = $teil1|multiply:0.42
            }
            var.update $lohnsteuer {
              value = 500|add:$teil2
            }
          }
        }
      }
      elseif ($input.tax_class == "2") {
        // Steuerklasse 2: Entlastungsbetrag fuer Alleinerziehende (4.260 EUR/Jahr = 355 EUR/Monat)
        var $entlastung_monatlich {
          value = 355
        }
        var $abzug_gesamt {
          value = $grundfreibetrag_monatlich|add:$entlastung_monatlich
        }
        var $zu_versteuern_raw {
          value = $bereinigtes_brutto|subtract:$abzug_gesamt
        }
        var $zu_versteuern {
          value = $zu_versteuern_raw
        }
        conditional {
          if ($zu_versteuern_raw < 0) {
            var.update $zu_versteuern {
              value = 0
            }
          }
        }
        conditional {
          if ($zu_versteuern <= 1000) {
            var.update $lohnsteuer {
              value = $zu_versteuern|multiply:0.14
            }
          }
          elseif ($zu_versteuern <= 2500) {
            var $teil1 {
              value = $zu_versteuern|subtract:1000
            }
            var $teil2 {
              value = $teil1|multiply:0.24
            }
            var.update $lohnsteuer {
              value = 140|add:$teil2
            }
          }
          else {
            var $teil1 {
              value = $zu_versteuern|subtract:2500
            }
            var $teil2 {
              value = $teil1|multiply:0.42
            }
            var.update $lohnsteuer {
              value = 500|add:$teil2
            }
          }
        }
      }
      elseif ($input.tax_class == "3") {
        // Steuerklasse 3: Doppelter Grundfreibetrag (Splitting)
        var $doppelter_freibetrag {
          value = $grundfreibetrag_monatlich|multiply:2
        }
        var $zu_versteuern_raw {
          value = $bereinigtes_brutto|subtract:$doppelter_freibetrag
        }
        var $zu_versteuern {
          value = $zu_versteuern_raw
        }
        conditional {
          if ($zu_versteuern_raw < 0) {
            var.update $zu_versteuern {
              value = 0
            }
          }
        }
        conditional {
          if ($zu_versteuern <= 2000) {
            var.update $lohnsteuer {
              value = $zu_versteuern|multiply:0.14
            }
          }
          elseif ($zu_versteuern <= 5000) {
            var $teil1 {
              value = $zu_versteuern|subtract:2000
            }
            var $teil2 {
              value = $teil1|multiply:0.24
            }
            var.update $lohnsteuer {
              value = 280|add:$teil2
            }
          }
          else {
            var $teil1 {
              value = $zu_versteuern|subtract:5000
            }
            var $teil2 {
              value = $teil1|multiply:0.42
            }
            var.update $lohnsteuer {
              value = 1000|add:$teil2
            }
          }
        }
      }
      elseif ($input.tax_class == "5") {
        // Steuerklasse 5: Kein Grundfreibetrag
        var $zu_versteuern {
          value = $bereinigtes_brutto
        }
        conditional {
          if ($zu_versteuern <= 1000) {
            var.update $lohnsteuer {
              value = $zu_versteuern|multiply:0.24
            }
          }
          elseif ($zu_versteuern <= 2500) {
            var $teil1 {
              value = $zu_versteuern|subtract:1000
            }
            var $teil2 {
              value = $teil1|multiply:0.32
            }
            var.update $lohnsteuer {
              value = 240|add:$teil2
            }
          }
          else {
            var $teil1 {
              value = $zu_versteuern|subtract:2500
            }
            var $teil2 {
              value = $teil1|multiply:0.42
            }
            var.update $lohnsteuer {
              value = 720|add:$teil2
            }
          }
        }
      }
      else {
        // Steuerklasse 6: Hoechste Belastung (42% auf alles)
        var.update $lohnsteuer {
          value = $bereinigtes_brutto|multiply:0.42
        }
      }
    }

    // SCHRITT 3: Solidaritaetszuschlag (5.5% der Lohnsteuer)
    var $soli {
      value = 0
    }

    conditional {
      if ($lohnsteuer > 81.87) {
        var.update $soli {
          value = $lohnsteuer|multiply:0.055
        }
      }
    }

    // SCHRITT 4: Kirchensteuer
    // Paragraph 2e Abs. 5 BEEG: IMMER 8%, unabhaengig vom Bundesland!
    var $kirchensteuer {
      value = 0
    }

    conditional {
      if ($input.church_tax == true) {
        var.update $kirchensteuer {
          value = $lohnsteuer|multiply:0.08
        }
      }
    }

    // SCHRITT 5: Sozialabgaben nach BEEG-Pauschalen (Paragraph 2f)
    // WICHTIG: Feste Pauschalen, NICHT tatsaechliche AN-Anteile!
    // KV/PV: 9% (NICHT 8.1% + 1.7%)
    // RV: 10% (NICHT 9.3%)
    // AV: 2% (NICHT 1.3%)
    // Gesamt bei voller SV-Pflicht: 21%
    var $sozialabgaben {
      value = 0
    }

    // Kranken- und Pflegeversicherung: 9% Pauschale
    conditional {
      if ($input.gkv_insured == true) {
        var $kv_beitrag {
          value = $bereinigtes_brutto|multiply:0.09
        }
        var.update $sozialabgaben {
          value = $sozialabgaben|add:$kv_beitrag
        }
      }
    }

    // Rentenversicherung: 10% Pauschale
    conditional {
      if ($input.pension_insured == true) {
        var $rv_beitrag {
          value = $bereinigtes_brutto|multiply:0.10
        }
        var.update $sozialabgaben {
          value = $sozialabgaben|add:$rv_beitrag
        }
      }
    }

    // Arbeitslosenversicherung: 2% Pauschale
    conditional {
      if ($input.unemployment_insured == true) {
        var $av_beitrag {
          value = $bereinigtes_brutto|multiply:0.02
        }
        var.update $sozialabgaben {
          value = $sozialabgaben|add:$av_beitrag
        }
      }
    }

    // SCHRITT 6: Elterngeld-Netto berechnen
    var $gesamt_abzuege {
      value = $lohnsteuer|add:$soli|add:$kirchensteuer|add:$sozialabgaben
    }

    var $elterngeld_netto_raw {
      value = $bereinigtes_brutto|subtract:$gesamt_abzuege
    }

    var $elterngeld_netto {
      value = $elterngeld_netto_raw
    }

    conditional {
      if ($elterngeld_netto_raw < 0) {
        var.update $elterngeld_netto {
          value = 0
        }
      }
    }
  }

  response = {
    elterngeld_netto: $elterngeld_netto|round:2
    bereinigtes_brutto: $bereinigtes_brutto|round:2
    abzuege: {
      werbungskosten: $werbungskosten
      lohnsteuer: $lohnsteuer|round:2
      soli: $soli|round:2
      kirchensteuer: $kirchensteuer|round:2
      sozialabgaben: $sozialabgaben|round:2
      gesamt: $gesamt_abzuege|round:2
    }
  }
}
```

### c) `functions/elterngeld/calculate_ersatzrate.xs`

```xs
// Berechnet Ersatzrate nach BEEG Paragraph 2 Abs. 2
// < 1.000 EUR: bis 100%
// 1.000-1.200 EUR: konstant 67%
// > 1.200 EUR: bis min 65%
function "elterngeld/calculate_ersatzrate" {
  description = "Berechnet Ersatzrate nach BEEG Paragraph 2 Abs. 2 (65-100%)"

  input {
    decimal elterngeld_netto filters=min:0 {
      description = "Elterngeld-Netto vor Geburt"
    }
  }

  stack {
    var $ersatzrate {
      value = 0.67
    }

    conditional {
      // Fall 1: Einkommen unter 1.000 EUR - Erhoehung bis 100%
      if ($input.elterngeld_netto < 1000) {
        // Pro 2 EUR unter 1.000: 0,1% mehr (= 0,05% pro 1 EUR)
        var $unterschuss {
          value = 1000|subtract:$input.elterngeld_netto
        }
        // Stufen = Unterschuss / 2 (abgerundet)
        var $stufen {
          value = $unterschuss|divide:2|floor
        }
        // Erhoehung = Stufen * 0,1% = Stufen * 0,001
        var $erhoehung {
          value = $stufen|multiply:0.001
        }
        var.update $ersatzrate {
          value = 0.67|add:$erhoehung
        }
        // Maximum: 100%
        conditional {
          if ($ersatzrate > 1.0) {
            var.update $ersatzrate {
              value = 1.0
            }
          }
        }
      }
      // Fall 2: Einkommen ueber 1.200 EUR - Absenkung bis 65%
      elseif ($input.elterngeld_netto > 1200) {
        // Pro 2 EUR ueber 1.200: 0,1% weniger
        var $ueberschuss {
          value = $input.elterngeld_netto|subtract:1200
        }
        var $stufen {
          value = $ueberschuss|divide:2|floor
        }
        var $absenkung {
          value = $stufen|multiply:0.001
        }
        var.update $ersatzrate {
          value = 0.67|subtract:$absenkung
        }
        // Minimum: 65%
        conditional {
          if ($ersatzrate < 0.65) {
            var.update $ersatzrate {
              value = 0.65
            }
          }
        }
      }
      // Fall 3: Einkommen zwischen 1.000 und 1.200 EUR - Standard 67%
      else {
        var.update $ersatzrate {
          value = 0.67
        }
      }
    }
  }

  response = $ersatzrate|round:4
}
```

### d) `functions/elterngeld/calculate_basiselterngeld.xs`

```xs
// Berechnet monatliches Basiselterngeld nach BEEG
// Min 300 EUR, Max 1.800 EUR
function "elterngeld/calculate_basiselterngeld" {
  description = "Berechnet monatliches Basiselterngeld nach BEEG"

  input {
    decimal elterngeld_netto filters=min:0 {
      description = "Elterngeld-Netto vor Geburt"
    }

    decimal einkommen_waehrend?=0 filters=min:0 {
      description = "Elterngeld-Netto waehrend Elternzeit (bei Teilzeit)"
    }

    int kinder_unter_3?=0 filters=min:0 {
      description = "Anzahl Kinder unter 3 Jahren (Geschwisterbonus)"
    }

    int kinder_unter_6?=0 filters=min:0 {
      description = "Anzahl Kinder unter 6 Jahren (mind. 2 fuer Bonus)"
    }

    bool mehrlinge?=false {
      description = "Mehrlingsgeburt"
    }

    int mehrling_anzahl?=1 filters=min:1 {
      description = "Anzahl Kinder bei Mehrlingsgeburt"
    }
  }

  stack {
    // Einkommensverlust berechnen
    var $einkommensverlust_raw {
      value = $input.elterngeld_netto|subtract:$input.einkommen_waehrend
    }

    var $einkommensverlust {
      value = $einkommensverlust_raw
    }

    conditional {
      if ($einkommensverlust_raw < 0) {
        var.update $einkommensverlust {
          value = 0
        }
      }
    }

    // Ersatzrate ermitteln
    function.run "elterngeld/calculate_ersatzrate" {
      input = {
        elterngeld_netto: $input.elterngeld_netto
      }
    } as $ersatzrate

    // Basiselterngeld berechnen
    var $elterngeld_roh {
      value = $einkommensverlust|multiply:$ersatzrate
    }

    // Grenzen anwenden (300-1.800 EUR)
    var $elterngeld {
      value = $elterngeld_roh
    }

    conditional {
      if ($elterngeld < 300) {
        var.update $elterngeld {
          value = 300
        }
      }
      elseif ($elterngeld > 1800) {
        var.update $elterngeld {
          value = 1800
        }
      }
    }

    // Geschwisterbonus (Paragraph 2a BEEG)
    // +10%, mind. 75 EUR
    var $geschwisterbonus {
      value = 0
    }

    var $hat_geschwisterbonus {
      value = false
    }

    conditional {
      if ($input.kinder_unter_3 >= 1) {
        var.update $hat_geschwisterbonus {
          value = true
        }
      }
      elseif ($input.kinder_unter_6 >= 2) {
        var.update $hat_geschwisterbonus {
          value = true
        }
      }
    }

    conditional {
      if ($hat_geschwisterbonus == true) {
        var $bonus_prozent {
          value = $elterngeld|multiply:0.10
        }
        conditional {
          if ($bonus_prozent < 75) {
            var.update $geschwisterbonus {
              value = 75
            }
          }
          else {
            var.update $geschwisterbonus {
              value = $bonus_prozent
            }
          }
        }
      }
    }

    // Mehrlingszuschlag (Paragraph 2a BEEG)
    // +300 EUR pro weiterem Kind
    var $mehrlingszuschlag {
      value = 0
    }

    conditional {
      if ($input.mehrlinge == true) {
        conditional {
          if ($input.mehrling_anzahl > 1) {
            var $weitere_kinder {
              value = $input.mehrling_anzahl|subtract:1
            }
            var.update $mehrlingszuschlag {
              value = $weitere_kinder|multiply:300
            }
          }
        }
      }
    }

    // Gesamtbetrag
    var $elterngeld_gesamt {
      value = $elterngeld|add:$geschwisterbonus|add:$mehrlingszuschlag
    }
  }

  response = {
    elterngeld_monatlich: $elterngeld_gesamt|round:2
    elterngeld_basis: $elterngeld|round:2
    einkommensverlust: $einkommensverlust|round:2
    ersatzrate: $ersatzrate
    zuschlaege: {
      geschwisterbonus: $geschwisterbonus|round:2
      hat_geschwisterbonus: $hat_geschwisterbonus
      mehrlingszuschlag: $mehrlingszuschlag
    }
  }
}
```

### e) `functions/elterngeld/calculate_elterngeld_plus.xs`

```xs
// Berechnet ElterngeldPlus (halber Satz, doppelte Dauer)
// Min 150 EUR, Max 900 EUR
function "elterngeld/calculate_elterngeld_plus" {
  description = "Berechnet ElterngeldPlus (halber Satz, doppelte Dauer)"

  input {
    decimal basiselterngeld filters=min:0 {
      description = "Berechnetes Basiselterngeld"
    }

    decimal einkommen_waehrend?=0 filters=min:0 {
      description = "Einkommen waehrend ElterngeldPlus (Teilzeit)"
    }

    decimal elterngeld_netto_vor filters=min:0 {
      description = "Elterngeld-Netto vor Geburt"
    }
  }

  stack {
    // ElterngeldPlus = 50% des Basiselterngeldes
    var $elterngeld_plus_max {
      value = $input.basiselterngeld|divide:2
    }

    var $elterngeld_plus {
      value = $elterngeld_plus_max
    }

    // Bei Zuverdienst: Anrechnung des Einkommens
    conditional {
      if ($input.einkommen_waehrend > 0) {
        // Verlust = Einkommen vor - Einkommen waehrend
        var $verlust_raw {
          value = $input.elterngeld_netto_vor|subtract:$input.einkommen_waehrend
        }

        var $verlust {
          value = $verlust_raw
        }

        conditional {
          if ($verlust_raw < 0) {
            var.update $verlust {
              value = 0
            }
          }
        }

        // Ersatzrate auf Verlust anwenden
        function.run "elterngeld/calculate_ersatzrate" {
          input = {
            elterngeld_netto: $input.elterngeld_netto_vor
          }
        } as $ersatzrate

        var $angerechnetes_elterngeld {
          value = $verlust|multiply:$ersatzrate
        }

        // ElterngeldPlus = min(angerechnetes, maximales)
        conditional {
          if ($angerechnetes_elterngeld < $elterngeld_plus_max) {
            var.update $elterngeld_plus {
              value = $angerechnetes_elterngeld
            }
          }
        }
      }
    }

    // Mindestens 150 EUR (halber Mindestbetrag)
    conditional {
      if ($elterngeld_plus < 150) {
        var.update $elterngeld_plus {
          value = 150
        }
      }
    }

    // Maximal 900 EUR (halber Hoechstbetrag)
    conditional {
      if ($elterngeld_plus > 900) {
        var.update $elterngeld_plus {
          value = 900
        }
      }
    }
  }

  response = {
    elterngeld_plus_monatlich: $elterngeld_plus|round:2
    deckelung: $elterngeld_plus_max|round:2
  }
}
```

### f) `functions/elterngeld/check_income_eligibility.xs`

```xs
// Prueft Einkommensgrenze nach Paragraph 1 Abs. 8 BEEG
// 175.000 EUR Grenze (bzw. 200.000 EUR Uebergangsregel)
function "elterngeld/check_income_eligibility" {
  description = "Prueft Einkommensgrenze nach Paragraph 1 Abs. 8 BEEG inkl. Uebergangsregelungen"

  input {
    decimal taxable_income_person1 filters=min:0 {
      description = "Zu versteuerndes Einkommen Person 1 (letzter VZ)"
    }

    decimal taxable_income_person2?=0 filters=min:0 {
      description = "Zu versteuerndes Einkommen Person 2 (bei Paaren)"
    }

    date birth_date {
      description = "Geburtsdatum des Kindes"
    }

    bool is_single_parent?=false {
      description = "Alleinerziehend (nur eigenes Einkommen pruefen)"
    }
  }

  stack {
    // Einkommensgrenze je nach Geburtsdatum (Paragraph 28 Abs. 5)
    var $income_threshold {
      value = 175000
    }

    // Uebergangsregelung: 01.04.2024 - 31.03.2025 = 200.000 EUR
    conditional {
      if ($input.birth_date >= "2024-04-01") {
        conditional {
          if ($input.birth_date < "2025-04-01") {
            var.update $income_threshold {
              value = 200000
            }
          }
        }
      }
    }

    // Vor 01.04.2024: Keine solche Einkommensgrenze
    conditional {
      if ($input.birth_date < "2024-04-01") {
        var.update $income_threshold {
          value = 9999999
        }
      }
    }

    // Relevantes Einkommen bestimmen
    var $relevant_income {
      value = $input.taxable_income_person1
    }

    conditional {
      if ($input.is_single_parent == false) {
        var.update $relevant_income {
          value = $input.taxable_income_person1|add:$input.taxable_income_person2
        }
      }
    }

    // Anspruchspruefung
    var $is_eligible {
      value = true
    }

    conditional {
      if ($relevant_income > $income_threshold) {
        var.update $is_eligible {
          value = false
        }
      }
    }

    // Ueberschreitung berechnen
    var $exceeded_by {
      value = 0
    }

    conditional {
      if ($is_eligible == false) {
        var.update $exceeded_by {
          value = $relevant_income|subtract:$income_threshold
        }
      }
    }
  }

  response = {
    is_eligible: $is_eligible
    income_threshold: $income_threshold
    total_income: $relevant_income
    exceeded_by: $exceeded_by
    legal_reference: "Paragraph 1 Abs. 8 BEEG"
  }
}
```

### g) `functions/elterngeld/calculate_maternity_benefit_offset.xs`

```xs
// Berechnet Elterngeld unter Anrechnung von Mutterschaftsgeld (Paragraph 3 BEEG)
// WICHTIG: Keine 300 EUR Freibetrag bei Mutterschaftsleistungen!
function "elterngeld/calculate_maternity_benefit_offset" {
  description = "Berechnet Elterngeld unter Anrechnung von Mutterschaftsgeld (Paragraph 3 BEEG)"

  input {
    decimal elterngeld_calculated filters=min:0 {
      description = "Berechnetes Elterngeld vor Anrechnung"
    }

    decimal maternity_benefit_daily?=0 filters=min:0 {
      description = "Mutterschaftsgeld pro Tag (max. 13 EUR von Krankenkasse)"
    }

    decimal employer_supplement_daily?=0 filters=min:0 {
      description = "Arbeitgeberzuschuss zum Mutterschaftsgeld pro Tag"
    }

    int days_in_month?=30 filters=min:28|max:31 {
      description = "Tage im Lebensmonat mit Mutterschaftsgeld-Anspruch"
    }
  }

  stack {
    // Gesamtes Mutterschaftsgeld im Monat
    var $maternity_benefit_monthly {
      value = $input.maternity_benefit_daily|multiply:$input.days_in_month
    }

    var $employer_supplement_monthly {
      value = $input.employer_supplement_daily|multiply:$input.days_in_month
    }

    var $total_maternity_benefit {
      value = $maternity_benefit_monthly|add:$employer_supplement_monthly
    }

    // VOLLE Anrechnung - kein 300 EUR Freibetrag bei Mutterschaftsleistungen!
    // Paragraph 3 Abs. 2: "soweit nicht Einnahmen nach Absatz 1 Satz 1 Nummer 1 bis 3"
    var $elterngeld_after_offset_raw {
      value = $input.elterngeld_calculated|subtract:$total_maternity_benefit
    }

    var $elterngeld_after_offset {
      value = $elterngeld_after_offset_raw
    }

    // Kann nicht negativ werden
    conditional {
      if ($elterngeld_after_offset_raw < 0) {
        var.update $elterngeld_after_offset {
          value = 0
        }
      }
    }
  }

  response = {
    elterngeld_before_offset: $input.elterngeld_calculated|round:2
    maternity_benefit_offset: $total_maternity_benefit|round:2
    elterngeld_after_offset: $elterngeld_after_offset|round:2
    note: "Mutterschaftsgeld wird voll angerechnet (Paragraph 3 Abs. 1 Nr. 1 BEEG)"
    legal_reference: "Paragraph 3 BEEG"
  }
}
```

---

## 5. Phase 2.3: Auth-Funktionen

### a) `functions/auth/register_user.xs`

```xs
// Registriert neuen User und erstellt Household
function "auth/register_user" {
  description = "Registriert neuen User und erstellt Household"

  input {
    email email filters=trim|lower {
      description = "E-Mail-Adresse (wird Login)"
    }

    password password filters=min:8 {
      description = "Passwort (mind. 8 Zeichen)"
    }

    text first_name? filters=trim {
      description = "Vorname"
    }

    bool consent_marketing?=false {
      description = "Marketing-Einwilligung"
    }

    int lead_id? {
      description = "Lead-ID falls aus Quick-Check konvertiert"
    }
  }

  stack {
    // 1. Pruefen ob E-Mail bereits existiert
    db.query "users" {
      where = $db.users.email == $input.email
      return = {type: "first"}
    } as $existing_user

    conditional {
      if ($existing_user != null) {
        precondition.fail {
          code = 409
          message = "Diese E-Mail-Adresse ist bereits registriert"
        }
      }
    }

    // 2. Einladungscode generieren (6 Zeichen)
    var $invite_code {
      value = $util.random_string:6|upper
    }

    // 3. Household erstellen
    db.post "households" {
      data = {
        premium_tier: "free"
        invite_code: $invite_code
        lead_id: $input.lead_id
      }
    } as $household

    // 4. Verifizierungs-Token generieren
    var $verification_token {
      value = $util.random_string:32
    }

    // 5. User erstellen
    db.post "users" {
      data = {
        email: $input.email
        password: $input.password
        household_id: $household.id
        household_role: "owner"
        first_name: $input.first_name
        email_verified: false
        email_verification_token: $verification_token
        consent_marketing: $input.consent_marketing
        consent_privacy: true
        consent_privacy_at: $util.now
      }
    } as $user

    // 6. Auth-Token generieren
    auth.create_token {
      user_id = $user.id
    } as $auth_token
  }

  response = {
    success: true
    user: {
      id: $user.id
      email: $user.email
      first_name: $user.first_name
      household_id: $household.id
      household_role: "owner"
    }
    household: {
      id: $household.id
      invite_code: $invite_code
      premium_tier: "free"
    }
    auth_token: $auth_token
    message: "Bitte bestaetigen Sie Ihre E-Mail-Adresse"
  }
}
```

### b) `functions/auth/verify_email.xs`

```xs
// Bestaetigt E-Mail-Adresse
function "auth/verify_email" {
  description = "Bestaetigt E-Mail-Adresse"

  input {
    text token filters=trim {
      description = "Verifizierungs-Token aus dem Link"
    }
  }

  stack {
    // Token suchen
    db.query "users" {
      where = $db.users.email_verification_token == $input.token
      return = {type: "first"}
    } as $user

    conditional {
      if ($user == null) {
        precondition.fail {
          code = 404
          message = "Ungueltiger Verifizierungslink"
        }
      }
    }

    conditional {
      if ($user.email_verified == true) {
        precondition.fail {
          code = 400
          message = "E-Mail wurde bereits bestaetigt"
        }
      }
    }

    // E-Mail als verifiziert markieren
    db.edit "users" {
      field_name = "id"
      field_value = $user.id
      data = {
        email_verified: true
        email_verified_at: $util.now
        email_verification_token: null
      }
    }
  }

  response = {
    success: true
    message: "E-Mail erfolgreich bestaetigt"
  }
}
```

### c) `functions/household/invite_partner.xs`

```xs
// Erstellt Einladung fuer Partner
function "household/invite_partner" {
  description = "Erstellt Einladung fuer Partner"

  input {
    int user_id {
      description = "ID des einladenden Users (muss Owner sein)"
    }

    email partner_email filters=trim|lower {
      description = "E-Mail des Partners"
    }
  }

  stack {
    // 1. User laden und Berechtigung pruefen
    db.get "users" {
      field_name = "id"
      field_value = $input.user_id
    } as $user

    conditional {
      if ($user.household_role != "owner") {
        precondition.fail {
          code = 403
          message = "Nur der Account-Ersteller kann Partner einladen"
        }
      }
    }

    // 2. Pruefen ob bereits Partner im Household
    db.query "users" {
      where = $db.users.household_id == $user.household_id && $db.users.household_role == "partner"
      return = {type: "first"}
    } as $existing_partner

    conditional {
      if ($existing_partner != null) {
        precondition.fail {
          code = 400
          message = "Es ist bereits ein Partner im Household registriert"
        }
      }
    }

    // 3. Pruefen ob E-Mail bereits registriert
    db.query "users" {
      where = $db.users.email == $input.partner_email
      return = {type: "first"}
    } as $email_exists

    conditional {
      if ($email_exists != null) {
        precondition.fail {
          code = 409
          message = "Diese E-Mail ist bereits registriert"
        }
      }
    }

    // 4. Alte offene Einladungen zurueckziehen
    db.query "household_invitations" {
      where = $db.household_invitations.household_id == $user.household_id && $db.household_invitations.status == "pending"
      return = {type: "list"}
    } as $old_invitations

    foreach ($old_invitations) {
      each as $old_inv {
        db.edit "household_invitations" {
          field_name = "id"
          field_value = $old_inv.id
          data = {
            status: "cancelled"
          }
        }
      }
    }

    // 5. Einladungs-Token generieren
    var $token {
      value = $util.random_string:48
    }

    // 6. Ablaufzeit: 7 Tage
    var $expires_at {
      value = $util.now|transform_timestamp:"+7 days"
    }

    // 7. Einladung erstellen
    db.post "household_invitations" {
      data = {
        household_id: $user.household_id
        invited_by_user_id: $user.id
        invited_email: $input.partner_email
        token: $token
        status: "pending"
        expires_at: $expires_at
      }
    } as $invitation

    // 8. Einladungs-Link erstellen
    var $invite_link {
      value = $env.APP_URL ~ "/einladung/" ~ $token
    }
  }

  response = {
    success: true
    invitation_id: $invitation.id
    invited_email: $input.partner_email
    expires_at: $expires_at
    invite_link: $invite_link
    message: "Einladung wurde erstellt"
  }
}
```

---

## 6. Phase 2.4: APIs

### Oeffentliche APIs (Quick-Check)

#### `apis/quick-check/submit.xs`

```xs
// Quick-Check Berechnung (ohne Account)
api "quick-check/submit" {
  method = "POST"
  auth = false
  description = "Quick-Check Elterngeld-Schaetzung"

  input {
    decimal mother_income filters=min:0 {
      description = "Monatliches Bruttoeinkommen der Mutter"
    }

    decimal partner_income? filters=min:0 {
      description = "Monatliches Bruttoeinkommen des Partners"
    }

    date due_date {
      description = "Errechneter Geburtstermin"
    }

    enum bundesland {
      values = ["BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV", "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH"]
      description = "Bundesland"
    }

    bool has_partner?=false {
      description = "Hat Partner"
    }
  }

  stack {
    // Mutterschutz berechnen
    function.run "elterngeld/calculate_mutterschutz" {
      input = {
        due_date: $input.due_date
        is_multiple: false
        is_premature: false
      }
    } as $mutterschutz

    // Elterngeld-Netto Mutter (vereinfacht: Steuerklasse 4)
    function.run "elterngeld/calculate_elterngeld_netto" {
      input = {
        brutto_monatlich: $input.mother_income
        tax_class: "4"
        church_tax: false
        gkv_insured: true
        pension_insured: true
        unemployment_insured: true
      }
    } as $mother_netto

    // Basiselterngeld Mutter
    function.run "elterngeld/calculate_basiselterngeld" {
      input = {
        elterngeld_netto: $mother_netto.elterngeld_netto
        einkommen_waehrend: 0
      }
    } as $mother_elterngeld

    // Partner falls vorhanden
    var $partner_elterngeld {
      value = null
    }

    conditional {
      if ($input.has_partner == true) {
        conditional {
          if ($input.partner_income != null) {
            function.run "elterngeld/calculate_elterngeld_netto" {
              input = {
                brutto_monatlich: $input.partner_income
                tax_class: "4"
                church_tax: false
                gkv_insured: true
                pension_insured: true
                unemployment_insured: true
              }
            } as $partner_netto

            function.run "elterngeld/calculate_basiselterngeld" {
              input = {
                elterngeld_netto: $partner_netto.elterngeld_netto
                einkommen_waehrend: 0
              }
            } as $partner_eg

            var.update $partner_elterngeld {
              value = $partner_eg
            }
          }
        }
      }
    }

    // Gesamtschaetzung (12 Monate Mutter + 2 Monate Partner)
    var $total_mother {
      value = $mother_elterngeld.elterngeld_monatlich|multiply:12
    }

    var $total_partner {
      value = 0
    }

    conditional {
      if ($partner_elterngeld != null) {
        var.update $total_partner {
          value = $partner_elterngeld.elterngeld_monatlich|multiply:2
        }
      }
    }

    var $estimated_total {
      value = $total_mother|add:$total_partner
    }

    // Optimierungshinweis
    var $optimization_hint {
      value = "Mit der Premium-Version koennen Sie bis zu 2.000 EUR mehr Elterngeld erhalten."
    }
  }

  response = {
    success: true
    estimated_total: $estimated_total|round:2
    mother: {
      elterngeld_monatlich: $mother_elterngeld.elterngeld_monatlich
      elterngeld_netto: $mother_netto.elterngeld_netto
      ersatzrate: $mother_elterngeld.ersatzrate
      monate: 12
    }
    partner: $partner_elterngeld
    mutterschutz: $mutterschutz
    optimization_hint: $optimization_hint
  }
}
```

#### `apis/quick-check/save-lead.xs`

```xs
// Lead speichern nach Quick-Check
api "quick-check/save-lead" {
  method = "POST"
  auth = false
  description = "Speichert Lead nach Quick-Check"

  input {
    email email filters=trim|lower {
      description = "E-Mail-Adresse"
    }

    date due_date {
      description = "Errechneter Geburtstermin"
    }

    enum bundesland {
      values = ["BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV", "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH"]
      description = "Bundesland"
    }

    json quick_check_data? {
      description = "Alle Quick-Check-Antworten"
    }

    decimal estimated_elterngeld? {
      description = "Geschaetztes Elterngeld"
    }

    bool consent_marketing?=false {
      description = "Marketing-Einwilligung"
    }

    text utm_source? {
      description = "UTM Source"
    }

    text utm_medium? {
      description = "UTM Medium"
    }

    text utm_campaign? {
      description = "UTM Campaign"
    }
  }

  stack {
    // Pruefen ob Lead bereits existiert
    db.query "leads" {
      where = $db.leads.email == $input.email
      return = {type: "first"}
    } as $existing_lead

    conditional {
      if ($existing_lead != null) {
        // Lead aktualisieren
        db.edit "leads" {
          field_name = "id"
          field_value = $existing_lead.id
          data = {
            due_date: $input.due_date
            bundesland: $input.bundesland
            quick_check_data: $input.quick_check_data
            estimated_elterngeld: $input.estimated_elterngeld
            consent_marketing: $input.consent_marketing
          }
        }

        var $lead_id {
          value = $existing_lead.id
        }
      }
      else {
        // Neuen Lead erstellen
        db.post "leads" {
          data = {
            email: $input.email
            due_date: $input.due_date
            bundesland: $input.bundesland
            quick_check_data: $input.quick_check_data
            estimated_elterngeld: $input.estimated_elterngeld
            consent_marketing: $input.consent_marketing
            consent_privacy: true
            utm_source: $input.utm_source
            utm_medium: $input.utm_medium
            utm_campaign: $input.utm_campaign
          }
        } as $new_lead

        var $lead_id {
          value = $new_lead.id
        }
      }
    }
  }

  response = {
    success: true
    lead_id: $lead_id
    message: "Vielen Dank! Wir haben Ihre Daten gespeichert."
  }
}
```

### Auth APIs

#### `apis/auth/register.xs`

```xs
// Registrierung
api "auth/register" {
  method = "POST"
  auth = false
  description = "Registriert neuen User und erstellt Household"

  input {
    email email filters=trim|lower {
      description = "E-Mail-Adresse"
    }

    password password filters=min:8 {
      description = "Passwort (mind. 8 Zeichen)"
    }

    text first_name? {
      description = "Vorname"
    }

    bool consent_marketing?=false {
      description = "Marketing-Einwilligung"
    }

    int lead_id? {
      description = "Lead-ID falls aus Quick-Check"
    }
  }

  stack {
    function.run "auth/register_user" {
      input = {
        email: $input.email
        password: $input.password
        first_name: $input.first_name
        consent_marketing: $input.consent_marketing
        lead_id: $input.lead_id
      }
    } as $result
  }

  response = $result
}
```

#### `apis/auth/login.xs`

```xs
// Login
api "auth/login" {
  method = "POST"
  auth = false
  description = "Login - gibt Token und Household-Daten zurueck"

  input {
    email email filters=trim|lower {
      description = "E-Mail-Adresse"
    }

    password password {
      description = "Passwort"
    }
  }

  stack {
    // Xano built-in Auth
    auth.login {
      email = $input.email
      password = $input.password
    } as $auth_result

    // User laden
    db.get "users" {
      field_name = "id"
      field_value = $auth_result.user_id
    } as $user

    // Household laden
    db.get "households" {
      field_name = "id"
      field_value = $user.household_id
    } as $household

    // Last login aktualisieren
    db.edit "users" {
      field_name = "id"
      field_value = $user.id
      data = {
        last_login_at: $util.now
        last_login_ip: $request.ip
      }
    }
  }

  response = {
    auth_token: $auth_result.token
    user: {
      id: $user.id
      email: $user.email
      first_name: $user.first_name
      household_role: $user.household_role
    }
    household: {
      id: $household.id
      premium_tier: $household.premium_tier
      invite_code: $household.invite_code
    }
  }
}
```

#### `apis/auth/me.xs`

```xs
// Eigene Daten abrufen
api "auth/me" {
  method = "GET"
  auth = true
  description = "Gibt eigene User- und Household-Daten zurueck"

  stack {
    // User laden
    db.get "users" {
      field_name = "id"
      field_value = $auth.user_id
    } as $user

    // Household laden
    db.get "households" {
      field_name = "id"
      field_value = $user.household_id
    } as $household

    // Schwangerschaften laden
    db.query "pregnancies" {
      where = $db.pregnancies.household_id == $user.household_id
      return = {type: "list"}
    } as $pregnancies
  }

  response = {
    user: {
      id: $user.id
      email: $user.email
      first_name: $user.first_name
      last_name: $user.last_name
      household_role: $user.household_role
      email_verified: $user.email_verified
      consent_marketing: $user.consent_marketing
    }
    household: {
      id: $household.id
      premium_tier: $household.premium_tier
      invite_code: $household.invite_code
      premium_purchased_at: $household.premium_purchased_at
    }
    pregnancies: $pregnancies
  }
}
```

### Premium APIs

#### `apis/pregnancies/create.xs`

```xs
// Schwangerschaft erstellen
api "pregnancies/create" {
  method = "POST"
  auth = true
  description = "Erstellt neue Schwangerschaft fuer den Household"

  input {
    date due_date {
      description = "Errechneter Geburtstermin"
    }

    enum bundesland {
      values = ["BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV", "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH"]
      description = "Bundesland"
    }

    bool is_multiple?=false {
      description = "Mehrlingsgeburt"
    }

    int multiple_count?=1 {
      description = "Anzahl bei Mehrlingsgeburt"
    }

    bool is_married?=false {
      description = "Verheiratet"
    }

    int existing_children_under_3?=0 {
      description = "Kinder unter 3 Jahren"
    }

    int existing_children_under_6?=0 {
      description = "Kinder unter 6 Jahren"
    }
  }

  stack {
    // User laden
    db.get "users" {
      field_name = "id"
      field_value = $auth.user_id
    } as $user

    // Mutterschutz berechnen
    function.run "elterngeld/calculate_mutterschutz" {
      input = {
        due_date: $input.due_date
        is_multiple: $input.is_multiple
        is_premature: false
      }
    } as $mutterschutz

    // Schwangerschaft erstellen
    db.post "pregnancies" {
      data = {
        household_id: $user.household_id
        due_date: $input.due_date
        bundesland: $input.bundesland
        is_multiple: $input.is_multiple
        multiple_count: $input.multiple_count
        is_married: $input.is_married
        existing_children_under_3: $input.existing_children_under_3
        existing_children_under_6: $input.existing_children_under_6
        mutterschutz_start: $mutterschutz.mutterschutz_start
        mutterschutz_end: $mutterschutz.mutterschutz_end
      }
    } as $pregnancy
  }

  response = {
    success: true
    pregnancy: $pregnancy
    mutterschutz: $mutterschutz
  }
}
```

#### `apis/calculations/create.xs`

```xs
// Berechnung erstellen (Premium erforderlich)
api "calculations/create" {
  method = "POST"
  auth = true
  description = "Erstellt vollstaendige Elterngeld-Berechnung"

  input {
    int pregnancy_id {
      description = "ID der Schwangerschaft"
    }
  }

  stack {
    // User laden
    db.get "users" {
      field_name = "id"
      field_value = $auth.user_id
    } as $user

    // Household laden
    db.get "households" {
      field_name = "id"
      field_value = $user.household_id
    } as $household

    // Premium-Status pruefen
    conditional {
      if ($household.premium_tier == "free") {
        precondition.fail {
          code = 403
          message = "Premium-Account erforderlich"
        }
      }
    }

    // Schwangerschaft laden und Berechtigung pruefen
    db.get "pregnancies" {
      field_name = "id"
      field_value = $input.pregnancy_id
    } as $pregnancy

    conditional {
      if ($pregnancy.household_id != $user.household_id) {
        precondition.fail {
          code = 403
          message = "Keine Berechtigung fuer diese Schwangerschaft"
        }
      }
    }

    // Vollstaendige Berechnung durchfuehren
    function.run "elterngeld/calculate_full" {
      input = {
        pregnancy_id: $input.pregnancy_id
      }
    } as $calculation_result

    // Berechnung speichern
    db.post "calculations" {
      data = {
        pregnancy_id: $input.pregnancy_id
        baseline_total: $calculation_result.baseline_total
        optimized_total: $calculation_result.optimized_total
        optimization_potential: $calculation_result.optimization_potential
        mother_baseline: $calculation_result.mother
        partner_baseline: $calculation_result.partner
        scenarios: $calculation_result.scenarios
        best_scenario: $calculation_result.best_scenario
        calculation_version: "1.0"
      }
    } as $calculation

    // Optimierungen speichern
    foreach ($calculation_result.optimizations) {
      each as $opt {
        db.post "optimizations" {
          data = {
            calculation_id: $calculation.id
            type: $opt.type
            title: $opt.title
            potential_gain: $opt.potential_gain
            description: $opt.description
            how_to: $opt.how_to
            priority: $opt.priority
            difficulty: $opt.difficulty
          }
        }
      }
    }
  }

  response = {
    success: true
    calculation_id: $calculation.id
    baseline_total: $calculation_result.baseline_total
    optimized_total: $calculation_result.optimized_total
    optimization_potential: $calculation_result.optimization_potential
    optimization_count: $calculation_result.optimizations|length
  }
}
```

### Payment APIs

#### `apis/payments/webhook.xs`

```xs
// Stripe Webhook
api "payments/webhook" {
  method = "POST"
  auth = false
  description = "Stripe Webhook fuer Zahlungsbestaetigung"

  input {
    json stripe_event {
      description = "Stripe Event Payload"
    }
  }

  stack {
    // Event-Typ pruefen
    var $event_type {
      value = $input.stripe_event.type
    }

    conditional {
      if ($event_type == "checkout.session.completed") {
        // Session-Daten extrahieren
        var $session {
          value = $input.stripe_event.data.object
        }

        // Metadaten auslesen
        var $household_id {
          value = $session.metadata.household_id|int
        }

        var $user_id {
          value = $session.metadata.user_id|int
        }

        var $product {
          value = $session.metadata.product
        }

        // Premium-Tier bestimmen
        var $premium_tier {
          value = "premium"
        }

        conditional {
          if ($product == "premium_plus") {
            var.update $premium_tier {
              value = "premium_plus"
            }
          }
        }

        // Household upgraden
        db.edit "households" {
          field_name = "id"
          field_value = $household_id
          data = {
            premium_tier: $premium_tier
            premium_purchased_at: $util.now
          }
        }

        // Payment speichern
        db.post "payments" {
          data = {
            household_id: $household_id
            purchased_by_user_id: $user_id
            stripe_payment_id: $session.payment_intent
            stripe_checkout_session_id: $session.id
            stripe_customer_id: $session.customer
            amount: $session.amount_total
            status: "completed"
            product: $product
            completed_at: $util.now
          }
        }
      }
    }
  }

  response = {
    received: true
  }
}
```

---

## 7. Phase 2.5: Scheduled Tasks

### `tasks/send_reminders.xs`

```xs
// Taeglich: Erinnerungen versenden
task "send_reminders" {
  description = "Versendet faellige Erinnerungen per E-Mail"
  schedule = "0 8 * * *"

  stack {
    // Aktuelle Zeit + Remind-Tage berechnen
    var $today {
      value = $util.now|format_timestamp:"Y-m-d"
    }

    // Faellige Erinnerungen finden
    db.query "reminders" {
      where = $db.reminders.email_sent == false && $db.reminders.completed == false
      return = {type: "list"}
    } as $all_reminders

    foreach ($all_reminders) {
      each as $reminder {
        // Remind-Datum berechnen
        var $remind_days_str {
          value = "-" ~ $reminder.remind_days_before ~ " days"
        }

        var $remind_date {
          value = $reminder.due_date|transform_timestamp:$remind_days_str|format_timestamp:"Y-m-d"
        }

        // Pruefen ob heute erinnert werden soll
        conditional {
          if ($today >= $remind_date) {
            // User-E-Mail laden
            conditional {
              if ($reminder.user_id != null) {
                db.get "users" {
                  field_name = "id"
                  field_value = $reminder.user_id
                } as $user

                // E-Mail senden via Resend API (hier vereinfacht)
                external_api_request {
                  url = "https://api.resend.com/emails"
                  method = "POST"
                  headers = {
                    "Authorization": "Bearer " ~ $env.RESEND_API_KEY
                    "Content-Type": "application/json"
                  }
                  params = {
                    from: "Eltern-Kompass <noreply@eltern-kompass.de>"
                    to: $user.email
                    subject: "Erinnerung: " ~ $reminder.title
                    html: "<h1>" ~ $reminder.title ~ "</h1><p>" ~ $reminder.description ~ "</p>"
                  }
                }

                // Als gesendet markieren
                db.edit "reminders" {
                  field_name = "id"
                  field_value = $reminder.id
                  data = {
                    email_sent: true
                    email_sent_at: $util.now
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
```

### `tasks/cleanup_old_leads.xs`

```xs
// Woechentlich: Alte Leads loeschen (DSGVO)
task "cleanup_old_leads" {
  description = "Loescht Leads aelter als 2 Jahre (DSGVO-Compliance)"
  schedule = "0 3 * * 0"

  stack {
    // Datum vor 2 Jahren
    var $cutoff_date {
      value = $util.now|transform_timestamp:"-2 years"|format_timestamp:"Y-m-d H:i:s"
    }

    // Alte Leads finden
    db.query "leads" {
      where = $db.leads.created_at < $cutoff_date
      return = {type: "list"}
    } as $old_leads

    // Loeschen
    foreach ($old_leads) {
      each as $lead {
        db.delete "leads" {
          field_name = "id"
          field_value = $lead.id
        }
      }
    }

    var $deleted_count {
      value = $old_leads|length
    }
  }
}
```

---

## 8. Environment Variables

Diese Umgebungsvariablen muessen im Xano Dashboard konfiguriert werden:

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `STRIPE_SECRET_KEY` | Stripe API Key (Live oder Test) | `sk_live_...` oder `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook Signatur-Secret | `whsec_...` |
| `STRIPE_PRICE_PREMIUM` | Price ID fuer Premium (79 EUR) | `price_...` |
| `STRIPE_PRICE_PREMIUM_PLUS` | Price ID fuer Premium+ (149 EUR) | `price_...` |
| `APP_URL` | Frontend URL | `https://eltern-kompass.de` |
| `RESEND_API_KEY` | E-Mail API Key | `re_...` |
| `OPENAI_API_KEY` | OpenAI API Key (fuer Dokument-Analyse) | `sk-...` |

---

## 9. Implementierungs-Reihenfolge

### Schritt 1: Tabellen ohne FK erstellen

```
1. tables/households.xs
2. tables/leads.xs
3. tables/users.xs
4. tables/household_invitations.xs
5. tables/pregnancies.xs
6. tables/parents.xs
7. tables/calculations.xs
8. tables/optimizations.xs
9. tables/reminders.xs
10. tables/payments.xs
```

### Schritt 2: Foreign Keys hinzufuegen

Nach Erstellen aller Tabellen die `table = "..."` Referenzen hinzufuegen.

### Schritt 3: Push zu Xano

```bash
push_all_changes_to_xano
```

### Schritt 4: Basis-Funktionen erstellen

```
1. functions/elterngeld/calculate_mutterschutz.xs
2. functions/elterngeld/calculate_elterngeld_netto.xs
3. functions/elterngeld/calculate_ersatzrate.xs
4. functions/elterngeld/calculate_basiselterngeld.xs
5. functions/elterngeld/calculate_elterngeld_plus.xs
6. functions/elterngeld/check_income_eligibility.xs
7. functions/elterngeld/calculate_maternity_benefit_offset.xs
```

### Schritt 5: Auth-Funktionen erstellen

```
1. functions/auth/register_user.xs
2. functions/auth/verify_email.xs
3. functions/household/invite_partner.xs
```

### Schritt 6: APIs erstellen

```
1. apis/quick-check/submit.xs
2. apis/quick-check/save-lead.xs
3. apis/auth/register.xs
4. apis/auth/login.xs
5. apis/auth/me.xs
6. apis/pregnancies/create.xs
7. apis/calculations/create.xs
8. apis/payments/webhook.xs
```

### Schritt 7: Tasks erstellen

```
1. tasks/send_reminders.xs
2. tasks/cleanup_old_leads.xs
```

### Schritt 8: Finaler Push

```bash
push_all_changes_to_xano
```

---

## 10. Verifikation

### 10.1 Xano Dashboard pruefen

Nach dem Push im Xano Dashboard verifizieren:

1. **Database > Tables**: Alle 10 Tabellen vorhanden
2. **API > Endpoints**: Alle APIs erstellt
3. **Library > Functions**: Alle Funktionen vorhanden
4. **Tasks**: Beide Scheduled Tasks konfiguriert

### 10.2 API-Tests

#### Quick-Check testen

```bash
curl -X POST https://x8ki-letl-twmt.n7.xano.io/api:v1/quick-check/submit \
  -H "Content-Type: application/json" \
  -d '{
    "mother_income": 3000,
    "due_date": "2026-09-01",
    "bundesland": "BY",
    "has_partner": true,
    "partner_income": 4000
  }'
```

**Erwartetes Ergebnis:**
- `estimated_total`: ca. 16.000-20.000 EUR
- `mother.elterngeld_monatlich`: ca. 1.200-1.400 EUR
- `mutterschutz.mutterschutz_start`: 2026-07-21
- `mutterschutz.mutterschutz_end`: 2026-10-27

#### Mutterschutz berechnen

```bash
curl -X POST https://x8ki-letl-twmt.n7.xano.io/api:v1/rechner/mutterschutz \
  -H "Content-Type: application/json" \
  -d '{
    "due_date": "2026-09-01",
    "is_multiple": false
  }'
```

**Erwartetes Ergebnis:**
- `mutterschutz_start`: 2026-07-21 (6 Wochen vor ET)
- `mutterschutz_end`: 2026-10-27 (8 Wochen nach ET)
- `total_weeks`: 14

### 10.3 BEEG-Validierung

| Testfall | Input | Erwartetes Ergebnis |
|----------|-------|---------------------|
| Geringverdiener | 800 EUR Netto | Ersatzrate 77%, EG ~616 EUR |
| Normalverdiener | 1.100 EUR Netto | Ersatzrate 67%, EG ~737 EUR |
| Besserverdiener | 2.500 EUR Netto | Ersatzrate 65%, EG ~1.625 EUR |
| Hoechstverdiener | 4.000 EUR Netto | Ersatzrate 65%, EG 1.800 EUR (Max) |
| Mindestbetrag | 0 EUR Netto | EG 300 EUR (Min) |

### 10.4 Swagger/OpenAPI

Nach erfolgreichem Push die automatisch generierte API-Dokumentation im Xano Dashboard pruefen:

1. **API > Documentation**
2. Alle Endpoints mit korrekten Input/Output-Schemas
3. Beispiel-Requests testen

---

## Anhang: BEEG-Referenz

### Sozialabgaben-Pauschalen (Paragraph 2f BEEG)

| Versicherung | BEEG-Pauschale | Tatsaechlicher AN-Anteil |
|--------------|----------------|-------------------------|
| KV + PV | **9%** | ~8.1% + 1.7% = 9.8% |
| RV | **10%** | ~9.3% |
| AV | **2%** | ~1.3% |
| **Gesamt** | **21%** | ~20.4% |

**WICHTIG:** Das BEEG schreibt feste Pauschalen vor, NICHT die tatsaechlichen Saetze!

### Kirchensteuer (Paragraph 2e Abs. 5 BEEG)

> "Als Abzug fuer die Kirchensteuer ist der Betrag anzusetzen, der sich unter Anwendung eines Kirchensteuersatzes von **8 Prozent** fuer die Einkommensteuer nach Absatz 3 ergibt."

**Immer 8%**, unabhaengig vom Bundesland (BY/BW haben normalerweise 8%, andere 9%).

### Ersatzrate (Paragraph 2 Abs. 2 BEEG)

| Elterngeld-Netto | Ersatzrate |
|------------------|------------|
| < 1.000 EUR | 67% + 0,1% je 2 EUR unter 1.000 (max 100%) |
| 1.000 - 1.200 EUR | **67%** (Standard) |
| > 1.200 EUR | 67% - 0,1% je 2 EUR ueber 1.200 (min 65%) |

### Einkommensgrenze (Paragraph 1 Abs. 8 + Paragraph 28 Abs. 5 BEEG)

| Geburtsdatum | Grenze |
|--------------|--------|
| Vor 01.04.2024 | Keine |
| 01.04.2024 - 31.03.2025 | 200.000 EUR (Uebergang) |
| Ab 01.04.2025 | 175.000 EUR |
