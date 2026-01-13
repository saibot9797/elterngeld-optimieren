"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Upload,
  Check,
  AlertCircle,
  Loader2,
  X,
  FileCheck,
  Receipt,
  Baby,
  Heart,
} from "lucide-react";
import type { OnboardingData } from "@/hooks/useOnboarding";

interface Step3Props {
  data: OnboardingData;
  updateData: (data: Partial<OnboardingData>) => void;
}

interface DocumentType {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  relevantFor: string;
}

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: "lohnabrechnung",
    name: "Lohnabrechnung",
    description: "Brutto, Netto, Steuerklasse, Sozialabgaben",
    icon: <Receipt className="h-6 w-6" />,
    relevantFor: "Alle Angestellten",
  },
  {
    id: "steuerbescheid",
    name: "Steuerbescheid",
    description: "Jahreseinkommen, Gewinn aus Selbständigkeit",
    icon: <FileText className="h-6 w-6" />,
    relevantFor: "Selbständige, Mischeinkommen",
  },
  {
    id: "mutterpass",
    name: "Mutterpass",
    description: "ET-Datum, Mehrlinge, Frühgeburt-Hinweise",
    icon: <Baby className="h-6 w-6" />,
    relevantFor: "Optional",
  },
  {
    id: "mutterschaftsgeld",
    name: "Mutterschaftsgeld-Bescheid",
    description: "Täglicher Betrag, Zeitraum",
    icon: <Heart className="h-6 w-6" />,
    relevantFor: "Nach Antrag bei KK",
  },
];

interface UploadedDocument {
  id: string;
  type: string;
  name: string;
  status: "uploading" | "analyzing" | "done" | "error";
  extractedData?: Record<string, string>;
}

export function Step3Dokumente({ data, updateData }: Step3Props) {
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const simulateUpload = async (docType: string, fileName: string) => {
    const newDoc: UploadedDocument = {
      id: Math.random().toString(36).substr(2, 9),
      type: docType,
      name: fileName,
      status: "uploading",
    };

    setUploadedDocs((prev) => [...prev, newDoc]);

    // Simuliere Upload
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setUploadedDocs((prev) =>
      prev.map((d) =>
        d.id === newDoc.id ? { ...d, status: "analyzing" as const } : d
      )
    );

    // Simuliere KI-Analyse
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Simulierte extrahierte Daten
    const extractedData: Record<string, string> = {
      lohnabrechnung: JSON.stringify({
        brutto: "4.250 €",
        netto: "2.680 €",
        steuerklasse: "4",
        kirchensteuer: "Ja",
      }),
      steuerbescheid: JSON.stringify({
        jahreseinkommen: "52.000 €",
        gewinn: "12.500 €",
      }),
      mutterpass: JSON.stringify({
        et: "15.08.2024",
        mehrlinge: "Nein",
      }),
      mutterschaftsgeld: JSON.stringify({
        betrag: "13 €/Tag",
        zeitraum: "6 Wochen vor bis 8 Wochen nach Geburt",
      }),
    };

    setUploadedDocs((prev) =>
      prev.map((d) =>
        d.id === newDoc.id
          ? {
              ...d,
              status: "done" as const,
              extractedData: JSON.parse(extractedData[docType] || "{}"),
            }
          : d
      )
    );

    // Update dokumenteIds
    updateData({
      dokumenteIds: [...data.dokumenteIds, newDoc.id],
    });
  };

  const handleDrop = (e: React.DragEvent, docType: string) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      simulateUpload(docType, file.name);
    }
  };

  const handleFileSelect = (docType: string) => {
    // In einer echten App würde hier ein File-Input verwendet
    const mockFileName = `${docType}_dokument.pdf`;
    simulateUpload(docType, mockFileName);
  };

  const removeDocument = (docId: string) => {
    setUploadedDocs((prev) => prev.filter((d) => d.id !== docId));
    updateData({
      dokumenteIds: data.dokumenteIds.filter((id) => id !== docId),
    });
  };

  const getUploadedDocForType = (typeId: string) => {
    return uploadedDocs.find((d) => d.type === typeId);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">Dokumente hochladen</h2>
        <p className="text-muted-foreground">
          Optional: Unsere KI extrahiert die Daten automatisch
        </p>
      </div>

      {/* Dokument-Karten */}
      <div className="grid gap-4">
        {DOCUMENT_TYPES.map((docType) => {
          const uploadedDoc = getUploadedDocForType(docType.id);

          return (
            <Card
              key={docType.id}
              className={`transition-all ${
                isDragging ? "border-primary border-dashed" : ""
              }`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => handleDrop(e, docType.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div
                    className={`p-3 rounded-lg ${
                      uploadedDoc?.status === "done"
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {uploadedDoc?.status === "done" ? (
                      <FileCheck className="h-6 w-6" />
                    ) : (
                      docType.icon
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium">{docType.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {docType.description}
                        </p>
                        <span className="text-xs text-muted-foreground">
                          {docType.relevantFor}
                        </span>
                      </div>

                      {!uploadedDoc && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleFileSelect(docType.id)}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Hochladen
                        </Button>
                      )}
                    </div>

                    {/* Upload Status */}
                    {uploadedDoc && (
                      <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium truncate">
                            {uploadedDoc.name}
                          </span>
                          {uploadedDoc.status === "done" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={() => removeDocument(uploadedDoc.id)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {uploadedDoc.status === "uploading" && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>Wird hochgeladen...</span>
                          </div>
                        )}

                        {uploadedDoc.status === "analyzing" && (
                          <div className="flex items-center gap-2 text-sm text-blue-600">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span>KI analysiert Dokument...</span>
                          </div>
                        )}

                        {uploadedDoc.status === "done" &&
                          uploadedDoc.extractedData && (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-sm text-green-600 mb-2">
                                <Check className="h-4 w-4" />
                                <span>Daten erfolgreich extrahiert</span>
                              </div>
                              <div className="grid grid-cols-2 gap-2">
                                {Object.entries(uploadedDoc.extractedData).map(
                                  ([key, value]) => (
                                    <div key={key} className="text-xs">
                                      <span className="text-muted-foreground capitalize">
                                        {key}:
                                      </span>{" "}
                                      <span className="font-medium">{value}</span>
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          )}

                        {uploadedDoc.status === "error" && (
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="h-4 w-4" />
                            <span>Fehler beim Verarbeiten</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info-Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800">
            <p className="font-medium mb-1">Dieser Schritt ist optional</p>
            <p>
              Du kannst auch ohne Dokumente fortfahren. Die Dokumente helfen uns
              aber, deine Situation noch genauer zu analysieren.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
