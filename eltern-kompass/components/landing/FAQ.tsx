"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Ist der Quick-Check wirklich kostenlos?",
    answer:
      "Ja, der Quick-Check mit 5 Fragen ist komplett kostenlos und unverbindlich. Du erhältst sofort eine Einschätzung deines Elterngeldes und des Optimierungspotenzials.",
  },
  {
    question: "Wie genau ist die Berechnung?",
    answer:
      "Der Quick-Check gibt dir eine erste Einschätzung basierend auf den BEEG-Formeln. Für eine exakte Berechnung mit allen Sonderfällen (Steuerklassen, Einmalzahlungen, etc.) empfehlen wir den Premium-Rechner oder die offizielle Elterngeldstelle.",
  },
  {
    question: "Was ist der Unterschied zwischen Basiselterngeld und ElterngeldPlus?",
    answer:
      "Basiselterngeld beträgt 65-67% deines Nettoeinkommens (max. 1.800€) für bis zu 14 Monate. ElterngeldPlus ist die Hälfte davon, dafür doppelt so lange beziehbar. Bei geplantem Teilzeit-Zuverdienst kann ElterngeldPlus vorteilhafter sein.",
  },
  {
    question: "Wann sollte ich die Steuerklasse wechseln?",
    answer:
      "Für maximales Elterngeld sollte die günstigere Steuerklasse (meist III) in mindestens 7 der 12 Monate vor Mutterschutzbeginn gelten. Ein Wechsel sollte also idealerweise 7-9 Monate vor dem Geburtstermin erfolgen.",
  },
  {
    question: "Werden meine Daten gespeichert?",
    answer:
      "Der kostenlose Quick-Check speichert keine personenbezogenen Daten. Nur wenn du dich für den E-Mail-Newsletter anmeldest, speichern wir deine E-Mail-Adresse DSGVO-konform in Deutschland.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Häufige Fragen
          </h2>
          <p className="text-lg text-muted-foreground">
            Alles, was du über Elterngeld und unseren Rechner wissen musst.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent>{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
