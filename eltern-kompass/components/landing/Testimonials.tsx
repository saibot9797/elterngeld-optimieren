"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

// Beispiel-Testimonials (später durch echte ersetzen)
const testimonials = [
  {
    name: "Sarah M.",
    location: "München",
    image: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Durch den Steuerklassenwechsel-Tipp haben wir über 2.800€ mehr Elterngeld bekommen. Das hätten wir ohne Eltern-Kompass nie gewusst!",
    highlight: "+2.800 €",
  },
  {
    name: "Thomas & Julia K.",
    location: "Berlin",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Die Aufteilung zwischen Basiselterngeld und ElterngeldPlus war für uns ein Buch mit sieben Siegeln. Der Optimierer hat uns genau gezeigt, wie wir das Maximum rausholen.",
    highlight: "+3.200 €",
  },
  {
    name: "Lisa F.",
    location: "Hamburg",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Als Alleinerziehende dachte ich, ich hätte keinen Spielraum. Falsch gedacht! Mit den Tipps zur Elternzeit-Planung konnte ich deutlich mehr rausholen.",
    highlight: "+1.900 €",
  },
  {
    name: "Michael & Anna S.",
    location: "Köln",
    image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
    rating: 5,
    text: "Der Partnerschaftsbonus war uns völlig unbekannt. Dank Eltern-Kompass haben wir 4 zusätzliche Monate ElterngeldPlus bekommen!",
    highlight: "+4 Monate",
  },
];

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={`h-4 w-4 ${
            i < rating
              ? "fill-[#00b67a] text-[#00b67a]"
              : "fill-gray-200 text-gray-200"
          }`}
        />
      ))}
    </div>
  );
}

export function Testimonials() {
  return (
    <section className="py-20 gradient-subtle">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Das sagen unsere Kund:innen
          </h2>
          <p className="text-lg text-muted-foreground">
            Über 2.000 Familien haben mit Eltern-Kompass ihr Elterngeld optimiert.
          </p>

          {/* Trustpilot Summary */}
          <div className="mt-6 inline-flex items-center gap-3 bg-white rounded-full px-5 py-2 shadow-sm">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-[#00b67a] text-[#00b67a]" />
              ))}
            </div>
            <span className="font-semibold">4,9/5</span>
            <span className="text-muted-foreground text-sm">basierend auf 127 Bewertungen</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <Card
              key={index}
              className="shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden"
            >
              <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                  <Quote className="h-8 w-8 text-primary/20" />
                </div>

                {/* Testimonial Text */}
                <p className="text-foreground mb-6 leading-relaxed">
                  &ldquo;{testimonial.text}&rdquo;
                </p>

                {/* Highlight Badge */}
                <div className="mb-6">
                  <span className="inline-block px-3 py-1 rounded-full text-sm font-semibold gradient-primary text-white">
                    {testimonial.highlight}
                  </span>
                </div>

                {/* Author */}
                <div className="flex items-center gap-4 pt-4 border-t">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {testimonial.location}
                    </p>
                  </div>
                  <StarRating rating={testimonial.rating} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Trustpilot CTA */}
        <div className="mt-12 text-center">
          <a
            href="https://www.trustpilot.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <span>Alle Bewertungen auf</span>
            <svg className="h-4 w-4" viewBox="0 0 126 31" xmlns="http://www.w3.org/2000/svg">
              <path d="M33.3 15.5l4.6-3.4h-5.7L30.5 7l-1.7 5.1h-5.7l4.6 3.4-1.8 5.4 4.6-3.4 4.6 3.4-1.8-5.4z" fill="#00b67a"/>
              <path d="M41.5 21.2V9.9h2.1v9.4h5.8v1.9h-7.9zm12.1 0V9.9h2.1v11.3h-2.1zm7.3 0V11.8h-3.5V9.9h9.1v1.9h-3.5v9.4h-2.1zm10.9 0V9.9h5.4c1.7 0 2.9.4 3.7 1.2.6.6.9 1.4.9 2.4 0 1.7-1 2.8-2.5 3.3l3 4.4h-2.5l-2.7-4.1h-3.2v4.1h-2.1zm2.1-5.9h3.1c1.5 0 2.3-.7 2.3-1.9 0-1.2-.8-1.8-2.3-1.8h-3.1v3.7zm12.6 5.9V9.9h2.1v6.8c0 1.6.9 2.7 2.7 2.7s2.7-1.1 2.7-2.7V9.9h2.1v6.8c0 2.8-1.8 4.7-4.8 4.7-3 0-4.8-1.9-4.8-4.7zm16.6.2c-1.4 0-2.5-.4-3.4-1.2-.9-.8-1.4-1.9-1.4-3.2h2.2c0 .8.3 1.4.8 1.9.5.5 1.1.7 1.9.7 1.5 0 2.3-.7 2.3-1.7 0-.5-.2-.9-.5-1.2-.4-.3-1-.6-1.9-.8-1.3-.3-2.3-.7-3-1.3-.7-.6-1-1.4-1-2.4 0-1 .4-1.9 1.2-2.5.8-.6 1.8-1 3.1-1 1.3 0 2.3.4 3.1 1.1.8.7 1.2 1.7 1.2 2.9h-2.2c0-.6-.2-1.1-.6-1.5-.4-.4-1-.6-1.7-.6-.6 0-1.1.2-1.5.5-.4.3-.6.7-.6 1.3 0 .5.2.9.5 1.2.4.3 1 .5 1.9.7 1.3.3 2.3.8 3 1.4.7.6 1 1.5 1 2.5 0 1.1-.4 2-1.2 2.7-.8.6-1.9 1-3.2 1zm10.5-.2V11.8h-3.5V9.9h9.1v1.9h-3.5v9.4h-2.1z" fill="#191919"/>
            </svg>
            <span>ansehen →</span>
          </a>
        </div>
      </div>
    </section>
  );
}
