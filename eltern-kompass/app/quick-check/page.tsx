import type { Metadata } from "next";
import { QuickCheckWizard } from "@/components/quick-check/QuickCheckWizard";
import { Header } from "@/components/landing/Header";

export const metadata: Metadata = {
  title: "Quick-Check | Eltern-Kompass",
  description:
    "Berechne in 2 Minuten, wie viel Elterngeld dir zusteht und wie du mehr herausholen kannst.",
};

export default function QuickCheckPage() {
  return (
    <>
      <Header />
      <QuickCheckWizard />
    </>
  );
}
