# Eltern-Kompass Backend-Architektur (Xano/XanoScript)

## Projektübersicht

Eltern-Kompass ist ein Elterngeld-Optimierer ("Taxfix für werdende Eltern"). Das Backend wird in Xano mit XanoScript implementiert.

**Business-Modell:**
- Kostenloser Quick-Check (5 Fragen) → Lead-Generierung
- Premium (79€): Volle Optimierung + Antragsassistent
- Premium+ (149€): + Video-Call + Review

**Technologie:**
- Backend: Xano (XanoScript)
- Frontend: Next.js 15 + shadcn/ui (bereits vorhanden)
- Payments: Stripe (später)

---

## Inhaltsverzeichnis

1. [Tabellen-Struktur](#1-tabellen-struktur)
2. [Funktionen](#2-funktionen)
3. [BEEG-Berechnungslogik](#3-beeg-berechnungslogik-exakt)
4. [APIs](#4-apis)
5. [Scheduled Tasks](#5-scheduled-tasks)
6. [Environment Variables](#6-environment-variables)
7. [Implementierungs-Reihenfolge](#7-implementierungs-reihenfolge)

---

## 1. Tabellen-Struktur

### Wichtig: Xano-Workflow
1. Tabellen **ohne** Foreign-Key-Referenzen erstellen (Xano lehnt Cross-References ab, wenn Zieltabelle nicht existiert)
2. Nach Erstellung aller Tabellen: FK-Referenzen hinzufügen
3. Mit `push_all_changes_to_xano` Tool synchronisieren

---

### 1.1 `tables/leads.xs` - Lead-Generierung

```xs
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
      description = "Geschätztes Elterngeld aus Quick-Check"
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

---

### 1.2 `tables/pregnancies.xs` - Schwangerschaftsdaten

```xs
table "pregnancies" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Schwangerschafts-ID"
    }

    // ===== HOUSEHOLD-ZUGEHÖRIGKEIT =====
    // Schwangerschaften gehören zum Household, nicht zu einem einzelnen User.
    // So können beide Partner (Mutter + Partner) die Daten sehen und bearbeiten.

    int household_id {
      description = "Referenz zum Household - beide Partner haben Zugriff"
    }

    date due_date {
      description = "Errechneter Geburtstermin (ET)"
    }

    date actual_birth_date? {
      description = "Tatsächliches Geburtsdatum (falls bereits geboren)"
    }

    enum bundesland {
      values = ["BW", "BY", "BE", "BB", "HB", "HH", "HE", "MV", "NI", "NW", "RP", "SL", "SN", "ST", "SH", "TH"]
      description = "Bundesland des Wohnsitzes"
    }

    bool is_multiple?=false {
      description = "Mehrlingsgeburt (Zwillinge, Drillinge, etc.)"
    }

    int multiple_count?=1 filters=min:1|max:5 {
      description = "Anzahl der Kinder bei Mehrlingsgeburt"
    }

    bool is_premature?=false {
      description = "Frühgeburt (vor 37. SSW)"
    }

    date mutterschutz_start? {
      description = "Berechneter Mutterschutz-Beginn"
    }

    date mutterschutz_end? {
      description = "Berechnetes Mutterschutz-Ende"
    }

    int existing_children_under_3?=0 filters=min:0 {
      description = "Anzahl Kinder unter 3 Jahren im Haushalt (für Geschwisterbonus)"
    }

    int existing_children_under_6?=0 filters=min:0 {
      description = "Anzahl Kinder unter 6 Jahren im Haushalt"
    }

    int existing_children_with_disability?=0 filters=min:0 {
      description = "Anzahl Kinder mit Behinderung unter 14 Jahren"
    }

    bool is_married?=false {
      description = "Verheiratet oder eingetragene Lebenspartnerschaft"
    }

    bool lives_together?=true {
      description = "Eltern leben zusammen"
    }

    // ===== ALLEINERZIEHENDE (§ 4c BEEG) =====

    bool is_single_parent?=false {
      description = "Alleinerziehend nach § 4c BEEG (berechtigt zu Partnermonaten)"
    }

    enum single_parent_reason? {
      values = ["tax_relief", "child_welfare", "care_impossible"]
      description = "Grund für Alleinerziehenden-Status: tax_relief=§4c Nr.1 (Entlastungsbetrag+getrennt), child_welfare=§4c Nr.2 (Kindeswohl), care_impossible=§4c Nr.3 (Betreuung unmöglich)"
    }

    bool partner_lives_separately?=false {
      description = "Partner lebt nicht im selben Haushalt (für § 4c Abs. 1 Nr. 1)"
    }

    bool child_welfare_at_risk?=false {
      description = "Kindeswohl bei Betreuung durch anderen Elternteil gefährdet (§ 4c Abs. 1 Nr. 2)"
    }

    bool partner_care_impossible?=false {
      description = "Betreuung durch anderen Elternteil unmöglich - Krankheit/Behinderung (§ 4c Abs. 1 Nr. 3)"
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

---

### 1.3 `tables/parents.xs` - Elternteil-Daten

```xs
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

    // ===== BESCHÄFTIGUNG =====

    enum employment_type {
      values = ["angestellt", "selbststaendig", "beamtet", "nicht_erwerbstaetig", "minijob", "arbeitslos", "student", "elternzeit"]
      description = "Art der Beschäftigung"
    }

    bool has_multiple_jobs?=false {
      description = "Mehrere Beschäftigungen"
    }

    // ===== EINKOMMEN (Bemessungszeitraum) =====

    decimal gross_income_monthly? filters=min:0 {
      description = "Durchschnittliches Bruttoeinkommen monatlich im Bemessungszeitraum"
    }

    json monthly_incomes? {
      description = "Detaillierte Einkommen der 12 Monate (Array mit {month, gross, net})"
    }

    decimal bonus_annual? filters=min:0 {
      description = "Jährliche Sonderzahlungen (Weihnachtsgeld, Urlaubsgeld)"
    }

    bool has_commission?=false {
      description = "Hat Provisionen/variable Vergütung"
    }

    decimal commission_average? filters=min:0 {
      description = "Durchschnittliche monatliche Provision"
    }

    // ===== STEUER =====

    enum tax_class {
      values = ["1", "2", "3", "4", "5", "6"]
      description = "Aktuelle Steuerklasse"
    }

    enum tax_class_assessment? {
      values = ["1", "2", "3", "4", "5", "6"]
      description = "Steuerklasse im Bemessungszeitraum (überwiegend - 7 von 12 Monaten)"
    }

    bool church_tax?=false {
      description = "Kirchensteuerpflichtig (Satz immer 8% nach § 2e Abs. 5 BEEG)"
    }

    // ===== SOZIALVERSICHERUNG =====
    // HINWEIS: § 2f BEEG verwendet Pauschalen (9%/10%/2%), nicht tatsächliche Sätze!
    // Daher nur prüfen OB versichert, nicht welcher Satz.

    enum health_insurance {
      values = ["gkv", "pkv"]
      description = "Krankenversicherung: GKV oder PKV (bei GKV: 9% Pauschale nach § 2f)"
    }

    bool pension_insurance?=true {
      description = "Rentenversicherungspflichtig (wenn ja: 10% Pauschale nach § 2f)"
    }

    bool unemployment_insurance?=true {
      description = "Arbeitslosenversicherungspflichtig (wenn ja: 2% Pauschale nach § 2f)"
    }

    // ===== EINKOMMENSGRENZE (§ 1 Abs. 8 BEEG) =====

    decimal taxable_income_annual? filters=min:0 {
      description = "Zu versteuerndes Einkommen lt. letztem Steuerbescheid (für 175.000 EUR Grenze)"
    }

    // ===== MUTTERSCHAFTSGELD (§ 3 BEEG) - nur für role=mother relevant =====

    decimal maternity_benefit_daily?=0 filters=min:0|max:13 {
      description = "Mutterschaftsgeld pro Tag von Krankenkasse (max. 13 EUR)"
    }

    decimal employer_supplement_daily?=0 filters=min:0 {
      description = "Arbeitgeberzuschuss zum Mutterschaftsgeld pro Tag"
    }

    date maternity_benefit_start? {
      description = "Beginn Mutterschaftsgeld-Bezug (i.d.R. 6 Wochen vor ET)"
    }

    date maternity_benefit_end? {
      description = "Ende Mutterschaftsgeld-Bezug (i.d.R. 8-12 Wochen nach Geburt)"
    }

    // ===== GEPLANTE ELTERNZEIT =====

    int planned_months_basis?=0 filters=min:0|max:14 {
      description = "Geplante Monate Basiselterngeld"
    }

    int planned_months_plus?=0 filters=min:0|max:28 {
      description = "Geplante Monate ElterngeldPlus"
    }

    int work_hours_during?=0 filters=min:0|max:32 {
      description = "Geplante Arbeitsstunden/Woche während Elternzeit (max 32)"
    }

    decimal expected_income_during? filters=min:0 {
      description = "Erwartetes Bruttoeinkommen während Teilzeit"
    }

    bool wants_partnership_bonus?=false {
      description = "Partnerschaftsbonus gewünscht (beide 24-32h für 2-4 Monate)"
    }

    // ===== AUSSCHLUSSMONATE (Bemessungszeitraum) =====

    json exclusion_months? {
      description = "Monate die aus Bemessungszeitraum ausgeschlossen werden (Krankheit, Kurzarbeit, etc.)"
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

---

### 1.4 `tables/calculations.xs` - Berechnungsergebnisse

```xs
table "calculations" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Berechnungs-ID"
    }

    int pregnancy_id {
      description = "Referenz zur Schwangerschaft"
    }

    // ===== HAUPTERGEBNISSE =====

    decimal baseline_total?=0 filters=min:0 {
      description = "Elterngeld ohne Optimierung (Summe beider Elternteile)"
    }

    decimal optimized_total?=0 filters=min:0 {
      description = "Elterngeld mit Optimierung (Summe)"
    }

    decimal optimization_potential?=0 filters=min:0 {
      description = "Berechnetes Optimierungspotenzial in Euro"
    }

    // ===== DETAILDATEN =====

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

    // ===== EMPFEHLUNG =====

    enum best_scenario? {
      values = ["basis_only", "plus_only", "mixed_mother_basis", "mixed_partner_basis", "partnership_bonus", "custom"]
      description = "Empfohlenes Szenario"
    }

    text recommendation_summary? {
      description = "Zusammenfassung der Empfehlung"
    }

    // ===== ZUSATZLEISTUNGEN =====

    decimal geschwisterbonus?=0 filters=min:0 {
      description = "Berechneter Geschwisterbonus"
    }

    decimal landeserziehungsgeld?=0 filters=min:0 {
      description = "Landeserziehungsgeld (BY/SN/TH)"
    }

    decimal kinderzuschlag_monthly?=0 filters=min:0 {
      description = "Geschätzter Kinderzuschlag pro Monat"
    }

    decimal wohngeld_monthly?=0 filters=min:0 {
      description = "Geschätztes Wohngeld pro Monat"
    }

    // ===== METADATA =====

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

---

### 1.5 `tables/optimizations.xs` - Gefundene Optimierungen

```xs
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
      values = [
        "tax_class_switch",
        "elterngeld_plus_mother",
        "elterngeld_plus_partner",
        "partnership_bonus",
        "sibling_bonus",
        "landeserziehungsgeld",
        "kinderzuschlag",
        "wohngeld",
        "timing_optimization",
        "income_shifting",
        "exclusion_months"
      ]
      description = "Art der Optimierung"
    }

    decimal potential_gain?=0 filters=min:0 {
      description = "Potenzieller Mehrwert in Euro"
    }

    text title filters=trim {
      description = "Kurztitel der Optimierung"
    }

    text description? {
      description = "Detaillierte Beschreibung"
    }

    text how_to? {
      description = "Schritt-für-Schritt Anleitung"
    }

    text requirements? {
      description = "Voraussetzungen für diese Optimierung"
    }

    text risks? {
      description = "Mögliche Risiken oder Nachteile"
    }

    date deadline? {
      description = "Frist für die Umsetzung"
    }

    int priority?=99 filters=min:1 {
      description = "Priorität (1 = höchste)"
    }

    enum difficulty {
      values = ["easy", "medium", "hard"]
      description = "Schwierigkeitsgrad der Umsetzung"
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

---

### 1.6 `tables/reminders.xs` - Erinnerungen & Fristen

```xs
table "reminders" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Erinnerungs-ID"
    }

    int user_id? {
      description = "Referenz zum User (optional)"
    }

    int lead_id? {
      description = "Referenz zum Lead (optional, für nicht-registrierte)"
    }

    int pregnancy_id? {
      description = "Referenz zur Schwangerschaft"
    }

    enum reminder_type {
      values = [
        "steuerklasse_wechsel",
        "mutterschutz_beginn",
        "elterngeld_antrag",
        "kindergeld_antrag",
        "elternzeit_antrag",
        "landesleistung_antrag",
        "geburtsurkunde",
        "vaterschaftsanerkennung",
        "custom"
      ]
      description = "Art der Erinnerung"
    }

    date due_date {
      description = "Fälligkeitsdatum"
    }

    int remind_days_before?=7 filters=min:1 {
      description = "Tage vor Fälligkeit erinnern"
    }

    text title filters=trim {
      description = "Titel der Erinnerung"
    }

    text description? {
      description = "Beschreibung"
    }

    text action_url? {
      description = "Link zur Aktion (z.B. Formular)"
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

---

### 1.7 `tables/payments.xs` - Zahlungen

> **Wichtig:** Premium wird pro **Household** gekauft, nicht pro User. So muss ein Paar nur einmal zahlen und beide Partner haben Premium-Zugang.

```xs
table "payments" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Payment-ID"
    }

    // ===== ZUORDNUNG =====
    // Premium gilt für den gesamten Household.
    // purchased_by_user_id dokumentiert, wer bezahlt hat (für Rückfragen).

    int household_id {
      description = "Household der Premium erhält - beide Partner profitieren"
    }

    int purchased_by_user_id {
      description = "Welcher User hat den Kauf getätigt (für Support-Anfragen)"
    }

    // ===== STRIPE-INTEGRATION =====
    text stripe_payment_id? filters=trim {
      description = "Stripe Payment Intent ID"
      sensitive = true
    }

    text stripe_checkout_session_id? filters=trim {
      description = "Stripe Checkout Session ID"
      sensitive = true
    }

    text stripe_customer_id? filters=trim {
      description = "Stripe Customer ID (wird pro Household erstellt)"
      sensitive = true
    }

    // ===== ZAHLUNGSDETAILS =====
    int amount filters=min:0 {
      description = "Betrag in Cent (7900 = 79€, 14900 = 149€)"
    }

    enum currency?="eur" {
      values = ["eur"]
      description = "Währung (nur EUR unterstützt)"
    }

    enum status {
      values = ["pending", "processing", "completed", "refunded", "failed", "disputed"]
      description = "Zahlungsstatus"
    }

    enum product {
      values = ["premium", "premium_plus"]
      description = "Gekauftes Produkt: premium=79€, premium_plus=149€"
    }

    // ===== METADATA =====
    json stripe_metadata? {
      description = "Zusätzliche Metadaten von Stripe (Webhook-Daten)"
      sensitive = true
    }

    // ===== ERSTATTUNG =====
    // 500€-Garantie: Wenn Optimierungspotenzial < 500€, volle Erstattung

    text refund_reason? {
      description = "Grund für Erstattung (z.B. 'Garantie: Optimierung < 500€')"
    }

    // ===== TIMESTAMPS =====
    timestamp created_at?=now {
      description = "Erstellungszeitpunkt (Checkout gestartet)"
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

### 1.8 Account-System: Household-Konzept

> **Konzept:** Ein Paar teilt sich einen **Household** (Haushalt). Beide Partner haben eigene Login-Daten, sehen aber dieselben Schwangerschafts- und Elterngelddaten. Premium wird pro Household gekauft und gilt für beide.

```
┌─────────────────────────────────────────────────────────────┐
│                      HOUSEHOLD                               │
│  (Zentrale Einheit für ein Paar)                            │
│  - Premium-Status gilt für alle Mitglieder                  │
│  - Schwangerschaftsdaten gehören dem Household              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   ┌─────────────┐    Einladung    ┌─────────────┐           │
│   │   USER 1    │  ────────────>  │   USER 2    │           │
│   │  (Owner)    │                 │  (Partner)  │           │
│   │  E-Mail/PW  │                 │  E-Mail/PW  │           │
│   └─────────────┘                 └─────────────┘           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

**Warum dieses Konzept?**
- **BEEG-konform:** Die 175.000€ Einkommensgrenze gilt für das Paar gemeinsam
- **Praktisch:** Elterngeld-Aufteilung wird gemeinsam geplant
- **Flexibel:** Jeder Partner hat eigene Login-Daten
- **Fair:** Premium-Kauf gilt für beide (nicht doppelt zahlen)

---

#### 1.8.1 `tables/households.xs` - Haushalt (zentrale Einheit)

> **Zweck:** Der Household ist die zentrale Einheit, zu der alles gehört: Users, Schwangerschaften, Zahlungen. Premium-Status wird hier gespeichert und gilt für alle Mitglieder.

```xs
table "households" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Household-ID"
    }

    // ===== PREMIUM-STATUS =====
    // Premium gilt für den gesamten Haushalt, nicht pro User!
    // So muss ein Paar nur einmal zahlen.

    enum premium_tier?="free" {
      values = ["free", "premium", "premium_plus"]
      description = "Premium-Stufe des Haushalts: free=Basis, premium=79€, premium_plus=149€"
    }

    timestamp premium_purchased_at? {
      description = "Zeitpunkt des Premium-Kaufs"
    }

    timestamp premium_expires_at? {
      description = "Ablaufdatum (NULL = unbegrenzt gültig)"
    }

    // ===== EINLADUNG =====
    // Kurzcode für Partner-Einladung (z.B. "ABC123")
    // Alternative zum E-Mail-Link

    text invite_code? filters=trim {
      description = "6-stelliger Einladungscode für Partner (z.B. zum Vorlesen)"
    }

    // ===== LEAD-KONVERTIERUNG =====
    // Wenn ein Lead (Quick-Check ohne Account) sich registriert,
    // verknüpfen wir den Lead mit dem neuen Household

    int lead_id? {
      description = "Ursprünglicher Lead-Eintrag (für Tracking)"
    }

    // ===== TIMESTAMPS =====
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

---

#### 1.8.2 `tables/users.xs` - Benutzer (Auth-Tabelle)

> **Zweck:** Authentifizierung und persönliche Daten. Jeder User gehört zu genau einem Household. Die Rolle (owner/partner) bestimmt, wer den Account erstellt hat und wer eingeladen wurde.

```xs
table "users" {
  // auth = true aktiviert Xanos eingebaute Authentifizierung
  // (automatisches Password-Hashing, JWT-Token-Generierung)
  auth = true

  schema {
    int id {
      description = "Eindeutige User-ID"
    }

    // ===== AUTHENTIFIZIERUNG =====
    // Diese Felder werden von Xano für Login verwaltet

    email email filters=trim|lower {
      description = "E-Mail-Adresse (wird als Login verwendet)"
      sensitive = true
    }

    password password {
      description = "Passwort (automatisch gehasht von Xano)"
      sensitive = true
    }

    // ===== HOUSEHOLD-ZUGEHÖRIGKEIT =====
    // Jeder User gehört zu genau einem Household.
    // So teilen sich Paare die Daten.

    int household_id {
      description = "Referenz zum Household - alle Daten werden darüber geteilt"
    }

    enum household_role?="owner" {
      values = ["owner", "partner"]
      description = "owner = hat Account erstellt, partner = wurde eingeladen"
    }

    // ===== PERSÖNLICHE DATEN =====
    text first_name? filters=trim {
      description = "Vorname (für personalisierte Ansprache)"
    }

    text last_name? filters=trim {
      description = "Nachname"
      sensitive = true
    }

    // ===== E-MAIL-VERIFIZIERUNG =====
    // Wichtig für: Passwort-Reset, Marketing-Mails, Sicherheit

    bool email_verified?=false {
      description = "Hat E-Mail-Adresse bestätigt"
    }

    text email_verification_token? {
      description = "Zufälliger Token für Verifizierungs-Link"
      sensitive = true
    }

    timestamp email_verified_at? {
      description = "Zeitpunkt der Bestätigung"
    }

    // ===== PASSWORT-RESET =====
    text password_reset_token? {
      description = "Token für Passwort-Reset-Link (24h gültig)"
      sensitive = true
    }

    timestamp password_reset_expires_at? {
      description = "Ablaufzeit des Reset-Tokens"
    }

    // ===== EINWILLIGUNGEN (DSGVO) =====
    bool consent_marketing?=false {
      description = "Einwilligung für Marketing-E-Mails (optional)"
    }

    bool consent_privacy?=true {
      description = "Datenschutz akzeptiert (Pflicht bei Registrierung)"
    }

    timestamp consent_privacy_at? {
      description = "Zeitpunkt der Datenschutz-Zustimmung"
    }

    // ===== SESSION-TRACKING =====
    timestamp last_login_at? {
      description = "Letzter erfolgreicher Login"
    }

    text last_login_ip? {
      description = "IP-Adresse beim letzten Login (für Sicherheit)"
      sensitive = true
    }

    // ===== TIMESTAMPS =====
    timestamp created_at?=now {
      description = "Registrierungszeitpunkt"
    }

    timestamp updated_at?=now {
      description = "Letzte Profiländerung"
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

---

#### 1.8.3 `tables/household_invitations.xs` - Partner-Einladungen

> **Zweck:** Verwaltet Einladungen für den Partner. Der Owner kann den Partner per E-Mail einladen. Der Einladungslink ist 7 Tage gültig.

```xs
table "household_invitations" {
  auth = false
  schema {
    int id {
      description = "Eindeutige Einladungs-ID"
    }

    // ===== VERKNÜPFUNGEN =====
    int household_id {
      description = "Zu welchem Household wird eingeladen"
    }

    int invited_by_user_id {
      description = "Wer hat die Einladung erstellt (Owner)"
    }

    // ===== EINLADUNGSDATEN =====
    email invited_email filters=trim|lower {
      description = "E-Mail-Adresse des eingeladenen Partners"
      sensitive = true
    }

    text token {
      description = "Einzigartiger Token für den Einladungslink"
      sensitive = true
    }

    // ===== STATUS =====
    enum status?="pending" {
      values = ["pending", "accepted", "expired", "cancelled"]
      description = "pending=offen, accepted=angenommen, expired=abgelaufen, cancelled=zurückgezogen"
    }

    // ===== GÜLTIGKEIT =====
    timestamp expires_at {
      description = "Ablaufzeitpunkt (Standard: 7 Tage nach Erstellung)"
    }

    // ===== ANNAHME =====
    timestamp accepted_at? {
      description = "Wann wurde die Einladung angenommen"
    }

    int accepted_by_user_id? {
      description = "User-ID des neu registrierten Partners"
    }

    // ===== TIMESTAMPS =====
    timestamp created_at?=now {
      description = "Erstellungszeitpunkt der Einladung"
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

---

## 2. Funktionen

### 2.1 Mutterschutz-Berechnung

**Datei:** `functions/elterngeld/calculate_mutterschutz.xs`

```xs
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
      description = "Frühgeburt"
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

    // Wochen nach Geburt bestimmen
    var $weeks_after {
      value = 8
    }

    // 12 Wochen bei: Mehrlinge, Frühgeburt, Kind mit Behinderung
    conditional {
      if ($input.is_multiple == true || $input.is_premature == true || $input.is_disabled_child == true) {
        var.update $weeks_after {
          value = 12
        }
      }
    }

    var $days_after {
      value = $weeks_after|multiply:7
    }

    var $mutterschutz_end {
      value = $input.due_date|transform_timestamp:"+" ~ $days_after ~ " days"|format_timestamp:"Y-m-d"
    }

    // Bemessungszeitraum Mutter: 12 Monate vor Mutterschutz-Beginn
    var $bemessungszeitraum_start {
      value = $mutterschutz_start|transform_timestamp:"-12 months"|format_timestamp:"Y-m-d"
    }

    var $bemessungszeitraum_end {
      value = $mutterschutz_start|transform_timestamp:"-1 day"|format_timestamp:"Y-m-d"
    }
  }

  response = {
    mutterschutz_start: $mutterschutz_start
    mutterschutz_end: $mutterschutz_end
    weeks_before: 6
    weeks_after: $weeks_after
    total_weeks: 6|add:$weeks_after
    bemessungszeitraum: {
      start: $bemessungszeitraum_start
      end: $bemessungszeitraum_end
    }
  }
}
```

---

### 2.2 Elterngeld-Netto Berechnung (EXAKT nach BEEG)

**Datei:** `functions/elterngeld/calculate_elterngeld_netto.xs`

Diese Funktion berechnet das "Elterngeld-Netto" nach den Pauschalierungsregeln des BEEG:

```xs
function "elterngeld/calculate_elterngeld_netto" {
  description = "Berechnet Elterngeld-Netto nach BEEG Pauschalabzügen"

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

    // HINWEIS: § 2e Abs. 5 BEEG schreibt einheitlich 8% vor!
    // "Als Abzug für die Kirchensteuer ist der Betrag anzusetzen, der sich unter
    // Anwendung eines Kirchensteuersatzes von 8 Prozent für die Einkommensteuer
    // nach Absatz 3 ergibt."
    // Der tatsächliche Bundesland-Satz (8% oder 9%) ist NICHT relevant!

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
    // ===== SCHRITT 1: Werbungskostenpauschale abziehen =====
    // 1.230 EUR jährlich / 12 = 102,50 EUR monatlich
    var $werbungskosten {
      value = 102.50
    }

    var $bereinigtes_brutto {
      value = $input.brutto_monatlich|subtract:$werbungskosten|max:0
    }

    // ===== SCHRITT 2: Lohnsteuer nach Programmablaufplan =====
    // Vereinfachte Berechnung basierend auf Steuerklasse
    // In der Praxis: Lohnsteuertabelle oder Programmablaufplan BMF

    // Steuertarif 2024 (vereinfacht als effektiver Steuersatz)
    var $lohnsteuer {
      value = 0
    }

    // Grundfreibetrag 2024: 11.604 EUR jährlich = 967 EUR monatlich
    var $grundfreibetrag_monatlich {
      value = 967
    }

    conditional {
      if ($input.tax_class == "1" || $input.tax_class == "4") {
        // Steuerklasse 1 und 4: Standard-Tarif
        var $zu_versteuern {
          value = $bereinigtes_brutto|subtract:$grundfreibetrag_monatlich|max:0
        }
        // Progressiver Tarif (vereinfacht)
        conditional {
          if ($zu_versteuern <= 1000) {
            var.update $lohnsteuer {
              value = $zu_versteuern|multiply:0.14
            }
          }
          elseif ($zu_versteuern <= 2500) {
            var.update $lohnsteuer {
              value = 140|add:(($zu_versteuern|subtract:1000)|multiply:0.24)
            }
          }
          else {
            var.update $lohnsteuer {
              value = 500|add:(($zu_versteuern|subtract:2500)|multiply:0.42)
            }
          }
        }
      }
      elseif ($input.tax_class == "2") {
        // Steuerklasse 2: Entlastungsbetrag für Alleinerziehende (4.260 EUR/Jahr)
        var $entlastung_monatlich {
          value = 355
        }
        var $zu_versteuern {
          value = $bereinigtes_brutto|subtract:$grundfreibetrag_monatlich|subtract:$entlastung_monatlich|max:0
        }
        conditional {
          if ($zu_versteuern <= 1000) {
            var.update $lohnsteuer {
              value = $zu_versteuern|multiply:0.14
            }
          }
          elseif ($zu_versteuern <= 2500) {
            var.update $lohnsteuer {
              value = 140|add:(($zu_versteuern|subtract:1000)|multiply:0.24)
            }
          }
          else {
            var.update $lohnsteuer {
              value = 500|add:(($zu_versteuern|subtract:2500)|multiply:0.42)
            }
          }
        }
      }
      elseif ($input.tax_class == "3") {
        // Steuerklasse 3: Doppelter Grundfreibetrag (Splitting)
        var $zu_versteuern {
          value = $bereinigtes_brutto|subtract:($grundfreibetrag_monatlich|multiply:2)|max:0
        }
        conditional {
          if ($zu_versteuern <= 2000) {
            var.update $lohnsteuer {
              value = $zu_versteuern|multiply:0.14
            }
          }
          elseif ($zu_versteuern <= 5000) {
            var.update $lohnsteuer {
              value = 280|add:(($zu_versteuern|subtract:2000)|multiply:0.24)
            }
          }
          else {
            var.update $lohnsteuer {
              value = 1000|add:(($zu_versteuern|subtract:5000)|multiply:0.42)
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
            var.update $lohnsteuer {
              value = 240|add:(($zu_versteuern|subtract:1000)|multiply:0.32)
            }
          }
          else {
            var.update $lohnsteuer {
              value = 720|add:(($zu_versteuern|subtract:2500)|multiply:0.42)
            }
          }
        }
      }
      else {
        // Steuerklasse 6: Höchste Belastung
        var.update $lohnsteuer {
          value = $bereinigtes_brutto|multiply:0.42
        }
      }
    }

    // ===== SCHRITT 3: Solidaritätszuschlag =====
    // 5.5% der Lohnsteuer (mit Freigrenzen, hier vereinfacht)
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

    // ===== SCHRITT 4: Kirchensteuer =====
    // § 2e Abs. 5 BEEG: "Als Abzug für die Kirchensteuer ist der Betrag anzusetzen,
    // der sich unter Anwendung eines Kirchensteuersatzes von 8 Prozent für die
    // Einkommensteuer nach Absatz 3 ergibt."
    // WICHTIG: Immer 8%, unabhängig vom Bundesland!
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

    // ===== SCHRITT 5: Sozialabgaben nach BEEG-Pauschale =====
    // WICHTIG: § 2f BEEG schreibt feste Pauschalen vor, NICHT die tatsächlichen AN-Anteile!
    //
    // § 2f Abs. 1 BEEG:
    // "Die Abzüge für Sozialabgaben werden einheitlich [...] anhand folgender Beitragssatzpauschalen ermittelt:
    //  1. 9 Prozent für die Kranken- und Pflegeversicherung [...]
    //  2. 10 Prozent für die Rentenversicherung [...]
    //  3. 2 Prozent für die Arbeitsförderung [...]"

    var $sozialabgaben {
      value = 0
    }

    // Kranken- und Pflegeversicherung: PAUSCHALE 9% (§ 2f Abs. 1 Nr. 1)
    // NICHT die tatsächlichen Sätze von 8.1% + 1.7%!
    conditional {
      if ($input.gkv_insured == true) {
        var.update $sozialabgaben {
          value = $sozialabgaben|add:($bereinigtes_brutto|multiply:0.09)
        }
      }
    }

    // Rentenversicherung: PAUSCHALE 10% (§ 2f Abs. 1 Nr. 2)
    // NICHT der tatsächliche AN-Anteil von 9.3%!
    conditional {
      if ($input.pension_insured == true) {
        var.update $sozialabgaben {
          value = $sozialabgaben|add:($bereinigtes_brutto|multiply:0.10)
        }
      }
    }

    // Arbeitslosenversicherung: PAUSCHALE 2% (§ 2f Abs. 1 Nr. 3)
    // NICHT der tatsächliche AN-Anteil von 1.3%!
    conditional {
      if ($input.unemployment_insured == true) {
        var.update $sozialabgaben {
          value = $sozialabgaben|add:($bereinigtes_brutto|multiply:0.02)
        }
      }
    }

    // Gesamt bei voller Versicherungspflicht: 9% + 10% + 2% = 21%

    // ===== SCHRITT 6: Elterngeld-Netto berechnen =====
    var $gesamt_abzuege {
      value = $lohnsteuer|add:$soli|add:$kirchensteuer|add:$sozialabgaben
    }

    var $elterngeld_netto {
      value = $bereinigtes_brutto|subtract:$gesamt_abzuege|max:0|round:2
    }
  }

  response = {
    elterngeld_netto: $elterngeld_netto
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

---

### 2.3 Ersatzrate nach BEEG §2 Abs. 2

**Datei:** `functions/elterngeld/calculate_ersatzrate.xs`

**Gesetzesgrundlage:** § 2 Abs. 2 BEEG:
> *"In den Fällen, in denen das Einkommen aus Erwerbstätigkeit vor der Geburt geringer als 1 000 Euro war, erhöht sich der Prozentsatz von 67 Prozent um 0,1 Prozentpunkte für je 2 Euro, um die dieses Einkommen den Betrag von 1 000 Euro unterschreitet, auf bis zu 100 Prozent. In den Fällen, in denen das Einkommen aus Erwerbstätigkeit vor der Geburt höher als 1 200 Euro war, sinkt der Prozentsatz von 67 Prozent um 0,1 Prozentpunkte für je 2 Euro, um die dieses Einkommen den Betrag von 1 200 Euro überschreitet, auf bis zu 65 Prozent."*

| Einkommensbereich | Ersatzrate |
|-------------------|------------|
| < 1.000 EUR | 67% + 0,1% je 2 EUR unter 1.000 → max 100% |
| 1.000 - 1.200 EUR | **Standard 67%** |
| > 1.200 EUR | 67% - 0,1% je 2 EUR über 1.200 → min 65% |

```xs
function "elterngeld/calculate_ersatzrate" {
  description = "Berechnet Ersatzrate nach BEEG §2 Abs. 2 (65-100%)"

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
      // Fall 1: Einkommen unter 1.000 EUR - Erhöhung bis 100%
      // § 2 Abs. 2 Satz 1: "geringer als 1 000 Euro"
      if ($input.elterngeld_netto < 1000) {
        // Pro 2 EUR unter 1.000: 0,1% mehr, bis 100%
        var $unterschuss {
          value = 1000|subtract:$input.elterngeld_netto
        }
        var $stufen {
          value = $unterschuss|divide:2|floor
        }
        var $erhoehung {
          value = $stufen|multiply:0.001
        }
        var.update $ersatzrate {
          value = 0.67|add:$erhoehung
        }
        conditional {
          if ($ersatzrate > 1.0) {
            var.update $ersatzrate {
              value = 1.0
            }
          }
        }
      }
      // Fall 2: Einkommen über 1.200 EUR - Absenkung bis 65%
      // § 2 Abs. 2 Satz 2: "höher als 1 200 Euro"
      elseif ($input.elterngeld_netto > 1200) {
        // Pro 2 EUR über 1.200: 0,1% weniger, minimal 65%
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
        conditional {
          if ($ersatzrate < 0.65) {
            var.update $ersatzrate {
              value = 0.65
            }
          }
        }
      }
      // Fall 3: Einkommen zwischen 1.000 und 1.200 EUR - Standard 67%
      // Keine Anpassung laut § 2 Abs. 2
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

---

### 2.4 Basiselterngeld berechnen

**Datei:** `functions/elterngeld/calculate_basiselterngeld.xs`

```xs
function "elterngeld/calculate_basiselterngeld" {
  description = "Berechnet monatliches Basiselterngeld nach BEEG"

  input {
    decimal elterngeld_netto filters=min:0 {
      description = "Elterngeld-Netto vor Geburt"
    }

    decimal einkommen_waehrend?=0 filters=min:0 {
      description = "Elterngeld-Netto während Elternzeit (bei Teilzeit)"
    }

    int kinder_unter_3?=0 filters=min:0 {
      description = "Anzahl Kinder unter 3 Jahren (für Geschwisterbonus)"
    }

    int kinder_unter_6?=0 filters=min:0 {
      description = "Anzahl Kinder unter 6 Jahren (mind. 2 für Bonus)"
    }

    bool mehrlinge?=false {
      description = "Mehrlingsgeburt"
    }

    int mehrling_anzahl?=1 filters=min:1 {
      description = "Anzahl Kinder bei Mehrlingsgeburt"
    }
  }

  stack {
    // ===== EINKOMMENSVERLUST BERECHNEN =====
    var $einkommensverlust {
      value = $input.elterngeld_netto|subtract:$input.einkommen_waehrend|max:0
    }

    // ===== ERSATZRATE ERMITTELN =====
    function.run "elterngeld/calculate_ersatzrate" {
      input = {
        elterngeld_netto: $input.elterngeld_netto
      }
    } as $ersatzrate

    // ===== BASISELTERNGELD BERECHNEN =====
    var $elterngeld_roh {
      value = $einkommensverlust|multiply:$ersatzrate
    }

    // ===== GRENZEN ANWENDEN (300-1.800 EUR) =====
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

    // ===== GESCHWISTERBONUS (§2a BEEG) =====
    // +10%, mind. 75 EUR, wenn:
    // - mind. 1 Kind unter 3 Jahren ODER
    // - mind. 2 Kinder unter 6 Jahren
    var $geschwisterbonus {
      value = 0
    }
    var $hat_geschwisterbonus {
      value = false
    }

    conditional {
      if ($input.kinder_unter_3 >= 1 || $input.kinder_unter_6 >= 2) {
        var.update $hat_geschwisterbonus {
          value = true
        }
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

    // ===== MEHRLINGSZUSCHLAG (§2a BEEG) =====
    // +300 EUR pro weiterem Kind
    var $mehrlingszuschlag {
      value = 0
    }

    conditional {
      if ($input.mehrlinge == true && $input.mehrling_anzahl > 1) {
        var $weitere_kinder {
          value = $input.mehrling_anzahl|subtract:1
        }
        var.update $mehrlingszuschlag {
          value = $weitere_kinder|multiply:300
        }
      }
    }

    // ===== GESAMTBETRAG =====
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

---

### 2.5 ElterngeldPlus berechnen

**Datei:** `functions/elterngeld/calculate_elterngeld_plus.xs`

```xs
function "elterngeld/calculate_elterngeld_plus" {
  description = "Berechnet ElterngeldPlus (halber Satz, doppelte Dauer)"

  input {
    decimal basiselterngeld filters=min:0 {
      description = "Berechnetes Basiselterngeld"
    }

    decimal einkommen_waehrend?=0 filters=min:0 {
      description = "Einkommen während ElterngeldPlus (Teilzeit)"
    }

    decimal elterngeld_netto_vor filters=min:0 {
      description = "Elterngeld-Netto vor Geburt"
    }
  }

  stack {
    // ElterngeldPlus = 50% des Basiselterngeldes, max. Deckelung
    var $elterngeld_plus_max {
      value = $input.basiselterngeld|divide:2
    }

    // Bei Zuverdienst: Anrechnung des Einkommens
    var $elterngeld_plus {
      value = $elterngeld_plus_max
    }

    conditional {
      if ($input.einkommen_waehrend > 0) {
        // Verlust = Einkommen vor - Einkommen während
        var $verlust {
          value = $input.elterngeld_netto_vor|subtract:$input.einkommen_waehrend|max:0
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
  }

  response = {
    elterngeld_plus_monatlich: $elterngeld_plus|round:2
    deckelung: $elterngeld_plus_max|round:2
  }
}
```

---

### 2.6 Optimierungen finden

**Datei:** `functions/elterngeld/find_optimizations.xs`

```xs
function "elterngeld/find_optimizations" {
  description = "Analysiert Situation und findet alle möglichen Optimierungen"

  input {
    int pregnancy_id {
      description = "ID der Schwangerschaft"
    }
  }

  stack {
    // Pregnancy und Parents laden
    db.get "pregnancies" {
      field_name = "id"
      field_value = $input.pregnancy_id
    } as $pregnancy

    db.query "parents" {
      where = $db.parents.pregnancy_id == $input.pregnancy_id
      return = {type: "list"}
    } as $parents

    var $optimizations {
      value = []
    }

    // Mutter und Partner extrahieren
    var $mother {
      value = null
    }
    var $partner {
      value = null
    }

    foreach ($parents) {
      each as $parent {
        conditional {
          if ($parent.role == "mother") {
            var.update $mother {
              value = $parent
            }
          }
          else {
            var.update $partner {
              value = $parent
            }
          }
        }
      }
    }

    // ===== OPTIMIERUNG 1: Steuerklassenwechsel =====
    conditional {
      if ($mother != null && $partner != null && $pregnancy.is_married == true) {
        // Wenn Mutter in SK5 und Partner in SK3
        conditional {
          if ($mother.tax_class == "5" && $partner.tax_class == "3") {
            // Wechsel zu 3/5 könnte Mutter helfen
            var.update $optimizations {
              value = $optimizations|push:{
                type: "tax_class_switch"
                title: "Steuerklassenwechsel zu 3/5"
                potential_gain: 2000
                description: "Wechsel der Steuerklassen: Mutter auf 3, Partner auf 5"
                how_to: "1. Formular beim Finanzamt einreichen\n2. Mindestens 7 Monate vor Mutterschutz wechseln"
                priority: 1
                difficulty: "easy"
                deadline: $pregnancy.mutterschutz_start|transform_timestamp:"-7 months"
              }
            }
          }
        }
      }
    }

    // ===== OPTIMIERUNG 2: ElterngeldPlus bei Teilzeit =====
    conditional {
      if ($mother != null && $mother.work_hours_during > 0 && $mother.work_hours_during <= 32) {
        var.update $optimizations {
          value = $optimizations|push:{
            type: "elterngeld_plus_mother"
            title: "ElterngeldPlus für Mutter nutzen"
            potential_gain: 500
            description: "Bei Teilzeitarbeit ist ElterngeldPlus vorteilhaft"
            how_to: "Im Elterngeld-Antrag ElterngeldPlus statt Basiselterngeld beantragen"
            priority: 2
            difficulty: "easy"
          }
        }
      }
    }

    // ===== OPTIMIERUNG 3: Partnerschaftsbonus =====
    conditional {
      if ($mother != null && $partner != null) {
        conditional {
          if ($mother.work_hours_during >= 24 && $mother.work_hours_during <= 32
              && $partner.work_hours_during >= 24 && $partner.work_hours_during <= 32) {
            var.update $optimizations {
              value = $optimizations|push:{
                type: "partnership_bonus"
                title: "Partnerschaftsbonus nutzen"
                potential_gain: 1200
                description: "Beide Eltern arbeiten 24-32h: 4 zusätzliche ElterngeldPlus-Monate"
                how_to: "Im Antrag Partnerschaftsbonus beantragen, Arbeitszeitnachweis beifügen"
                priority: 2
                difficulty: "medium"
              }
            }
          }
        }
      }
    }

    // ===== OPTIMIERUNG 4: Geschwisterbonus =====
    conditional {
      if ($pregnancy.existing_children_under_3 >= 1 || $pregnancy.existing_children_under_6 >= 2) {
        var.update $optimizations {
          value = $optimizations|push:{
            type: "sibling_bonus"
            title: "Geschwisterbonus beantragen"
            potential_gain: 900
            description: "+10% Elterngeld (mind. 75€/Monat) für Geschwister"
            how_to: "Im Antrag Geschwisterbonus ankreuzen, Geburtsurkunden beifügen"
            priority: 3
            difficulty: "easy"
          }
        }
      }
    }

    // ===== OPTIMIERUNG 5: Landeserziehungsgeld (BY, SN, TH) =====
    conditional {
      if ($pregnancy.bundesland == "BY" || $pregnancy.bundesland == "SN" || $pregnancy.bundesland == "TH") {
        var $landesleistung_name {
          value = "Landeserziehungsgeld"
        }
        var $landesleistung_betrag {
          value = 0
        }

        switch ($pregnancy.bundesland) {
          case ("BY") {
            var.update $landesleistung_betrag {
              value = 3000
            }
          } break
          case ("SN") {
            var.update $landesleistung_betrag {
              value = 1800
            }
          } break
          case ("TH") {
            var.update $landesleistung_betrag {
              value = 1500
            }
          } break
        }

        var.update $optimizations {
          value = $optimizations|push:{
            type: "landeserziehungsgeld"
            title: $landesleistung_name ~ " beantragen"
            potential_gain: $landesleistung_betrag
            description: "Zusätzliche Landesleistung für " ~ $pregnancy.bundesland
            how_to: "Separaten Antrag beim Landesamt stellen"
            priority: 3
            difficulty: "easy"
          }
        }
      }
    }

    // ===== OPTIMIERUNG 6: Kinderzuschlag prüfen =====
    // Wenn Haushaltseinkommen niedrig
    conditional {
      if ($mother != null && $mother.net_income < 2000) {
        var.update $optimizations {
          value = $optimizations|push:{
            type: "kinderzuschlag"
            title: "Kinderzuschlag prüfen"
            potential_gain: 2920
            description: "Bis zu 292€/Monat extra für einkommensschwache Familien"
            how_to: "Antrag bei der Familienkasse stellen"
            priority: 4
            difficulty: "medium"
          }
        }
      }
    }

    // Prioritäten sortieren
    var.update $optimizations {
      value = $optimizations|sort:"priority":"asc"
    }
  }

  response = $optimizations
}
```

---

### 2.7 Vollständige Berechnung

**Datei:** `functions/elterngeld/calculate_full.xs`

```xs
function "elterngeld/calculate_full" {
  description = "Führt vollständige Elterngeld-Berechnung durch"

  input {
    int pregnancy_id {
      description = "ID der Schwangerschaft"
    }
  }

  stack {
    // Daten laden
    db.get "pregnancies" {
      field_name = "id"
      field_value = $input.pregnancy_id
    } as $pregnancy

    db.query "parents" {
      where = $db.parents.pregnancy_id == $input.pregnancy_id
      return = {type: "list"}
    } as $parents

    // Mutter und Partner extrahieren
    var $mother {
      value = null
    }
    var $partner {
      value = null
    }

    foreach ($parents) {
      each as $parent {
        conditional {
          if ($parent.role == "mother") {
            var.update $mother {
              value = $parent
            }
          }
          else {
            var.update $partner {
              value = $parent
            }
          }
        }
      }
    }

    // ===== MUTTER BERECHNEN =====
    var $mother_result {
      value = null
    }

    conditional {
      if ($mother != null) {
        // Elterngeld-Netto berechnen
        function.run "elterngeld/calculate_elterngeld_netto" {
          input = {
            brutto_monatlich: $mother.gross_income_monthly
            tax_class: $mother.tax_class_assessment
            church_tax: $mother.church_tax
            gkv_insured: $mother.health_insurance == "gkv"
            pension_insured: $mother.pension_insurance
          }
        } as $mother_netto

        // Basiselterngeld berechnen
        function.run "elterngeld/calculate_basiselterngeld" {
          input = {
            elterngeld_netto: $mother_netto.elterngeld_netto
            einkommen_waehrend: $mother.expected_income_during
            kinder_unter_3: $pregnancy.existing_children_under_3
            kinder_unter_6: $pregnancy.existing_children_under_6
            mehrlinge: $pregnancy.is_multiple
            mehrling_anzahl: $pregnancy.multiple_count
          }
        } as $mother_basis

        var.update $mother_result {
          value = {
            elterngeld_netto: $mother_netto.elterngeld_netto
            basiselterngeld: $mother_basis.elterngeld_monatlich
            monate_basis: $mother.planned_months_basis
            monate_plus: $mother.planned_months_plus
            gesamt: ($mother_basis.elterngeld_monatlich|multiply:$mother.planned_months_basis)|add:(($mother_basis.elterngeld_monatlich|divide:2)|multiply:$mother.planned_months_plus)
          }
        }
      }
    }

    // ===== PARTNER BERECHNEN (analog) =====
    var $partner_result {
      value = null
    }

    conditional {
      if ($partner != null) {
        function.run "elterngeld/calculate_elterngeld_netto" {
          input = {
            brutto_monatlich: $partner.gross_income_monthly
            tax_class: $partner.tax_class_assessment
            church_tax: $partner.church_tax
            gkv_insured: $partner.health_insurance == "gkv"
            pension_insured: $partner.pension_insurance
          }
        } as $partner_netto

        function.run "elterngeld/calculate_basiselterngeld" {
          input = {
            elterngeld_netto: $partner_netto.elterngeld_netto
            einkommen_waehrend: $partner.expected_income_during
            kinder_unter_3: $pregnancy.existing_children_under_3
            kinder_unter_6: $pregnancy.existing_children_under_6
            mehrlinge: $pregnancy.is_multiple
            mehrling_anzahl: $pregnancy.multiple_count
          }
        } as $partner_basis

        var.update $partner_result {
          value = {
            elterngeld_netto: $partner_netto.elterngeld_netto
            basiselterngeld: $partner_basis.elterngeld_monatlich
            monate_basis: $partner.planned_months_basis
            monate_plus: $partner.planned_months_plus
            gesamt: ($partner_basis.elterngeld_monatlich|multiply:$partner.planned_months_basis)|add:(($partner_basis.elterngeld_monatlich|divide:2)|multiply:$partner.planned_months_plus)
          }
        }
      }
    }

    // ===== OPTIMIERUNGEN FINDEN =====
    function.run "elterngeld/find_optimizations" {
      input = {
        pregnancy_id: $input.pregnancy_id
      }
    } as $optimizations

    // ===== SUMMEN BERECHNEN =====
    var $baseline_total {
      value = 0
    }

    conditional {
      if ($mother_result != null) {
        var.update $baseline_total {
          value = $baseline_total|add:$mother_result.gesamt
        }
      }
    }

    conditional {
      if ($partner_result != null) {
        var.update $baseline_total {
          value = $baseline_total|add:$partner_result.gesamt
        }
      }
    }

    // Optimierungspotenzial summieren
    var $optimization_potential {
      value = 0
    }

    foreach ($optimizations) {
      each as $opt {
        var.update $optimization_potential {
          value = $optimization_potential|add:$opt.potential_gain
        }
      }
    }

    var $optimized_total {
      value = $baseline_total|add:$optimization_potential
    }
  }

  response = {
    baseline_total: $baseline_total|round:2
    optimized_total: $optimized_total|round:2
    optimization_potential: $optimization_potential|round:2
    mother: $mother_result
    partner: $partner_result
    optimizations: $optimizations
    best_scenario: "mixed"
  }
}
```

---

### 2.8 Einkommensgrenze prüfen (§ 1 Abs. 8 + § 28 Abs. 5 BEEG)

**Datei:** `functions/elterngeld/check_income_eligibility.xs`

**Gesetzesgrundlage:** § 1 Abs. 8 BEEG:
> *"Ein Anspruch entfällt, wenn die berechtigte Person im letzten abgeschlossenen Veranlagungszeitraum vor der Geburt des Kindes ein zu versteuerndes Einkommen nach § 2 Absatz 5 des Einkommensteuergesetzes in Höhe von mehr als 175 000 Euro erzielt hat. Erfüllt auch eine andere Person die Voraussetzungen [...], entfällt [...] der Anspruch, wenn die Summe des zu versteuernden Einkommens beider Personen mehr als 175 000 Euro beträgt."*

**Übergangsregelung § 28 Abs. 5:** Für Geburten 01.04.2024 - 31.03.2025 gilt noch die Grenze von 200.000 EUR.

```xs
function "elterngeld/check_income_eligibility" {
  description = "Prüft Einkommensgrenze nach § 1 Abs. 8 BEEG inkl. Übergangsregelungen"

  input {
    decimal taxable_income_person1 filters=min:0 {
      description = "Zu versteuerndes Einkommen Person 1 (letzter Veranlagungszeitraum)"
    }

    decimal taxable_income_person2?=0 filters=min:0 {
      description = "Zu versteuerndes Einkommen Person 2 (bei Paaren)"
    }

    date birth_date {
      description = "Geburtsdatum des Kindes"
    }

    bool is_single_parent?=false {
      description = "Alleinerziehend (nur eigenes Einkommen prüfen)"
    }
  }

  stack {
    // Einkommensgrenze je nach Geburtsdatum bestimmen (§ 28 Abs. 5)
    var $income_threshold {
      value = 175000
    }

    // Übergangsregelung: 01.04.2024 - 31.03.2025 → 200.000 EUR
    conditional {
      if ($input.birth_date >= "2024-04-01" && $input.birth_date < "2025-04-01") {
        var.update $income_threshold {
          value = 200000
        }
      }
      // Vor 01.04.2024: Keine Einkommensgrenze dieser Art
      elseif ($input.birth_date < "2024-04-01") {
        var.update $income_threshold {
          value = 9999999
        }
      }
    }

    // Prüfung: Bei Alleinerziehenden nur eigenes Einkommen
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

    var $is_eligible {
      value = $relevant_income <= $income_threshold
    }

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
    legal_reference: "§ 1 Abs. 8 BEEG"
  }
}
```

---

### 2.9 Mutterschaftsgeld-Anrechnung (§ 3 BEEG)

**Datei:** `functions/elterngeld/calculate_maternity_benefit_offset.xs`

**Gesetzesgrundlage:** § 3 Abs. 1 BEEG:
> *"Auf das [...] Elterngeld werden folgende Einnahmen angerechnet:*
> *1. Mutterschaftsleistungen a) in Form des Mutterschaftsgeldes nach dem Fünften Buch Sozialgesetzbuch [...] b) in Form des Zuschusses zum Mutterschaftsgeld nach § 20 des Mutterschutzgesetzes"*

**WICHTIG:** § 3 Abs. 2 - Der 300 EUR Freibetrag gilt NICHT für Mutterschaftsleistungen!

```xs
function "elterngeld/calculate_maternity_benefit_offset" {
  description = "Berechnet Elterngeld unter Anrechnung von Mutterschaftsgeld (§ 3 BEEG)"

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
    // Gesamtes Mutterschaftsgeld im Monat berechnen
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
    // § 3 Abs. 2: "soweit nicht Einnahmen nach Absatz 1 Satz 1 Nummer 1 bis 3"
    var $elterngeld_after_offset {
      value = $input.elterngeld_calculated|subtract:$total_maternity_benefit
    }

    // Kann nicht negativ werden
    conditional {
      if ($elterngeld_after_offset < 0) {
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
    note: "Mutterschaftsgeld wird voll angerechnet (§ 3 Abs. 1 Nr. 1 BEEG)"
    legal_reference: "§ 3 BEEG"
  }
}
```

---

### 2.10 Einkommensdeckelung bei Teilzeit (§ 2 Abs. 3 BEEG)

**Datei:** `functions/elterngeld/calculate_with_income_cap.xs`

**Gesetzesgrundlage:** § 2 Abs. 3 Satz 2 BEEG:
> *"Als Einkommen aus Erwerbstätigkeit vor der Geburt ist dabei höchstens der Betrag von 2 770 Euro anzusetzen."*

Diese Deckelung gilt nur bei der Differenzberechnung, wenn während des Elterngeldbezugs Einkommen erzielt wird.

```xs
function "elterngeld/calculate_with_income_cap" {
  description = "Berechnet Elterngeld bei Teilzeit mit 2.770 EUR Deckelung (§ 2 Abs. 3)"

  input {
    decimal elterngeld_netto_before filters=min:0 {
      description = "Elterngeld-Netto vor der Geburt"
    }

    decimal elterngeld_netto_during filters=min:0 {
      description = "Elterngeld-Netto während Elternzeit (Teilzeit)"
    }
  }

  stack {
    // Deckelung des Vorgeburt-Einkommens auf 2.770 EUR
    var $capped_income_before {
      value = $input.elterngeld_netto_before
    }

    conditional {
      if ($input.elterngeld_netto_before > 2770) {
        var.update $capped_income_before {
          value = 2770
        }
      }
    }

    // Einkommensverlust berechnen (mit Deckelung)
    var $income_difference {
      value = $capped_income_before|subtract:$input.elterngeld_netto_during|max:0
    }

    // Ersatzrate auf gedeckeltes Einkommen anwenden
    function.run "elterngeld/calculate_ersatzrate" {
      input = {
        elterngeld_netto: $capped_income_before
      }
    } as $ersatzrate

    var $elterngeld {
      value = $income_difference|multiply:$ersatzrate
    }

    // Min/Max anwenden
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
  }

  response = {
    elterngeld_monatlich: $elterngeld|round:2
    original_income: $input.elterngeld_netto_before|round:2
    capped_income: $capped_income_before
    income_during: $input.elterngeld_netto_during|round:2
    income_difference: $income_difference|round:2
    ersatzrate: $ersatzrate
    cap_applied: $input.elterngeld_netto_before > 2770
    legal_reference: "§ 2 Abs. 3 Satz 2 BEEG"
  }
}
```

---

### 2.11 Frühgeburten-Zusatzmonate (§ 4 Abs. 5 BEEG)

**Datei:** `functions/elterngeld/calculate_premature_birth_months.xs`

**Gesetzesgrundlage:** § 4 Abs. 5 BEEG:
> *"Abweichend von Absatz 3 Satz 1 beträgt der gemeinsame Anspruch der Eltern auf Basiselterngeld für ein Kind, das*
> *1. mindestens sechs Wochen vor dem voraussichtlichen Tag der Entbindung geboren wurde: 13 Monatsbeträge;*
> *2. mindestens acht Wochen vor dem voraussichtlichen Tag der Entbindung geboren wurde: 14 Monatsbeträge;*
> *3. mindestens zwölf Wochen vor dem voraussichtlichen Tag der Entbindung geboren wurde: 15 Monatsbeträge;*
> *4. mindestens 16 Wochen vor dem voraussichtlichen Tag der Entbindung geboren wurde: 16 Monatsbeträge."*

```xs
function "elterngeld/calculate_premature_birth_months" {
  description = "Berechnet Zusatzmonate bei Frühgeburt (§ 4 Abs. 5 BEEG)"

  input {
    date due_date {
      description = "Voraussichtlicher Entbindungstermin (ET)"
    }

    date actual_birth_date {
      description = "Tatsächliches Geburtsdatum"
    }
  }

  stack {
    // Tage vor ET berechnen
    var $days_early {
      value = $input.due_date|transform_timestamp:"-0 days"|date_diff:$input.actual_birth_date:"days"
    }

    // In Wochen umrechnen
    var $weeks_early {
      value = $days_early|divide:7|floor
    }

    // Standard: 12 Monate
    var $base_months {
      value = 12
    }

    var $additional_months {
      value = 0
    }

    var $is_premature {
      value = false
    }

    // Zusatzmonate nach § 4 Abs. 5 bestimmen
    conditional {
      if ($weeks_early >= 16) {
        // § 4 Abs. 5 Nr. 4: 16 Wochen → 16 Monate (+4)
        var.update $additional_months {
          value = 4
        }
        var.update $is_premature {
          value = true
        }
      }
      elseif ($weeks_early >= 12) {
        // § 4 Abs. 5 Nr. 3: 12 Wochen → 15 Monate (+3)
        var.update $additional_months {
          value = 3
        }
        var.update $is_premature {
          value = true
        }
      }
      elseif ($weeks_early >= 8) {
        // § 4 Abs. 5 Nr. 2: 8 Wochen → 14 Monate (+2)
        var.update $additional_months {
          value = 2
        }
        var.update $is_premature {
          value = true
        }
      }
      elseif ($weeks_early >= 6) {
        // § 4 Abs. 5 Nr. 1: 6 Wochen → 13 Monate (+1)
        var.update $additional_months {
          value = 1
        }
        var.update $is_premature {
          value = true
        }
      }
    }

    var $total_months {
      value = $base_months|add:$additional_months
    }

    // Auch pro Elternteil erhöht sich das Maximum entsprechend (§ 4 Abs. 5 Satz 3)
    var $max_per_parent {
      value = 12|add:$additional_months
    }
  }

  response = {
    is_premature: $is_premature
    weeks_early: $weeks_early
    base_months: $base_months
    additional_months: $additional_months
    total_months: $total_months
    max_per_parent: $max_per_parent
    legal_reference: "§ 4 Abs. 5 BEEG"
  }
}
```

---

### 2.12 Alleinerziehenden-Prüfung (§ 4c BEEG)

**Datei:** `functions/elterngeld/check_single_parent_eligibility.xs`

**Gesetzesgrundlage:** § 4c Abs. 1 BEEG:
> *"Ein Elternteil kann abweichend von § 4 Absatz 4 Satz 1 zusätzlich auch das Elterngeld für die Partnermonate [...] beziehen, wenn [...]:*
> *1. bei diesem Elternteil die Voraussetzungen für den Entlastungsbetrag für Alleinerziehende nach § 24b Absatz 1 und 3 des Einkommensteuergesetzes vorliegen und der andere Elternteil weder mit ihm noch mit dem Kind in einer Wohnung lebt,*
> *2. mit der Betreuung durch den anderen Elternteil eine Gefährdung des Kindeswohls [...] verbunden wäre oder*
> *3. die Betreuung durch den anderen Elternteil unmöglich ist [...]"*

```xs
function "elterngeld/check_single_parent_eligibility" {
  description = "Prüft Anspruch auf Partnermonate für Alleinerziehende (§ 4c BEEG)"

  input {
    bool has_tax_class_2?=false {
      description = "Steuerklasse 2 (Entlastungsbetrag für Alleinerziehende)"
    }

    bool partner_lives_separately?=false {
      description = "Partner lebt nicht im selben Haushalt"
    }

    bool child_welfare_at_risk?=false {
      description = "Kindeswohl bei Betreuung durch anderen Elternteil gefährdet"
    }

    bool partner_care_impossible?=false {
      description = "Betreuung durch anderen Elternteil unmöglich (Krankheit, Behinderung)"
    }
  }

  stack {
    var $qualifies_paragraph_4c {
      value = false
    }

    var $qualifying_reason {
      value = ""
    }

    // Prüfung nach § 4c Abs. 1 Nr. 1
    conditional {
      if ($input.has_tax_class_2 == true && $input.partner_lives_separately == true) {
        var.update $qualifies_paragraph_4c {
          value = true
        }
        var.update $qualifying_reason {
          value = "§ 4c Abs. 1 Nr. 1: Entlastungsbetrag für Alleinerziehende + getrennt lebend"
        }
      }
    }

    // Prüfung nach § 4c Abs. 1 Nr. 2
    conditional {
      if ($input.child_welfare_at_risk == true) {
        var.update $qualifies_paragraph_4c {
          value = true
        }
        var.update $qualifying_reason {
          value = "§ 4c Abs. 1 Nr. 2: Gefährdung des Kindeswohls"
        }
      }
    }

    // Prüfung nach § 4c Abs. 1 Nr. 3
    conditional {
      if ($input.partner_care_impossible == true) {
        var.update $qualifies_paragraph_4c {
          value = true
        }
        var.update $qualifying_reason {
          value = "§ 4c Abs. 1 Nr. 3: Betreuung durch anderen Elternteil unmöglich"
        }
      }
    }

    // Zusätzliche Monate bei Alleinerziehenden
    var $additional_months {
      value = 0
    }

    conditional {
      if ($qualifies_paragraph_4c == true) {
        // 2 Partnermonate zusätzlich
        var.update $additional_months {
          value = 2
        }
      }
    }
  }

  response = {
    qualifies_for_partner_months: $qualifies_paragraph_4c
    qualifying_reason: $qualifying_reason
    additional_months: $additional_months
    total_months_available: 12|add:$additional_months
    legal_reference: "§ 4c BEEG"
  }
}
```

---

### 2.8 Auth-Funktionen

> **Übersicht:** Diese Funktionen verwalten Registrierung, Login, E-Mail-Verifizierung und das Einladungssystem für Partner.

---

#### 2.8.1 `functions/auth/register_user.xs` - Neue Registrierung

> **Zweck:** Erstellt einen neuen Account. Automatisch wird auch ein Household erstellt, zu dem der User als "owner" gehört.

```xs
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
    // ===== 1. Prüfen ob E-Mail bereits existiert =====
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

    // ===== 2. Household erstellen =====
    // Der Household ist die zentrale Einheit für das Paar

    var $invite_code {
      value = $util.random_string:6|upper
    }

    db.post "households" {
      data = {
        premium_tier: "free"
        invite_code: $invite_code
        lead_id: $input.lead_id
      }
    } as $household

    // ===== 3. User erstellen =====
    var $verification_token {
      value = $util.random_string:32
    }

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

    // ===== 4. Verifizierungs-E-Mail senden =====
    // (E-Mail-Versand hier ausgelassen, siehe separaten E-Mail-Service)

    // ===== 5. Auth-Token generieren =====
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
    message: "Bitte bestätige deine E-Mail-Adresse"
  }
}
```

---

#### 2.8.2 `functions/auth/register_with_invitation.xs` - Registrierung über Einladung

> **Zweck:** Partner registriert sich über den Einladungslink. Wird automatisch dem existierenden Household zugeordnet.

```xs
function "auth/register_with_invitation" {
  description = "Registriert Partner über Einladungslink"

  input {
    text token filters=trim {
      description = "Einladungs-Token aus dem Link"
    }

    email email filters=trim|lower {
      description = "E-Mail-Adresse"
    }

    password password filters=min:8 {
      description = "Passwort"
    }

    text first_name? filters=trim {
      description = "Vorname"
    }
  }

  stack {
    // ===== 1. Einladung prüfen =====
    db.query "household_invitations" {
      where = $db.household_invitations.token == $input.token
      return = {type: "first"}
    } as $invitation

    conditional {
      if ($invitation == null) {
        precondition.fail {
          code = 404
          message = "Einladung nicht gefunden"
        }
      }
    }

    // ===== 2. Status und Ablauf prüfen =====
    conditional {
      if ($invitation.status != "pending") {
        precondition.fail {
          code = 400
          message = "Diese Einladung wurde bereits verwendet oder zurückgezogen"
        }
      }
    }

    conditional {
      if ($invitation.expires_at < $util.now) {
        // Einladung als abgelaufen markieren
        db.edit "household_invitations" {
          field_name = "id"
          field_value = $invitation.id
          data = {status: "expired"}
        }
        precondition.fail {
          code = 410
          message = "Diese Einladung ist abgelaufen. Bitte fordere eine neue an."
        }
      }
    }

    // ===== 3. E-Mail prüfen (muss mit Einladung übereinstimmen) =====
    conditional {
      if ($invitation.invited_email != $input.email) {
        precondition.fail {
          code = 400
          message = "Die E-Mail-Adresse stimmt nicht mit der Einladung überein"
        }
      }
    }

    // ===== 4. User erstellen =====
    db.post "users" {
      data = {
        email: $input.email
        password: $input.password
        household_id: $invitation.household_id
        household_role: "partner"
        first_name: $input.first_name
        email_verified: true
        consent_privacy: true
        consent_privacy_at: $util.now
      }
    } as $user

    // ===== 5. Einladung als akzeptiert markieren =====
    db.edit "household_invitations" {
      field_name = "id"
      field_value = $invitation.id
      data = {
        status: "accepted"
        accepted_at: $util.now
        accepted_by_user_id: $user.id
      }
    }

    // ===== 6. Auth-Token generieren =====
    auth.create_token {
      user_id = $user.id
    } as $auth_token

    // ===== 7. Household laden =====
    db.get "households" {
      field_name = "id"
      field_value = $invitation.household_id
    } as $household
  }

  response = {
    success: true
    user: {
      id: $user.id
      email: $user.email
      first_name: $user.first_name
      household_id: $household.id
      household_role: "partner"
    }
    household: {
      id: $household.id
      premium_tier: $household.premium_tier
    }
    auth_token: $auth_token
    message: "Willkommen! Du bist jetzt mit deinem Partner verbunden."
  }
}
```

---

#### 2.8.3 `functions/household/invite_partner.xs` - Partner einladen

> **Zweck:** Owner lädt Partner per E-Mail ein. Einladung ist 7 Tage gültig.

```xs
function "household/invite_partner" {
  description = "Erstellt Einladung für Partner"

  input {
    int user_id {
      description = "ID des einladenden Users (muss Owner sein)"
    }

    email partner_email filters=trim|lower {
      description = "E-Mail des Partners"
    }
  }

  stack {
    // ===== 1. User laden und Berechtigung prüfen =====
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

    // ===== 2. Prüfen ob bereits Partner im Household =====
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

    // ===== 3. Prüfen ob E-Mail bereits registriert =====
    db.query "users" {
      where = $db.users.email == $input.partner_email
      return = {type: "first"}
    } as $email_exists

    conditional {
      if ($email_exists != null) {
        precondition.fail {
          code = 409
          message = "Diese E-Mail ist bereits registriert. Dein Partner kann sich direkt mit dem Einladungscode verbinden."
        }
      }
    }

    // ===== 4. Alte offene Einladungen zurückziehen =====
    db.query "household_invitations" {
      where = $db.household_invitations.household_id == $user.household_id && $db.household_invitations.status == "pending"
      return = {type: "list"}
    } as $old_invitations

    foreach ($old_invitations as $old_inv) {
      db.edit "household_invitations" {
        field_name = "id"
        field_value = $old_inv.id
        data = {status: "cancelled"}
      }
    }

    // ===== 5. Neue Einladung erstellen =====
    var $token {
      value = $util.random_string:48
    }

    var $expires_at {
      value = $util.now|transform_timestamp:"+7 days"
    }

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

    // ===== 6. Einladungs-E-Mail senden =====
    // (E-Mail-Versand separat implementieren)
  }

  response = {
    success: true
    invitation_id: $invitation.id
    invited_email: $input.partner_email
    expires_at: $expires_at
    invite_link: "https://eltern-kompass.de/einladung/" ~ $token
    message: "Einladung wurde an " ~ $input.partner_email ~ " gesendet"
  }
}
```

---

#### 2.8.4 `functions/auth/verify_email.xs` - E-Mail bestätigen

> **Zweck:** Bestätigt die E-Mail-Adresse über den Verifizierungslink.

```xs
function "auth/verify_email" {
  description = "Bestätigt E-Mail-Adresse"

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
          message = "Ungültiger Verifizierungslink"
        }
      }
    }

    conditional {
      if ($user.email_verified == true) {
        precondition.fail {
          code = 400
          message = "E-Mail wurde bereits bestätigt"
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
    message: "E-Mail erfolgreich bestätigt"
  }
}
```

---

#### 2.8.5 `functions/auth/request_password_reset.xs` - Passwort-Reset anfordern

> **Zweck:** Sendet einen Passwort-Reset-Link per E-Mail (24h gültig).

```xs
function "auth/request_password_reset" {
  description = "Startet Passwort-Reset-Prozess"

  input {
    email email filters=trim|lower {
      description = "E-Mail-Adresse des Accounts"
    }
  }

  stack {
    // User suchen (Fehler NICHT preisgeben ob E-Mail existiert - Sicherheit!)
    db.query "users" {
      where = $db.users.email == $input.email
      return = {type: "first"}
    } as $user

    conditional {
      if ($user != null) {
        // Reset-Token erstellen
        var $reset_token {
          value = $util.random_string:48
        }

        var $expires_at {
          value = $util.now|transform_timestamp:"+24 hours"
        }

        db.edit "users" {
          field_name = "id"
          field_value = $user.id
          data = {
            password_reset_token: $reset_token
            password_reset_expires_at: $expires_at
          }
        }

        // E-Mail mit Reset-Link senden
        // (separat implementieren)
      }
    }
  }

  // Immer gleiche Antwort (Sicherheit: keine Info ob E-Mail existiert)
  response = {
    success: true
    message: "Falls ein Account mit dieser E-Mail existiert, erhältst du einen Reset-Link."
  }
}
```

---

#### 2.8.6 `functions/auth/reset_password.xs` - Neues Passwort setzen

> **Zweck:** Setzt ein neues Passwort über den Reset-Link.

```xs
function "auth/reset_password" {
  description = "Setzt neues Passwort"

  input {
    text token filters=trim {
      description = "Reset-Token aus dem Link"
    }

    password new_password filters=min:8 {
      description = "Neues Passwort (mind. 8 Zeichen)"
    }
  }

  stack {
    // Token suchen
    db.query "users" {
      where = $db.users.password_reset_token == $input.token
      return = {type: "first"}
    } as $user

    conditional {
      if ($user == null) {
        precondition.fail {
          code = 404
          message = "Ungültiger Reset-Link"
        }
      }
    }

    // Ablauf prüfen
    conditional {
      if ($user.password_reset_expires_at < $util.now) {
        precondition.fail {
          code = 410
          message = "Dieser Reset-Link ist abgelaufen. Bitte fordere einen neuen an."
        }
      }
    }

    // Passwort ändern und Token löschen
    db.edit "users" {
      field_name = "id"
      field_value = $user.id
      data = {
        password: $input.new_password
        password_reset_token: null
        password_reset_expires_at: null
      }
    }
  }

  response = {
    success: true
    message: "Passwort erfolgreich geändert. Du kannst dich jetzt einloggen."
  }
}
```

---

## 3. BEEG-Berechnungslogik (Exakt)

### 3.1 Bemessungszeitraum

| Person | Bemessungszeitraum |
|--------|-------------------|
| Mutter | 12 Monate vor **Mutterschutz-Beginn** (6 Wochen vor ET) |
| Partner | 12 Monate vor **Geburt** |

### 3.2 Elterngeld-Netto (§ 2c-2f BEEG)

1. **Werbungskostenpauschale:** 1.230 EUR/Jahr = 102,50 EUR/Monat abziehen (§ 2c Abs. 1)
2. **Steuern:** Nach Lohnsteuertabelle (Programmablaufplan BMF) (§ 2e)
3. **Kirchensteuer:** Einheitlich **8%** der Lohnsteuer (§ 2e Abs. 5) - NICHT bundeslandabhängig!
4. **Sozialabgaben nach § 2f BEEG (PAUSCHALEN, nicht tatsächliche AN-Anteile!):**
   - Kranken- und Pflegeversicherung: **9%** (§ 2f Abs. 1 Nr. 1)
   - Rentenversicherung: **10%** (§ 2f Abs. 1 Nr. 2)
   - Arbeitslosenversicherung: **2%** (§ 2f Abs. 1 Nr. 3)
   - **Gesamt: 21%**

### 3.3 Ersatzrate (§ 2 Abs. 2 BEEG)

| Elterngeld-Netto | Ersatzrate | Gesetzesreferenz |
|------------------|------------|------------------|
| < 1.000 EUR | 67% + 0,1% je 2 EUR unter 1.000 → max **100%** | § 2 Abs. 2 Satz 1 |
| 1.000 - 1.200 EUR | **67%** (Standard) | § 2 Abs. 1 |
| > 1.200 EUR | 67% - 0,1% je 2 EUR über 1.200 → min **65%** | § 2 Abs. 2 Satz 2 |

### 3.4 Grenzen

| Typ | Minimum | Maximum |
|-----|---------|---------|
| Basiselterngeld | 300 EUR | 1.800 EUR |
| ElterngeldPlus | 150 EUR | 900 EUR |

### 3.5 Zuschläge

| Zuschlag | Bedingung | Betrag |
|----------|-----------|--------|
| Geschwisterbonus | 1 Kind < 3 Jahre ODER 2 Kinder < 6 Jahre | +10%, mind. 75 EUR |
| Mehrlingszuschlag | Pro weiteres Kind | +300 EUR |
| Partnerschaftsbonus | Beide 24-32h, 2-4 Monate | 4 Extra-Monate ElterngeldPlus |

### 3.6 Bezugsdauer

| Variante | Monate | Bedingung |
|----------|--------|-----------|
| Basiselterngeld | 12 + 2 Partner | 14 Monate gesamt aufteilbar |
| ElterngeldPlus | Doppelt so lang | 1 Basismonat = 2 Plus-Monate |
| Partnerschaftsbonus | +4 Monate | Beide 24-32h arbeiten |

---

## 4. APIs

### 4.0 API-Gruppe: `auth` - Authentifizierung

> **Übersicht:** Diese Endpoints verwalten Registrierung, Login, und Account-Verwaltung. Die meisten sind öffentlich (kein Auth nötig).

#### Öffentliche Auth-Endpoints (kein Token nötig)

| Method | Endpoint | Beschreibung | Funktion |
|--------|----------|--------------|----------|
| POST | `/api/auth/register` | Neuen Account erstellen | `auth/register_user` |
| POST | `/api/auth/register/invitation` | Mit Einladung registrieren | `auth/register_with_invitation` |
| POST | `/api/auth/login` | Einloggen | Xano built-in |
| POST | `/api/auth/verify-email` | E-Mail bestätigen | `auth/verify_email` |
| POST | `/api/auth/password-reset/request` | Reset-Link anfordern | `auth/request_password_reset` |
| POST | `/api/auth/password-reset/confirm` | Neues Passwort setzen | `auth/reset_password` |

#### Geschützte Auth-Endpoints (Token nötig)

| Method | Endpoint | Beschreibung |
|--------|----------|--------------|
| GET | `/api/auth/me` | Eigene User-Daten + Household |
| PUT | `/api/auth/me` | Profil aktualisieren |
| PUT | `/api/auth/password` | Passwort ändern |
| DELETE | `/api/auth/me` | Account löschen |

---

**`apis/auth/register.xs`**
```xs
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

---

**`apis/auth/login.xs`** (Xano built-in mit Erweiterung)
```xs
api "auth/login" {
  method = "POST"
  auth = false
  description = "Login - gibt Token und Household-Daten zurück"

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

    // Household-Daten laden
    db.get "users" {
      field_name = "id"
      field_value = $auth_result.user_id
    } as $user

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

---

### 4.0.1 API-Gruppe: `household` - Haushaltsverwaltung

> **Übersicht:** Verwalten des Households und Partner-Einladungen.

| Method | Endpoint | Beschreibung | Auth |
|--------|----------|--------------|------|
| GET | `/api/household` | Household-Daten abrufen | Ja |
| GET | `/api/household/members` | Alle Mitglieder | Ja |
| POST | `/api/household/invite` | Partner einladen | Ja (nur Owner) |
| GET | `/api/household/invitations` | Offene Einladungen | Ja |
| DELETE | `/api/household/invite/{id}` | Einladung zurückziehen | Ja (nur Owner) |
| POST | `/api/household/invite/{id}/resend` | Einladung erneut senden | Ja (nur Owner) |

---

**`apis/household/invite.xs`**
```xs
api "household/invite" {
  method = "POST"
  auth = true
  description = "Lädt Partner per E-Mail ein"

  input {
    email partner_email filters=trim|lower {
      description = "E-Mail des Partners"
    }
  }

  stack {
    function.run "household/invite_partner" {
      input = {
        user_id: $auth.user_id
        partner_email: $input.partner_email
      }
    } as $result
  }

  response = $result
}
```

---

### 4.1 API-Gruppe: `quick-check` (öffentlich)

**`apis/quick-check/submit.xs`**
- POST /api/quick-check/submit
- Input: mother_income, partner_income?, due_date, bundesland, has_partner
- Output: estimated_total, mutterschutz_dates, optimization_hint

**`apis/quick-check/save-lead.xs`**
- POST /api/quick-check/save-lead
- Input: email, due_date, bundesland, quick_check_data, consent_marketing
- Output: success, message

### 4.2 API-Gruppe: `rechner` (öffentlich)

**`apis/rechner/mutterschutz.xs`**
- POST /api/rechner/mutterschutz
- Input: due_date, is_multiple, is_premature
- Output: mutterschutz_start, mutterschutz_end, weeks_before, weeks_after

### 4.3 API-Gruppe: `calculations` (auth = user)

**`apis/calculations/create.xs`**
- POST /api/calculations/create
- Input: pregnancy_id
- Erfordert: Premium-Account
- Output: calculation_id, baseline_total, optimized_total, optimization_count

**`apis/calculations/get.xs`**
- GET /api/calculations/get/{calculation_id}
- Output: calculation, optimizations[]

### 4.4 API-Gruppe: `pregnancies` (auth = user)

**`apis/pregnancies/create.xs`**
- POST /api/pregnancies/create
- Input: due_date, bundesland, is_multiple, etc.
- Output: pregnancy_id

**`apis/pregnancies/get.xs`**
- GET /api/pregnancies/get/{pregnancy_id}
- Output: pregnancy, parents[]

### 4.5 API-Gruppe: `parents` (auth = user)

**`apis/parents/create.xs`**
- POST /api/parents/create
- Input: pregnancy_id, role, employment_type, income_data, etc.
- Output: parent_id

**`apis/parents/update.xs`**
- PUT /api/parents/update/{parent_id}
- Input: Alle Parent-Felder
- Output: updated parent

### 4.6 API-Gruppe: `payments` (später)

**`apis/payments/create-checkout.xs`**
- POST /api/payments/create-checkout
- Input: product (premium|premium_plus)
- Output: checkout_url, session_id

**`apis/payments/webhook.xs`**
- POST /api/payments/webhook (öffentlich, Stripe Signatur)
- Setzt Premium-Status bei erfolgreicher Zahlung

---

## 5. Scheduled Tasks

### 5.1 `tasks/send_reminders.xs`

- Läuft täglich
- Findet fällige Erinnerungen (due_date <= heute + remind_days_before)
- Versendet E-Mails via Resend API
- Markiert als sent

### 5.2 `tasks/cleanup_old_leads.xs`

- Läuft wöchentlich
- Löscht Leads älter als 2 Jahre (DSGVO)

---

## 6. Environment Variables

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `STRIPE_SECRET_KEY` | Stripe API Key | `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | Webhook Signatur | `whsec_...` |
| `STRIPE_PRICE_PREMIUM` | Price ID Premium | `price_...` |
| `STRIPE_PRICE_PREMIUM_PLUS` | Price ID Premium+ | `price_...` |
| `APP_URL` | Frontend URL | `https://eltern-kompass.de` |
| `RESEND_API_KEY` | E-Mail API Key | `re_...` |

---

## 7. Implementierungs-Reihenfolge

### Schritt 1: Tabellen (ohne FK)
1. leads.xs
2. pregnancies.xs
3. parents.xs
4. calculations.xs
5. optimizations.xs
6. reminders.xs
7. payments.xs

### Schritt 2: User erweitern + FK hinzufügen
1. User-Tabelle um Felder erweitern
2. Alle FK-Referenzen hinzufügen
3. `push_all_changes_to_xano`

### Schritt 3: Basis-Funktionen
1. calculate_mutterschutz
2. calculate_elterngeld_netto
3. calculate_ersatzrate
4. calculate_basiselterngeld
5. calculate_elterngeld_plus

### Schritt 4: Komplexe Funktionen
1. find_optimizations
2. calculate_full

### Schritt 5: Quick-Check APIs (MVP)
1. quick-check/submit
2. quick-check/save-lead
3. rechner/mutterschutz

### Schritt 6: Premium APIs
1. pregnancies/*
2. parents/*
3. calculations/*

### Schritt 7: Payments (später)
1. payments/create-checkout
2. payments/webhook

### Schritt 8: Tasks
1. send_reminders
2. cleanup_old_leads

---

## Verifizierung

Nach Implementierung:

1. **Quick-Check testen:**
   ```bash
   curl -X POST /api/quick-check/submit \
     -d '{"mother_income": 3000, "due_date": "2026-09-01", "bundesland": "BY"}'
   ```

2. **Lead speichern:**
   ```bash
   curl -X POST /api/quick-check/save-lead \
     -d '{"email": "test@example.com", "due_date": "2026-09-01", "bundesland": "BY"}'
   ```

3. **Mutterschutz berechnen:**
   ```bash
   curl -X POST /api/rechner/mutterschutz \
     -d '{"due_date": "2026-09-01", "is_multiple": false}'
   ```
   Erwartetes Ergebnis:
   - Start: 2026-07-21 (6 Wochen vor)
   - Ende: 2026-10-27 (8 Wochen nach)

4. **BEEG-Berechnung validieren:**
   - 3.000 EUR Brutto → ~2.100 EUR Elterngeld-Netto
   - Ersatzrate: 65% (über 1.200 EUR gemäß §2 Abs. 2 BEEG)
   - Basiselterngeld: ~1.365 EUR/Monat

---

## 8. Onboarding & Dokument-Analyse (Erweiterung)

Dieser Abschnitt erweitert die Backend-Architektur um den Onboarding-Flow mit KI-gestützter Dokument-Analyse.

→ Detaillierter User Flow: siehe `pläne/onboarding-flow.md`

### 8.1 Neue Tabelle: `documents`

**`tables/documents.xs`**

```xs
table documents {
  // Primärschlüssel
  id int autoincrement primary

  // Referenzen
  user_id int references(user.id)
  parent_id int? references(parents.id)

  // Dokument-Typ
  type enum [
    "payslip",           // Lohnabrechnung
    "tax_return",        // Steuerbescheid
    "maternity_pass",    // Mutterpass
    "maternity_benefit"  // Mutterschaftsgeld-Bescheid
  ]

  // Datei
  file_url text
  file_name text?
  file_size int?
  mime_type text?

  // KI-Extraktion
  extracted_data json?
  // Beispiel payslip: { brutto: 4500, netto: 2800, steuerklasse: 3, kirchensteuer: true, kist_betrag: 45.50 }
  // Beispiel tax_return: { jahreseinkommen: 65000, gewinn_selbstaendig: 12000 }
  // Beispiel maternity_pass: { et_datum: "2026-09-15", mehrlinge: false }
  // Beispiel maternity_benefit: { tagessatz: 13.00, start: "2026-08-01", ende: "2026-11-10" }

  extraction_confidence decimal?
  // 0.0 - 1.0: Wie sicher ist die KI bei der Extraktion

  // User-Bestätigung
  confirmed bool = false
  confirmed_at timestamp?
  user_corrections json?
  // Falls User Werte korrigiert hat: { brutto: { original: 4500, corrected: 4800 } }

  // Timestamps
  created_at timestamp = now()
  updated_at timestamp?
}
```

### 8.2 Neue Tabelle: `onboarding_progress`

**`tables/onboarding_progress.xs`**

```xs
table onboarding_progress {
  id int autoincrement primary
  user_id int references(user.id) unique

  // Step-Status
  step_basics_completed bool = false
  step_income_completed bool = false
  step_documents_completed bool = false
  step_plan_completed bool = false

  // Gesamtfortschritt (0-100)
  progress_percent int = 0

  // Quick-Check Daten (übernommen)
  quickcheck_data json?
  // { dueDate, employment, monthlyNetIncome, hasPartner, bundesland }

  // Timestamps
  created_at timestamp = now()
  updated_at timestamp?
}
```

### 8.3 User-Tabelle erweitern

**Zusätzliche Felder für User-Tabelle:**

```xs
// In der bestehenden User-Tabelle hinzufügen:
first_name text?
last_name text?
onboarding_completed bool = false
premium_unlocked bool = false
premium_unlocked_at timestamp?
```

### 8.4 Funktionen für Dokument-Analyse

**`functions/analyze_document.xs`**

```xs
// Hauptfunktion: Dokument analysieren
function analyze_document {
  input {
    file_url text required
    document_type enum [payslip, tax_return, maternity_pass, maternity_benefit] required
  }

  // Prompt je nach Dokumenttyp
  $prompts = {
    "payslip": "Analysiere diese deutsche Lohnabrechnung und extrahiere folgende Daten als JSON:
      - brutto: Bruttogehalt in EUR (Zahl)
      - netto: Nettogehalt in EUR (Zahl)
      - steuerklasse: Steuerklasse (1-6)
      - kirchensteuer: Kirchensteuerpflichtig (true/false)
      - kist_betrag: Kirchensteuerbetrag in EUR (Zahl oder null)
      - sozialabgaben: Gesamte Sozialabgaben in EUR (Zahl)
      - arbeitgeber: Name des Arbeitgebers (String)
      - monat: Abrechnungsmonat (YYYY-MM Format)
      Antworte NUR mit dem JSON, keine Erklärungen.",

    "tax_return": "Analysiere diesen deutschen Steuerbescheid und extrahiere folgende Daten als JSON:
      - jahreseinkommen: Zu versteuerndes Einkommen in EUR (Zahl)
      - gewinn_selbstaendig: Gewinn aus selbständiger Arbeit in EUR (Zahl oder null)
      - einkuenfte_nichtselbstaendig: Einkünfte aus nichtselbständiger Arbeit in EUR (Zahl oder null)
      - steuerjahr: Jahr des Bescheids (YYYY)
      Antworte NUR mit dem JSON, keine Erklärungen.",

    "maternity_pass": "Analysiere diesen deutschen Mutterpass und extrahiere folgende Daten als JSON:
      - et_datum: Errechneter Geburtstermin (YYYY-MM-DD Format)
      - mehrlinge: Mehrlingschwangerschaft (true/false)
      - schwangerschaftswoche: Aktuelle SSW falls erkennbar (Zahl oder null)
      Antworte NUR mit dem JSON, keine Erklärungen.",

    "maternity_benefit": "Analysiere diesen Mutterschaftsgeld-Bescheid und extrahiere folgende Daten als JSON:
      - tagessatz: Tägliches Mutterschaftsgeld in EUR (Zahl, max 13.00)
      - start: Beginn des Bezugszeitraums (YYYY-MM-DD)
      - ende: Ende des Bezugszeitraums (YYYY-MM-DD)
      - krankenkasse: Name der Krankenkasse (String)
      Antworte NUR mit dem JSON, keine Erklärungen."
  }

  $prompt = $prompts[$input.document_type]

  // OpenAI Vision API Call
  $response = external_api_request({
    url: "https://api.openai.com/v1/chat/completions",
    method: "POST",
    headers: {
      "Authorization": "Bearer " + $env.OPENAI_API_KEY,
      "Content-Type": "application/json"
    },
    body: {
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: $prompt },
            { type: "image_url", image_url: { url: $input.file_url } }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1
    }
  })

  // Response parsen
  $content = $response.choices[0].message.content

  // JSON aus Response extrahieren (manchmal in ```json ... ``` gewrappt)
  $json_match = $content|preg_match:'/\{[\s\S]*\}/'
  if ($json_match) {
    $extracted = $json_match[0]|json_decode
  }
  else {
    $extracted = null
  }

  // Confidence basierend auf Vollständigkeit berechnen
  $confidence = 0.0
  if ($extracted) {
    $expected_fields = {
      "payslip": ["brutto", "netto", "steuerklasse"],
      "tax_return": ["jahreseinkommen"],
      "maternity_pass": ["et_datum"],
      "maternity_benefit": ["tagessatz", "start", "ende"]
    }

    $required = $expected_fields[$input.document_type]
    $found = 0
    foreach ($required as $field) {
      if ($extracted[$field] != null) {
        $found = $found + 1
      }
    }
    $confidence = $found / count($required)
  }

  return {
    extracted_data: $extracted,
    confidence: $confidence,
    raw_response: $content
  }
}
```

**`functions/validate_payslip_data.xs`**

```xs
// Validiert extrahierte Lohnabrechnungsdaten
function validate_payslip_data {
  input {
    data json required
  }

  $errors = []
  $warnings = []

  // Brutto validieren
  if ($input.data.brutto == null) {
    $errors[] = "Bruttogehalt fehlt"
  }
  elseif ($input.data.brutto < 0 || $input.data.brutto > 50000) {
    $warnings[] = "Bruttogehalt außerhalb üblicher Grenzen"
  }

  // Netto validieren
  if ($input.data.netto == null) {
    $errors[] = "Nettogehalt fehlt"
  }
  elseif ($input.data.netto > $input.data.brutto) {
    $errors[] = "Netto kann nicht größer als Brutto sein"
  }

  // Steuerklasse validieren
  if ($input.data.steuerklasse == null) {
    $errors[] = "Steuerklasse fehlt"
  }
  elseif ($input.data.steuerklasse < 1 || $input.data.steuerklasse > 6) {
    $errors[] = "Ungültige Steuerklasse (muss 1-6 sein)"
  }

  return {
    valid: count($errors) == 0,
    errors: $errors,
    warnings: $warnings
  }
}
```

### 8.5 API-Gruppe: `onboarding` (auth = user)

**`apis/onboarding/get-progress.xs`**

```xs
// GET /api/onboarding/progress
// Gibt den aktuellen Onboarding-Fortschritt zurück

$user_id = $auth.id

$progress = db_query_single({
  from: "onboarding_progress",
  where: { user_id: $user_id }
})

if (!$progress) {
  // Neuen Eintrag erstellen
  $progress = db_insert({
    into: "onboarding_progress",
    values: {
      user_id: $user_id,
      progress_percent: 0
    }
  })
}

return {
  progress: $progress.progress_percent,
  steps: {
    basics: $progress.step_basics_completed,
    income: $progress.step_income_completed,
    documents: $progress.step_documents_completed,
    plan: $progress.step_plan_completed
  },
  quickcheck_data: $progress.quickcheck_data
}
```

**`apis/onboarding/save-basics.xs`**

```xs
// PUT /api/onboarding/basics
// Speichert Basisdaten (Step 1)

input {
  first_name text required
  last_name text required
  bundesland text required
  due_date date required
  partner object? {
    first_name text required
    last_name text required
    relationship enum [father, mother, adoptive] required
  }
}

$user_id = $auth.id

// User-Daten aktualisieren
db_update({
  table: "user",
  where: { id: $user_id },
  values: {
    first_name: $input.first_name,
    last_name: $input.last_name
  }
})

// Schwangerschaft anlegen/aktualisieren
$pregnancy = db_query_single({
  from: "pregnancies",
  where: { user_id: $user_id }
})

if (!$pregnancy) {
  $pregnancy = db_insert({
    into: "pregnancies",
    values: {
      user_id: $user_id,
      due_date: $input.due_date,
      bundesland: $input.bundesland
    }
  })
}
else {
  db_update({
    table: "pregnancies",
    where: { id: $pregnancy.id },
    values: {
      due_date: $input.due_date,
      bundesland: $input.bundesland
    }
  })
}

// Mutter als Parent anlegen
$mother = db_query_single({
  from: "parents",
  where: { pregnancy_id: $pregnancy.id, role: "mother" }
})

if (!$mother) {
  db_insert({
    into: "parents",
    values: {
      pregnancy_id: $pregnancy.id,
      user_id: $user_id,
      role: "mother",
      first_name: $input.first_name,
      last_name: $input.last_name
    }
  })
}

// Partner anlegen wenn vorhanden
if ($input.partner) {
  $partner = db_query_single({
    from: "parents",
    where: { pregnancy_id: $pregnancy.id, role: "partner" }
  })

  if (!$partner) {
    db_insert({
      into: "parents",
      values: {
        pregnancy_id: $pregnancy.id,
        role: "partner",
        first_name: $input.partner.first_name,
        last_name: $input.partner.last_name,
        relationship_to_child: $input.partner.relationship
      }
    })
  }
  else {
    db_update({
      table: "parents",
      where: { id: $partner.id },
      values: {
        first_name: $input.partner.first_name,
        last_name: $input.partner.last_name,
        relationship_to_child: $input.partner.relationship
      }
    })
  }
}

// Fortschritt aktualisieren
db_update({
  table: "onboarding_progress",
  where: { user_id: $user_id },
  values: {
    step_basics_completed: true,
    progress_percent: 25,
    updated_at: now()
  }
})

return { success: true, progress: 25 }
```

**`apis/onboarding/save-income.xs`**

```xs
// PUT /api/onboarding/income
// Speichert Einkommensdaten (Step 2)

input {
  mother object {
    employment_type enum [employed, self_employed, civil_servant, mixed] required
    monthly_net decimal required
    tax_class int required min:1 max:6
    church_tax bool required
  }
  partner object? {
    employment_type enum [employed, self_employed, civil_servant, mixed] required
    monthly_net decimal required
    tax_class int required min:1 max:6
    church_tax bool required
  }
}

$user_id = $auth.id

$pregnancy = db_query_single({
  from: "pregnancies",
  where: { user_id: $user_id }
})

// Mutter-Einkommen speichern
db_update({
  table: "parents",
  where: { pregnancy_id: $pregnancy.id, role: "mother" },
  values: {
    employment_type: $input.mother.employment_type,
    monthly_net_income: $input.mother.monthly_net,
    tax_class: $input.mother.tax_class,
    has_church_tax: $input.mother.church_tax
  }
})

// Partner-Einkommen speichern
if ($input.partner) {
  db_update({
    table: "parents",
    where: { pregnancy_id: $pregnancy.id, role: "partner" },
    values: {
      employment_type: $input.partner.employment_type,
      monthly_net_income: $input.partner.monthly_net,
      tax_class: $input.partner.tax_class,
      has_church_tax: $input.partner.church_tax
    }
  })
}

// Fortschritt aktualisieren
db_update({
  table: "onboarding_progress",
  where: { user_id: $user_id },
  values: {
    step_income_completed: true,
    progress_percent: 50,
    updated_at: now()
  }
})

return { success: true, progress: 50 }
```

**`apis/documents/upload.xs`**

```xs
// POST /api/documents/upload
// Lädt Dokument hoch und startet KI-Analyse

input {
  file file required
  type enum [payslip, tax_return, maternity_pass, maternity_benefit] required
  parent_id int?
}

$user_id = $auth.id

// Datei hochladen (Xano File Storage)
$upload = file_upload({
  file: $input.file,
  folder: "documents/" + $user_id
})

// Dokument-Eintrag erstellen
$document = db_insert({
  into: "documents",
  values: {
    user_id: $user_id,
    parent_id: $input.parent_id,
    type: $input.type,
    file_url: $upload.url,
    file_name: $upload.name,
    file_size: $upload.size,
    mime_type: $upload.mime_type
  }
})

// KI-Analyse starten
$analysis = call_function("analyze_document", {
  file_url: $upload.url,
  document_type: $input.type
})

// Ergebnis speichern
db_update({
  table: "documents",
  where: { id: $document.id },
  values: {
    extracted_data: $analysis.extracted_data,
    extraction_confidence: $analysis.confidence,
    updated_at: now()
  }
})

return {
  document_id: $document.id,
  extracted_data: $analysis.extracted_data,
  confidence: $analysis.confidence,
  needs_confirmation: true
}
```

**`apis/documents/confirm.xs`**

```xs
// PUT /api/documents/confirm/{document_id}
// User bestätigt oder korrigiert extrahierte Daten

input {
  confirmed_data json required
}

$user_id = $auth.id
$document_id = $params.document_id

// Dokument prüfen
$document = db_query_single({
  from: "documents",
  where: { id: $document_id, user_id: $user_id }
})

if (!$document) {
  throw_error("Dokument nicht gefunden", 404)
}

// Korrekturen ermitteln
$corrections = {}
if ($document.extracted_data) {
  foreach ($input.confirmed_data as $key => $value) {
    if ($document.extracted_data[$key] != $value) {
      $corrections[$key] = {
        original: $document.extracted_data[$key],
        corrected: $value
      }
    }
  }
}

// Speichern
db_update({
  table: "documents",
  where: { id: $document_id },
  values: {
    extracted_data: $input.confirmed_data,
    confirmed: true,
    confirmed_at: now(),
    user_corrections: count($corrections) > 0 ? $corrections : null,
    updated_at: now()
  }
})

// Wenn Lohnabrechnung: Daten in Parent übernehmen
if ($document.type == "payslip" && $document.parent_id) {
  db_update({
    table: "parents",
    where: { id: $document.parent_id },
    values: {
      monthly_gross_income: $input.confirmed_data.brutto,
      monthly_net_income: $input.confirmed_data.netto,
      tax_class: $input.confirmed_data.steuerklasse,
      has_church_tax: $input.confirmed_data.kirchensteuer == true
    }
  })
}

return { success: true }
```

### 8.6 Environment Variables (Erweiterung)

| Variable | Beschreibung | Beispiel |
|----------|--------------|----------|
| `OPENAI_API_KEY` | OpenAI API Key für Vision | `sk-...` |

### 8.7 Implementierungs-Reihenfolge (Onboarding)

1. [ ] `documents` Tabelle erstellen
2. [ ] `onboarding_progress` Tabelle erstellen
3. [ ] User-Tabelle erweitern (first_name, last_name, onboarding_completed, premium_unlocked)
4. [ ] `analyze_document` Funktion erstellen
5. [ ] `validate_payslip_data` Funktion erstellen
6. [ ] Onboarding APIs erstellen:
   - GET `/api/onboarding/progress`
   - PUT `/api/onboarding/basics`
   - PUT `/api/onboarding/income`
7. [ ] Document APIs erstellen:
   - POST `/api/documents/upload`
   - PUT `/api/documents/confirm/{id}`
8. [ ] OpenAI API Key in Xano Environment Variables hinterlegen
