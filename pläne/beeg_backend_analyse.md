Analyse: Backend vs. BEEG-Berechnungsformeln

  Grundsätzlich vorhanden und korrekt:

  - Mutterschutz-Berechnung (6 Wochen vor, 8/12 Wochen nach)
  - Basiselterngeld Min/Max (300/1.800 EUR)
  - ElterngeldPlus Min/Max (150/900 EUR)
  - Geschwisterbonus (10%, min 75 EUR)
  - Mehrlingszuschlag ((n-1) × 300 EUR)
  - Bemessungszeitraum Mutter vs. Partner

  ---
  Probleme und Lücken:

  1. Ersatzrate - FEHLERHAFT
  ┌────────────────────────────────┬─────────────────────────────────────┐
  │          BEEG-Formel           │               Backend               │
  ├────────────────────────────────┼─────────────────────────────────────┤
  │ > 1.200 EUR: Absenkung beginnt │ > 1.240 EUR: Absenkung beginnt      │
  ├────────────────────────────────┼─────────────────────────────────────┤
  │ 1.000-1.200 EUR: Standard 67%  │ 1.000-1.200 EUR: Erhöhung (falsch!) │
  └────────────────────────────────┴─────────────────────────────────────┘
  Der Code in calculate_ersatzrate.xs verwendet falsche Grenzen.

  2. Einkommensgrenze 175.000 EUR - FEHLT

  Laut §1 Abs. 8 kein Anspruch bei >175.000 EUR (Einzelperson oder Paar). Im Backend nicht implementiert.

  3. Deckelung 2.770 EUR bei Teilzeit - FEHLT

  Bei Einkommen während Bezug wird das Vorgeburt-Einkommen auf 2.770 EUR gedeckelt (§2 Abs. 3). Nicht implementiert.

  4. Sozialabgaben - FALSCHE SÄTZE
  ┌──────────────────────┬────────────────────┐
  │ BEEG-Pauschale (§2f) │      Backend       │
  ├──────────────────────┼────────────────────┤
  │ KV/PV: 9%            │ 8.1% + 1.7% = 9.8% │
  ├──────────────────────┼────────────────────┤
  │ RV: 10%              │ 9.3%               │
  ├──────────────────────┼────────────────────┤
  │ AV: 2%               │ 1.3%               │
  ├──────────────────────┼────────────────────┤
  │ Gesamt: 21%          │ 20.4%              │
  └──────────────────────┴────────────────────┘
  Das Backend verwendet tatsächliche AN-Anteile statt BEEG-Pauschalen.

  5. Kirchensteuersatz - FALSCH
  ┌───────────────────┬─────────────┐
  │ BEEG (§2e Abs. 5) │   Backend   │
  ├───────────────────┼─────────────┤
  │ Einheitlich 8%    │ Standard 9% │
  └───────────────────┴─────────────┘
  6. Selbständige (§2d) - NICHT IMPLEMENTIERT

  Tabelle hat employment_type, aber keine Berechnung für Selbständige/Mischeinkommen.

  7. Ausklammerbare Monate (§2b) - NICHT IMPLEMENTIERT

  Feld exclusion_months existiert, aber keine Berechnungslogik.

  8. Frühgeburten-Zusatzmonate (§4 Abs. 5) - FEHLT

  +1-4 Monate je nach Wochen vor ET. Feld vorhanden, Berechnung fehlt.

  9. Mutterschaftsgeld-Anrechnung (§3) - FEHLT

  Mutterschaftsgeld wird auf Elterngeld angerechnet. Komplett nicht implementiert.

  10. Alleinerziehende (§4c) - FEHLT

  Kein Feld, keine Berechnung für vollen Partnermonate-Bezug.

  11. Gleichzeitiger Bezug (§4 Abs. 6) - NICHT VALIDIERT

  Basiselterngeld gleichzeitig nur in 1 Monat erlaubt (außer Ausnahmen).

  12. Übergangsregelungen (§28) - FEHLT

  Unterschiedliche Grenzen je nach Geburtsdatum (200.000 EUR bis 31.03.2025).

  ---
  Zusammenfassung
  ┌───────────────────────────────────────────┬────────────────────────────────────────────┐
  │                 Kategorie                 │                   Status                   │
  ├───────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Kernberechnung Elterngeld                 │ ⚠️ Ersatzrate-Grenzen falsch               │
  ├───────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Steuer-/Sozialabzüge                      │ ⚠️ Sätze stimmen nicht mit BEEG-Pauschalen │
  ├───────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Boni/Zuschläge                            │ ✅ Korrekt                                 │
  ├───────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Selbständige                              │ ❌ Fehlt komplett                          │
  ├───────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Mutterschaftsgeld                         │ ❌ Fehlt komplett                          │
  ├───────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Sonderfälle (Frühgeburt, Alleinerziehend) │ ❌ Nicht implementiert                     │
  ├───────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Bezugsdauer-Validierung                   │ ❌ Fehlt                                   │
  ├───────────────────────────────────────────┼────────────────────────────────────────────┤
  │ Einkommensgrenzen                         │ ❌ Fehlt                                   │
  └───────────────────────────────────────────┴────────────────────────────────────────────┘
  Fazit: Das Backend deckt die Grundberechnung ab, hat aber fehlerhafte Grenzen bei der Ersatzrate und fehlende Implementierung für Sonderfälle, Anrechnungen und Validierungen.