import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Datenschutz | Eltern-Kompass",
  description: "Datenschutzerklärung von Eltern-Kompass",
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <Button variant="ghost" asChild className="mb-8">
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zur Startseite
          </Link>
        </Button>

        <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

        <div className="prose prose-gray max-w-none">
          <h2>1. Datenschutz auf einen Blick</h2>
          <h3>Allgemeine Hinweise</h3>
          <p>
            Die folgenden Hinweise geben einen einfachen Überblick darüber, was
            mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website
            besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie
            persönlich identifiziert werden können.
          </p>

          <h3>Datenerfassung auf dieser Website</h3>
          <p>
            <strong>
              Wer ist verantwortlich für die Datenerfassung auf dieser Website?
            </strong>
          </p>
          <p>
            Die Datenverarbeitung auf dieser Website erfolgt durch den
            Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum
            dieser Website entnehmen.
          </p>

          <h2>2. Hosting</h2>
          <p>
            Diese Website wird bei einem externen Dienstleister gehostet
            (Hoster). Die personenbezogenen Daten, die auf dieser Website
            erfasst werden, werden auf den Servern des Hosters gespeichert.
          </p>

          <h2>3. Allgemeine Hinweise und Pflichtinformationen</h2>
          <h3>Datenschutz</h3>
          <p>
            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen
            Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten
            vertraulich und entsprechend den gesetzlichen
            Datenschutzvorschriften sowie dieser Datenschutzerklärung.
          </p>

          <h2>4. Datenerfassung auf dieser Website</h2>
          <h3>Cookies</h3>
          <p>
            Diese Website verwendet keine Tracking-Cookies. Technisch notwendige
            Cookies (z.B. für die Speicherung Ihrer Eingaben im Quick-Check)
            werden nur lokal in Ihrem Browser gespeichert (localStorage).
          </p>

          <h3>Kontaktformular / E-Mail-Anmeldung</h3>
          <p>
            Wenn Sie sich für unseren Newsletter anmelden, werden Ihre Angaben
            (E-Mail-Adresse) zum Zwecke der Bearbeitung der Anfrage und für den
            Fall von Anschlussfragen bei uns gespeichert. Diese Daten geben wir
            nicht ohne Ihre Einwilligung weiter.
          </p>

          <h2>5. Ihre Rechte</h2>
          <p>Sie haben jederzeit das Recht:</p>
          <ul>
            <li>Auskunft über Ihre gespeicherten Daten zu erhalten</li>
            <li>Berichtigung unrichtiger Daten zu verlangen</li>
            <li>Löschung Ihrer Daten zu verlangen</li>
            <li>
              Einschränkung der Verarbeitung Ihrer Daten zu verlangen
            </li>
            <li>Der Verarbeitung Ihrer Daten zu widersprechen</li>
            <li>Datenübertragbarkeit zu verlangen</li>
          </ul>

          <p className="text-sm text-muted-foreground mt-8">
            Stand: Januar 2026
          </p>
        </div>
      </div>
    </div>
  );
}
