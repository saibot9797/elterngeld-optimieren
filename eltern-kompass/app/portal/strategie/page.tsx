"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Download,
  Calendar,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Clock,
  Euro,
  Users,
  FileText,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { calculateMonthlyElterngeld, formatCurrency } from "@/lib/calculations/elterngeld-quick";

export default function StrategiePage() {
  const router = useRouter();
  const { data, isLoaded, isComplete } = useOnboarding();
  const [activeTab, setActiveTab] = useState<"overview" | "timeline" | "actions">("overview");

  // Redirect wenn Onboarding nicht abgeschlossen
  useEffect(() => {
    if (isLoaded && !isComplete) {
      router.push("/portal/onboarding");
    }
  }, [isLoaded, isComplete, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-muted-foreground">Laden...</div>
      </div>
    );
  }

  // Berechne Ergebnisse
  const mutterMonatlich = calculateMonthlyElterngeld(data.mutter.monatlichesNetto);
  const partnerMonatlich = data.partner
    ? calculateMonthlyElterngeld(data.partner.monatlichesNetto)
    : 0;

  const totalElterngeld =
    mutterMonatlich * data.elternzeitPlan.monateMutter +
    partnerMonatlich * data.elternzeitPlan.monatePartner;

  // Mock Empfehlungen
  const steuerklassenEmpfehlung = {
    aktuell: { mutter: data.mutter.steuerklasse || 4, partner: data.partner?.steuerklasse || 4 },
    optimal: { mutter: 3, partner: 5 },
    wechselBis: data.errechneterTermin
      ? new Date(
          new Date(data.errechneterTermin).setMonth(
            data.errechneterTermin.getMonth() - 7
          )
        )
      : null,
    ersparnis: 1850,
  };

  const elterngeldTypEmpfehlung = {
    typ: "Kombination" as const,
    beschreibung: "12 Monate Basiselterngeld + 4 Monate ElterngeldPlus",
    vorteil: 680,
  };

  const actions = [
    {
      title: "Steuerklasse wechseln",
      deadline: steuerklassenEmpfehlung.wechselBis?.toLocaleDateString("de-DE"),
      priority: "hoch",
      done: false,
    },
    {
      title: "Elterngeld-Antrag vorbereiten",
      deadline: "Nach der Geburt",
      priority: "mittel",
      done: false,
    },
    {
      title: "Arbeitgeber über Elternzeit informieren",
      deadline: "7 Wochen vor Beginn",
      priority: "hoch",
      done: false,
    },
    {
      title: "Mutterschaftsgeld beantragen",
      deadline: "7 Wochen vor ET",
      priority: "mittel",
      done: false,
    },
  ];

  // Generiere Timeline-Monate
  const generateTimeline = () => {
    if (!data.errechneterTermin) return [];

    const timeline = [];
    const startDate = new Date(data.errechneterTermin);

    for (let i = 0; i < data.elternzeitPlan.monateMutter + data.elternzeitPlan.monatePartner; i++) {
      const month = new Date(startDate);
      month.setMonth(month.getMonth() + i);

      const isMutter = i < data.elternzeitPlan.monateMutter;
      const isPartner = i >= data.elternzeitPlan.monateMutter;

      timeline.push({
        month: month.toLocaleDateString("de-DE", { month: "short", year: "numeric" }),
        mutter: isMutter ? mutterMonatlich : 0,
        partner: isPartner ? partnerMonatlich : 0,
        typ: i < 12 ? "Basis" : "Plus",
      });
    }

    return timeline;
  };

  const timeline = generateTimeline();

  return (
    <div className="min-h-screen bg-gray-50 py-6 lg:py-10 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-sm font-medium mb-2">
              <CheckCircle2 className="h-4 w-4" />
              Premium freigeschaltet
            </div>
            <h1 className="text-2xl md:text-3xl font-bold">
              Deine Elterngeld-Strategie
            </h1>
          </div>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" />
            PDF exportieren
          </Button>
        </div>

        {/* Übersicht */}
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-100">
                  <Euro className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gesamt-Elterngeld</p>
                  <p className="text-2xl font-bold">{formatCurrency(totalElterngeld)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Deine Ersparnis</p>
                  <p className="text-2xl font-bold text-green-600">
                    +{formatCurrency(steuerklassenEmpfehlung.ersparnis + elterngeldTypEmpfehlung.vorteil)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-100">
                  <Clock className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Bezugsdauer</p>
                  <p className="text-2xl font-bold">
                    {data.elternzeitPlan.monateMutter + data.elternzeitPlan.monatePartner} Monate
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {[
            { id: "overview", label: "Empfehlungen" },
            { id: "timeline", label: "Bezugsplan" },
            { id: "actions", label: "Checkliste" },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Steuerklassen-Empfehlung */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Steuerklassen-Strategie
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">Aktuell</p>
                    <p className="font-medium">
                      {data.mutter.vorname}: Klasse {steuerklassenEmpfehlung.aktuell.mutter}
                    </p>
                    {data.partner && (
                      <p className="font-medium">
                        {data.partner.vorname}: Klasse {steuerklassenEmpfehlung.aktuell.partner}
                      </p>
                    )}
                  </div>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm text-green-700 mb-1">Empfohlen</p>
                    <p className="font-medium text-green-800">
                      {data.mutter.vorname}: Klasse {steuerklassenEmpfehlung.optimal.mutter}
                    </p>
                    {data.partner && (
                      <p className="font-medium text-green-800">
                        {data.partner.vorname}: Klasse {steuerklassenEmpfehlung.optimal.partner}
                      </p>
                    )}
                  </div>
                </div>

                {steuerklassenEmpfehlung.wechselBis && (
                  <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                    <AlertCircle className="h-5 w-5 text-amber-600" />
                    <div className="text-sm">
                      <p className="font-medium text-amber-800">
                        Wechsel bis{" "}
                        {steuerklassenEmpfehlung.wechselBis.toLocaleDateString("de-DE")}
                      </p>
                      <p className="text-amber-700">
                        Damit der Wechsel 7 Monate vor Mutterschutz wirksam ist
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <span className="text-muted-foreground">Geschätzte Ersparnis:</span>
                  <span className="text-xl font-bold text-green-600">
                    +{formatCurrency(steuerklassenEmpfehlung.ersparnis)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Elterngeld-Typ */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Basis vs. ElterngeldPlus
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                  <p className="font-medium text-primary mb-1">
                    Unsere Empfehlung: {elterngeldTypEmpfehlung.typ}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {elterngeldTypEmpfehlung.beschreibung}
                  </p>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Vorteil gegenüber reinem Basiselterngeld:</span>
                  <span className="text-xl font-bold text-green-600">
                    +{formatCurrency(elterngeldTypEmpfehlung.vorteil)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Partnerschaftsbonus */}
            {data.hatPartner && data.elternzeitPlan.partnerschaftsbonus && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Partnerschaftsbonus
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Da ihr beide Interesse am Partnerschaftsbonus habt, könnt ihr zusätzlich 4 ElterngeldPlus-Monate pro Person erhalten.
                  </p>
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="font-medium text-blue-800 mb-2">Voraussetzungen:</p>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4" />
                        Beide arbeiten 24-32 Stunden/Woche
                      </li>
                      <li className="flex items-center gap-2">
                        <ChevronRight className="h-4 w-4" />
                        Gleichzeitig für 4 aufeinanderfolgende Monate
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "timeline" && (
          <Card>
            <CardHeader>
              <CardTitle>Monatsgenauer Bezugsplan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {timeline.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50"
                  >
                    <div className="w-24 text-sm font-medium">{item.month}</div>
                    <div className="flex-1 flex gap-2">
                      {item.mutter > 0 && (
                        <div className="flex-1 bg-pink-100 rounded px-3 py-1 text-sm text-pink-700">
                          {data.mutter.vorname}: {formatCurrency(item.mutter)}
                        </div>
                      )}
                      {item.partner > 0 && (
                        <div className="flex-1 bg-blue-100 rounded px-3 py-1 text-sm text-blue-700">
                          {data.partner?.vorname}: {formatCurrency(item.partner)}
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground w-12">{item.typ}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "actions" && (
          <Card>
            <CardHeader>
              <CardTitle>Deine To-Do-Liste</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {actions.map((action, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-4 p-4 rounded-lg border hover:bg-gray-50"
                  >
                    <div
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        action.done
                          ? "bg-green-500 border-green-500"
                          : "border-gray-300"
                      }`}
                    >
                      {action.done && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{action.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Deadline: {action.deadline}
                      </p>
                    </div>
                    <div
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        action.priority === "hoch"
                          ? "bg-red-100 text-red-700"
                          : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {action.priority}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
