import type { Lead, QuickCheckData } from "@/types";

const XANO_BASE_URL = process.env.NEXT_PUBLIC_XANO_API_URL || "";

interface XanoResponse<T> {
  data?: T;
  error?: string;
}

/**
 * Speichert einen Lead in Xano
 */
export async function saveLead(lead: Lead): Promise<XanoResponse<{ id: number }>> {
  if (!XANO_BASE_URL) {
    console.warn("Xano API URL not configured");
    return { error: "API nicht konfiguriert" };
  }

  try {
    const response = await fetch(`${XANO_BASE_URL}/leads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: lead.email,
        due_date: lead.dueDate?.toISOString(),
        bundesland: lead.bundesland,
        quick_check_data: lead.quickCheckData ? JSON.stringify(lead.quickCheckData) : null,
        consent_marketing: lead.consentMarketing,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error saving lead:", error);
    return { error: "Fehler beim Speichern. Bitte versuche es erneut." };
  }
}

/**
 * Speichert ein Quick-Check Ergebnis in Xano
 */
export async function saveQuickCheckResult(
  quickCheckData: QuickCheckData,
  result: {
    monthlyElterngeld: number;
    totalElterngeld: number;
    months: number;
    optimizationPotential: number;
  }
): Promise<XanoResponse<{ id: number }>> {
  if (!XANO_BASE_URL) {
    console.warn("Xano API URL not configured");
    return { error: "API nicht konfiguriert" };
  }

  try {
    const response = await fetch(`${XANO_BASE_URL}/quick-check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        due_date: quickCheckData.dueDate?.toISOString(),
        employment: quickCheckData.employment,
        monthly_net_income: quickCheckData.monthlyNetIncome,
        has_partner: quickCheckData.hasPartner,
        bundesland: quickCheckData.bundesland,
        monthly_elterngeld: result.monthlyElterngeld,
        total_elterngeld: result.totalElterngeld,
        months: result.months,
        optimization_potential: result.optimizationPotential,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return { data };
  } catch (error) {
    console.error("Error saving quick check result:", error);
    return { error: "Fehler beim Speichern. Bitte versuche es erneut." };
  }
}
