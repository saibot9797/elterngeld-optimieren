# Analyse: Backend vs. BEEG-Berechnungsformeln

**Stand:** Januar 2026
**Verifiziert:** Online-Quellen (familienportal.de, elterngeld.net, haufe.de)

---

## BEEG 2026 - Aktuelle Werte (verifiziert)

| Parameter | Wert 2026 | Quelle |
|-----------|-----------|--------|
| Einkommensgrenze (Paare) | 175.000 EUR | §1 Abs. 8 BEEG |
| Einkommensgrenze (Alleinerziehend) | 175.000 EUR | §1 Abs. 8 BEEG |
| Arbeitnehmer-Pauschbetrag | 1.230 EUR/Jahr (102,50 EUR/Monat) | §2e Abs. 1 BEEG |
| Sozialabgaben-Pauschale | 21% (9% KV/PV + 10% RV + 2% AV) | §2f BEEG |
| Kirchensteuer-Pauschale | 8% (einheitlich, nicht bundeslandabhängig) | §2e Abs. 5 BEEG |
| Ersatzrate Standard | 67% | §2 Abs. 1 BEEG |
| Ersatzrate Minimum | 65% (bei Einkommen > 1.200 EUR) | §2 Abs. 2 BEEG |
| Ersatzrate Maximum | 100% (bei Einkommen < 1.000 EUR) | §2 Abs. 2 BEEG |
| Basiselterngeld Min/Max | 300 / 1.800 EUR | §2 Abs. 4-5 BEEG |
| ElterngeldPlus Min/Max | 150 / 900 EUR | §4a Abs. 2 BEEG |
| Deckelung Teilzeit | 2.770 EUR | §2 Abs. 3 BEEG |

---

## Grundsätzlich vorhanden und korrekt

- Mutterschutz-Berechnung (6 Wochen vor, 8/12 Wochen nach)
- Basiselterngeld Min/Max (300/1.800 EUR)
- ElterngeldPlus Min/Max (150/900 EUR)
- Geschwisterbonus (10%, min 75 EUR)
- Mehrlingszuschlag ((n-1) × 300 EUR)
- Bemessungszeitraum Mutter vs. Partner

---

## Probleme und Lücken

### 1. Ersatzrate - FEHLERHAFT

| BEEG-Formel (§2 Abs. 2) | Backend (IST) |
|-------------------------|---------------|
| > 1.200 EUR: Absenkung beginnt | > 1.240 EUR: Absenkung beginnt |
| 1.000-1.200 EUR: Standard 67% | 1.000-1.200 EUR: Erhöhung (falsch!) |

**Fix:** Grenzen in `calculate_ersatzrate.xs` korrigieren:
```
< 1.000 EUR:  67% + (1000 - Einkommen) × 0,1%  → max 100%
1.000-1.200:  67% (keine Anpassung)
> 1.200 EUR:  67% - (Einkommen - 1200) × 0,1%  → min 65%
```

### 2. Einkommensgrenze 175.000 EUR - FEHLT

Laut §1 Abs. 8 kein Anspruch bei >175.000 EUR (Einzelperson oder Paar). Im Backend nicht implementiert.

**Fix:** Validierung vor Berechnung hinzufügen.

### 3. Deckelung 2.770 EUR bei Teilzeit - FEHLT

Bei Einkommen während Bezug wird das Vorgeburt-Einkommen auf 2.770 EUR gedeckelt (§2 Abs. 3). Nicht implementiert.

**Fix:** `min(vorgeburt_einkommen, 2770)` bei Teilzeit-Fällen.

### 4. Sozialabgaben - FALSCHE SÄTZE

| BEEG-Pauschale (§2f) | Backend (IST) |
|----------------------|---------------|
| KV/PV: 9% | 8.1% + 1.7% = 9.8% |
| RV: 10% | 9.3% |
| AV: 2% | 1.3% |
| **Gesamt: 21%** | **20.4%** |

Das Backend verwendet tatsächliche AN-Anteile statt BEEG-Pauschalen.

**Fix:** Feste 21% Pauschale verwenden (§2f BEEG schreibt dies vor).

### 5. Kirchensteuersatz - FALSCH

| BEEG (§2e Abs. 5) | Backend (IST) |
|-------------------|---------------|
| Einheitlich 8% | Standard 9% |

**Fix:** Feste 8% verwenden, unabhängig vom Bundesland.

### 6. Selbständige (§2d) - NICHT IMPLEMENTIERT

Tabelle hat `employment_type`, aber keine Berechnung für Selbständige/Mischeinkommen.

**Fix:** Implementierung gemäß §2d BEEG:
- Gewinn aus Steuerbescheid (Vorjahr oder Durchschnitt)
- Pauschalen gelten nicht, nur tatsächliche Abzüge

### 7. Ausklammerbare Monate (§2b) - NICHT IMPLEMENTIERT

Feld `exclusion_months` existiert, aber keine Berechnungslogik.

**Fix:** Monate mit bestimmten Ereignissen (Krankheit, Kurzarbeit, vorherige Elternzeit) aus Bemessungszeitraum ausklammern.

### 8. Frühgeburten-Zusatzmonate (§4 Abs. 5) - FEHLT

+1-4 Monate je nach Wochen vor ET. Feld vorhanden, Berechnung fehlt.

| Wochen vor ET | Zusatzmonate |
|---------------|--------------|
| 6 Wochen | +1 Monat |
| 8 Wochen | +2 Monate |
| 12 Wochen | +3 Monate |
| 16 Wochen | +4 Monate |

**Fix:** Automatische Berechnung basierend auf tatsächlichem vs. errechnetem Geburtstermin.

### 9. Mutterschaftsgeld-Anrechnung (§3) - FEHLT

Mutterschaftsgeld wird auf Elterngeld angerechnet. Komplett nicht implementiert.

**Fix:**
- Mutterschaftsgeld (max 13 EUR/Tag von KK) + Arbeitgeberzuschuss
- Wird 1:1 vom Elterngeld abgezogen
- Ergebnis darf nicht unter Mindestbetrag fallen

### 10. Alleinerziehende (§4c) - FEHLT

Kein Feld, keine Berechnung für vollen Partnermonate-Bezug.

**Fix:**
- Alleinerziehende können volle 14 Monate Basiselterngeld beziehen
- Feld `is_single_parent` hinzufügen

### 11. Gleichzeitiger Bezug (§4 Abs. 6) - NICHT VALIDIERT

Basiselterngeld gleichzeitig nur in 1 Monat erlaubt (außer Ausnahmen).

**Fix:** Validierung hinzufügen, Warnung bei mehr als 1 gleichzeitigem Monat.

### 12. Übergangsregelungen (§28) - VERALTET

| Geburtsdatum | Einkommensgrenze |
|--------------|------------------|
| Bis 31.03.2025 | 200.000 EUR (Paare) |
| Ab 01.04.2025 | 175.000 EUR |

**Fix:** Für neue Geburten ab 2026 nur noch 175.000 EUR relevant.

---

## Zusammenfassung

| Kategorie | Status | Priorität |
|-----------|--------|-----------|
| Kernberechnung Elterngeld | ⚠️ Ersatzrate-Grenzen falsch | **HOCH** |
| Steuer-/Sozialabzüge | ⚠️ Sätze stimmen nicht mit BEEG-Pauschalen | **HOCH** |
| Boni/Zuschläge | ✅ Korrekt | - |
| Selbständige | ❌ Fehlt komplett | MITTEL |
| Mutterschaftsgeld | ❌ Fehlt komplett | **HOCH** |
| Sonderfälle (Frühgeburt, Alleinerziehend) | ❌ Nicht implementiert | MITTEL |
| Bezugsdauer-Validierung | ❌ Fehlt | MITTEL |
| Einkommensgrenzen | ❌ Fehlt | **HOCH** |

---

## Priorisierte Aktionsliste

### Phase 1 - Kritische Fixes (HOCH)

1. **Ersatzrate-Grenzen korrigieren**
   - 1.240 → 1.200 EUR in `calculate_ersatzrate.xs`
   - Formel anpassen gemäß §2 Abs. 2

2. **Sozialabgaben auf 21% fixieren**
   - Nicht tatsächliche AN-Anteile, sondern BEEG-Pauschale

3. **Kirchensteuer auf 8% fixieren**
   - Einheitlich, nicht bundeslandabhängig

4. **Einkommensgrenze 175.000 EUR implementieren**
   - Validierung vor Berechnung

5. **Mutterschaftsgeld-Anrechnung implementieren**
   - Abzug vom Elterngeld in Mutterschutz-Monaten

### Phase 2 - Wichtige Features (MITTEL)

6. Frühgeburten-Zusatzmonate
7. Alleinerziehenden-Modus
8. Deckelung 2.770 EUR bei Teilzeit
9. Ausklammerbare Monate

### Phase 3 - Erweiterungen (NIEDRIG)

10. Selbständige/Mischeinkommen
11. Gleichzeitiger Bezug Validierung

---

## Fazit

Das Backend deckt die Grundberechnung ab, hat aber fehlerhafte Grenzen bei der Ersatzrate und verwendet falsche Pauschalen für Sozialabgaben/Kirchensteuer. Die kritischen Fixes in Phase 1 sollten vor Produktivbetrieb umgesetzt werden, da sie zu falschen Berechnungsergebnissen führen.

**Geschätzter Impact der Fehler:**
- Ersatzrate-Fehler: Bis zu 2% Abweichung bei mittleren Einkommen
- Sozialabgaben-Fehler: ~0,6% Abweichung (20,4% statt 21%)
- Kirchensteuer-Fehler: 1% Abweichung bei kirchensteuerpflichtigen Personen

Diese Abweichungen können in Summe zu Fehlberechnungen von 50-150 EUR/Monat führen.
