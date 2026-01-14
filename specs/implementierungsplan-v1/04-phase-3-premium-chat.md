# Phase 3: Premium Chat-Berater

## Zusammenfassung

| Aspekt | Details |
|--------|---------|
| **Status** | 30% implementiert |
| **Geschaetzter Aufwand** | 9-13 Tage |
| **Abhaengigkeiten** | Phase 2 (Xano Backend) muss abgeschlossen sein |
| **Prioritaet** | Mittel |

### Was bereits existiert

- **Frontend-Komponenten:** ChatContainer, ChatHistory, QuestionCard, ProgressHeader
- **Input-Komponenten:** ButtonGroup, SliderInput, CurrencyInput, DateInput, SelectInput, PrefillInput
- **Fragen-Definition:** Phase 1-3 (Grundsituation, Einkommensgrenze, Geschwister) - ca. 20 Fragen
- **State Management:** useBerater Hook mit localStorage-Persistenz
- **Types:** Basis-Typen fuer Question, ChatMessage, BeraterState

### Was fehlt

1. **Input-Komponenten:** MultiSelectInput, MultiDateInput, MonthlyInput (12-Monate), PersonSelector, DualSliderInput
2. **Fragen:** Phase 4-8 (ca. 50 Fragen fuer Beschaeftigung, Ausklammerung, Mutterschaftsgeld, Elternzeit, Optimierung)
3. **Backend:** Xano-Tabellen (chat_sessions, chat_messages), APIs (/berater/state, /berater/answer, /berater/ask)
4. **AI Integration:** Gemini 2.5 Flash via Xano AI fuer Rueckfragen
5. **Premium-Gate:** Zugriffskontrolle fuer Premium+ Nutzer

---

## 3.1 Aktueller Stand

### Implementierte Fragen (Phase 1-3)

```typescript
// Bereits in eltern-kompass/lib/berater/questions.ts

// PHASE 1: GRUNDSITUATION (9 Fragen)
Q1_kind_geboren       // Ja/Nein Buttons
Q2a_geburtsdatum      // Date Input
Q2b_errechneter_termin // Date Input mit Prefill
Q3_fruehgeburt        // Ja/Nein Buttons
Q3b_wochen_vor_et     // Slider (6-20 Wochen)
Q4_mehrlinge          // Buttons (Einling/Zwillinge/Drillinge)
Q5_bundesland         // Select mit Prefill
Q6_wohnsitz           // Buttons (DE/Ausland)
WARNUNG_KEIN_ANSPRUCH // Info-Screen
Q7_adoption           // Ja/Nein Buttons
Q7b_aufnahmedatum     // Date Input
Q8_partner            // Ja/Nein Buttons mit Prefill
Q9_alleinerziehend    // Ja/Nein Buttons

// PHASE 2: EINKOMMENSGRENZE (3 Fragen)
Q10_einkommensgrenze  // Buttons (unter/ueber/weiss_nicht)
Q10b_genauer_betrag   // Currency Input
WARNUNG_EINKOMMEN     // Info-Screen

// PHASE 3: GESCHWISTER (3 Fragen)
Q15_geschwister       // Ja/Nein Buttons
Q15b_anzahl           // Slider (1-6)
PHASE_COMPLETE        // Transition-Screen

// PHASE 4 PLACEHOLDER
Q20_beschaeftigung    // Buttons (nur Platzhalter)
COMING_SOON           // Demo-Ende
```

### useBerater Hook - Aktuelle Features

Der Hook in `eltern-kompass/hooks/useBerater.ts` bietet:

```typescript
// State
messages: ChatMessage[]           // Chat-Verlauf
currentQuestion: Question | null  // Aktuelle Frage
answers: Record<string, unknown>  // Alle Antworten
phase: number                     // Aktuelle Phase (1-8)
currentPhaseInfo: PhaseInfo       // Phase-Name und Fragen-Anzahl
progress: number                  // Fortschritt in %
canGoBack: boolean                // Zurueck-Navigation moeglich?
isLoaded: boolean                 // LocalStorage geladen?
prefillData: PrefillData          // Vorausgefuellte Daten

// Actions
sendAnswer(answer: unknown)       // Antwort senden
goBack()                          // Zur vorherigen Frage
reset()                           // Chat zuruecksetzen
getPrefillValue(question)         // Prefill-Wert fuer Frage holen
```

**Prefill-Datenquellen:**
- `eltern-kompass-quick-check` (localStorage)
- `eltern-kompass-onboarding` (localStorage)

---

## 3.2 Fehlende Input-Komponenten

### 3.2.1 MultiSelectInput.tsx

Fuer Mehrfachauswahl (z.B. Q23b_sonderzahlungen_art, Q55_ausklammerung).

```typescript
// eltern-kompass/components/berater/inputs/MultiSelectInput.tsx
'use client'

import { useState } from 'react'
import { Option } from '@/lib/berater/types'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiSelectInputProps {
  options: Option[]
  onSubmit: (values: string[]) => void
  minSelect?: number
  maxSelect?: number
}

export function MultiSelectInput({
  options,
  onSubmit,
  minSelect = 1,
  maxSelect
}: MultiSelectInputProps) {
  const [selected, setSelected] = useState<string[]>([])

  const toggleOption = (value: string) => {
    // "nichts" Option deselektiert alle anderen
    if (value === 'nichts') {
      setSelected(['nichts'])
      return
    }

    // Andere Option deselektiert "nichts"
    let newSelected = selected.filter(v => v !== 'nichts')

    if (newSelected.includes(value)) {
      newSelected = newSelected.filter(v => v !== value)
    } else {
      // Max-Limit pruefen
      if (maxSelect && newSelected.length >= maxSelect) {
        return
      }
      newSelected = [...newSelected, value]
    }

    setSelected(newSelected)
  }

  const handleSubmit = () => {
    if (selected.length < minSelect) return
    onSubmit(selected)
  }

  const isValid = selected.length >= minSelect

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col gap-2">
        {options.map((option) => {
          const isSelected = selected.includes(option.value)
          return (
            <button
              key={option.value}
              onClick={() => toggleOption(option.value)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all",
                "text-left",
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-primary/50"
              )}
            >
              <div className={cn(
                "flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center",
                isSelected
                  ? "border-primary bg-primary"
                  : "border-gray-300"
              )}>
                {isSelected && <Check className="h-3 w-3 text-white" />}
              </div>
              <div className="flex-1">
                <span className={cn(
                  "font-medium",
                  isSelected ? "text-primary" : "text-gray-900"
                )}>
                  {option.label}
                </span>
                {option.description && (
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                )}
              </div>
            </button>
          )
        })}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full"
        size="lg"
      >
        Bestaetigen ({selected.length} ausgewaehlt)
      </Button>
    </div>
  )
}
```

### 3.2.2 MultiDateInput.tsx

Fuer mehrere Datumseingaben (z.B. Q15c_geburtsdaten_geschwister).

```typescript
// eltern-kompass/components/berater/inputs/MultiDateInput.tsx
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, X, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MultiDateInputProps {
  count: number  // Anzahl der erwarteten Daten
  onSubmit: (dates: string[]) => void
  label?: string
}

export function MultiDateInput({
  count,
  onSubmit,
  label = 'Geburtsdatum'
}: MultiDateInputProps) {
  const [dates, setDates] = useState<string[]>(Array(count).fill(''))

  const updateDate = (index: number, value: string) => {
    const newDates = [...dates]
    newDates[index] = value
    setDates(newDates)
  }

  const handleSubmit = () => {
    // Nur gefuellte Daten submitten
    const filledDates = dates.filter(d => d)
    if (filledDates.length === 0) return
    onSubmit(filledDates)
  }

  const isValid = dates.some(d => d)

  return (
    <div className="w-full space-y-4">
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, index) => (
          <div key={index} className="flex items-center gap-2">
            <span className="text-sm text-gray-500 w-16">
              {label} {index + 1}:
            </span>
            <div className="relative flex-1">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="date"
                value={dates[index]}
                onChange={(e) => updateDate(index, e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full"
        size="lg"
      >
        Bestaetigen
      </Button>
    </div>
  )
}
```

### 3.2.3 MonthlyInput.tsx

Fuer 12-Monats-Eingabe von Gehaeltern (Q22b_gehalt_monate).

```typescript
// eltern-kompass/components/berater/inputs/MonthlyInput.tsx
'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Euro, Copy, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthlyInputProps {
  onSubmit: (values: number[]) => void
  startDate?: Date  // Optional: Startdatum fuer Monatsnamen
}

const MONTH_NAMES = [
  'Januar', 'Februar', 'Maerz', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
]

export function MonthlyInput({ onSubmit, startDate }: MonthlyInputProps) {
  const [values, setValues] = useState<string[]>(Array(12).fill(''))
  const [isExpanded, setIsExpanded] = useState(false)

  // Berechne Monatsnamen basierend auf Startdatum oder aktuell - 12 Monate
  const monthLabels = useMemo(() => {
    const start = startDate || new Date()
    const labels: string[] = []
    for (let i = 11; i >= 0; i--) {
      const date = new Date(start)
      date.setMonth(date.getMonth() - i)
      labels.push(`${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`)
    }
    return labels
  }, [startDate])

  const updateValue = (index: number, value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    const newValues = [...values]
    newValues[index] = numericValue
    setValues(newValues)
  }

  const formatValue = (value: string) => {
    if (!value) return ''
    return Number(value).toLocaleString('de-DE')
  }

  const copyToAll = () => {
    if (!values[0]) return
    setValues(Array(12).fill(values[0]))
  }

  const handleSubmit = () => {
    const numericValues = values.map(v => Number(v) || 0)
    // Mindestens ein Wert muss > 0 sein
    if (numericValues.every(v => v === 0)) return
    onSubmit(numericValues)
  }

  const total = values.reduce((sum, v) => sum + (Number(v) || 0), 0)
  const average = Math.round(total / 12)
  const isValid = values.some(v => Number(v) > 0)

  return (
    <div className="w-full space-y-4">
      {/* Zusammenfassung */}
      <div className="p-4 rounded-xl bg-gray-50 border">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-500">Durchschnitt</p>
            <p className="text-xl font-bold text-gray-900">
              {formatValue(String(average))} EUR
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Jahressumme</p>
            <p className="text-lg font-medium text-gray-700">
              {formatValue(String(total))} EUR
            </p>
          </div>
        </div>
      </div>

      {/* Erster Monat + Copy-Button */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 w-32 truncate">
            {monthLabels[0]}:
          </span>
          <div className="relative flex-1">
            <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              inputMode="numeric"
              value={formatValue(values[0])}
              onChange={(e) => updateValue(0, e.target.value)}
              placeholder="0"
              className="pl-10 text-right"
            />
          </div>
        </div>

        {!isExpanded && values[0] && (
          <Button
            variant="outline"
            size="sm"
            onClick={copyToAll}
            className="w-full"
          >
            <Copy className="h-4 w-4 mr-2" />
            Auf alle 12 Monate uebertragen
          </Button>
        )}
      </div>

      {/* Toggle fuer alle Monate */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-center gap-2 w-full py-2 text-sm text-primary hover:text-primary/80"
      >
        {isExpanded ? (
          <>
            <ChevronUp className="h-4 w-4" />
            Weniger anzeigen
          </>
        ) : (
          <>
            <ChevronDown className="h-4 w-4" />
            Alle 12 Monate einzeln eingeben
          </>
        )}
      </button>

      {/* Alle Monate (expandiert) */}
      {isExpanded && (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {monthLabels.slice(1).map((label, idx) => (
            <div key={idx + 1} className="flex items-center gap-2">
              <span className="text-sm text-gray-500 w-32 truncate">
                {label}:
              </span>
              <div className="relative flex-1">
                <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatValue(values[idx + 1])}
                  onChange={(e) => updateValue(idx + 1, e.target.value)}
                  placeholder="0"
                  className="pl-10 text-right"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <Button
        onClick={handleSubmit}
        disabled={!isValid}
        className="w-full"
        size="lg"
      >
        Bestaetigen
      </Button>
    </div>
  )
}
```

### 3.2.4 PersonSelector.tsx

Fuer Auswahl "Fuer wen starten?" (Mutter/Partner).

```typescript
// eltern-kompass/components/berater/PersonSelector.tsx
'use client'

import { User, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PersonSelectorProps {
  onSelect: (person: 'mutter' | 'partner') => void
  motherName?: string
  partnerName?: string
  hasPartner: boolean
}

export function PersonSelector({
  onSelect,
  motherName = 'Mutter',
  partnerName = 'Partner',
  hasPartner
}: PersonSelectorProps) {
  return (
    <div className="space-y-4">
      <p className="text-center text-gray-600">
        Fuer wen moechtest du die Beratung starten?
      </p>

      <div className="grid grid-cols-1 gap-3">
        {/* Mutter */}
        <button
          onClick={() => onSelect('mutter')}
          className={cn(
            "flex items-center gap-4 p-4 rounded-xl border-2",
            "transition-all duration-200",
            "hover:border-primary hover:bg-primary/5",
            "border-gray-200"
          )}
        >
          <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center">
            <User className="h-6 w-6 text-pink-600" />
          </div>
          <div className="text-left">
            <p className="font-medium text-gray-900">{motherName}</p>
            <p className="text-sm text-gray-500">Geburtsmutter / Schwangere</p>
          </div>
        </button>

        {/* Partner (nur wenn vorhanden) */}
        {hasPartner && (
          <button
            onClick={() => onSelect('partner')}
            className={cn(
              "flex items-center gap-4 p-4 rounded-xl border-2",
              "transition-all duration-200",
              "hover:border-primary hover:bg-primary/5",
              "border-gray-200"
            )}
          >
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="font-medium text-gray-900">{partnerName}</p>
              <p className="text-sm text-gray-500">Partner/in</p>
            </div>
          </button>
        )}
      </div>

      {hasPartner && (
        <p className="text-xs text-center text-gray-400">
          Nach Abschluss kannst du die Beratung fuer die andere Person starten
        </p>
      )}
    </div>
  )
}
```

### 3.2.5 DualSliderInput.tsx

Fuer Kombinations-Aufteilung Basiselterngeld/ElterngeldPlus (Q71b_kombination).

```typescript
// eltern-kompass/components/berater/inputs/DualSliderInput.tsx
'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface SliderConfig {
  label: string
  min: number
  max: number
  unit?: string
  color?: string
}

interface DualSliderInputProps {
  slider1: SliderConfig
  slider2: SliderConfig
  constraint?: 'equal' | 'linked'  // 'linked': slider2 = slider1 * 2
  onSubmit: (values: { slider1: number; slider2: number }) => void
}

export function DualSliderInput({
  slider1,
  slider2,
  constraint,
  onSubmit
}: DualSliderInputProps) {
  const [value1, setValue1] = useState(slider1.min)
  const [value2, setValue2] = useState(slider2.min)

  // Bei 'linked' constraint: 1 Basis = 2 Plus
  useEffect(() => {
    if (constraint === 'linked') {
      setValue2(value1 * 2)
    }
  }, [value1, constraint])

  const handleSubmit = () => {
    onSubmit({ slider1: value1, slider2: value2 })
  }

  return (
    <div className="w-full space-y-6">
      {/* Slider 1 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{slider1.label}</span>
          <span className="text-lg font-bold text-primary">
            {value1} {slider1.unit || 'Monate'}
          </span>
        </div>
        <Slider
          value={[value1]}
          min={slider1.min}
          max={slider1.max}
          step={1}
          onValueChange={([v]) => setValue1(v)}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{slider1.min} {slider1.unit}</span>
          <span>{slider1.max} {slider1.unit}</span>
        </div>
      </div>

      {/* Verbindungs-Indikator */}
      {constraint === 'linked' && (
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <div className="h-px flex-1 bg-gray-200" />
          <span>1 Basis = 2 Plus</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>
      )}

      {/* Slider 2 */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-gray-700">{slider2.label}</span>
          <span className={cn(
            "text-lg font-bold",
            constraint === 'linked' ? "text-gray-400" : "text-primary"
          )}>
            {value2} {slider2.unit || 'Monate'}
          </span>
        </div>
        <Slider
          value={[value2]}
          min={slider2.min}
          max={slider2.max}
          step={1}
          onValueChange={([v]) => setValue2(v)}
          disabled={constraint === 'linked'}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-400">
          <span>{slider2.min} {slider2.unit}</span>
          <span>{slider2.max} {slider2.unit}</span>
        </div>
      </div>

      {/* Zusammenfassung */}
      <div className="p-4 rounded-xl bg-gray-50 border">
        <p className="text-sm text-gray-500 text-center">
          Gesamt: {value1} Monate Basis + {value2} Monate Plus = {value1 + value2} Monate Bezug
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full"
        size="lg"
      >
        Bestaetigen
      </Button>
    </div>
  )
}
```

### 3.2.6 MonthSelectInput.tsx

Fuer Auswahl von Monaten im Bemessungszeitraum (Q55b_ausklammerung_monate).

```typescript
// eltern-kompass/components/berater/inputs/MonthSelectInput.tsx
'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MonthSelectInputProps {
  onSubmit: (months: string[]) => void
  referenceDate?: Date  // Bezugsdatum (Geburtstermin)
  monthsBack?: number   // Anzahl Monate zurueck (default: 12)
}

const MONTH_NAMES_SHORT = [
  'Jan', 'Feb', 'Mrz', 'Apr', 'Mai', 'Jun',
  'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'
]

export function MonthSelectInput({
  onSubmit,
  referenceDate,
  monthsBack = 12
}: MonthSelectInputProps) {
  const [selected, setSelected] = useState<string[]>([])

  // Generiere Monate basierend auf Referenzdatum
  const months = useMemo(() => {
    const ref = referenceDate || new Date()
    const result: { key: string; label: string; year: number }[] = []

    for (let i = monthsBack; i > 0; i--) {
      const date = new Date(ref)
      date.setMonth(date.getMonth() - i)
      const monthIdx = date.getMonth()
      const year = date.getFullYear()
      result.push({
        key: `${year}-${String(monthIdx + 1).padStart(2, '0')}`,
        label: MONTH_NAMES_SHORT[monthIdx],
        year
      })
    }

    return result
  }, [referenceDate, monthsBack])

  // Gruppiere nach Jahr
  const groupedByYear = useMemo(() => {
    const groups: Record<number, typeof months> = {}
    months.forEach(m => {
      if (!groups[m.year]) groups[m.year] = []
      groups[m.year].push(m)
    })
    return groups
  }, [months])

  const toggleMonth = (key: string) => {
    setSelected(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const handleSubmit = () => {
    if (selected.length === 0) return
    onSubmit(selected)
  }

  return (
    <div className="w-full space-y-4">
      {Object.entries(groupedByYear).map(([year, yearMonths]) => (
        <div key={year} className="space-y-2">
          <p className="text-sm font-medium text-gray-500">{year}</p>
          <div className="grid grid-cols-4 gap-2">
            {yearMonths.map(month => {
              const isSelected = selected.includes(month.key)
              return (
                <button
                  key={month.key}
                  onClick={() => toggleMonth(month.key)}
                  className={cn(
                    "relative py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all",
                    isSelected
                      ? "border-primary bg-primary text-white"
                      : "border-gray-200 hover:border-primary/50"
                  )}
                >
                  {month.label}
                  {isSelected && (
                    <Check className="absolute -top-1 -right-1 h-4 w-4 bg-primary rounded-full p-0.5" />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      ))}

      <Button
        onClick={handleSubmit}
        disabled={selected.length === 0}
        className="w-full"
        size="lg"
      >
        {selected.length} Monat{selected.length !== 1 ? 'e' : ''} ausgewaehlt
      </Button>
    </div>
  )
}
```

---

## 3.3 Fehlende Fragen (Phase 4-8)

### Erweiterte Types

Zunaechst muessen die Types erweitert werden:

```typescript
// In eltern-kompass/lib/berater/types.ts - Ergaenzungen

export type InputType =
  | 'buttons'           // Auswahl-Bubbles
  | 'slider'            // Schieberegler
  | 'currency'          // Geld-Betrag
  | 'date'              // Datum
  | 'select'            // Dropdown
  | 'text'              // Freitext
  | 'multiselect'       // Mehrfachauswahl
  | 'multi_date'        // Mehrere Daten
  | 'monthly_currency'  // 12-Monats-Eingabe
  | 'month_select'      // Monate auswaehlen
  | 'dual_slider'       // Zwei gekoppelte Slider
  | 'person_select'     // Mutter/Partner Auswahl

export interface DualSliderConfig {
  slider1: {
    label: string
    min: number
    max: number
    unit?: string
  }
  slider2: {
    label: string
    min: number
    max: number
    unit?: string
  }
  constraint?: 'linked'  // slider2 = slider1 * 2
}

export interface Question {
  id: string
  phase: number
  text: string
  subtext?: string
  inputType: InputType
  options?: Option[]
  sliderConfig?: SliderConfig
  dualSliderConfig?: DualSliderConfig
  validation?: {
    min?: number
    max?: number
    required?: boolean
    minSelect?: number
    maxSelect?: number
  }
  condition?: (answers: Record<string, unknown>) => boolean
  next: string | ((answer: unknown, answers: Record<string, unknown>) => string)
  // Prefill
  prefillKey?: string
  prefillLabel?: string
  prefillFormat?: (value: unknown) => string
  // BEEG-Referenz (fuer Dokumentation)
  beegRef?: string  // z.B. "SS2c Abs. 1 S. 2"
}
```

### Vollstaendige Fragen-Definition Phase 4-8

```typescript
// eltern-kompass/lib/berater/questions.ts - VOLLSTAENDIGE ERGAENZUNG

// =============================================================================
// PHASE 4: BESCHAEFTIGUNG (Pro Person) - SS2c, SS2d BEEG
// =============================================================================

// Q20_beschaeftigung existiert bereits als Platzhalter - hier vollstaendig:

// ── ANGESTELLTE (SS2c BEEG) ──

{
  id: 'Q21_brutto',
  phase: 4,
  text: 'Wie hoch ist dein aktuelles monatliches Bruttogehalt?',
  subtext: 'Ohne Sonderzahlungen wie Weihnachtsgeld oder Boni',
  inputType: 'currency',
  validation: { min: 0, max: 50000 },
  beegRef: 'SS2c Abs. 1',
  next: 'Q22_gehalt_konstant'
},
{
  id: 'Q22_gehalt_konstant',
  phase: 4,
  text: 'War dein Gehalt in den letzten 12 Monaten konstant?',
  subtext: 'Bei Gehaltserhoehungen oder variablem Einkommen brauchen wir die einzelnen Monate',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja, konstant' },
    { value: 'nein', label: 'Nein, hat sich veraendert' }
  ],
  beegRef: 'SS2b Abs. 1',
  next: (answer) => answer === 'nein' ? 'Q22b_gehalt_monate' : 'Q23_sonderzahlungen'
},
{
  id: 'Q22b_gehalt_monate',
  phase: 4,
  text: 'Bitte gib dein Bruttogehalt fuer jeden der letzten 12 Monate an:',
  subtext: 'Oder lade deine Lohnabrechnungen hoch fuer automatische Erkennung',
  inputType: 'monthly_currency',
  validation: { required: true },
  beegRef: 'SS2b Abs. 1',
  next: 'Q23_sonderzahlungen'
},
{
  id: 'Q23_sonderzahlungen',
  phase: 4,
  text: 'Hast du in den letzten 12 Monaten Sonderzahlungen erhalten?',
  subtext: 'WICHTIG: Weihnachtsgeld, 13. Gehalt, Boni werden NICHT fuer Elterngeld beruecksichtigt!',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja' },
    { value: 'nein', label: 'Nein' }
  ],
  beegRef: 'SS2c Abs. 1 S. 2 - sonstige Bezuege ausgeschlossen',
  next: (answer) => answer === 'ja' ? 'Q23b_sonderzahlungen_art' : 'Q24_steuerklasse'
},
{
  id: 'Q23b_sonderzahlungen_art',
  phase: 4,
  text: 'Welche Sonderzahlungen hast du erhalten?',
  subtext: 'Diese muessen vom Brutto abgezogen werden!',
  inputType: 'multiselect',
  options: [
    { value: 'weihnachtsgeld', label: 'Weihnachtsgeld' },
    { value: '13_gehalt', label: '13. Monatsgehalt' },
    { value: 'urlaubsgeld', label: 'Urlaubsgeld (Einmalzahlung)' },
    { value: 'praemie', label: 'Praemien / Boni' },
    { value: 'tantieme', label: 'Tantieme' },
    { value: 'provision', label: 'Provisionen (einmalig)' },
    { value: 'abfindung', label: 'Abfindung' }
  ],
  beegRef: 'SS2c Abs. 1 S. 2',
  next: 'Q23c_sonderzahlungen_betrag'
},
{
  id: 'Q23c_sonderzahlungen_betrag',
  phase: 4,
  text: 'Wie hoch waren die Sonderzahlungen insgesamt im Jahr?',
  inputType: 'currency',
  validation: { min: 0 },
  beegRef: 'SS2c Abs. 1 S. 2',
  next: 'Q24_steuerklasse'
},
{
  id: 'Q24_steuerklasse',
  phase: 4,
  text: 'Welche Steuerklasse hast du aktuell?',
  subtext: 'Steuerklasse VI (Zweitjob) wird NICHT beruecksichtigt!',
  inputType: 'buttons',
  options: [
    { value: '1', label: 'I - Ledig' },
    { value: '2', label: 'II - Alleinerziehend' },
    { value: '3', label: 'III - Verheiratet (hoeher verdienend)' },
    { value: '4', label: 'IV - Verheiratet (gleich)' },
    { value: '5', label: 'V - Verheiratet (geringer verdienend)' }
  ],
  beegRef: 'SS2e Abs. 3 - Steuerklasse VI ausgeschlossen',
  next: 'Q24b_steuerklasse_gewechselt'
},
{
  id: 'Q24b_steuerklasse_gewechselt',
  phase: 4,
  text: 'Hast du die Steuerklasse in den letzten 12 Monaten gewechselt?',
  subtext: 'Wechsel muss 7 Monate VOR Ende des Bemessungszeitraums erfolgt sein!',
  inputType: 'buttons',
  options: [
    { value: 'nein', label: 'Nein' },
    { value: 'ja', label: 'Ja, gewechselt' }
  ],
  beegRef: 'SS2e Abs. 3 - 7-Monats-Frist',
  next: (answer) => answer === 'ja' ? 'Q24c_wechsel_datum' : 'Q25_kirchensteuer'
},
{
  id: 'Q24c_wechsel_datum',
  phase: 4,
  text: 'Wann hast du die Steuerklasse gewechselt?',
  inputType: 'date',
  validation: { required: true },
  beegRef: 'SS2e Abs. 3',
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
  beegRef: 'SS2e Abs. 3',
  next: 'STEUERKLASSEN_CHECK'
},
{
  id: 'STEUERKLASSEN_CHECK',
  phase: 4,
  text: 'Steuerklassen-Analyse',
  // Diese Frage zeigt dynamisch an, ob der Wechsel rechtzeitig war
  inputType: 'buttons',
  options: [
    { value: 'weiter', label: 'Verstanden, weiter' }
  ],
  condition: (answers) => !!answers.Q24c_wechsel_datum,
  // Wird dynamisch mit Warnung gefuellt wenn Wechsel zu spaet
  next: 'Q25_kirchensteuer'
},
{
  id: 'Q25_kirchensteuer',
  phase: 4,
  text: 'Bist du kirchensteuerpflichtig?',
  subtext: 'BEEG rechnet einheitlich mit 8% Kirchensteuer (nicht 9%)',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja' },
    { value: 'nein', label: 'Nein' }
  ],
  beegRef: 'SS2e Abs. 5 - einheitlich 8%',
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
  subtext: 'Pauschal versteuerter Minijob und Steuerklasse VI werden NICHT beruecksichtigt.',
  inputType: 'buttons',
  options: [
    { value: 'minijob_pauschal', label: 'Minijob (pauschal versteuert)' },
    { value: 'steuerklasse_6', label: 'Steuerklasse VI' }
  ],
  beegRef: 'SS2e Abs. 3',
  next: 'Q27_sozialversicherung'
},
{
  id: 'Q27_sozialversicherung',
  phase: 4,
  text: 'Wie bist du krankenversichert?',
  subtext: 'GKV: Pauschale 9% KV/PV + 10% RV + 2% AV = 21% gesamt',
  inputType: 'buttons',
  options: [
    { value: 'gkv', label: 'Gesetzlich (GKV)' },
    { value: 'pkv', label: 'Privat (PKV)' }
  ],
  beegRef: 'SS2f Abs. 1 - 21% Sozialabgaben-Pauschale',
  next: (answer, answers) => {
    if (answer === 'pkv') return 'Q27b_rentenversicherung'
    const brutto = Number(answers.Q21_brutto) || 0
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
  beegRef: 'SS2f Abs. 1',
  next: (_, answers) => {
    const brutto = Number(answers.Q21_brutto) || 0
    if (brutto > 538 && brutto <= 2000) return 'Q28_midijob_check'
    return 'Q55_ausklammerung'
  }
},
{
  id: 'Q28_midijob_check',
  phase: 4,
  text: 'Du bist im Uebergangsbereich (Midijob, 538-2.000 EUR).',
  subtext: 'Im Uebergangsbereich zahlen Arbeitnehmer reduzierte Beitraege. Diese werden fuer Elterngeld verwendet!',
  inputType: 'buttons',
  options: [
    { value: 'standard', label: 'Normale Abzuege lt. Lohnabrechnung' },
    { value: 'reduziert', label: 'Reduzierte Midijob-Abzuege' },
    { value: 'weiss_nicht', label: 'Weiss nicht' }
  ],
  beegRef: 'SS2f Abs. 2 S. 3 - Uebergangsbereich',
  next: 'Q55_ausklammerung'
},

// ── SELBSTAENDIGE (SS2d BEEG) ──

{
  id: 'Q30_selbstaendig_art',
  phase: 4,
  text: 'Welche Art von Selbstaendigkeit uebst du aus?',
  subtext: 'Wichtig fuer die Gewinnermittlung',
  inputType: 'buttons',
  options: [
    { value: 'freiberuflich', label: 'Freiberuflich (SS18 EStG)', description: 'z.B. Arzt, Anwalt, Kuenstler, Berater' },
    { value: 'gewerbe', label: 'Gewerbetreibend (SS15 EStG)', description: 'z.B. Handwerker, Haendler, Gastro' },
    { value: 'landwirtschaft', label: 'Land- und Forstwirtschaft (SS13 EStG)' }
  ],
  beegRef: 'SS2d Abs. 1',
  next: 'Q31_steuerbescheid'
},
{
  id: 'Q31_steuerbescheid',
  phase: 4,
  text: 'Liegt ein Steuerbescheid fuer das Vorjahr vor?',
  subtext: 'Der Gewinn aus dem Steuerbescheid ist Grundlage der Berechnung',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja, Steuerbescheid vorhanden' },
    { value: 'nein', label: 'Nein, noch nicht' }
  ],
  beegRef: 'SS2d Abs. 2',
  next: (answer) => answer === 'ja' ? 'Q31b_gewinn' : 'Q31d_schaetzung'
},
{
  id: 'Q31b_gewinn',
  phase: 4,
  text: 'Wie hoch war dein Gewinn laut Steuerbescheid?',
  subtext: 'Einkuenfte aus selbstaendiger Arbeit / Gewerbebetrieb',
  inputType: 'currency',
  validation: { min: 0 },
  beegRef: 'SS2d Abs. 2',
  next: 'Q31c_jahr'
},
{
  id: 'Q31c_jahr',
  phase: 4,
  text: 'Fuer welches Jahr ist der Steuerbescheid?',
  inputType: 'select',
  options: [
    { value: '2026', label: '2026' },
    { value: '2025', label: '2025' },
    { value: '2024', label: '2024' },
    { value: '2023', label: '2023' }
  ],
  beegRef: 'SS2d Abs. 2',
  next: 'Q32_voraussichtlich'
},
{
  id: 'Q31d_schaetzung',
  phase: 4,
  text: 'Wie hoch schaetzt du deinen Jahresgewinn?',
  subtext: 'Einnahmen minus Betriebsausgaben. Pauschale: 25% der Einnahmen',
  inputType: 'currency',
  validation: { min: 0 },
  beegRef: 'SS2d Abs. 3 - Betriebsausgaben-Pauschale 25%',
  next: 'Q32_voraussichtlich'
},
{
  id: 'Q32_voraussichtlich',
  phase: 4,
  text: 'Wie hoch wird dein voraussichtlicher Gewinn im Jahr vor der Geburt sein?',
  subtext: 'Bei Abweichung vom Vorjahr kann ein anderer Betrag angesetzt werden',
  inputType: 'currency',
  validation: { min: 0 },
  beegRef: 'SS2d Abs. 3',
  next: 'Q33_kirchensteuer_selbst'
},
{
  id: 'Q33_kirchensteuer_selbst',
  phase: 4,
  text: 'Bist du kirchensteuerpflichtig?',
  subtext: 'BEEG rechnet einheitlich mit 8% Kirchensteuer',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja' },
    { value: 'nein', label: 'Nein' }
  ],
  beegRef: 'SS2e Abs. 5',
  next: 'Q34_sv_selbst'
},
{
  id: 'Q34_sv_selbst',
  phase: 4,
  text: 'Wie bist du sozialversichert?',
  subtext: 'Selbstaendige: Nur tatsaechliche Pflichtbeitraege werden beruecksichtigt',
  inputType: 'buttons',
  options: [
    { value: 'gkv_freiwillig', label: 'GKV freiwillig versichert' },
    { value: 'pkv', label: 'Privat versichert (PKV)' },
    { value: 'ksk', label: 'Kuenstlersozialkasse (KSK)' }
  ],
  beegRef: 'SS2f',
  next: 'Q34b_rv_selbst'
},
{
  id: 'Q34b_rv_selbst',
  phase: 4,
  text: 'Bist du rentenversicherungspflichtig?',
  subtext: 'Z.B. Handwerker, Kuenstler/Publizisten (KSK), Lehrer, Hebammen',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja, pflichtversichert' },
    { value: 'nein', label: 'Nein' }
  ],
  beegRef: 'SS2f',
  next: 'Q35_av_selbst'
},
{
  id: 'Q35_av_selbst',
  phase: 4,
  text: 'Bist du freiwillig arbeitslosenversichert?',
  subtext: 'Freiwillige Arbeitslosenversicherung = 2% Pauschale',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja' },
    { value: 'nein', label: 'Nein' }
  ],
  beegRef: 'SS2f',
  next: 'Q55_ausklammerung'
},

// ── BEAMTE (SS2f - KEINE Sozialabgaben) ──

{
  id: 'Q40_dienstbezuege',
  phase: 4,
  text: 'Wie hoch sind deine monatlichen Brutto-Dienstbezuege?',
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
    { value: '3', label: 'III - Verheiratet (hoeher verdienend)' },
    { value: '4', label: 'IV - Verheiratet (gleich)' },
    { value: '5', label: 'V - Verheiratet (geringer verdienend)' }
  ],
  beegRef: 'SS2e Abs. 3',
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
  beegRef: 'SS2e Abs. 5',
  next: 'Q43_beihilfe'
},
{
  id: 'Q43_beihilfe',
  phase: 4,
  text: 'Hast du Beihilfeanspruch und PKV?',
  subtext: 'WICHTIG: Beamte zahlen KEINE Sozialabgaben - daher keine Pauschale!',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja, Beihilfe + PKV' },
    { value: 'nein', label: 'Nein, GKV' }
  ],
  beegRef: 'SS2f - keine Sozialabgaben bei Beamten',
  next: 'Q55_ausklammerung'
},

// ── MINIJOB (SS2f Abs. 2 - nicht SV-pflichtig) ──

{
  id: 'Q45_minijob_betrag',
  phase: 4,
  text: 'Wie hoch ist dein monatlicher Minijob-Verdienst?',
  subtext: 'Minijobs bis 538 EUR/Monat sind nicht sozialversicherungspflichtig',
  inputType: 'currency',
  validation: { min: 0, max: 538 },
  beegRef: 'SS2f Abs. 2',
  next: 'Q46_weitere_einkuenfte'
},
{
  id: 'Q46_weitere_einkuenfte',
  phase: 4,
  text: 'Hast du neben dem Minijob weitere Einkuenfte?',
  subtext: 'Z.B. Hauptjob, Selbstaendigkeit',
  inputType: 'buttons',
  options: [
    { value: 'angestellt', label: 'Ja, Hauptjob (angestellt)' },
    { value: 'selbstaendig', label: 'Ja, Selbstaendigkeit' },
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

// ── NICHT ERWERBSTAETIG ──

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
  subtext: 'ALG I wird teilweise auf Elterngeld angerechnet. Der Mindestbetrag von 300 EUR bleibt frei.',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja, ALG I' },
    { value: 'nein', label: 'Nein (ALG II / Buergergeld / kein Bezug)' }
  ],
  beegRef: 'SS3 Abs. 1 Nr. 5 - ALG I Anrechnung',
  next: (answer) => answer === 'ja' ? 'Q50c_alg_betrag' : 'Q55_ausklammerung'
},
{
  id: 'Q50c_alg_betrag',
  phase: 4,
  text: 'Wie hoch ist dein monatliches Arbeitslosengeld I?',
  inputType: 'currency',
  validation: { min: 0 },
  beegRef: 'SS3 Abs. 1 Nr. 5',
  next: 'Q55_ausklammerung'
},

// =============================================================================
// PHASE 5: AUSKLAMMERBARE MONATE (SS2b Abs. 1 S. 2 BEEG)
// =============================================================================

{
  id: 'Q55_ausklammerung',
  phase: 5,
  text: 'Hattest du im Bemessungszeitraum (letzte 12 Monate) eines der folgenden?',
  subtext: 'Diese Monate koennen ausgeklammert und durch fruehere ersetzt werden!',
  inputType: 'multiselect',
  options: [
    { value: 'elterngeld', label: 'Elterngeld fuer aelteres Kind bezogen' },
    { value: 'mutterschutz', label: 'Mutterschutz fuer aelteres Kind' },
    { value: 'krankheit', label: 'Schwangerschaftsbedingte Krankheit' },
    { value: 'wehrdienst', label: 'Wehrdienst / Zivildienst' },
    { value: 'nichts', label: 'Nichts davon' }
  ],
  beegRef: 'SS2b Abs. 1 S. 2 - Ausklammerung',
  next: (answer) => {
    const arr = answer as string[]
    if (arr.includes('nichts') || arr.length === 0) {
      return 'Q60_mutterschaftsgeld'
    }
    return 'Q55b_ausklammerung_monate'
  }
},
{
  id: 'Q55b_ausklammerung_monate',
  phase: 5,
  text: 'In welchen Monaten war das?',
  subtext: 'Waehle alle betroffenen Monate aus. Diese werden durch fruehere Monate ersetzt.',
  inputType: 'month_select',
  validation: { required: true },
  beegRef: 'SS2b Abs. 1 S. 2',
  next: 'Q60_mutterschaftsgeld'
},

// =============================================================================
// PHASE 6: MUTTERSCHAFTSGELD (nur Mutter) (SS3 Abs. 1 BEEG)
// =============================================================================

{
  id: 'Q60_mutterschaftsgeld',
  phase: 6,
  text: 'Hast du Anspruch auf Mutterschaftsgeld?',
  subtext: 'GKV-Versicherte: max. 13 EUR/Tag von der Krankenkasse',
  inputType: 'buttons',
  options: [
    { value: 'ja_gkv', label: 'Ja (GKV-versichert)' },
    { value: 'ja_pkv', label: 'Ja, aber PKV (210 EUR Einmalzahlung)' },
    { value: 'nein', label: 'Nein / Weiss nicht' }
  ],
  condition: (answers) => answers.currentPerson === 'mutter',
  beegRef: 'SS3 Abs. 1',
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
  subtext: 'Maximum: 13 EUR/Tag (ca. 390 EUR/Monat)',
  inputType: 'currency',
  validation: { min: 0, max: 13 },
  beegRef: 'SS3 Abs. 1',
  next: 'Q60c_arbeitgeber_zuschuss'
},
{
  id: 'Q60c_arbeitgeber_zuschuss',
  phase: 6,
  text: 'Bekommst du einen Arbeitgeber-Zuschuss zum Mutterschaftsgeld?',
  subtext: 'WICHTIG: Mutterschaftsgeld + AG-Zuschuss werden VOLL auf Elterngeld angerechnet (kein Sockelbetrag!)',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja' },
    { value: 'nein', label: 'Nein (z.B. arbeitslos)' }
  ],
  beegRef: 'SS3 Abs. 1 Nr. 1 - volle Anrechnung',
  next: 'Q60d_weitere_anrechnungen'
},
{
  id: 'Q60d_weitere_anrechnungen',
  phase: 6,
  text: 'Beziehst du weitere Lohnersatzleistungen?',
  subtext: 'Diese werden teilweise angerechnet (300 EUR Sockelbetrag bleibt frei)',
  inputType: 'multiselect',
  options: [
    { value: 'krankengeld', label: 'Krankengeld' },
    { value: 'alg1', label: 'Arbeitslosengeld I' },
    { value: 'verletztengeld', label: 'Verletztengeld' },
    { value: 'uebergangsgeld', label: 'Uebergangsgeld' },
    { value: 'nichts', label: 'Nichts davon' }
  ],
  beegRef: 'SS3 Abs. 1 Nr. 5 - Anrechnung mit 300 EUR Sockelbetrag',
  next: 'Q70_elternzeit'
},

// =============================================================================
// PHASE 7: ELTERNZEIT-PLANUNG (SS4, SS4a, SS4b BEEG)
// =============================================================================

{
  id: 'Q70_elternzeit',
  phase: 7,
  text: 'Wie viele Monate Elternzeit planst du?',
  inputType: 'slider',
  sliderConfig: { min: 0, max: 36, default: 12, step: 1, unit: 'Monate' },
  beegRef: 'SS4',
  next: 'Q71_elterngeld_variante'
},
{
  id: 'Q71_elterngeld_variante',
  phase: 7,
  text: 'Welche Elterngeld-Variante moechtest du nutzen?',
  subtext: 'Basiselterngeld: max 1.800 EUR, bis 14 Monate | ElterngeldPlus: max 900 EUR, doppelte Dauer',
  inputType: 'buttons',
  options: [
    { value: 'basis', label: 'Nur Basiselterngeld', description: 'Max. 14 Monate (Paar), 12 pro Person' },
    { value: 'plus', label: 'Nur ElterngeldPlus', description: 'Doppelte Dauer, halber Betrag' },
    { value: 'kombi', label: 'Kombination', description: '1 Monat Basis = 2 Monate Plus' }
  ],
  beegRef: 'SS4a - Basiselterngeld vs. ElterngeldPlus',
  next: (answer) => answer === 'kombi' ? 'Q71b_kombination' : 'Q72_teilzeit'
},
{
  id: 'Q71b_kombination',
  phase: 7,
  text: 'Wie moechtest du aufteilen?',
  subtext: '1 Monat Basiselterngeld = 2 Monate ElterngeldPlus',
  inputType: 'dual_slider',
  dualSliderConfig: {
    slider1: { label: 'Basiselterngeld', min: 0, max: 12, unit: 'Monate' },
    slider2: { label: 'ElterngeldPlus', min: 0, max: 24, unit: 'Monate' },
    constraint: 'linked'
  },
  beegRef: 'SS4a Abs. 1',
  next: 'Q72_teilzeit'
},
{
  id: 'Q72_teilzeit',
  phase: 7,
  text: 'Planst du waehrend der Elternzeit in Teilzeit zu arbeiten?',
  subtext: 'Max. 32 Stunden/Woche fuer Elterngeld-Anspruch',
  inputType: 'buttons',
  options: [
    { value: 'nein', label: 'Nein, komplett pausieren' },
    { value: 'ja', label: 'Ja, Teilzeit' }
  ],
  beegRef: 'SS1 Abs. 6 - max. 32 Stunden/Woche',
  next: (answer) => answer === 'ja' ? 'Q72b_teilzeit_stunden' : 'Q73_gleichzeitig'
},
{
  id: 'Q72b_teilzeit_stunden',
  phase: 7,
  text: 'Wie viele Stunden pro Woche planst du zu arbeiten?',
  subtext: 'Max. 32 Stunden im Monatsdurchschnitt',
  inputType: 'slider',
  sliderConfig: { min: 1, max: 32, default: 20, step: 1, unit: 'Std/Woche' },
  beegRef: 'SS1 Abs. 6',
  next: 'Q72c_teilzeit_netto'
},
{
  id: 'Q72c_teilzeit_netto',
  phase: 7,
  text: 'Wie hoch wird dein monatliches Netto in Teilzeit sein?',
  subtext: 'Bei Einkommen im Bezug: Vorgeburt-Einkommen wird auf 2.770 EUR gedeckelt',
  inputType: 'currency',
  validation: { min: 0 },
  beegRef: 'SS2 Abs. 3 - Deckelung 2.770 EUR bei Teilzeit',
  next: 'Q73_gleichzeitig'
},
{
  id: 'Q73_gleichzeitig',
  phase: 7,
  text: 'Plant ihr gleichzeitig Elterngeld zu beziehen?',
  subtext: 'Basiselterngeld gleichzeitig nur in EINEM Monat erlaubt! Ausnahme: Mehrlinge, Fruehgeburt',
  inputType: 'buttons',
  options: [
    { value: 'nein', label: 'Nein, nacheinander' },
    { value: 'ja', label: 'Ja, gleichzeitig' }
  ],
  condition: (answers) => answers.Q8_partner === 'ja',
  beegRef: 'SS4 Abs. 6 - gleichzeitiger Bezug',
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
  subtext: 'Nur 1 Monat erlaubt (ausser bei Mehrlinge/Fruehgeburt)',
  inputType: 'slider',
  sliderConfig: { min: 1, max: 14, default: 1, step: 1, unit: '. Lebensmonat' },
  beegRef: 'SS4 Abs. 6',
  next: 'Q74_partnerschaftsbonus'
},
{
  id: 'Q74_partnerschaftsbonus',
  phase: 7,
  text: 'Interessiert euch der Partnerschaftsbonus?',
  subtext: '2-4 zusaetzliche Monate ElterngeldPlus, wenn BEIDE gleichzeitig 24-32 Std/Woche arbeiten',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja, interessiert uns' },
    { value: 'nein', label: 'Nein / Nicht relevant' }
  ],
  condition: (answers) => answers.Q8_partner === 'ja',
  beegRef: 'SS4b - Partnerschaftsbonus',
  next: (answer) => answer === 'ja' ? 'Q74b_partnerschaftsbonus_moeglich' : 'FERTIG_PERSON'
},
{
  id: 'Q74b_partnerschaftsbonus_moeglich',
  phase: 7,
  text: 'Koennten beide Elternteile gleichzeitig 24-32 Stunden/Woche arbeiten?',
  subtext: 'Voraussetzung: Beide muessen im gleichen Zeitraum Teilzeit arbeiten',
  inputType: 'buttons',
  options: [
    { value: 'ja', label: 'Ja, ist moeglich' },
    { value: 'nein', label: 'Nein, nicht machbar' }
  ],
  beegRef: 'SS4b',
  next: 'FERTIG_PERSON'
},

// ── UEBERGANGSFRAGEN ──

{
  id: 'FERTIG_PERSON',
  phase: 7,
  text: 'Daten fuer diese Person erfasst!',
  subtext: 'Moechtest du nun die Daten fuer die andere Person erfassen?',
  inputType: 'buttons',
  options: [
    { value: 'naechste_person', label: 'Weiter mit Partner/in' },
    { value: 'berechnung', label: 'Zur Berechnung' }
  ],
  condition: (answers) => answers.Q8_partner === 'ja' && !answers.bothPersonsComplete,
  next: (answer) => answer === 'naechste_person' ? 'PERSON_WECHSEL' : 'OPTIMIERUNG_START'
},
{
  id: 'PERSON_WECHSEL',
  phase: 7,
  text: 'Jetzt erfassen wir die Daten fuer den/die Partner/in.',
  subtext: 'Die gemeinsamen Fragen (Grundsituation, Geschwister) wurden bereits beantwortet.',
  inputType: 'buttons',
  options: [
    { value: 'start', label: 'Starten' }
  ],
  // Setzt currentPerson auf 'partner' und springt zu Q20_beschaeftigung
  next: 'Q20_beschaeftigung'
},

// =============================================================================
// PHASE 8: OPTIMIERUNG (nach beiden Personen)
// =============================================================================

{
  id: 'OPTIMIERUNG_START',
  phase: 8,
  text: 'Optimierungsanalyse',
  subtext: 'Basierend auf deinen Angaben analysieren wir jetzt die besten Strategien.',
  inputType: 'buttons',
  options: [
    { value: 'start', label: 'Analyse starten' }
  ],
  next: 'OPT1_steuerklassen'
},
{
  id: 'OPT1_steuerklassen',
  phase: 8,
  text: 'Steuerklassen-Optimierung',
  // Dieser Text wird dynamisch basierend auf den Antworten generiert
  // z.B. "Mit Wechsel von IV/IV zu III/V: +320 EUR mehr Elterngeld pro Monat"
  subtext: 'Pruefung ob ein Steuerklassenwechsel noch moeglich und sinnvoll ist',
  inputType: 'buttons',
  options: [
    { value: 'weiter', label: 'Verstanden, weiter' }
  ],
  beegRef: 'SS2e Abs. 3 - 7-Monats-Frist',
  next: 'OPT2_basis_vs_plus'
},
{
  id: 'OPT2_basis_vs_plus',
  phase: 8,
  text: 'Basiselterngeld vs. ElterngeldPlus',
  // Dynamisch: Berechnung beider Varianten und Vergleich
  subtext: 'Vergleich der Gesamtsumme bei verschiedenen Varianten',
  inputType: 'buttons',
  options: [
    { value: 'weiter', label: 'Verstanden, weiter' }
  ],
  beegRef: 'SS4a',
  next: 'OPT3_partnerschaftsbonus'
},
{
  id: 'OPT3_partnerschaftsbonus',
  phase: 8,
  text: 'Partnerschaftsbonus-Potenzial',
  // Dynamisch: Pruefung ob beide 24-32h arbeiten koennten
  subtext: 'Zusaetzliche Monate ElterngeldPlus bei gleichzeitiger Teilzeit',
  inputType: 'buttons',
  options: [
    { value: 'weiter', label: 'Verstanden, weiter' }
  ],
  condition: (answers) => answers.Q8_partner === 'ja',
  beegRef: 'SS4b',
  next: 'OPT4_aufteilung'
},
{
  id: 'OPT4_aufteilung',
  phase: 8,
  text: 'Optimale Aufteilung zwischen den Eltern',
  // Dynamisch: Wer sollte wie viele Monate nehmen?
  subtext: 'Beruecksichtigt: Wer verdient mehr? Partnermonate-Bedingung',
  inputType: 'buttons',
  options: [
    { value: 'weiter', label: 'Verstanden, weiter' }
  ],
  condition: (answers) => answers.Q8_partner === 'ja',
  beegRef: 'SS4',
  next: 'OPT5_zusatzmonate'
},
{
  id: 'OPT5_zusatzmonate',
  phase: 8,
  text: 'Zusatzmonate-Check',
  // Dynamisch: Fruehgeburt, Mehrlinge, Behinderung
  subtext: 'Pruefung auf zusaetzliche Ansprueche',
  inputType: 'buttons',
  options: [
    { value: 'weiter', label: 'Verstanden, weiter' }
  ],
  condition: (answers) => {
    return answers.Q3_fruehgeburt === 'ja' ||
           answers.Q4_mehrlinge !== 'nein' ||
           answers.Q15d_behinderung === 'ja'
  },
  beegRef: 'SS4 Abs. 5 - Fruehgeburt, SS2a Abs. 4 - Mehrlinge',
  next: 'OPT6_geschwisterbonus'
},
{
  id: 'OPT6_geschwisterbonus',
  phase: 8,
  text: 'Geschwisterbonus-Check',
  // Dynamisch: Pruefung der Altersgrenzen
  subtext: 'Geschwisterbonus aktiv bis: [Datum basierend auf Altersgrenze]',
  inputType: 'buttons',
  options: [
    { value: 'weiter', label: 'Zur Zusammenfassung' }
  ],
  condition: (answers) => answers.Q15_geschwister === 'ja',
  beegRef: 'SS2a Abs. 1-3 - Geschwisterbonus',
  next: 'BERATUNG_ABGESCHLOSSEN'
},
{
  id: 'BERATUNG_ABGESCHLOSSEN',
  phase: 8,
  text: 'Beratung abgeschlossen!',
  subtext: 'Deine personalisierte Elterngeld-Strategie steht bereit.',
  inputType: 'buttons',
  options: [
    { value: 'ergebnis', label: 'Ergebnis anzeigen' },
    { value: 'pdf', label: 'Als PDF exportieren' }
  ],
  next: 'ERGEBNIS_SEITE'
}
```

### Aktualisierte PHASES-Konstante

```typescript
// In eltern-kompass/lib/berater/questions.ts

export const PHASES = [
  { number: 1, name: 'Grundsituation', questionCount: 14 },
  { number: 2, name: 'Einkommensgrenze', questionCount: 3 },
  { number: 3, name: 'Geschwister', questionCount: 4 },
  { number: 4, name: 'Beschaeftigung', questionCount: 35 },
  { number: 5, name: 'Ausklammerung', questionCount: 2 },
  { number: 6, name: 'Mutterschaftsgeld', questionCount: 4 },
  { number: 7, name: 'Elternzeit-Planung', questionCount: 10 },
  { number: 8, name: 'Optimierung', questionCount: 7 },
]

// Gesamt: ca. 79 Fragen (viele conditional)
```

---

## 3.4 Xano Chat-Backend

### 3.4.1 Tabellen

**chat_sessions.json:**
```json
{
  "name": "chat_sessions",
  "description": "Chat-Sessions fuer Premium-Berater",
  "fields": [
    {
      "name": "id",
      "type": "integer",
      "auto_increment": true,
      "primary_key": true
    },
    {
      "name": "user_id",
      "type": "integer",
      "foreign_key": {
        "table": "users",
        "field": "id",
        "on_delete": "cascade"
      },
      "nullable": false
    },
    {
      "name": "current_person",
      "type": "enum",
      "values": ["mutter", "partner"],
      "nullable": true,
      "description": "Aktuelle Person in der Beratung"
    },
    {
      "name": "current_question_id",
      "type": "text",
      "nullable": true,
      "description": "ID der aktuellen Frage"
    },
    {
      "name": "phase",
      "type": "integer",
      "default": 1,
      "description": "Aktuelle Phase (1-8)"
    },
    {
      "name": "answers_mutter",
      "type": "json",
      "default": {},
      "description": "Alle Antworten der Mutter"
    },
    {
      "name": "answers_partner",
      "type": "json",
      "default": {},
      "description": "Alle Antworten des Partners"
    },
    {
      "name": "answers_shared",
      "type": "json",
      "default": {},
      "description": "Gemeinsame Antworten (Phase 1-3)"
    },
    {
      "name": "is_complete",
      "type": "boolean",
      "default": false,
      "description": "Beratung abgeschlossen?"
    },
    {
      "name": "ai_questions_count",
      "type": "integer",
      "default": 0,
      "description": "Anzahl AI-Rueckfragen (fuer Rate Limiting)"
    },
    {
      "name": "ai_questions_reset_at",
      "type": "timestamp",
      "nullable": true,
      "description": "Zeitpunkt fuer Rate-Limit-Reset"
    },
    {
      "name": "created_at",
      "type": "timestamp",
      "default": "now()"
    },
    {
      "name": "updated_at",
      "type": "timestamp",
      "default": "now()",
      "auto_update": true
    }
  ],
  "indexes": [
    {
      "name": "idx_chat_sessions_user",
      "fields": ["user_id"],
      "unique": false
    }
  ]
}
```

**chat_messages.json:**
```json
{
  "name": "chat_messages",
  "description": "Alle Chat-Nachrichten",
  "fields": [
    {
      "name": "id",
      "type": "integer",
      "auto_increment": true,
      "primary_key": true
    },
    {
      "name": "session_id",
      "type": "integer",
      "foreign_key": {
        "table": "chat_sessions",
        "field": "id",
        "on_delete": "cascade"
      },
      "nullable": false
    },
    {
      "name": "type",
      "type": "enum",
      "values": ["bot", "user", "system", "ai"],
      "nullable": false,
      "description": "Nachrichtentyp"
    },
    {
      "name": "content",
      "type": "text",
      "nullable": false,
      "description": "Nachrichteninhalt"
    },
    {
      "name": "question_id",
      "type": "text",
      "nullable": true,
      "description": "Zugehoerige Frage-ID"
    },
    {
      "name": "person",
      "type": "enum",
      "values": ["mutter", "partner", "shared"],
      "nullable": true,
      "description": "Fuer welche Person"
    },
    {
      "name": "metadata",
      "type": "json",
      "nullable": true,
      "description": "Zusaetzliche Daten (z.B. AI-Tokens)"
    },
    {
      "name": "created_at",
      "type": "timestamp",
      "default": "now()"
    }
  ],
  "indexes": [
    {
      "name": "idx_chat_messages_session",
      "fields": ["session_id"],
      "unique": false
    },
    {
      "name": "idx_chat_messages_question",
      "fields": ["question_id"],
      "unique": false
    }
  ]
}
```

### 3.4.2 API: GET /berater/state

```xanoscript
// apis/berater/state.json
// GET /berater/state - Laedt aktuellen Chat-Status

// 1. Auth pruefen
user = $auth.getUser()
if (!user) {
  return $response.error(401, "Nicht authentifiziert")
}

// 2. Premium-Check
if (!user.is_premium && !user.is_premium_plus) {
  return $response.error(403, "Premium erforderlich")
}

// 3. Session laden oder erstellen
session = $db.query("chat_sessions")
  .where("user_id", "=", user.id)
  .orderBy("created_at", "desc")
  .first()

if (!session) {
  // Neue Session erstellen
  session = $db.insert("chat_sessions", {
    user_id: user.id,
    current_question_id: "Q1_kind_geboren",
    phase: 1
  })
}

// 4. Nachrichten laden
messages = $db.query("chat_messages")
  .where("session_id", "=", session.id)
  .orderBy("created_at", "asc")
  .get()

// 5. Response
return $response.json({
  session_id: session.id,
  current_person: session.current_person,
  current_question_id: session.current_question_id,
  phase: session.phase,
  answers: {
    mutter: session.answers_mutter,
    partner: session.answers_partner,
    shared: session.answers_shared
  },
  is_complete: session.is_complete,
  messages: messages,
  can_ask_ai: session.ai_questions_count < 20
})
```

### 3.4.3 API: POST /berater/answer

```xanoscript
// apis/berater/answer.json
// POST /berater/answer - Speichert Antwort

// Input
params = {
  session_id: integer,
  question_id: string,
  answer: any,
  next_question_id: string
}

// 1. Auth pruefen
user = $auth.getUser()
if (!user) {
  return $response.error(401, "Nicht authentifiziert")
}

// 2. Session laden und validieren
session = $db.query("chat_sessions")
  .where("id", "=", params.session_id)
  .where("user_id", "=", user.id)
  .first()

if (!session) {
  return $response.error(404, "Session nicht gefunden")
}

// 3. Bestimme welches Answer-Objekt aktualisiert wird
// Phase 1-3: shared, Phase 4+: mutter oder partner
phase = $fn.get_question_phase(params.question_id)

if (phase <= 3) {
  answers_key = "answers_shared"
  person = "shared"
} else {
  answers_key = session.current_person == "mutter" ? "answers_mutter" : "answers_partner"
  person = session.current_person
}

// 4. Antwort speichern
current_answers = session[answers_key] || {}
current_answers[params.question_id] = params.answer

update_data = {}
update_data[answers_key] = current_answers
update_data.current_question_id = params.next_question_id
update_data.phase = $fn.get_question_phase(params.next_question_id)

// Check ob Beratung abgeschlossen
if (params.next_question_id == "ERGEBNIS_SEITE") {
  update_data.is_complete = true
}

$db.update("chat_sessions", session.id, update_data)

// 5. User-Nachricht speichern
$db.insert("chat_messages", {
  session_id: session.id,
  type: "user",
  content: $fn.format_answer_for_display(params.question_id, params.answer),
  question_id: params.question_id,
  person: person
})

// 6. Bot-Nachricht fuer naechste Frage
if (params.next_question_id && params.next_question_id != "ERGEBNIS_SEITE") {
  next_question = $fn.get_question_text(params.next_question_id)
  $db.insert("chat_messages", {
    session_id: session.id,
    type: "bot",
    content: next_question.text,
    question_id: params.next_question_id,
    person: person
  })
}

// 7. Response
return $response.json({
  success: true,
  next_question_id: params.next_question_id,
  phase: update_data.phase
})
```

### 3.4.4 API: POST /berater/ask (AI-Rueckfragen)

```xanoscript
// apis/berater/ask.json
// POST /berater/ask - AI-Rueckfrage stellen

// Input
params = {
  session_id: integer,
  question: string
}

// 1. Auth + Premium-Check
user = $auth.getUser()
if (!user) {
  return $response.error(401, "Nicht authentifiziert")
}

if (!user.is_premium_plus) {
  return $response.error(403, "Premium+ erforderlich fuer AI-Rueckfragen")
}

// 2. Session laden
session = $db.query("chat_sessions")
  .where("id", "=", params.session_id)
  .where("user_id", "=", user.id)
  .first()

if (!session) {
  return $response.error(404, "Session nicht gefunden")
}

// 3. Rate Limiting pruefen (20 Fragen/Stunde)
now = $time.now()
reset_at = session.ai_questions_reset_at

// Reset nach 1 Stunde
if (!reset_at || $time.diff(now, reset_at, "hours") >= 1) {
  $db.update("chat_sessions", session.id, {
    ai_questions_count: 0,
    ai_questions_reset_at: now
  })
  session.ai_questions_count = 0
}

if (session.ai_questions_count >= 20) {
  minutes_left = 60 - $time.diff(now, reset_at, "minutes")
  return $response.error(429, "Limit erreicht. Bitte warte " + minutes_left + " Minuten.")
}

// 4. User-Frage speichern
$db.insert("chat_messages", {
  session_id: session.id,
  type: "user",
  content: params.question,
  metadata: { is_ai_question: true }
})

// 5. AI-Antwort generieren
ai_response = $fn.ai_ask_question({
  question: params.question,
  context: {
    current_question_id: session.current_question_id,
    phase: session.phase,
    answers_shared: session.answers_shared,
    answers_mutter: session.answers_mutter,
    answers_partner: session.answers_partner,
    current_person: session.current_person
  }
})

// 6. AI-Antwort speichern
$db.insert("chat_messages", {
  session_id: session.id,
  type: "ai",
  content: ai_response.answer,
  metadata: {
    tokens_used: ai_response.tokens_used,
    model: "gemini-2.5-flash"
  }
})

// 7. Counter erhoehen
$db.update("chat_sessions", session.id, {
  ai_questions_count: session.ai_questions_count + 1
})

// 8. Response
return $response.json({
  answer: ai_response.answer,
  questions_remaining: 20 - (session.ai_questions_count + 1)
})
```

---

## 3.5 Gemini AI Integration

### 3.5.1 Xano AI Funktion

```xanoscript
// functions/ai_ask_question.json
// Generiert AI-Antwort auf User-Rueckfrage

// Input
input = {
  question: string,
  context: {
    current_question_id: string,
    phase: number,
    answers_shared: object,
    answers_mutter: object,
    answers_partner: object,
    current_person: string
  }
}

// System-Prompt fuer Elterngeld-Berater
system_prompt = `Du bist ein freundlicher und kompetenter Elterngeld-Berater fuer deutsche Eltern.
Du hilfst bei Fragen zum Elterngeld nach dem BEEG (Bundeselterngeld- und Elternzeitgesetz).

WICHTIGE REGELN:
1. Antworte kurz und verstaendlich (max 3-4 Saetze)
2. Nutze einfache Sprache, kein Juristendeutsch
3. Verweise bei komplexen Fragen auf die Elterngeldstelle
4. Nenne konkrete Zahlen nur wenn du sicher bist:
   - Mindestbetrag: 300 EUR
   - Hoechstbetrag Basiselterngeld: 1.800 EUR
   - Hoechstbetrag ElterngeldPlus: 900 EUR
   - Einkommensgrenze: 175.000 EUR (ab 2025)
   - Max. Arbeitszeit: 32 Stunden/Woche
5. Bei Unsicherheit sage: "Das haengt von deiner individuellen Situation ab..."
6. Erwaehne relevante Paragraphen nur wenn hilfreich (z.B. "SS4 BEEG")

KONTEXT DER AKTUELLEN BERATUNG:
- Aktuelle Frage: ${input.context.current_question_id}
- Phase: ${input.context.phase}
- Person: ${input.context.current_person || 'noch nicht ausgewaehlt'}

BEREITS ERFASSTE DATEN:
${$json.stringify(input.context.answers_shared)}
${input.context.current_person == 'mutter' ? $json.stringify(input.context.answers_mutter) : ''}
${input.context.current_person == 'partner' ? $json.stringify(input.context.answers_partner) : ''}
`

// Xano AI Call (Gemini 2.5 Flash)
ai_result = $xano.ai.generate({
  model: "gemini-2.5-flash",
  system_prompt: system_prompt,
  prompt: input.question,
  max_tokens: 500,
  temperature: 0.7
})

// Output
return {
  answer: ai_result.text,
  tokens_used: ai_result.usage.total_tokens
}
```

### 3.5.2 Rate Limiting Details

| Limit | Wert | Begruendung |
|-------|------|-------------|
| Fragen pro Stunde | 20 | Verhindert Missbrauch, genuegt fuer normale Nutzung |
| Max Tokens pro Antwort | 500 | Ca. 100-150 Woerter, ausreichend fuer kurze Erklaerungen |
| Reset-Intervall | 1 Stunde | Gleitend ab erster Frage |
| Premium-Level | Premium+ | Nur hoechste Stufe hat AI-Zugang |

---

## 3.6 Frontend-Aenderungen

### 3.6.1 ChatContainer.tsx Updates

```typescript
// eltern-kompass/components/berater/ChatContainer.tsx - ERWEITERT
'use client'

import { useState } from 'react'
import { useBerater } from '@/hooks/useBerater'
import { ChatHistory } from './ChatHistory'
import { QuestionCard } from './QuestionCard'
import { ProgressHeader } from './ProgressHeader'
import { ChatInput } from './ChatInput'
import { PersonSelector } from './PersonSelector'
import { Button } from '@/components/ui/button'
import { ArrowLeft, RotateCcw, MessageCircle, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatContainerProps {
  isPremiumPlus?: boolean
}

export function ChatContainer({ isPremiumPlus = false }: ChatContainerProps) {
  const {
    messages,
    currentQuestion,
    phase,
    currentPhaseInfo,
    progress,
    canGoBack,
    isLoaded,
    currentPerson,
    hasPartner,
    prefillData,
    sendAnswer,
    goBack,
    reset,
    getPrefillValue,
    askAI,
    aiQuestionsRemaining,
    isAskingAI
  } = useBerater()

  const [showAIInput, setShowAIInput] = useState(false)

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-gray-400">Laedt...</div>
      </div>
    )
  }

  // Person-Auswahl anzeigen wenn noch nicht gewaehlt
  if (!currentPerson && phase >= 4) {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 py-3 border-b bg-white/80 backdrop-blur-sm">
          <ProgressHeader
            progress={progress}
            phase={phase}
            phaseName="Person auswaehlen"
          />
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <PersonSelector
            onSelect={(person) => sendAnswer({ type: 'person_select', value: person })}
            motherName={prefillData.motherFirstName}
            partnerName={prefillData.partnerFirstName}
            hasPartner={hasPartner}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Progress Header */}
      <div className="px-4 py-3 border-b bg-white/80 backdrop-blur-sm">
        <ProgressHeader
          progress={progress}
          phase={phase}
          phaseName={currentPhaseInfo?.name}
          currentPerson={currentPerson}
        />
      </div>

      {/* Chat History (scrollable) */}
      <div className="flex-shrink-0 border-b bg-gray-50/50">
        <ChatHistory messages={messages} />
      </div>

      {/* Current Question (main area) */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentQuestion && (
          <QuestionCard
            question={currentQuestion}
            onAnswer={sendAnswer}
            prefillValue={getPrefillValue(currentQuestion)}
          />
        )}
      </div>

      {/* AI Input (nur Premium+) */}
      {isPremiumPlus && showAIInput && (
        <div className="px-4 py-3 border-t bg-primary/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">
              Frage an den KI-Berater ({aiQuestionsRemaining} Fragen uebrig)
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAIInput(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <ChatInput
            onSend={askAI}
            placeholder="Deine Frage zum Elterngeld..."
            isLoading={isAskingAI}
            disabled={aiQuestionsRemaining <= 0}
          />
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="flex-shrink-0 px-4 py-3 border-t bg-white/80 backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goBack}
            disabled={!canGoBack}
            className="text-gray-500"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Zurueck
          </Button>

          <div className="flex items-center gap-2">
            {/* AI Button (nur Premium+) */}
            {isPremiumPlus && !showAIInput && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAIInput(true)}
                className="text-primary"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Frage stellen
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-gray-400 hover:text-red-500"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Neu
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
```

### 3.6.2 Neue ChatInput.tsx

```typescript
// eltern-kompass/components/berater/ChatInput.tsx
'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Send, Loader2 } from 'lucide-react'

interface ChatInputProps {
  onSend: (message: string) => void
  placeholder?: string
  isLoading?: boolean
  disabled?: boolean
}

export function ChatInput({
  onSend,
  placeholder = "Eine Frage stellen...",
  isLoading = false,
  disabled = false
}: ChatInputProps) {
  const [value, setValue] = useState('')

  const handleSend = () => {
    if (value.trim() && !isLoading && !disabled) {
      onSend(value.trim())
      setValue('')
    }
  }

  return (
    <div className="flex gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        placeholder={placeholder}
        disabled={isLoading || disabled}
        className="flex-1"
      />
      <Button
        onClick={handleSend}
        disabled={!value.trim() || isLoading || disabled}
        size="icon"
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </div>
  )
}
```

### 3.6.3 Neue Route /portal/berater/page.tsx

```typescript
// eltern-kompass/app/portal/berater/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChatContainer } from '@/components/berater/ChatContainer'

export default function BeraterPage() {
  const router = useRouter()
  const [isPremium, setIsPremium] = useState(false)
  const [isPremiumPlus, setIsPremiumPlus] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Premium-Status pruefen
    const checkPremium = async () => {
      try {
        // TODO: Durch echten API-Call ersetzen
        const authData = localStorage.getItem('eltern-kompass-auth')
        if (authData) {
          const user = JSON.parse(authData)
          setIsPremium(user.is_premium || user.is_premium_plus)
          setIsPremiumPlus(user.is_premium_plus)
        }
      } catch {
        // Fehler ignorieren
      } finally {
        setIsLoading(false)
      }
    }

    checkPremium()
  }, [])

  // Redirect wenn nicht Premium
  useEffect(() => {
    if (!isLoading && !isPremium) {
      router.push('/portal/ergebnis')
    }
  }, [isLoading, isPremium, router])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse text-gray-400">Laedt...</div>
      </div>
    )
  }

  if (!isPremium) {
    return null // Redirect laeuft
  }

  return (
    <div className="h-[calc(100dvh-4rem)]">
      <ChatContainer isPremiumPlus={isPremiumPlus} />
    </div>
  )
}
```

### 3.6.4 Portal Layout Update

```typescript
// In eltern-kompass/app/portal/layout.tsx - Menuepunkt hinzufuegen

const navigationItems = [
  { href: '/portal/dashboard', label: 'Dashboard', icon: Home },
  { href: '/portal/berater', label: 'Berater', icon: MessageCircle, premium: true },
  { href: '/portal/profil', label: 'Profil', icon: User },
]

// Im JSX: Premium-Badge anzeigen
{item.premium && (
  <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
    Premium
  </span>
)}
```

---

## 3.7 Testplan

### 3.7.1 BEEG-Compliance Checkliste

| Paragraph | Anforderung | Frage-ID | Status |
|-----------|-------------|----------|--------|
| SS1 Abs. 1 | Wohnsitz DE | Q6_wohnsitz | Implementiert |
| SS1 Abs. 3 | Adoption | Q7_adoption, Q7b_aufnahmedatum | Implementiert |
| SS1 Abs. 6 | Max 32h/Woche | Q72_teilzeit, Q72b_teilzeit_stunden | Zu implementieren |
| SS1 Abs. 8 | Einkommensgrenze 175.000 EUR | Q10_einkommensgrenze | Implementiert |
| SS2 Abs. 3 | Deckelung 2.770 EUR bei Teilzeit | Q72c_teilzeit_netto | Zu implementieren |
| SS2a Abs. 1-3 | Geschwisterbonus | Q15_geschwister, Q15b_anzahl | Implementiert |
| SS2a Abs. 4 | Mehrlingszuschlag | Q4_mehrlinge | Implementiert |
| SS2b Abs. 1 | Bemessungszeitraum | In Berechnung | Zu implementieren |
| SS2b Abs. 1 S.2 | Ausklammerbare Monate | Q55_ausklammerung | Zu implementieren |
| SS2c | Nichtselbstaendige | Q21-Q28 | Zu implementieren |
| SS2c Abs. 1 S.2 | Sonstige Bezuege ausschliessen | Q23_sonderzahlungen | Zu implementieren |
| SS2d | Selbstaendige | Q30-Q35 | Zu implementieren |
| SS2e Abs. 3 | Steuerklasse (nicht VI) | Q24_steuerklasse | Zu implementieren |
| SS2e Abs. 5 | Kirchensteuer 8% | Q25_kirchensteuer | Zu implementieren |
| SS2f | Sozialabgaben-Pauschalen (21%) | Q27_sozialversicherung | Zu implementieren |
| SS2f Abs. 2 | Midijob/Uebergangsbereich | Q28_midijob_check | Zu implementieren |
| SS3 Abs. 1 | Mutterschaftsgeld-Anrechnung | Q60_mutterschaftsgeld | Zu implementieren |
| SS4 Abs. 5 | Fruehgeburten-Zusatzmonate | Q3_fruehgeburt, Q3b_wochen_vor_et | Implementiert |
| SS4 Abs. 6 | Gleichzeitiger Bezug (nur 1 Monat Basis) | Q73_gleichzeitig | Zu implementieren |
| SS4a | Basiselterngeld vs ElterngeldPlus | Q71_elterngeld_variante | Zu implementieren |
| SS4b | Partnerschaftsbonus (24-32h) | Q74_partnerschaftsbonus | Zu implementieren |
| SS4c | Alleinerziehende | Q9_alleinerziehend | Implementiert |
| SS28 | Uebergangsregelung 200.000 EUR | In Berechnung | Zu implementieren |

### 3.7.2 Testfaelle pro Beschaeftigungsart

**Angestellte (Standard):**
```
Input:
- Brutto: 3.500 EUR/Monat
- Steuerklasse: IV
- Kirchensteuer: Ja
- GKV: Ja

Erwartete Berechnung:
- Netto vor Geburt: ca. 2.200 EUR
- Ersatzrate: 65% (da > 1.200 EUR)
- Basiselterngeld: ca. 1.430 EUR
```

**Selbstaendige:**
```
Input:
- Gewinn lt. Steuerbescheid: 48.000 EUR/Jahr
- Kirchensteuer: Nein
- KSK: Ja (RV-pflichtig)

Erwartete Berechnung:
- Monatlicher Gewinn: 4.000 EUR
- Minus Steuern + Sozialabgaben
- Netto vor Geburt: ca. 2.800 EUR
- Basiselterngeld: ca. 1.800 EUR (Maximum)
```

**Beamte:**
```
Input:
- Dienstbezuege Brutto: 4.000 EUR/Monat
- Steuerklasse: III
- Kirchensteuer: Ja
- Beihilfe + PKV: Ja

Erwartete Berechnung:
- KEINE Sozialabgaben-Pauschale!
- Nur Steuerabzuege
- Netto vor Geburt: ca. 3.100 EUR
- Basiselterngeld: ca. 1.800 EUR (Maximum)
```

**Midijob (Uebergangsbereich):**
```
Input:
- Brutto: 1.200 EUR/Monat
- Steuerklasse: I
- Kirchensteuer: Nein
- GKV: Ja

Erwartete Berechnung:
- Reduzierte Sozialabgaben (SS2f Abs. 2 S. 3)
- Netto vor Geburt: ca. 1.000 EUR
- Ersatzrate: 67% + Zuschlag (da < 1.200 EUR)
- Basiselterngeld: ca. 700 EUR
```

**Nicht erwerbstaetig mit ALG I:**
```
Input:
- ALG I: 1.200 EUR/Monat
- Kein weiteres Einkommen

Erwartete Berechnung:
- Mindestbetrag: 300 EUR
- ALG I wird angerechnet (ausser Sockelbetrag 300 EUR)
```

### 3.7.3 Edge Cases

| Edge Case | Erwartetes Verhalten |
|-----------|---------------------|
| Alleinerziehende | 14 Monate allein moeglich (SS4c) |
| Einkommen > 175.000 EUR | Warnung anzeigen, kein Anspruch |
| Einkommen 175-200k + Geburt vor 01.04.2025 | OK (Uebergangsregel SS28) |
| Mehrlinge | Zusatzmonate + 300 EUR Zuschlag pro weiterem Kind |
| Fruehgeburt >= 6 Wochen | +1-4 Monate je nach Wochen vor ET |
| Steuerklassenwechsel < 7 Monate | Warnung: unguentiger Wechsel |
| Gleichzeitiger Basis-Bezug > 1 Monat | Warnung (ausser Mehrlinge/Fruehgeburt) |
| PKV ohne RV | Nur 2% AV-Pauschale |
| Minijob pauschal versteuert | Nicht beruecksichtigt |

---

## 3.8 Implementierungsreihenfolge

### Sprint 1: Input-Komponenten + Fragen (3 Tage)

| Tag | Aufgaben |
|-----|----------|
| 1 | MultiSelectInput, MonthSelectInput implementieren |
| 1 | MonthlyInput (12-Monate) implementieren |
| 2 | DualSliderInput, PersonSelector implementieren |
| 2 | Types erweitern (DualSliderConfig, etc.) |
| 3 | Alle Phase 4 Fragen (Beschaeftigung) hinzufuegen |
| 3 | Phase 5-7 Fragen hinzufuegen |

### Sprint 2: Xano Backend (4 Tage)

| Tag | Aufgaben |
|-----|----------|
| 1 | Tabellen chat_sessions, chat_messages erstellen |
| 1 | Helper-Funktionen (get_question_phase, format_answer) |
| 2 | API GET /berater/state implementieren |
| 2 | API POST /berater/answer implementieren |
| 3 | Frontend mit Xano verbinden |
| 3 | Session-Management testen |
| 4 | Fehlerbehandlung, Edge Cases |

### Sprint 3: AI Integration (3 Tage)

| Tag | Aufgaben |
|-----|----------|
| 1 | Xano AI Funktion ai_ask_question |
| 1 | API POST /berater/ask mit Rate Limiting |
| 2 | ChatInput Komponente |
| 2 | useBerater Hook erweitern (askAI) |
| 3 | Premium+ Check implementieren |
| 3 | Testing AI-Antworten |

### Sprint 4: Optimierung + Polish (3 Tage)

| Tag | Aufgaben |
|-----|----------|
| 1 | Phase 8 Optimierungs-Fragen mit dynamischem Content |
| 1 | Steuerklassen-Analyse implementieren |
| 2 | Mobile-Optimierung |
| 2 | Scroll-Verhalten, Animationen |
| 3 | End-to-End Tests alle Beschaeftigungsarten |
| 3 | BEEG-Compliance finale Pruefung |

---

## Checkliste

### Input-Komponenten
- [ ] MultiSelectInput.tsx erstellen
- [ ] MultiDateInput.tsx erstellen
- [ ] MonthlyInput.tsx erstellen (12-Monate)
- [ ] PersonSelector.tsx erstellen
- [ ] DualSliderInput.tsx erstellen
- [ ] MonthSelectInput.tsx erstellen
- [ ] QuestionCard.tsx fuer neue InputTypes erweitern

### Fragen-Definition
- [ ] Types erweitern (DualSliderConfig, beegRef)
- [ ] Phase 4 Angestellte (Q21-Q28)
- [ ] Phase 4 Selbstaendige (Q30-Q35)
- [ ] Phase 4 Beamte (Q40-Q43)
- [ ] Phase 4 Minijob (Q45-Q46)
- [ ] Phase 4 Nicht erwerbstaetig (Q50)
- [ ] Phase 5 Ausklammerung (Q55)
- [ ] Phase 6 Mutterschaftsgeld (Q60)
- [ ] Phase 7 Elternzeit-Planung (Q70-Q74)
- [ ] Phase 8 Optimierung (OPT1-OPT6)
- [ ] PHASES-Konstante aktualisieren

### Xano Backend
- [ ] Tabelle chat_sessions erstellen
- [ ] Tabelle chat_messages erstellen
- [ ] Funktion get_question_phase erstellen
- [ ] Funktion format_answer_for_display erstellen
- [ ] Funktion get_question_text erstellen
- [ ] API GET /berater/state
- [ ] API POST /berater/answer
- [ ] API POST /berater/ask

### AI Integration
- [ ] Funktion ai_ask_question erstellen
- [ ] Rate Limiting (20/Stunde) implementieren
- [ ] Premium+ Check in API
- [ ] System-Prompt optimieren

### Frontend
- [ ] useBerater Hook erweitern (Xano-Anbindung, askAI)
- [ ] ChatContainer.tsx erweitern (AI-Input, PersonSelector)
- [ ] ChatInput.tsx erstellen
- [ ] /portal/berater/page.tsx erstellen
- [ ] Portal Layout: Menuepunkt hinzufuegen
- [ ] Premium-Gate implementieren

### Testing
- [ ] BEEG-Compliance alle Paragraphen pruefen
- [ ] Testfall Angestellte
- [ ] Testfall Selbstaendige
- [ ] Testfall Beamte
- [ ] Testfall Midijob
- [ ] Testfall Nicht erwerbstaetig
- [ ] Edge Cases (Alleinerziehend, Mehrlinge, etc.)
- [ ] Mobile-Testing
- [ ] AI Rate-Limiting testen

---

*Letztes Update: Januar 2025*
