"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Header } from "@/components/landing/Header";
import { ArrowRight, Lock, Mail, CheckCircle2 } from "lucide-react";
import { useQuickCheck } from "@/hooks/useQuickCheck";
import { calculateQuickCheck, formatCurrency } from "@/lib/calculations/elterngeld-quick";

export default function RegistrierenPage() {
  const router = useRouter();
  const { data, isLoaded } = useQuickCheck();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const result = isLoaded ? calculateQuickCheck(data) : null;

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email) {
      newErrors.email = "E-Mail ist erforderlich";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Bitte gib eine gültige E-Mail-Adresse ein";
    }

    if (!password) {
      newErrors.password = "Passwort ist erforderlich";
    } else if (password.length < 8) {
      newErrors.password = "Passwort muss mindestens 8 Zeichen haben";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);

    // Simuliere kurze Ladezeit
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Speichere User-Daten lokal (später: Xano Auth)
    localStorage.setItem(
      "eltern-kompass-auth",
      JSON.stringify({ email, isAuthenticated: true })
    );

    // Nach erfolgreicher Registrierung zum Onboarding weiterleiten
    router.push("/portal/onboarding");
  };

  return (
    <>
      <Header />
      <div className="min-h-screen gradient-subtle pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Potenzial-Teaser */}
          {result && (
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-50 border border-green-200 mb-3">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-green-700 font-medium text-sm">
                  Dein Potenzial: {formatCurrency(result.optimizationPotential)}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Jetzt Konto erstellen
              </h1>
              <p className="text-muted-foreground">
                Sichere deine Berechnung und erhalte deine persönliche Strategie
              </p>
            </div>
          )}

          {!result && (
            <div className="text-center mb-8">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Konto erstellen
              </h1>
              <p className="text-muted-foreground">
                Erstelle dein Konto, um den Elterngeld-Optimierer zu nutzen
              </p>
            </div>
          )}

          <Card className="shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg text-center">Registrierung</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-Mail-Adresse</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="deine@email.de"
                      className={`pl-9 ${errors.email ? "border-red-500" : ""}`}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  {errors.email && (
                    <p className="text-xs text-red-500">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mindestens 8 Zeichen"
                      className={`pl-9 ${errors.password ? "border-red-500" : ""}`}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  {errors.password && (
                    <p className="text-xs text-red-500">{errors.password}</p>
                  )}
                </div>

                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    "Wird erstellt..."
                  ) : (
                    <>
                      Konto erstellen
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Mit der Registrierung akzeptierst du unsere{" "}
                  <Link href="/datenschutz" className="underline hover:text-primary">
                    Datenschutzerklärung
                  </Link>
                </p>
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  Bereits ein Konto?{" "}
                  <Link href="/login" className="text-primary font-medium hover:underline">
                    Jetzt anmelden
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Trust Signals */}
          <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Lock className="h-3 w-3" />
              <span>SSL verschlüsselt</span>
            </div>
            <div className="flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>DSGVO konform</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
