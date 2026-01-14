# Implementierungsplan v1 - Übersicht

## Projekt-Zusammenfassung

**Eltern-Kompass** ist ein Elterngeld-Optimierer - das "Taxfix für werdende Eltern".

| Aspekt | Details |
|--------|---------|
| **Vision** | Maximales Elterngeld durch intelligente Steuerklassen-Optimierung |
| **Frontend** | Next.js 15 + shadcn/ui + Tailwind CSS |
| **Backend** | Xano mit XanoScript |
| **Payments** | Stripe (Checkout Sessions + Webhooks) |
| **Zielgruppe** | Werdende Eltern in Deutschland |

### Business-Modell

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Quick-Check   │───>│    Premium      │───>│   Premium+      │
│    KOSTENLOS    │    │     79 EUR      │    │    149 EUR      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • 5-Schritt     │    │ • Detaillierte  │    │ • Alles aus     │
│   Wizard        │    │   Berechnung    │    │   Premium       │
│ • Grobe         │    │ • Optimierungs- │    │ • Premium Chat  │
│   Schätzung     │    │   strategie     │    │   mit KI-       │
│ • Lead-         │    │ • PDF-Export    │    │   Berater       │
│   Generierung   │    │                 │    │ • Persönliche   │
│                 │    │                 │    │   Beratung      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

---

## Aktueller Status

| Komponente | Status | Fortschritt | Anmerkung |
|------------|--------|-------------|-----------|
| Landing Page | ✅ Fertig | 100% | Vollständig implementiert |
| Quick-Check Wizard | ✅ Fertig | 100% | 5 Schritte, localStorage |
| Ergebnis-Seite | ✅ Fertig | 100% | CTA zu Registrierung |
| Registrierung | ✅ Fertig | 100% | Mock-Auth implementiert |
| Portal Onboarding | 🟡 Teilweise | 70% | 4 Schritte vorhanden |
| Portal Paywall | 🔴 Fehlend | 0% | Nur Redirect, keine echte Paywall |
| Stripe Integration | 🔴 Fehlend | 0% | Komplett nicht vorhanden |
| Xano Backend | 🔴 Fehlend | 0% | Keine Tabellen, keine APIs |
| Premium Chat | 🟡 Begonnen | 30% | Phase 1-3 von 8 implementiert |

### User Flow (Aktuell)

```
Landing ──> Quick-Check ──> Ergebnis ──> Registrieren
                                              │
                                              v
                           Portal/Strategie <── Portal/Onboarding
                                  ^                    │
                                  │                    v
                                  └──── Portal/Ergebnis (REDIRECT!)
                                              ⚠️ Keine Paywall!
```

---

## Kritische Probleme

### ~~BEEG-Berechnungsfehler~~ ✅ BEHOBEN (14.01.2026)

~~Die Frontend-Berechnungen in `lib/calculations/` enthalten **falsche Werte** gemäß BEEG:~~

| Parameter | ~~Falsch~~ | Korrigiert | Status |
|-----------|------------|------------|--------|
| Ersatzrate-Grenze | ~~1.240 EUR~~ | **1.200 EUR** | ✅ |
| Ersatzrate 1000-1200€ | ~~Gestaffelt~~ | **Konstant 67%** | ✅ |
| Sozialabgaben-Pauschale | ~~20,4%~~ | **21%** | ✅ |
| Kirchensteuer-Pauschale | ~~9% variabel~~ | **8% einheitlich** | ✅ |
| Einkommensgrenze | ~~Fehlte~~ | **175k/200k validiert** | ✅ |

**Alle BEEG-Berechnungen sind jetzt gesetzeskonform.**

### Fehlende Paywall

- `/portal/ergebnis` leitet direkt zu `/portal/strategie` weiter
- Keine Zahlungsaufforderung
- Keine Stripe-Integration
- **Business-Modell funktioniert nicht!**

### Fehlendes Backend

- Keine persistente Datenspeicherung
- Alle Daten nur in localStorage
- Keine User-Verwaltung
- Keine Transaktions-Historie

---

## Phasen-Übersicht

### Phase 0: BEEG-Fixes ✅ ABGESCHLOSSEN
**Status:** ✅ FERTIG (14.01.2026)

Alle BEEG-Berechnungsparameter korrigiert:
- `constants.ts`: Alle Konstanten BEEG-konform
- `elterngeld-quick.ts`: Ersatzraten-Logik + Input-Validierung
- 3x Code-Review bestanden (BEEG-Compliance, Code Quality, Security)

➡️ [Details: 01-phase-0-beeg-fixes.md](./01-phase-0-beeg-fixes.md)

---

### Phase 1: Paywall + Stripe
**Priorität:** 🟠 Hoch | **Aufwand:** 3-5 Tage

Implementierung der Zahlungsschranke und Stripe-Integration.

| Komponente | Beschreibung |
|------------|--------------|
| Paywall UI | Anzeige der Berechnungsergebnisse mit Blur/Lock |
| Pricing Cards | Premium (79€) und Premium+ (149€) Optionen |
| Stripe Checkout | Server-side Checkout Sessions |
| Webhooks | Payment-Bestätigung und User-Upgrade |
| Success/Cancel | Post-Payment Handling |

➡️ [Details: 02-phase-1-paywall-stripe.md](./02-phase-1-paywall-stripe.md)

---

### Phase 2: Xano Backend
**Priorität:** 🟠 Hoch | **Aufwand:** 1-2 Wochen

Aufbau des kompletten Backends in Xano.

| Bereich | Inhalt |
|---------|--------|
| Tabellen | users, calculations, transactions, chat_sessions |
| Auth | JWT-basierte Authentifizierung |
| APIs | User-CRUD, Calculations, Payments |
| Functions | BEEG-Berechnungen serverseitig |

➡️ [Details: 03-phase-2-xano-backend.md](./03-phase-2-xano-backend.md)

---

### Phase 3: Premium Chat
**Priorität:** 🟡 Mittel | **Aufwand:** 9-13 Tage

KI-gestützter Chat-Berater für Premium+ Nutzer.

| Phase | Beschreibung | Status |
|-------|--------------|--------|
| 1-3 | Basis Chat UI + Zustandsmanagement | ✅ 30% fertig |
| 4-5 | Backend Integration + KI-Anbindung | 🔴 Ausstehend |
| 6-7 | BEEG-spezifische Flows + Kontext | 🔴 Ausstehend |
| 8 | Polish + Testing | 🔴 Ausstehend |

➡️ [Details: 04-phase-3-premium-chat.md](./04-phase-3-premium-chat.md)

---

## Dateistruktur des Plans

```
specs/implementierungsplan-v1/
├── 00-uebersicht.md            # Diese Datei
├── 01-phase-0-beeg-fixes.md    # BEEG-Korrekturen
├── 02-phase-1-paywall-stripe.md # Paywall + Payments
├── 03-phase-2-xano-backend.md   # Backend-Aufbau
└── 04-phase-3-premium-chat.md   # Chat-Feature
```

---

## Team-Anforderungen

### Benötigte Skills

| Rolle | Skills | Phasen |
|-------|--------|--------|
| **Frontend-Entwickler** | Next.js 15, React 19, TypeScript, shadcn/ui | 0, 1, 3 |
| **Backend-Entwickler** | Xano, XanoScript, REST APIs | 2, 3 |
| **Payment-Spezialist** | Stripe API, Webhooks, PCI Compliance | 1 |
| **Domain-Experte** | BEEG, Elterngeld, Steuerrecht | 0, 3 |

### Empfohlene Dokumentation

- **BEEG Gesetz:** `/BEEG Gesetz/beeg_gesetz.html`
- **Berechnungsformeln:** `/BEEG Gesetz/beeg-berechnungsformeln.md`
- **Xano Docs:** `/xano-docs/docs/`
- **Premium Chat Plan:** `/pläne/premium-chat.md`

---

## Abhängigkeiten zwischen Phasen

```
                    ┌─────────────────┐
                    │    Phase 0      │
                    │   BEEG-Fixes    │
                    │   ✅ FERTIG     │
                    └────────┬────────┘
                             │
                             │ ✅ ERLEDIGT
                             │
              ┌──────────────┴──────────────┐
              │                             │
              v                             v
    ┌─────────────────┐           ┌─────────────────┐
    │    Phase 1      │           │    Phase 2      │
    │ Paywall+Stripe  │           │  Xano Backend   │
    │   🔴 OFFEN      │           │   🔴 OFFEN      │
    └────────┬────────┘           └────────┬────────┘
             │                             │
             │  ⬅️ JETZT PARALLEL MÖGLICH ➡️ │
             │                             │
             └──────────────┬──────────────┘
                            │
                            │ BENÖTIGT PHASE 2
                            v
                  ┌─────────────────┐
                  │    Phase 3      │
                  │  Premium Chat   │
                  │   🔴 WARTEND    │
                  └─────────────────┘
```

### Wichtige Hinweise

1. ~~**Phase 0 ist blockierend**~~ ✅ Phase 0 abgeschlossen - Berechnungen sind BEEG-konform
2. **Phase 1 & 2 parallel möglich** - Können jetzt gestartet werden
3. **Phase 3 braucht Phase 2** - Chat benötigt persistente Datenspeicherung in Xano
4. **Stripe-Webhooks** - Brauchen öffentlich erreichbaren Endpoint (ngrok für Dev)

---

## Timeline

| Phase | Status | Abgeschlossen |
|-------|--------|---------------|
| Phase 0 | ✅ FERTIG | 14.01.2026 |
| Phase 1 | 🔴 OFFEN | - |
| Phase 2 | 🔴 OFFEN | - |
| Phase 3 | 🔴 WARTEND | - |

---

## Nächste Schritte

1. [x] ~~**SOFORT:** Phase 0 - BEEG-Fixes durchführen~~ ✅ ERLEDIGT
2. [ ] **JETZT:** Phase 1 + 2 parallel starten
3. [ ] Stripe Account einrichten und API-Keys generieren
4. [ ] Xano Workspace vorbereiten

---

*Letztes Update: 14.01.2026 - Phase 0 abgeschlossen*
