import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Impressum | Eltern-Kompass",
  description: "Impressum von Eltern-Kompass",
};

export default function ImpressumPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Impressum</h1>

        <div className="prose prose-gray max-w-none">
          <h2>Angaben gemäß § 5 TMG</h2>
          <p>
            [Name einfügen]
            <br />
            [Straße und Hausnummer]
            <br />
            [PLZ Ort]
          </p>

          <h2>Kontakt</h2>
          <p>
            E-Mail: kontakt@eltern-kompass.de
          </p>

          <h2>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h2>
          <p>
            [Name einfügen]
            <br />
            [Anschrift]
          </p>

          <h2>Haftungsausschluss</h2>

          <h3>Haftung für Inhalte</h3>
          <p>
            Die Inhalte unserer Seiten wurden mit größter Sorgfalt erstellt. Für
            die Richtigkeit, Vollständigkeit und Aktualität der Inhalte können
            wir jedoch keine Gewähr übernehmen.
          </p>

          <h3>Haftung für Links</h3>
          <p>
            Unser Angebot enthält Links zu externen Webseiten Dritter, auf deren
            Inhalte wir keinen Einfluss haben. Deshalb können wir für diese
            fremden Inhalte auch keine Gewähr übernehmen.
          </p>

          <h2>Hinweis zur Elterngeld-Berechnung</h2>
          <p>
            Die auf dieser Website bereitgestellten Berechnungen und
            Informationen zum Elterngeld dienen ausschließlich der allgemeinen
            Information und Orientierung. Sie ersetzen keine professionelle
            Rechts- oder Steuerberatung.
          </p>
          <p>
            Die tatsächliche Höhe des Elterngeldes wird von der zuständigen
            Elterngeldstelle festgelegt und kann von unseren Berechnungen
            abweichen. Für die Richtigkeit der Berechnungen übernehmen wir keine
            Gewähr.
          </p>

          <p className="text-sm text-muted-foreground mt-8">
            Stand: Januar 2026
          </p>
        </div>
      </div>
    </div>
  );
}
