"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SuccessNotification } from "@/components/ui/SuccessNotification";
import { ErrorNotification } from "@/components/ui/ErrorNotification";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { BoreholeForm } from "@/components/boreholes/BoreholeForm";
import { StrataTab } from "@/components/boreholes/StrataTab";
import { CoreRunsTab } from "@/components/boreholes/CoreRunsTab";
import { WaterStrikesTab } from "@/components/boreholes/WaterStrikesTab";
import { InstallationsTab } from "@/components/boreholes/InstallationsTab";
import { HoleProgressTab } from "@/components/boreholes/HoleProgressTab";
import type { Borehole } from "@/types/database";

export default function BoreholeEditorPage() {
  const params = useParams();
  const boreholeId = params.id as string;

  const [borehole, setBorehole] = useState<Borehole | null>(null);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const fetchBorehole = useCallback(async () => {
    try {
      const res = await fetch(`/api/boreholes/${boreholeId}`);
      const json = await res.json();

      if (res.ok && json.data) {
        setBorehole(json.data);
      } else {
        setErrorMessage(json.error || "Borehole not found");
      }
    } catch {
      setErrorMessage("Failed to load borehole data");
    } finally {
      setLoading(false);
    }
  }, [boreholeId]);

  useEffect(() => {
    fetchBorehole();
  }, [fetchBorehole]);

  const handleUpdateSuccess = (message: string) => {
    setSuccessMessage(message);
    fetchBorehole();
  };

  const handleGeneratePdf = async () => {
    setGeneratingPdf(true);
    setErrorMessage(null);

    try {
      const res = await fetch(`/api/boreholes/${boreholeId}/generate-pdf`, {
        method: "POST",
      });

      if (!res.ok) {
        const json = await res.json();
        setErrorMessage(json.error || "Failed to generate PDF");
        return;
      }

      // Create a blob from the response and trigger download
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download =
        res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] ||
        `borehole-log-${borehole?.borehole_id || "report"}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      setSuccessMessage("PDF generated successfully");
    } catch {
      setErrorMessage("Failed to generate PDF. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!borehole) {
    return (
      <div className="space-y-4">
        <Link
          href="/projects"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Projects
        </Link>
        <p className="text-muted-foreground">Borehole not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {successMessage && (
        <SuccessNotification
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
      {errorMessage && (
        <ErrorNotification
          message={errorMessage}
          onDismiss={() => setErrorMessage(null)}
        />
      )}

      {/* Back Link */}
      <Link
        href={`/projects/${borehole.project_id}`}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Project
      </Link>

      {/* Borehole Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            {borehole.borehole_id}
          </h1>
          <p className="text-sm text-muted-foreground">
            {borehole.hole_type} &middot; Scale {borehole.scale}
            {borehole.location_description &&
              ` · ${borehole.location_description}`}
          </p>
        </div>
        <Button size="lg" className="text-base font-semibold shadow-md" onClick={handleGeneratePdf} disabled={generatingPdf}>
          {generatingPdf ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <FileText className="mr-2 h-5 w-5" />
          )}
          {generatingPdf ? "Generating..." : "Generate PDF"}
        </Button>
      </div>

      {/* Instruction Text */}
      <p className="text-sm text-muted-foreground -mt-2">
        Select a tab below to add data. Fill in Strata, Core Runs, and other sections, then click <strong>Generate PDF</strong>.
      </p>

      {/* Tabbed Interface */}
      <Tabs defaultValue="header" className="w-full">
        <TabsList className="w-full max-w-full justify-start overflow-x-auto scrollbar-none">
          <TabsTrigger value="header">Header</TabsTrigger>
          <TabsTrigger value="strata">Strata</TabsTrigger>
          <TabsTrigger value="core-runs">Core Runs</TabsTrigger>
          <TabsTrigger value="water-strikes">Water Strikes</TabsTrigger>
          <TabsTrigger value="installations">Installations</TabsTrigger>
          <TabsTrigger value="hole-progress">Hole Progress</TabsTrigger>
        </TabsList>

        <TabsContent value="header" className="mt-6">
          <BoreholeForm
            projectId={borehole.project_id}
            borehole={borehole}
            mode="edit"
            onSuccess={handleUpdateSuccess}
            onError={(msg) => setErrorMessage(msg)}
          />
        </TabsContent>

        <TabsContent value="strata" className="mt-6">
          <StrataTab
            boreholeId={boreholeId}
            onSuccess={(msg) => setSuccessMessage(msg)}
            onError={(msg) => setErrorMessage(msg)}
          />
        </TabsContent>

        <TabsContent value="core-runs" className="mt-6">
          <CoreRunsTab
            boreholeId={boreholeId}
            onSuccess={(msg) => setSuccessMessage(msg)}
            onError={(msg) => setErrorMessage(msg)}
          />
        </TabsContent>

        <TabsContent value="water-strikes" className="mt-6">
          <WaterStrikesTab
            boreholeId={boreholeId}
            onSuccess={(msg) => setSuccessMessage(msg)}
            onError={(msg) => setErrorMessage(msg)}
          />
        </TabsContent>

        <TabsContent value="installations" className="mt-6">
          <InstallationsTab
            boreholeId={boreholeId}
            onSuccess={(msg) => setSuccessMessage(msg)}
            onError={(msg) => setErrorMessage(msg)}
          />
        </TabsContent>

        <TabsContent value="hole-progress" className="mt-6">
          <HoleProgressTab
            boreholeId={boreholeId}
            onSuccess={(msg) => setSuccessMessage(msg)}
            onError={(msg) => setErrorMessage(msg)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
