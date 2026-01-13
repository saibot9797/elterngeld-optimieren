# BEEG - Vollständige Berechnungsformeln und Regelwerk

## Inhaltsverzeichnis

1. [Überblick und Grundstruktur](#1-überblick-und-grundstruktur)
2. [Anspruchsvoraussetzungen (§1)](#2-anspruchsvoraussetzungen-1)
3. [Einkommensgrenze und Ausschluss (§1 Abs. 8)](#3-einkommensgrenze-und-ausschluss-1-abs-8)
4. [Bemessungszeitraum (§2b)](#4-bemessungszeitraum-2b)
5. [Einkommen aus nichtselbständiger Erwerbstätigkeit (§2c)](#5-einkommen-aus-nichtselbständiger-erwerbstätigkeit-2c)
6. [Einkommen aus selbständiger Erwerbstätigkeit (§2d)](#6-einkommen-aus-selbständiger-erwerbstätigkeit-2d)
7. [Abzüge für Steuern (§2e)](#7-abzüge-für-steuern-2e)
8. [Abzüge für Sozialabgaben (§2f)](#8-abzüge-für-sozialabgaben-2f)
9. [Berechnung Basiselterngeld (§2, §4a Abs. 1)](#9-berechnung-basiselterngeld-2-4a-abs-1)
10. [Berechnung ElterngeldPlus (§4a Abs. 2)](#10-berechnung-elterngeldplus-4a-abs-2)
11. [Geschwisterbonus (§2a Abs. 1-3)](#11-geschwisterbonus-2a-abs-1-3)
12. [Mehrlingszuschlag (§2a Abs. 4)](#12-mehrlingszuschlag-2a-abs-4)
13. [Anrechnung anderer Einnahmen (§3)](#13-anrechnung-anderer-einnahmen-3)
14. [Bezugsdauer und Monatsbeträge (§4)](#14-bezugsdauer-und-monatsbeträge-4)
15. [Partnerschaftsbonus (§4b)](#15-partnerschaftsbonus-4b)
16. [Alleiniger Bezug / Alleinerziehende (§4c)](#16-alleiniger-bezug--alleinerziehende-4c)
17. [Frühgeburten-Regelung (§4 Abs. 5)](#17-frühgeburten-regelung-4-abs-5)
18. [Elternzeit-Regelungen (§15-§21)](#18-elternzeit-regelungen-15-21)
19. [Zusammenfassung der Kernformeln](#19-zusammenfassung-der-kernformeln)
20. [Übergangsregelungen (§28)](#20-übergangsregelungen-28)

---

## 1. Überblick und Grundstruktur

### Gesetzliche Grundlage
- **Vollständiger Name:** Bundeselterngeld- und Elternzeitgesetz (BEEG)
- **Fassung:** Bekanntmachung vom 27. Januar 2015, zuletzt geändert durch Art. 19 Abs. 2 G v. 22.12.2025

### Elterngeld-Varianten

| Variante | Beschreibung | Max. Bezugsdauer | Höchstbetrag |
|----------|--------------|------------------|--------------|
| **Basiselterngeld** | Volle Leistung | 14 Monate (Elternpaar) | 1.800 €/Monat |
| **ElterngeldPlus** | Halbierte Leistung, doppelte Dauer | 28 Monate | 900 €/Monat |
| **Partnerschaftsbonus** | Bonus für parallele Teilzeitarbeit | +4 Monate je Elternteil | ElterngeldPlus-Rate |

---

## 2. Anspruchsvoraussetzungen (§1)

### Grundvoraussetzungen (§1 Abs. 1)

Eine Person hat Anspruch auf Elterngeld, wenn **alle** folgenden Bedingungen erfüllt sind:

```
Anspruch = (Wohnsitz_DE ∨ Aufenthalt_DE)
           ∧ (Kind_im_Haushalt)
           ∧ (Selbstbetreuung ∧ Selbsterziehung)
           ∧ (¬Volle_Erwerbstätigkeit)
```

### Definition "Keine volle Erwerbstätigkeit" (§1 Abs. 6)

```
Nicht_voll_erwerbstätig = (Arbeitszeit ≤ 32 Wochenstunden_Durchschnitt)
                          ∨ (Beschäftigung_zur_Berufsbildung)
                          ∨ (Kindertagespflegeperson nach §§23, 43 SGB VIII)
```

**Wichtig:** Die 32-Stunden-Grenze gilt im **Durchschnitt des Lebensmonats**.

### Sonderregelungen für Auslandsaufenthalte (§1 Abs. 2)

Anspruch auch ohne Wohnsitz in Deutschland bei:
- Deutschem Sozialversicherungsrecht unterliegen (§4 SGB IV)
- Entwicklungshelfer/Missionare
- Vorübergehende Tätigkeit bei zwischen-/überstaatlichen Einrichtungen

### Adoption und Vaterschaftsfeststellung (§1 Abs. 3)

Bei **Adoption** oder **Aufnahme mit Ziel der Adoption**:
- Zeitpunkt der **Aufnahme** ersetzt Zeitpunkt der **Geburt**
- Bezugszeitraum: Bis Vollendung des **8. Lebensjahres**

---

## 3. Einkommensgrenze und Ausschluss (§1 Abs. 8)

### Einkommensgrenze ab 01.04.2025

```
WENN zu_versteuerndes_Einkommen_Person > 175.000 € DANN
    Anspruch = FALSCH

WENN (Person erfüllt §1 Abs.1 Nr.2) UND (andere_Person erfüllt §1 Abs.1 Nr.2) DANN
    WENN Summe_zvE_beide > 175.000 € DANN
        Anspruch = FALSCH
```

### Übergangsregelung (§28 Abs. 5)

Für Geburten **01.04.2024 bis 31.03.2025**:
```
Einkommensgrenze = 200.000 € (statt 175.000 €)
```

### Relevanter Veranlagungszeitraum

```
Maßgeblicher_VZ = letzter_abgeschlossener_Veranlagungszeitraum_vor_Geburt
```

**Beispiel:** Geburt März 2025 → VZ 2023 oder 2024 (je nach Steuerbescheid)

---

## 4. Bemessungszeitraum (§2b)

### 4.1 Nichtselbständige Erwerbstätigkeit (§2b Abs. 1)

#### Grundregel

```
Bemessungszeitraum = 12_Kalendermonate_vor_Geburtsmonat
```

#### Ausklammerbare Monate (§2b Abs. 1 Satz 2)

Folgende Monate bleiben auf **Antrag** unberücksichtigt:

| Nr. | Grund | Verweis |
|-----|-------|---------|
| 1 | Elterngeldbezug für älteres Kind | §4 |
| 2 | Mutterschutzfristen / Mutterschaftsgeld | §3 MuSchG |
| 3 | Schwangerschaftsbedingte Krankheit | - |
| 4 | Wehrdienst / Zivildienst | WehrpflG, SoldG |

**Wichtig:** Diese Monate werden **nach hinten verschoben**, nicht ersatzlos gestrichen.

```
Effektiver_Bemessungszeitraum = 12 Kalendermonate
WOBEI: Ausklammerbare_Monate werden durch frühere Monate ersetzt
```

#### Berechnung für Mutter vs. Partner

```
// Mutter:
Bemessungszeitraum_Mutter = 12_Monate_vor_Beginn_Mutterschutzfrist

// Partner:
Bemessungszeitraum_Partner = 12_Monate_vor_Geburt
```

### 4.2 Selbständige Erwerbstätigkeit (§2b Abs. 2)

```
Bemessungszeitraum_Selbständig = Gewinnermittlungszeiträume
                                 des letzten abgeschlossenen VZ vor Geburt
```

**In der Praxis:** Meist das Kalenderjahr vor dem Geburtsjahr.

### 4.3 Mischeinkommen (§2b Abs. 3-4)

Bei Einkommen aus **beiden** Quellen:

```
WENN Selbständiges_Einkommen_vorhanden DANN
    Bemessungszeitraum_Gesamt = letzter_abgeschlossener_VZ_vor_Geburt

// Ausnahme: Geringfügige Selbständigkeit (§2b Abs. 4)
WENN durchschn_Gewinn < 35 €/Monat DANN
    Option: Nur nichtselbständiges Einkommen nach 12-Monats-Regel
```

---

## 5. Einkommen aus nichtselbständiger Erwerbstätigkeit (§2c)

### 5.1 Grundformel (§2c Abs. 1)

```
Einkommen_nichtselbständig = (Brutto_Einnahmen
                              - (Arbeitnehmer_Pauschbetrag / 12)
                              - Abzüge_Steuern
                              - Abzüge_Sozialabgaben) / Anzahl_Monate
```

### 5.2 Arbeitnehmer-Pauschbetrag

```
Arbeitnehmer_Pauschbetrag_2024 = 1.230 € (§9a Abs. 1 Nr. 1a EStG)
Monatlicher_Pauschbetrag = 1.230 € / 12 = 102,50 €
```

**Achtung:** Es gilt der Pauschbetrag des Jahres **vor der Geburt**.

### 5.3 Zu berücksichtigende Einnahmen

**Eingeschlossen:**
- Laufender Arbeitslohn
- Lohnfortzahlung bei Krankheit
- Urlaubsgeld (wenn laufend)
- Zuschläge (Nacht, Sonntag, Feiertag)

**Ausgeschlossen (§2c Abs. 1 Satz 2):**
- **Sonstige Bezüge** im Sinne der Lohnsteuer:
  - Weihnachtsgeld
  - 13. Monatsgehalt
  - Tantieme
  - Abfindungen
  - Urlaubsabgeltung
  - Einmalzahlungen

### 5.4 Berechnungsbeispiel

```
Monat 1-12 Bruttolohn:   3.500 €/Monat × 12 = 42.000 €
./. AN-Pauschbetrag:     1.230 €
= Zu versteuernde Einkünfte: 40.770 €

Durchschnitt/Monat:      40.770 € / 12 = 3.397,50 €

./. Steuerabzüge (ca. 22%): 747,45 €
./. Sozialabzüge (ca. 21%): 713,48 €

= Netto-Bemessungseinkommen: 1.936,57 €
```

---

## 6. Einkommen aus selbständiger Erwerbstätigkeit (§2d)

### 6.1 Grundformel (§2d Abs. 1)

```
Einkommen_selbständig = (Summe_Gewinneinkünfte
                         - Abzüge_Steuern
                         - Abzüge_Sozialabgaben) / Anzahl_Monate
```

### 6.2 Gewinneinkünfte nach EStG

Umfasst Einkünfte aus:
- Land- und Forstwirtschaft (§2 Abs. 1 Nr. 1 EStG)
- Gewerbebetrieb (§2 Abs. 1 Nr. 2 EStG)
- Selbständiger Arbeit (§2 Abs. 1 Nr. 3 EStG)

### 6.3 Gewinnermittlung

#### Bei vorliegendem Steuerbescheid (§2d Abs. 2)
```
Gewinn = Im Einkommensteuerbescheid ausgewiesener Gewinn
```

#### Ohne Steuerbescheid / im Bezugszeitraum (§2d Abs. 3)
```
Gewinn = Einnahmen - Betriebsausgaben

// Betriebsausgaben-Pauschale:
Betriebsausgaben = MAX(tatsächliche_Betriebsausgaben, 25% × Einnahmen)
```

### 6.4 Zeitliche Zuordnung (§2d Abs. 5)

```
Zuordnung = nach einkommensteuerrechtlichen Grundsätzen
// D.h.: Zufluss-/Abflussprinzip (§11 EStG)
```

---

## 7. Abzüge für Steuern (§2e)

### 7.1 Bestandteile (§2e Abs. 1)

```
Abzüge_Steuern = Einkommensteuer
                 + Solidaritätszuschlag
                 + (Kirchensteuer falls kirchensteuerpflichtig)
```

### 7.2 Berechnungsgrundlage (§2e Abs. 2)

```
Bemessungsgrundlage_Steuer = (Einnahmen_§2c + Gewinneinkünfte_§2d) / Monat

// Berücksichtigte Pauschalen:
Pauschalen = Arbeitnehmer_Pauschbetrag (wenn §2c-Einkommen)
           + Vorsorgepauschale
```

### 7.3 Steuerklassen-Regelung (§2e Abs. 3)

```
WENN Steuerklasse_bekannt DANN
    Steuer = Berechnung_nach_Steuerklasse
    // Steuerklasse VI wird NICHT berücksichtigt

WENN keine_Steuerklasse ODER Gewinn > Überschuss DANN
    Steuer = Berechnung_nach_Steuerklasse_IV_ohne_Faktor
```

### 7.4 Solidaritätszuschlag (§2e Abs. 4)

```
Solidaritätszuschlag = gemäß SolZG 1995
// Mit Berücksichtigung von Kinderfreibeträgen
```

### 7.5 Kirchensteuer (§2e Abs. 5)

```
Kirchensteuer = Einkommensteuer × 8%
// Einheitlich 8%, unabhängig vom Bundesland
```

### 7.6 Steuerberechnung - Programmablaufplan

Die Steuerberechnung erfolgt nach dem **Programmablaufplan für die maschinelle Berechnung** des BMF für das Jahr vor der Geburt.

```
// Vereinfachte Darstellung des Ablaufs:
1. Bruttoeinkommen ermitteln
2. Werbungskosten abziehen (min. AN-Pauschbetrag)
3. Vorsorgepauschale abziehen
4. Zu versteuerndes Einkommen berechnen
5. Lohnsteuer nach Grundtabelle/Splittingtabelle ermitteln
6. Solidaritätszuschlag berechnen
7. Kirchensteuer berechnen
```

---

## 8. Abzüge für Sozialabgaben (§2f)

### 8.1 Beitragssatzpauschalen (§2f Abs. 1)

| Sozialversicherung | Pauschale | Bedingung |
|-------------------|-----------|-----------|
| Kranken- und Pflegeversicherung | **9%** | Versicherungspflicht nach §5 Abs.1 Nr.1-12 SGB V |
| Rentenversicherung | **10%** | Versicherungspflicht in gesetzl. RV oder vergleichbar |
| Arbeitsförderung | **2%** | Versicherungspflicht nach SGB III |

### 8.2 Gesamtabzug bei voller Sozialversicherungspflicht

```
Abzüge_Sozialabgaben = Bemessungseinkommen × (9% + 10% + 2%)
                     = Bemessungseinkommen × 21%
```

### 8.3 Bemessungsgrundlage (§2f Abs. 2)

```
Bemessungsgrundlage = Einnahmen_§2c + Gewinneinkünfte_§2d

// NICHT berücksichtigt:
- Minijobs (§8 SGB IV)
- Kurzfristige Beschäftigung (§8a SGB IV)
- Gleitzone/Übergangsbereich (§20 Abs. 3 SGB IV) → Sonderberechnung
```

### 8.4 Übergangsbereich (Midijob) (§2f Abs. 2 Satz 3)

Für Einkommen im Übergangsbereich (538,01 € - 2.000 €):

```
Beitragspflichtiges_Entgelt = §344 Abs. 4 SGB III
// Reduzierte Arbeitnehmerbeiträge, aber volle Anrechnung möglich
```

---

## 9. Berechnung Basiselterngeld (§2, §4a Abs. 1)

### 9.1 Ersatzrate (§2 Abs. 1-2)

Die Ersatzrate ist **einkommensabhängig**:

```
WENN Nettoeinkommen_vor_Geburt < 1.000 € DANN
    // Geringverdiener-Bonus
    Ersatzrate = 67% + ((1.000 - Nettoeinkommen) / 2) × 0,1%
    // Maximum: 100%

WENN Nettoeinkommen_vor_Geburt ZWISCHEN 1.000 € UND 1.200 € DANN
    Ersatzrate = 67%

WENN Nettoeinkommen_vor_Geburt > 1.200 € DANN
    // Besserverdiener-Abschlag
    Ersatzrate = 67% - ((Nettoeinkommen - 1.200) / 2) × 0,1%
    // Minimum: 65%
```

### 9.2 Formeln für Ersatzrate

```
// Geringverdiener (< 1.000 €):
Ersatzrate = MIN(100%, 67% + (1000 - Einkommen) × 0,05%)

// Normalverdiener (1.000 € - 1.200 €):
Ersatzrate = 67%

// Besserverdiener (> 1.200 €):
Ersatzrate = MAX(65%, 67% - (Einkommen - 1200) × 0,05%)
```

### 9.3 Elterngeld ohne Erwerbseinkommen im Bezug (§2 Abs. 1)

```
Elterngeld = Nettoeinkommen_vor_Geburt × Ersatzrate

// Begrenzungen:
Elterngeld = MAX(300, MIN(1.800, Elterngeld))
```

### 9.4 Elterngeld mit Erwerbseinkommen im Bezug (§2 Abs. 3)

```
Einkommensunterschied = Nettoeinkommen_vor_Geburt - Nettoeinkommen_während_Bezug

// Begrenzung des Vorgeburt-Einkommens:
Anrechenbares_Einkommen_vor = MIN(2.770, Nettoeinkommen_vor_Geburt)

Elterngeld = Einkommensunterschied × Ersatzrate

// Begrenzungen bleiben bestehen
```

### 9.5 Mindest- und Höchstbeträge

| Betrag | Wert | Verweis |
|--------|------|---------|
| **Mindestbetrag** | 300 € | §2 Abs. 4 |
| **Höchstbetrag** | 1.800 € | §2 Abs. 1 Satz 2 |
| **Deckelung Bemessungseinkommen** | 2.770 € | §2 Abs. 3 Satz 2 |

### 9.6 Komplette Berechnungsformel Basiselterngeld

```
// Schritt 1: Nettoeinkommen vor Geburt ermitteln
Brutto_vor = Summe_Brutto_12_Monate / 12
Netto_vor = Brutto_vor - AN_Pauschbetrag/12 - Steuern - Sozialabgaben

// Schritt 2: Ersatzrate bestimmen
WENN Netto_vor < 1000 DANN
    Rate = MIN(1.0, 0.67 + (1000 - Netto_vor) * 0.0005)
SONST WENN Netto_vor <= 1200 DANN
    Rate = 0.67
SONST
    Rate = MAX(0.65, 0.67 - (Netto_vor - 1200) * 0.0005)

// Schritt 3: Elterngeld berechnen
WENN kein_Einkommen_während_Bezug DANN
    Elterngeld = Netto_vor * Rate
SONST
    Netto_vor_gedeckelt = MIN(2770, Netto_vor)
    Differenz = Netto_vor_gedeckelt - Netto_während
    Elterngeld = Differenz * Rate

// Schritt 4: Begrenzungen anwenden
Elterngeld = MAX(300, MIN(1800, Elterngeld))
```

---

## 10. Berechnung ElterngeldPlus (§4a Abs. 2)

### 10.1 Grundprinzip

```
ElterngeldPlus = MIN(berechnetes_Elterngeld, Basiselterngeld_ohne_Einkommen / 2)
```

### 10.2 Obergrenze

```
Max_ElterngeldPlus = Basiselterngeld_ohne_Bezugseinkommen / 2
                   = MIN(1.800, Netto_vor × Ersatzrate) / 2
                   = MAX 900 €
```

### 10.3 Halbierte Beträge bei ElterngeldPlus (§4a Abs. 2 Satz 3)

| Betrag | Basiselterngeld | ElterngeldPlus |
|--------|-----------------|----------------|
| Mindestbetrag | 300 € | 150 € |
| Geschwisterbonus (Minimum) | 75 € | 37,50 € |
| Mehrlingszuschlag | 300 € | 150 € |
| Anrechnungsfreier Betrag | 300 € | 150 € |

### 10.4 Berechnungsbeispiel

```
// Annahme: Netto vor Geburt = 2.500 €, Netto während Bezug = 1.000 €

// Basiselterngeld ohne Einkommen:
Ersatzrate = MAX(0.65, 0.67 - (2500-1200) * 0.0005) = 0.65
Basis_ohne = 2.500 × 0.65 = 1.625 €

// Basiselterngeld mit Einkommen:
Differenz = MIN(2.770, 2.500) - 1.000 = 1.500 €
Basis_mit = 1.500 × 0.65 = 975 €

// ElterngeldPlus:
Max_Plus = 1.625 / 2 = 812,50 €
// Da 975 € > 812,50 €:
ElterngeldPlus = 812,50 €
```

### 10.5 Vorteil bei Teilzeitarbeit

ElterngeldPlus lohnt sich besonders bei Teilzeitarbeit:

```
// Beispiel: 1.625 € Basiselterngeld-Anspruch ohne Einkommen
// Bei Teilzeit mit 1.000 € Netto:

Basiselterngeld: 975 € für 1 Monat = 975 €
ElterngeldPlus:  812,50 € für 2 Monate = 1.625 €

// → ElterngeldPlus bringt 650 € mehr!
```

---

## 11. Geschwisterbonus (§2a Abs. 1-3)

### 11.1 Anspruchsvoraussetzungen

```
Geschwisterbonus = WAHR WENN
    (2 Kinder im Haushalt UND beide < 3 Jahre)
    ODER
    (≥ 3 Kinder im Haushalt UND alle < 6 Jahre)
```

### 11.2 Berechnung

```
Geschwisterbonus = MAX(75 €, Elterngeld × 10%)

// Bei ElterngeldPlus:
Geschwisterbonus_Plus = MAX(37,50 €, ElterngeldPlus × 10%)
```

### 11.3 Altersgrenzen

| Konstellation | Altersgrenze |
|---------------|--------------|
| 2 Kinder | Beide unter 3 Jahren |
| 3+ Kinder | Alle unter 6 Jahren |
| Adoptivkinder | Unter 14 Jahren (Zeit seit Aufnahme zählt) |
| Kinder mit Behinderung | Unter 14 Jahren |

### 11.4 Ende des Anspruchs (§2a Abs. 3)

```
Ende_Geschwisterbonus = Ablauf des Monats, in dem Voraussetzung entfällt
```

---

## 12. Mehrlingszuschlag (§2a Abs. 4)

### 12.1 Berechnung

```
Mehrlingszuschlag = (Anzahl_Mehrlinge - 1) × 300 €

// Bei ElterngeldPlus:
Mehrlingszuschlag_Plus = (Anzahl_Mehrlinge - 1) × 150 €
```

### 12.2 Beispiele

| Mehrlinge | Basiselterngeld | ElterngeldPlus |
|-----------|-----------------|----------------|
| Zwillinge | +300 € | +150 € |
| Drillinge | +600 € | +300 € |
| Vierlinge | +900 € | +450 € |

### 12.3 Wichtige Regel (§1 Abs. 1 Satz 2)

```
// Bei Mehrlingsgeburten besteht nur EIN Anspruch auf Elterngeld
// (nicht pro Kind), aber PLUS Mehrlingszuschlag
```

---

## 13. Anrechnung anderer Einnahmen (§3)

### 13.1 Anzurechnende Einnahmen (§3 Abs. 1)

| Nr. | Einnahme | Anrechnung |
|-----|----------|------------|
| 1a | Mutterschaftsgeld (GKV) | Voll |
| 1b | Arbeitgeberzuschuss zum Mutterschaftsgeld | Voll |
| 2 | Dienst-/Anwärterbezüge bei Beschäftigungsverbot | Voll |
| 3 | Vergleichbare ausländische Leistungen | Voll |
| 4 | Elterngeld für älteres Kind | Voll |
| 5 | Lohnersatzleistungen | Teilweise |

### 13.2 Anrechnungsformel

```
Auszahlungsbetrag = Elterngeld - Anrechnungsbetrag

// Anteilige Anrechnung:
WENN Einnahme nur Teil des Lebensmonats DANN
    Anrechnung = anteilig
```

### 13.3 Anrechnungsfreier Sockelbetrag (§3 Abs. 2)

```
Anrechnungsfrei = 300 € (Basiselterngeld)
                = 150 € (ElterngeldPlus)

// NICHT anrechnungsfrei bei:
- Mutterschaftsgeld (Nr. 1)
- Arbeitgeberzuschuss (Nr. 1)
- Dienst-/Anwärterbezüge (Nr. 2)
- Ausländische vergleichbare Leistungen (Nr. 3)
```

### 13.4 Praktische Anrechnung Mutterschaftsgeld

```
// Typischer Fall: Mutterschaftsgeld + AG-Zuschuss
Mutterschaftsgeld_GKV = MAX 13 €/Tag × 30 = 390 €/Monat
AG_Zuschuss = Netto_durchschnitt - 13 €/Tag

// Beispiel: Netto 2.500 €/Monat
Tagessatz_Netto = 2.500 / 30 = 83,33 €
AG_Zuschuss_Tag = 83,33 - 13 = 70,33 €
AG_Zuschuss_Monat = 70,33 × 30 = 2.110 €

Gesamt_Mutterschaftsleistung = 390 + 2.110 = 2.500 €

// Anrechnung auf Elterngeld:
Elterngeld_Anspruch = 2.500 × 0.65 = 1.625 €
Anrechnung = 2.500 €
Auszahlung = MAX(0, 1.625 - 2.500) = 0 €
```

---

## 14. Bezugsdauer und Monatsbeträge (§4)

### 14.1 Grundanspruch Elternpaar

```
// Basiselterngeld:
Gemeinsamer_Anspruch = 12 Monatsbeträge
Partnermonate = +2 Monatsbeträge (wenn Einkommen eines Elternteils
                                  in 2 Monaten gemindert)
Gesamt_Basis = 14 Monatsbeträge

// Umwandlung:
1 Monat Basiselterngeld = 2 Monate ElterngeldPlus
```

### 14.2 Maximaler Bezug pro Elternteil (§4 Abs. 4)

```
Max_Basiselterngeld_pro_Person = 12 Monate
Max_Partnerschaftsbonus_pro_Person = 4 Monate

// Mindestbezug:
Mindestbezug = 2 Lebensmonate
```

### 14.3 Bezugszeiträume

| Elterngeld-Art | Bezugszeitraum | Verweis |
|----------------|----------------|---------|
| Basiselterngeld | Bis 14. LM | §4 Abs. 1 Satz 3 |
| ElterngeldPlus | Bis 32. LM | §4 Abs. 1 Satz 4 |
| Adoption | Bis 8. Lebensjahr | §4 Abs. 1 Satz 5 |

### 14.4 Gleichzeitiger Bezug (§4 Abs. 6)

```
// Basiselterngeld gleichzeitig:
Erlaubt = nur in EINEM der ersten 12 Lebensmonate

// Ausnahmen für gleichzeitigen Basis-Bezug:
- Mehrlingsgeburten
- Frühgeburten (§4 Abs. 5)
- Kind mit Behinderung (§2 Abs. 1 SGB IX)
- Geschwisterbonus-Konstellation

// ElterngeldPlus:
Kann immer gleichzeitig bezogen werden
```

---

## 15. Partnerschaftsbonus (§4b)

### 15.1 Voraussetzungen

```
Partnerschaftsbonus_Anspruch =
    (Arbeitszeit_Elternteil_1 ≥ 24h UND ≤ 32h pro Woche)
    UND
    (Arbeitszeit_Elternteil_2 ≥ 24h UND ≤ 32h pro Woche)
    UND
    (beide erfüllen §1 Voraussetzungen)
```

### 15.2 Umfang

```
Max_Partnerschaftsbonus = 4 Monate ElterngeldPlus pro Elternteil
Mindestbezug = 2 Monate pro Elternteil
Bezugsform = gleichzeitig UND aufeinanderfolgend
```

### 15.3 Berechnung

```
Partnerschaftsbonus_Betrag = ElterngeldPlus_Berechnung
// Also maximal 50% des Basiselterngeldes ohne Einkommen
```

### 15.4 Arbeitszeit-Korridor

```
Arbeitszeit_Woche = Durchschnitt_im_Lebensmonat

MIN_Arbeitszeit = 24 Stunden/Woche
MAX_Arbeitszeit = 32 Stunden/Woche

// Berechnung Monatsdurchschnitt:
Durchschnitt = Summe_Wochenstunden / Anzahl_Wochen_im_Monat
```

---

## 16. Alleiniger Bezug / Alleinerziehende (§4c)

### 16.1 Voraussetzungen für alleinigen Bezug der Partnermonate

```
Alleinerziehend_nach_§4c =
    (Entlastungsbetrag_§24b_EStG)
    UND
    (anderer_Elternteil_wohnt_nicht_mit_Kind)

ODER

    (Betreuung_durch_anderen = Kindeswohlgefährdung_§1666_BGB)

ODER

    (Betreuung_durch_anderen = unmöglich wegen Krankheit/Behinderung)
```

### 16.2 Alleiniger Partnerschaftsbonus (§4c Abs. 2)

```
WENN §4c Abs. 1 Nr. 1-3 erfüllt DANN
    Partnerschaftsbonus_allein = 2-4 Monate ElterngeldPlus
    Arbeitszeit_Bedingung = 24-32 Wochenstunden
```

---

## 17. Frühgeburten-Regelung (§4 Abs. 5)

### 17.1 Zusätzliche Basiselterngeld-Monate

| Frühgeburt vor ET | Zusätzliche Monate | Gesamt Basis |
|-------------------|-------------------|--------------|
| ≥ 6 Wochen | +1 Monat | 13 Monate |
| ≥ 8 Wochen | +2 Monate | 14 Monate |
| ≥ 12 Wochen | +3 Monate | 15 Monate |
| ≥ 16 Wochen | +4 Monate | 16 Monate |

### 17.2 Berechnung Frühgeburt

```
Frühgeburt_Wochen = (voraussichtlicher_ET - tatsächliche_Geburt) / 7

WENN Frühgeburt_Wochen >= 16 DANN
    Zusatz_Monate = 4
SONST WENN Frühgeburt_Wochen >= 12 DANN
    Zusatz_Monate = 3
SONST WENN Frühgeburt_Wochen >= 8 DANN
    Zusatz_Monate = 2
SONST WENN Frühgeburt_Wochen >= 6 DANN
    Zusatz_Monate = 1
SONST
    Zusatz_Monate = 0
```

### 17.3 Verlängerter Bezugszeitraum

```
// Verschiebung der Grenzen entsprechend:
Basiselterngeld_bis = 14. LM + Zusatz_Monate
ElterngeldPlus_ab = 15. LM + Zusatz_Monate (bei durchgängigem Bezug)
```

---

## 18. Elternzeit-Regelungen (§15-§21)

### 18.1 Anspruch (§15)

```
Elternzeit_Anspruch =
    (Arbeitnehmer)
    UND
    (Kind im Haushalt)
    UND
    (Selbstbetreuung und -erziehung)
```

### 18.2 Dauer und Aufteilung (§15 Abs. 2)

```
Gesamtanspruch = 3 Jahre pro Kind
Transfer_auf_später = bis zu 24 Monate zwischen 3. und 8. Geburtstag
Zeitabschnitte = max. 3 (weitere nur mit AG-Zustimmung)
```

### 18.3 Arbeitszeit während Elternzeit (§15 Abs. 4)

```
Max_Arbeitszeit_Elternzeit = 32 Wochenstunden (Monatsdurchschnitt)
// Ausnahme: Kindertagespflege
```

### 18.4 Anmeldefristen (§16 Abs. 1)

| Zeitraum | Anmeldefrist |
|----------|--------------|
| Bis 3. Geburtstag | 7 Wochen vor Beginn |
| 3. - 8. Geburtstag | 13 Wochen vor Beginn |

### 18.5 Kündigungsschutz (§18)

```
Kündigungsschutz_Start = ab Anmeldung der Elternzeit

// Frühester Beginn des Schutzes:
Bis_3._Geburtstag: 8 Wochen vor Elternzeit-Beginn
3.-8._Geburtstag: 14 Wochen vor Elternzeit-Beginn
```

### 18.6 Urlaubskürzung (§17)

```
Urlaubskürzung = (Volle_Kalendermonate_Elternzeit / 12) × Jahresurlaub

// KEINE Kürzung bei Teilzeit während Elternzeit
```

---

## 19. Zusammenfassung der Kernformeln

### 19.1 Einkommensermittlung

```
// Nichtselbständige:
Netto = (Brutto - AN_Pauschbetrag/12 - Steuern - Sozialabgaben) / 12

// Selbständige:
Netto = (Gewinn - Steuern - Sozialabgaben) / 12

// Steuern:
Steuern = Einkommensteuer + Solidaritätszuschlag + Kirchensteuer(8%)

// Sozialabgaben:
Sozialabgaben = Einkommen × (9% KV/PV + 10% RV + 2% AV)
             = Einkommen × 21%
```

### 19.2 Ersatzrate

```
Rate =
    100% - (Einkommen - 1000) × 0,05%   wenn Einkommen < 1000
    67%                                  wenn 1000 ≤ Einkommen ≤ 1200
    67% - (Einkommen - 1200) × 0,05%    wenn Einkommen > 1200

// Grenzen:
65% ≤ Rate ≤ 100%
```

### 19.3 Elterngeld

```
// Basiselterngeld ohne Einkommen im Bezug:
Basis = MAX(300, MIN(1800, Netto_vor × Rate))

// Basiselterngeld mit Einkommen im Bezug:
Basis = MAX(300, MIN(1800, (MIN(2770, Netto_vor) - Netto_während) × Rate))

// ElterngeldPlus:
Plus = MIN(berechnet, Basis_ohne_Einkommen / 2)
     = MAX(150, MIN(900, ...))

// Geschwisterbonus:
Bonus = MAX(75, Elterngeld × 10%)  // bzw. 37,50 bei Plus

// Mehrlingszuschlag:
Zuschlag = (n - 1) × 300  // bzw. 150 bei Plus
```

### 19.4 Bezugsdauer-Übersicht

```
// Basiselterngeld:
Elternpaar: 12 + 2 Partnermonate = 14 Monate
Pro Person: max. 12 Monate
Alleinerziehend: 14 Monate

// ElterngeldPlus:
Umrechnung: 1 Basis = 2 Plus
Elternpaar: 28 Monate möglich (ohne Partnerschaftsbonus)

// Partnerschaftsbonus:
Pro Person: 2-4 Monate (bei 24-32h Teilzeit)
```

---

## 20. Übergangsregelungen (§28)

### 20.1 Zeitliche Geltung

| Geburt | Anzuwendende Fassung |
|--------|---------------------|
| Vor 01.09.2021 | Fassung bis 31.08.2021 |
| 01.09.2021 - 31.03.2024 | Fassung bis 31.03.2024 |
| 01.04.2024 - 30.04.2025 | Fassung bis 30.04.2025 |
| Ab 01.05.2025 | Aktuelle Fassung |

### 20.2 Einkommensgrenzen-Übergang

```
// Geburt 01.04.2024 - 31.03.2025:
Grenze_Einzelperson = 200.000 € (statt 175.000 €)
Grenze_Paar = 200.000 € (statt 175.000 €)

// Ab 01.04.2025:
Grenze = 175.000 € für alle
```

---

## Anhang A: Steuerklassen-Übersicht

| Klasse | Anwendung | Relevanz für Elterngeld |
|--------|-----------|------------------------|
| I | Ledig, verwitwet, geschieden | Standard |
| II | Alleinerziehend | + Entlastungsbetrag |
| III | Verheiratet (höheres Einkommen) | Höheres Netto → Mehr Elterngeld |
| IV | Verheiratet (beide gleich) | Standard |
| V | Verheiratet (niedrigeres Einkommen) | Niedrigeres Netto |
| VI | Zweit-/Drittjob | NICHT berücksichtigt |

### Steuerklassenwechsel-Strategie

```
// Optimierung für werdende Eltern:
WENN Partner_mit_höherem_Einkommen_pausiert DANN
    Wechsel zu III für diesen Partner
    Wechsel zu V für anderen Partner
    Mindestdauer: 7 Monate vor Bemessungszeitraum-Ende
```

---

## Anhang B: Berechnungsbeispiele

### Beispiel 1: Standardfall - Ein Verdiener, voller Bezug

```
Ausgangslage:
- Mutter: 3.200 € brutto, Steuerklasse IV
- Vater: 4.500 € brutto, Steuerklasse IV
- Mutter nimmt 12 Monate Elternzeit

Berechnung Mutter:
Brutto/Monat:           3.200,00 €
- AN-Pauschbetrag:        102,50 €
= Bemessungsgrundlage:  3.097,50 €
- Steuerabzüge (~20%):    619,50 €
- Sozialabgaben (21%):    650,48 €
= Netto vor Geburt:     1.827,52 €

Ersatzrate: 67% - (1.827,52 - 1.200) × 0,05% = 63,86%
// Minimum 65% greift
Ersatzrate = 65%

Basiselterngeld = 1.827,52 × 65% = 1.187,89 €
```

### Beispiel 2: Geringverdiener

```
Ausgangslage:
- Mutter: 800 € Netto vor Geburt

Berechnung:
Ersatzrate = 67% + (1.000 - 800) × 0,05% = 77%

Basiselterngeld = 800 × 77% = 616 €
```

### Beispiel 3: ElterngeldPlus mit Teilzeit

```
Ausgangslage:
- Netto vor Geburt: 2.000 €
- Teilzeit während Bezug: 1.200 € Netto

Basiselterngeld ohne Einkommen:
Rate = 65% (da > 1.200 €)
Basis_ohne = 2.000 × 65% = 1.300 €

Basiselterngeld mit Einkommen:
Differenz = 2.000 - 1.200 = 800 €
Basis_mit = 800 × 65% = 520 €

ElterngeldPlus:
Max = 1.300 / 2 = 650 €
Plus = MIN(520, 650) = 520 €

Vergleich über 12 Monate:
- Basiselterngeld: 520 × 6 = 3.120 €
- ElterngeldPlus: 520 × 12 = 6.240 €
→ ElterngeldPlus vorteilhafter!
```

---

## Anhang C: Checkliste für die Berechnung

### Vor der Geburt ermitteln:

- [ ] Bemessungszeitraum bestimmen (12 Monate / VZ)
- [ ] Ausklammerbare Monate identifizieren
- [ ] Bruttoeinkommen sammeln (ohne sonstige Bezüge)
- [ ] Steuerklasse und -merkmale erfassen
- [ ] Sozialversicherungsstatus prüfen
- [ ] Evtl. Steuerklassenwechsel planen

### Bei der Berechnung:

- [ ] Nettoeinkommen vor Geburt berechnen
- [ ] Ersatzrate bestimmen
- [ ] Grundanspruch berechnen
- [ ] Geschwisterbonus prüfen
- [ ] Mehrlingszuschlag prüfen
- [ ] Anrechnungen berücksichtigen
- [ ] Mindest-/Höchstgrenzen anwenden

### Bezugsplanung:

- [ ] Basiselterngeld vs. ElterngeldPlus abwägen
- [ ] Partnermonate einplanen
- [ ] Partnerschaftsbonus-Option prüfen
- [ ] Mutterschaftsgeld-Anrechnung beachten
- [ ] Gleichzeitigen Bezug planen (falls erlaubt)

---

*Letzte Aktualisierung: Januar 2026*
*Basierend auf BEEG in der Fassung vom 22.12.2025*
