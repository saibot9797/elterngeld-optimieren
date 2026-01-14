# Phase 1: Paywall & Stripe Integration

## 1. Ubersicht

**Ziel:** Paywall-Screen nach Onboarding anzeigen, bevor der Nutzer Zugang zum Premium-Bereich (Strategie) erhalt.

**Preis:** 79 EUR einmalig

**Technologie:** Stripe Checkout (hosted) - einfachste und sicherste Integration

**User Flow:**
```
Onboarding (4 Steps) --> Paywall (Ergebnis) --> Stripe Checkout --> Success --> Premium-Bereich
```

---

## 2. Aufgabe 1: Paywall-Screen erstellen

### Datei: `/eltern-kompass/app/portal/ergebnis/page.tsx`

**Design-Mockup (ASCII):**
```
+-----------------------------------------------------------+
|  [Berechnung Icon]                                        |
|                                                           |
|  Deine Berechnung ist fertig!                            |
|                                                           |
|  +-----------------------------------------------------+  |
|  |                                                     |  |
|  |  Ohne Optimierung          Mit Optimierung         |  |
|  |  ----------------          ---------------         |  |
|  |  14.234 EUR          -->   16.580 EUR             |  |
|  |                                                     |  |
|  |  [Pfeil Icon] Dein Potenzial: +2.346 EUR          |  |
|  |                                                     |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  Deine personalisierte Strategie enthalt:                |
|                                                           |
|  [Check] Optimale Steuerklassen-Kombination              |
|  [Check] Monatsgenauer Bezugsplan                        |
|  [Check] Basis vs. ElterngeldPlus Empfehlung             |
|  [Check] PDF-Export fur Arbeitgeber                      |
|                                                           |
|  +-----------------------------------------------------+  |
|  |     [Button] Strategie freischalten - 79 EUR       |  |
|  +-----------------------------------------------------+  |
|                                                           |
|  [Shield] 100% Geld-zuruck-Garantie                      |
|                                                           |
+-----------------------------------------------------------+
```

### Vollstandiger Code:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  TrendingUp,
  Calculator,
  Loader2,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { usePremium } from "@/hooks/usePremium";
import {
  calculateMonthlyElterngeld,
  formatCurrency,
} from "@/lib/calculations/elterngeld-quick";

export default function PaywallPage() {
  const router = useRouter();
  const { data, isLoaded, isComplete } = useOnboarding();
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);

  // Redirect wenn Onboarding nicht abgeschlossen
  useEffect(() => {
    if (isLoaded && !isComplete) {
      router.push("/portal/onboarding");
    }
  }, [isLoaded, isComplete, router]);

  // Redirect wenn bereits Premium
  useEffect(() => {
    if (!isPremiumLoading && isPremium) {
      router.push("/portal/strategie");
    }
  }, [isPremium, isPremiumLoading, router]);

  // Berechnung der Werte
  const calculateResults = () => {
    if (!data) return null;

    const mutterMonatlich = calculateMonthlyElterngeld(
      data.mutter.monatlichesNetto
    );
    const partnerMonatlich = data.partner
      ? calculateMonthlyElterngeld(data.partner.monatlichesNetto)
      : 0;

    const ohneOptimierung =
      mutterMonatlich * data.elternzeitPlan.monateMutter +
      partnerMonatlich * data.elternzeitPlan.monatePartner;

    // Optimierungspotenzial berechnen (realistisch: 12-18%)
    const optimierungsProzent = data.hatPartner ? 0.18 : 0.12;
    const optimierungsPotenzial = Math.round(
      ohneOptimierung * optimierungsProzent
    );
    const mitOptimierung = ohneOptimierung + optimierungsPotenzial;

    return {
      ohneOptimierung,
      mitOptimierung,
      optimierungsPotenzial,
    };
  };

  const results = calculateResults();

  // Checkout starten
  const handleCheckout = async () => {
    setIsCheckoutLoading(true);

    try {
      const response = await fetch("/api/stripe/create-checkout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Optional: User-Daten fur Stripe Metadata
          email: localStorage.getItem("eltern-kompass-email") || undefined,
        }),
      });

      const data = await response.json();

      if (data.url) {
        // Redirect zu Stripe Checkout
        window.location.href = data.url;
      } else {
        throw new Error("Keine Checkout-URL erhalten");
      }
    } catch (error) {
      console.error("Checkout-Fehler:", error);
      setIsCheckoutLoading(false);
      // TODO: Error-Toast anzeigen
    }
  };

  // Loading State
  if (!isLoaded || isPremiumLoading || !results) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Berechnung lauft...</h2>
          <p className="text-muted-foreground">
            Wir analysieren deine individuelle Situation
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 lg:py-10 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <Calculator className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Deine Berechnung ist fertig!
          </h1>
          <p className="text-muted-foreground">
            Basierend auf deinen Angaben haben wir dein Optimierungspotenzial
            berechnet
          </p>
        </div>

        {/* Ergebnis-Vergleich */}
        <Card className="mb-8 overflow-hidden border-2 border-primary/20">
          <CardContent className="p-0">
            <div className="grid md:grid-cols-2">
              {/* Ohne Optimierung */}
              <div className="p-6 bg-gray-50 border-b md:border-b-0 md:border-r">
                <p className="text-sm text-muted-foreground mb-2">
                  Ohne Optimierung
                </p>
                <p className="text-3xl font-bold text-gray-600">
                  {formatCurrency(results.ohneOptimierung)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Gesamt uber alle Monate
                </p>
              </div>

              {/* Mit Optimierung */}
              <div className="p-6 bg-green-50">
                <p className="text-sm text-green-700 mb-2">Mit Optimierung</p>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(results.mitOptimierung)}
                </p>
                <p className="text-sm text-green-600 mt-1">
                  +{formatCurrency(results.optimierungsPotenzial)} mehr
                  Elterngeld
                </p>
              </div>
            </div>

            {/* Potenzial-Highlight */}
            <div className="p-4 bg-gradient-to-r from-primary/10 to-green-100 border-t">
              <div className="flex items-center justify-center gap-3">
                <TrendingUp className="h-6 w-6 text-green-600" />
                <span className="text-lg font-semibold">
                  Dein Potenzial:{" "}
                  <span className="text-green-600">
                    +{formatCurrency(results.optimierungsPotenzial)}
                  </span>
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <div className="mb-8">
          <h2 className="font-semibold text-lg mb-4">
            Deine personalisierte Strategie enthalt:
          </h2>
          <div className="space-y-3">
            {[
              "Optimale Steuerklassen-Kombination",
              "Monatsgenauer Bezugsplan",
              "Basis vs. ElterngeldPlus Empfehlung",
              "PDF-Export fur Arbeitgeber",
              "Partnerschaftsbonus-Berechnung",
              "Personliche Checkliste mit Deadlines",
            ].map((feature, index) => (
              <div key={index} className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                <span>{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="space-y-4">
          <Button
            size="lg"
            className="w-full text-lg py-6"
            onClick={handleCheckout}
            disabled={isCheckoutLoading}
          >
            {isCheckoutLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Weiterleitung zu Stripe...
              </>
            ) : (
              <>
                Strategie freischalten - 79 EUR
                <ArrowRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>

          {/* Garantie */}
          <div className="flex items-center justify-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">
                100% Geld-zuruck-Garantie
              </p>
              <p className="text-sm text-green-600">
                Volle Erstattung wenn dein Optimierungspotenzial unter 500 EUR
                liegt
              </p>
            </div>
          </div>

          {/* Trust-Elemente */}
          <div className="flex items-center justify-center gap-6 pt-4 text-sm text-muted-foreground">
            <span>Sichere Zahlung</span>
            <span>|</span>
            <span>SSL-verschlusselt</span>
            <span>|</span>
            <span>DSGVO-konform</span>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 p-4 rounded-xl bg-muted/50 border">
          <p className="text-xs text-muted-foreground text-center">
            <strong>Hinweis:</strong> Die angezeigte Berechnung ist eine
            Schatzung basierend auf deinen Angaben und den aktuellen
            BEEG-Formeln. Die tatsachliche Hohe des Elterngeldes wird von der
            zustandigen Elterngeldstelle berechnet.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## 3. Aufgabe 2: Onboarding-Redirect andern

### Datei: `/eltern-kompass/app/portal/onboarding/page.tsx`

**Anderung in Zeile 37:**

```tsx
// VORHER:
const handleNext = () => {
  if (currentStep === totalSteps - 1) {
    // Onboarding abgeschlossen - zum Dashboard
    router.push("/portal/dashboard");
  } else {
    nextStep();
  }
};

// NACHHER:
const handleNext = () => {
  if (currentStep === totalSteps - 1) {
    // Onboarding abgeschlossen - zur Paywall
    router.push("/portal/ergebnis");
  } else {
    nextStep();
  }
};
```

---

## 4. Aufgabe 3: Stripe Setup

### Schritt-fur-Schritt Anleitung:

1. **Stripe Account erstellen** (falls nicht vorhanden)
   - Gehe zu https://dashboard.stripe.com/register
   - Verifiziere deine E-Mail

2. **Product erstellen**
   - Gehe zu Products -> Add Product
   - Name: "Elterngeld-Optimierer Premium"
   - Beschreibung: "Personalisierte Elterngeld-Strategie mit Steuerklassen-Optimierung, Bezugsplan und PDF-Export"
   - Preis: 79,00 EUR (einmalig)

3. **Price ID notieren**
   - Nach dem Erstellen: Klicke auf das Product
   - Kopiere die Price ID (beginnt mit `price_`)

4. **Webhook-Endpoint konfigurieren**
   - Gehe zu Developers -> Webhooks
   - Add Endpoint
   - URL: `https://deine-domain.de/api/stripe/webhook`
   - Events: `checkout.session.completed`
   - Kopiere das Webhook Secret (beginnt mit `whsec_`)

5. **API Keys holen**
   - Developers -> API Keys
   - Kopiere Publishable Key (beginnt mit `pk_test_`)
   - Kopiere Secret Key (beginnt mit `sk_test_`)

---

## 5. Aufgabe 4: Environment Variables

### Datei: `/eltern-kompass/.env.local`

```env
# Stripe Configuration
# Test-Keys fur Entwicklung - spater durch Live-Keys ersetzen!

# Publishable Key (offentlich, kann im Browser verwendet werden)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51...

# Secret Key (NIEMALS im Browser verwenden!)
STRIPE_SECRET_KEY=sk_test_51...

# Webhook Secret (fur Signatur-Validierung)
STRIPE_WEBHOOK_SECRET=whsec_...

# Price ID fur das Premium-Produkt
STRIPE_PRICE_ID=price_...
```

### Datei: `/eltern-kompass/.env.example` (fur Git)

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here
STRIPE_PRICE_ID=price_your_price_id_here
```

**Wichtig:** `.env.local` in `.gitignore` eintragen!

---

## 6. Aufgabe 5: Stripe Client

### Datei: `/eltern-kompass/lib/stripe/client.ts`

```ts
import Stripe from "stripe";

// Server-side Stripe Client
// NUR in API Routes und Server Components verwenden!
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia", // Aktuelle API Version
  typescript: true,
});

// Konstanten
export const STRIPE_PRICE_ID = process.env.STRIPE_PRICE_ID!;
```

### Datei: `/eltern-kompass/lib/stripe/config.ts`

```ts
// Client-side Konfiguration
// Kann sicher im Browser verwendet werden

export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
};
```

---

## 7. Aufgabe 6: API Route - Checkout erstellen

### Datei: `/eltern-kompass/app/api/stripe/create-checkout/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { stripe, STRIPE_PRICE_ID } from "@/lib/stripe/client";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    // Base URL fur Redirects
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

    // Stripe Checkout Session erstellen
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price: STRIPE_PRICE_ID,
          quantity: 1,
        },
      ],
      // Redirect URLs
      success_url: `${baseUrl}/portal/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/portal/ergebnis?canceled=true`,

      // Kunden-Email vorausfullen (optional)
      customer_email: email || undefined,

      // Metadata fur spatere Zuordnung
      metadata: {
        product: "elterngeld-premium",
        source: "paywall",
      },

      // Weitere Optionen
      allow_promotion_codes: true, // Gutscheincodes erlauben
      billing_address_collection: "required",
      locale: "de", // Deutsche Sprache

      // Automatische Steuerberechnung (optional)
      // automatic_tax: { enabled: true },
    });

    return NextResponse.json({
      url: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    console.error("Stripe Checkout Error:", error);

    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(
      { error: "Ein Fehler ist aufgetreten" },
      { status: 500 }
    );
  }
}
```

---

## 8. Aufgabe 7: API Route - Webhook

### Datei: `/eltern-kompass/app/api/stripe/webhook/route.ts`

```ts
import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import Stripe from "stripe";

// Webhook Secret aus Environment
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    // Raw Body fur Signatur-Validierung
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
      console.error("Webhook: Keine Signatur");
      return NextResponse.json(
        { error: "Keine Signatur" },
        { status: 400 }
      );
    }

    // Event verifizieren
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error("Webhook Signatur-Fehler:", err);
      return NextResponse.json(
        { error: "Ungultige Signatur" },
        { status: 400 }
      );
    }

    // Event verarbeiten
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;

        console.log("Zahlung erfolgreich:", {
          sessionId: session.id,
          customerEmail: session.customer_email,
          amountTotal: session.amount_total,
          metadata: session.metadata,
        });

        // Premium-Status aktivieren
        await handleSuccessfulPayment(session);

        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("Checkout abgelaufen:", session.id);
        break;
      }

      default:
        console.log(`Unbehandeltes Event: ${event.type}`);
    }

    // Erfolg zuruck an Stripe
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json(
      { error: "Webhook-Verarbeitung fehlgeschlagen" },
      { status: 500 }
    );
  }
}

/**
 * Premium-Status nach erfolgreicher Zahlung aktivieren
 */
async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
  const customerEmail = session.customer_email;
  const sessionId = session.id;

  // TODO: In Produktion - Xano API aufrufen um User als Premium zu markieren
  // Beispiel:
  // await xanoClient.post('/user/activate-premium', {
  //   email: customerEmail,
  //   stripeSessionId: sessionId,
  //   paidAt: new Date().toISOString(),
  // });

  // Fur MVP: In einer einfachen Datenbank/Cache speichern
  // oder Session-ID fur spatere Validierung merken

  console.log(`Premium aktiviert fur: ${customerEmail}`);

  // Optional: Bestatigungsmail senden
  // await sendPremiumConfirmationEmail(customerEmail);
}
```

### Next.js Config fur Webhook

Der Webhook braucht den Raw Body. In Next.js 14+ mit App Router funktioniert das automatisch.

Falls Probleme auftreten, kann ein Route Segment Config notig sein:

```ts
// Am Anfang der route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

---

## 9. Aufgabe 8: Premium-Status Hook

### Datei: `/eltern-kompass/hooks/usePremium.ts`

```ts
"use client";

import { useState, useCallback, useEffect } from "react";

const STORAGE_KEY = "eltern-kompass-premium";

interface PremiumData {
  isPremium: boolean;
  activatedAt: string | null;
  stripeSessionId: string | null;
}

const initialPremiumData: PremiumData = {
  isPremium: false,
  activatedAt: null,
  stripeSessionId: null,
};

export function usePremium() {
  const [data, setData] = useState<PremiumData>(initialPremiumData);
  const [isLoading, setIsLoading] = useState(true);

  // Lade Premium-Status aus localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY);

      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setData(parsed);
        } catch {
          // Ignore parse errors
        }
      }

      setIsLoading(false);
    }
  }, []);

  // Speichere Premium-Status
  useEffect(() => {
    if (!isLoading && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }, [data, isLoading]);

  /**
   * Premium-Status aktivieren
   */
  const activatePremium = useCallback((stripeSessionId?: string) => {
    setData({
      isPremium: true,
      activatedAt: new Date().toISOString(),
      stripeSessionId: stripeSessionId || null,
    });
  }, []);

  /**
   * Premium-Status deaktivieren (fur Admin/Debug)
   */
  const deactivatePremium = useCallback(() => {
    setData(initialPremiumData);
  }, []);

  /**
   * Premium-Status von Server validieren
   * Spater: API-Call zu Xano um Status zu prufen
   */
  const validatePremium = useCallback(async () => {
    // TODO: In Produktion - API-Call zu Xano
    // const response = await fetch('/api/user/premium-status');
    // const { isPremium } = await response.json();
    // setData(prev => ({ ...prev, isPremium }));

    return data.isPremium;
  }, [data.isPremium]);

  return {
    isPremium: data.isPremium,
    activatedAt: data.activatedAt,
    isLoading,
    activatePremium,
    deactivatePremium,
    validatePremium,
  };
}
```

---

## 10. Aufgabe 9: Route Protection

### Datei: `/eltern-kompass/app/portal/strategie/page.tsx`

**Anderungen am Anfang der Komponente:**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
// ... andere imports
import { usePremium } from "@/hooks/usePremium";

export default function StrategiePage() {
  const router = useRouter();
  const { data, isLoaded, isComplete } = useOnboarding();
  const { isPremium, isLoading: isPremiumLoading } = usePremium();
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "actions">("overview");

  // Redirect wenn Onboarding nicht abgeschlossen
  useEffect(() => {
    if (isLoaded && !isComplete) {
      router.push("/portal/onboarding");
    }
  }, [isLoaded, isComplete, router]);

  // NEU: Redirect wenn nicht Premium
  useEffect(() => {
    if (!isPremiumLoading && !isPremium) {
      router.push("/portal/ergebnis");
    }
  }, [isPremium, isPremiumLoading, router]);

  // Loading State anpassen
  if (!isLoaded || isPremiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  // ... Rest der Komponente bleibt gleich
}
```

### Datei: `/eltern-kompass/app/portal/berater/page.tsx` (falls vorhanden)

Gleiche Pattern anwenden:

```tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { usePremium } from "@/hooks/usePremium";
import { useOnboarding } from "@/hooks/useOnboarding";

export default function BeraterPage() {
  const router = useRouter();
  const { isLoaded, isComplete } = useOnboarding();
  const { isPremium, isLoading: isPremiumLoading } = usePremium();

  // Redirect wenn nicht Premium
  useEffect(() => {
    if (isLoaded && !isComplete) {
      router.push("/portal/onboarding");
      return;
    }

    if (!isPremiumLoading && !isPremium) {
      router.push("/portal/ergebnis");
    }
  }, [isLoaded, isComplete, isPremium, isPremiumLoading, router]);

  if (!isLoaded || isPremiumLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  // ... Rest der Komponente
}
```

---

## 11. Aufgabe 10: Success Page

### Datei: `/eltern-kompass/app/portal/payment-success/page.tsx`

```tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  ArrowRight,
  Loader2,
  PartyPopper,
} from "lucide-react";
import { usePremium } from "@/hooks/usePremium";

export default function PaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { activatePremium, isPremium } = usePremium();
  const [isProcessing, setIsProcessing] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const sessionId = searchParams.get("session_id");

  // Zahlung verifizieren und Premium aktivieren
  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setError("Keine Session-ID gefunden");
        setIsProcessing(false);
        return;
      }

      try {
        // Optional: Session bei Stripe verifizieren
        // const response = await fetch(`/api/stripe/verify-session?session_id=${sessionId}`);
        // const { valid } = await response.json();

        // Premium aktivieren
        activatePremium(sessionId);

        // Kurze Verzogerung fur bessere UX
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setIsProcessing(false);
      } catch (err) {
        console.error("Fehler bei Payment-Verifizierung:", err);
        setError("Fehler bei der Verifizierung");
        setIsProcessing(false);
      }
    };

    verifyPayment();
  }, [sessionId, activatePremium]);

  // Processing State
  if (isProcessing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">
            Zahlung wird verarbeitet...
          </h2>
          <p className="text-muted-foreground">
            Bitte warte einen Moment
          </p>
        </div>
      </div>
    );
  }

  // Error State
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">!</span>
            </div>
            <h2 className="text-xl font-semibold mb-2">
              Etwas ist schiefgelaufen
            </h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push("/portal/ergebnis")}>
              Zuruck zur Bezahlung
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success State
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="max-w-md w-full overflow-hidden">
        {/* Success Banner */}
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 text-white text-center">
          <PartyPopper className="h-12 w-12 mx-auto mb-3" />
          <h1 className="text-2xl font-bold">Zahlung erfolgreich!</h1>
        </div>

        <CardContent className="pt-6 text-center">
          <div className="space-y-4 mb-6">
            <div className="flex items-center gap-3 text-left">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Premium-Zugang freigeschaltet</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>Personalisierte Strategie verfugbar</span>
            </div>
            <div className="flex items-center gap-3 text-left">
              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
              <span>PDF-Export aktiviert</span>
            </div>
          </div>

          <Button
            size="lg"
            className="w-full"
            onClick={() => router.push("/portal/strategie")}
          >
            Zur Strategie
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <p className="text-sm text-muted-foreground mt-4">
            Eine Bestatigung wurde an deine E-Mail gesendet
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## 12. Stripe Checkout Flow (Diagramm)

```
                                    FRONTEND                                           BACKEND
+-------------------------------------------------------------------------------------------+
|                                                                                           |
|  [Paywall Page]                                                                           |
|       |                                                                                   |
|       | User klickt "Strategie freischalten"                                              |
|       v                                                                                   |
|  fetch('/api/stripe/create-checkout')  ------>  [API: create-checkout]                   |
|       |                                                |                                  |
|       |                                                | stripe.checkout.sessions.create |
|       |                                                v                                  |
|       |                                         [Stripe API]                              |
|       |                                                |                                  |
|       | <------ { url: checkout_url } <----------------+                                  |
|       |                                                                                   |
|       v                                                                                   |
|  window.location.href = url                                                               |
|       |                                                                                   |
|       v                                                                                   |
|  [Stripe Checkout Page]  (gehostet von Stripe)                                           |
|       |                                                                                   |
|       | User gibt Zahlungsdaten ein                                                       |
|       v                                                                                   |
|  [Zahlung erfolgreich]                                                                    |
|       |                                                                                   |
|       +-----> Redirect zu success_url                                                     |
|       |                                                                                   |
|       |       [Stripe Server] -----> Webhook POST ---->  [API: webhook]                  |
|       |                                                       |                           |
|       |                                                       | checkout.session.completed|
|       |                                                       v                           |
|       |                                                  [Premium aktivieren]             |
|       |                                                       |                           |
|       v                                                       |                           |
|  [Payment Success Page] <-------------------------------------+                           |
|       |                                                                                   |
|       | activatePremium() (localStorage)                                                  |
|       |                                                                                   |
|       v                                                                                   |
|  [Strategie Page]  (Premium-Bereich)                                                      |
|                                                                                           |
+-------------------------------------------------------------------------------------------+
```

---

## 13. NPM Dependencies

### Installation:

```bash
cd eltern-kompass
npm install stripe @stripe/stripe-js
```

### package.json Anderungen:

```json
{
  "dependencies": {
    // ... existierende dependencies
    "stripe": "^17.5.0",
    "@stripe/stripe-js": "^5.5.0"
  }
}
```

---

## 14. Testplan

### 1. Stripe Test-Mode verwenden

Alle Stripe Keys mussen mit `test` beginnen:
- `pk_test_...`
- `sk_test_...`

### 2. Test-Kreditkarten

| Karte | Nummer | Ergebnis |
|-------|--------|----------|
| Erfolg | `4242 4242 4242 4242` | Zahlung erfolgreich |
| Abgelehnt | `4000 0000 0000 0002` | Karte abgelehnt |
| 3D Secure | `4000 0027 6000 3184` | 3D Secure erforderlich |

Ablaufdatum: Beliebiges zukunftiges Datum (z.B. 12/34)
CVC: Beliebige 3 Ziffern (z.B. 123)
PLZ: Beliebig (z.B. 12345)

### 3. Webhook lokal testen mit Stripe CLI

```bash
# 1. Stripe CLI installieren
brew install stripe/stripe-cli/stripe

# 2. Einloggen
stripe login

# 3. Webhooks an lokalen Server weiterleiten
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 4. In neuem Terminal: Test-Events senden
stripe trigger checkout.session.completed
```

### 4. Manueller Test-Flow

1. Onboarding durchlaufen
2. Auf Paywall-Seite landen
3. "Strategie freischalten" klicken
4. Auf Stripe Checkout: Testkarte eingeben
5. Zahlung bestatigen
6. Auf Success-Page landen
7. Zu Strategie weitergeleitet werden
8. Premium-Badge in der Navigation prufen

### 5. Edge Cases testen

- [ ] Abgebrochene Zahlung (cancel_url)
- [ ] Doppelte Zahlungen verhindern
- [ ] Seiten-Refresh wahrend Checkout
- [ ] Direkt-Zugriff auf `/portal/strategie` ohne Premium
- [ ] Webhook-Wiederholungen (Idempotenz)

---

## 15. Checkliste fur Go-Live

### Vor Production:

- [ ] Test-Keys durch Live-Keys ersetzen
- [ ] `NEXT_PUBLIC_BASE_URL` auf Produktions-Domain setzen
- [ ] Webhook-URL in Stripe Dashboard aktualisieren
- [ ] SSL-Zertifikat vorhanden
- [ ] Error-Tracking einrichten (z.B. Sentry)
- [ ] Bestatigungsmail einrichten
- [ ] AGB und Widerrufsbelehrung verlinken
- [ ] DSGVO-Hinweise bei Checkout

### Post-Launch Monitoring:

- [ ] Stripe Dashboard auf Zahlungen prufen
- [ ] Webhook-Logs in Stripe uberwachen
- [ ] Conversion-Rate tracken
- [ ] Fehlerrate uberwachen

---

## 16. Dateistruktur nach Implementation

```
eltern-kompass/
├── app/
│   ├── api/
│   │   └── stripe/
│   │       ├── create-checkout/
│   │       │   └── route.ts          # NEU: Checkout Session erstellen
│   │       └── webhook/
│   │           └── route.ts          # NEU: Webhook Handler
│   └── portal/
│       ├── ergebnis/
│       │   └── page.tsx              # GEANDERT: Paywall statt Redirect
│       ├── onboarding/
│       │   └── page.tsx              # GEANDERT: Redirect zu /ergebnis
│       ├── payment-success/
│       │   └── page.tsx              # NEU: Success Page
│       └── strategie/
│           └── page.tsx              # GEANDERT: Premium-Check
├── hooks/
│   └── usePremium.ts                 # NEU: Premium-Status Hook
├── lib/
│   └── stripe/
│       ├── client.ts                 # NEU: Stripe Server Client
│       └── config.ts                 # NEU: Stripe Client Config
├── .env.local                        # NEU: Environment Variables
└── .env.example                      # NEU: Beispiel-Config
```

---

## 17. Zeitschatzung

| Aufgabe | Geschatzte Zeit |
|---------|-----------------|
| Paywall-Screen | 2h |
| Onboarding-Redirect | 15min |
| Stripe Setup | 30min |
| Environment Variables | 15min |
| Stripe Client | 30min |
| API: create-checkout | 1h |
| API: webhook | 1.5h |
| usePremium Hook | 1h |
| Route Protection | 30min |
| Success Page | 1h |
| Testing | 2h |
| **Gesamt** | **~10h** |

---

## 18. Nachste Schritte (Phase 2)

Nach erfolgreicher Stripe-Integration:

1. **Xano Backend Integration**
   - User-Tabelle um Premium-Feld erweitern
   - API-Endpunkt fur Premium-Status
   - Webhook ruft Xano API auf

2. **E-Mail Benachrichtigungen**
   - Bestatigungsmail nach Kauf
   - Willkommensmail mit nachsten Schritten

3. **Analytics**
   - Conversion-Tracking
   - Funnel-Analyse
   - A/B-Testing der Paywall

4. **Erweiterte Features**
   - Gutscheincodes
   - Rabattaktionen
   - Referral-Programm
