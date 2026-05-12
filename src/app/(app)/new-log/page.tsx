"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowLeft, ArrowRight, FileText, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WizardStepper } from "@/components/wizard/WizardStepper";
import { StrataTab } from "@/components/boreholes/StrataTab";
import { CoreRunsTab } from "@/components/boreholes/CoreRunsTab";
import { WaterStrikesTab } from "@/components/boreholes/WaterStrikesTab";
import { InstallationsTab } from "@/components/boreholes/InstallationsTab";
import { HoleProgressTab } from "@/components/boreholes/HoleProgressTab";
import { SuccessNotification } from "@/components/ui/SuccessNotification";
import { ErrorNotification } from "@/components/ui/ErrorNotification";
import type { Project } from "@/types/database";

const SCALE_OPTIONS = ["1:50", "1:100", "1:200"];
const HOLE_TYPE_OPTIONS = [
  "Rotary",
  "Cable Percussion",
  "Window Sample",
  "Dynamic Probe",
];

export default function NewLogPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Step 1: Project state
  const [projectMode, setProjectMode] = useState<"existing" | "new">("new");
  const [existingProjects, setExistingProjects] = useState<Project[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [projectName, setProjectName] = useState("");
  const [projectNumber, setProjectNumber] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectLocation, setProjectLocation] = useState("");
  const [projectLoading, setProjectLoading] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [createdProjectName, setCreatedProjectName] = useState("");

  // Step 2: Borehole state
  const [boreholeIdField, setBoreholeIdField] = useState("");
  const [locationDescription, setLocationDescription] = useState("");
  const [easting, setEasting] = useState("");
  const [northing, setNorthing] = useState("");
  const [groundLevel, setGroundLevel] = useState("");
  const [scale, setScale] = useState("1:50");
  const [holeType, setHoleType] = useState("Rotary");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loggedBy, setLoggedBy] = useState("");
  const [boreholeLoading, setBoreholeLoading] = useState(false);
  const [createdBoreholeId, setCreatedBoreholeId] = useState<string | null>(null);
  const [createdBoreholeLabel, setCreatedBoreholeLabel] = useState("");

  // Step 4: Summary counts
  const [summaryCounts, setSummaryCounts] = useState({
    strata: 0,
    coreRuns: 0,
    waterStrikes: 0,
    installations: 0,
    holeProgress: 0,
  });
  const [generating, setGenerating] = useState(false);

  // Fetch existing projects
  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch("/api/projects");
      const json = await res.json();
      if (res.ok && json.data) {
        setExistingProjects(json.data);
      }
    } catch {
      // Silently fail - user can still create new
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  // Fetch summary counts when entering step 4
  const fetchSummaryCounts = useCallback(async () => {
    if (!createdBoreholeId) return;

    try {
      const [strataRes, coreRunsRes, waterStrikesRes, installationsRes, holeProgressRes] =
        await Promise.all([
          fetch(`/api/boreholes/${createdBoreholeId}/strata`),
          fetch(`/api/boreholes/${createdBoreholeId}/core-runs`),
          fetch(`/api/boreholes/${createdBoreholeId}/water-strikes`),
          fetch(`/api/boreholes/${createdBoreholeId}/installations`),
          fetch(`/api/boreholes/${createdBoreholeId}/hole-progress`),
        ]);

      const [strataJson, coreRunsJson, waterStrikesJson, installationsJson, holeProgressJson] =
        await Promise.all([
          strataRes.json(),
          coreRunsRes.json(),
          waterStrikesRes.json(),
          installationsRes.json(),
          holeProgressRes.json(),
        ]);

      setSummaryCounts({
        strata: strataJson.data?.length ?? 0,
        coreRuns: coreRunsJson.data?.length ?? 0,
        waterStrikes: waterStrikesJson.data?.length ?? 0,
        installations: installationsJson.data?.length ?? 0,
        holeProgress: holeProgressJson.data?.length ?? 0,
      });
    } catch {
      // Non-critical
    }
  }, [createdBoreholeId]);

  // Step 1 validation and submission
  const handleStep1Next = async () => {
    if (projectMode === "existing") {
      if (!selectedProjectId) {
        setErrorMessage("Please select a project");
        return;
      }
      const selected = existingProjects.find((p) => p.id === selectedProjectId);
      setCreatedProjectId(selectedProjectId);
      setCreatedProjectName(selected?.name ?? "");
      setCurrentStep(2);
      return;
    }

    // Validate new project fields
    if (!projectName.trim()) {
      setErrorMessage("Project name is required");
      return;
    }
    if (!projectNumber.trim()) {
      setErrorMessage("Project number is required");
      return;
    }
    if (!clientName.trim()) {
      setErrorMessage("Client name is required");
      return;
    }
    if (!projectLocation.trim()) {
      setErrorMessage("Location is required");
      return;
    }

    setProjectLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: projectName.trim(),
          project_number: projectNumber.trim(),
          client_name: clientName.trim(),
          location: projectLocation.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "Failed to create project");
        setProjectLoading(false);
        return;
      }

      setCreatedProjectId(json.data.id);
      setCreatedProjectName(json.data.name);
      setSuccessMessage("Project created successfully");
      setCurrentStep(2);
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setProjectLoading(false);
    }
  };

  // Step 2 validation and submission
  const handleStep2Next = async () => {
    if (!boreholeIdField.trim()) {
      setErrorMessage("Borehole ID is required");
      return;
    }

    if (easting && isNaN(parseFloat(easting))) {
      setErrorMessage("Easting must be a valid number");
      return;
    }
    if (northing && isNaN(parseFloat(northing))) {
      setErrorMessage("Northing must be a valid number");
      return;
    }
    if (groundLevel && isNaN(parseFloat(groundLevel))) {
      setErrorMessage("Ground level must be a valid number");
      return;
    }

    setBoreholeLoading(true);
    try {
      const res = await fetch("/api/boreholes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          project_id: createdProjectId,
          borehole_id: boreholeIdField.trim(),
          location_description: locationDescription.trim(),
          easting: easting ? parseFloat(easting) : 0,
          northing: northing ? parseFloat(northing) : 0,
          ground_level: groundLevel ? parseFloat(groundLevel) : 0,
          scale,
          hole_type: holeType,
          start_date: startDate || null,
          end_date: endDate || null,
          logged_by: loggedBy.trim(),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setErrorMessage(json.error || "Failed to create borehole");
        setBoreholeLoading(false);
        return;
      }

      setCreatedBoreholeId(json.data.id);
      setCreatedBoreholeLabel(json.data.borehole_id);
      setSuccessMessage("Borehole created successfully");
      setCurrentStep(3);
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setBoreholeLoading(false);
    }
  };

  // Step 3 → Step 4
  const handleStep3Next = () => {
    fetchSummaryCounts();
    setCurrentStep(4);
  };

  // Generate PDF
  const handleGeneratePdf = async () => {
    if (!createdBoreholeId) return;

    setGenerating(true);
    try {
      const res = await fetch(
        `/api/boreholes/${createdBoreholeId}/generate-pdf`,
        { method: "POST" }
      );

      if (!res.ok) {
        const json = await res.json();
        setErrorMessage(json.error || "Failed to generate PDF");
        setGenerating(false);
        return;
      }

      // Download the PDF
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${createdBoreholeLabel || "borehole"}-log.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setSuccessMessage("PDF generated and downloaded successfully");
    } catch {
      setErrorMessage("Network error. Please try again.");
    } finally {
      setGenerating(false);
    }
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

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

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">New Borehole Log</h1>
        <p className="text-muted-foreground">
          Create a complete borehole log in 4 simple steps.
        </p>
      </div>

      {/* Stepper */}
      <Card>
        <CardContent className="py-5">
          <WizardStepper currentStep={currentStep} />
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card>
        <CardContent className="py-6">
          {/* Step 1: Project Details */}
          {currentStep === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Project Details</h2>
                <p className="text-sm text-muted-foreground">
                  Select an existing project or create a new one.
                </p>
              </div>

              {/* Mode toggle */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={projectMode === "new" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProjectMode("new")}
                >
                  Create New
                </Button>
                <Button
                  type="button"
                  variant={projectMode === "existing" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setProjectMode("existing")}
                  disabled={existingProjects.length === 0}
                >
                  Use Existing
                </Button>
              </div>

              {projectMode === "existing" ? (
                <div className="space-y-2">
                  <Label htmlFor="existing-project">Select Project</Label>
                  <Select
                    value={selectedProjectId}
                    onValueChange={(val) => {
                      if (val) setSelectedProjectId(val);
                    }}
                  >
                    <SelectTrigger id="existing-project">
                      <SelectValue placeholder="Choose a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {existingProjects.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.project_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="wizard-project-name">Project Name</Label>
                    <Input
                      id="wizard-project-name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      placeholder="e.g. Highway Bridge Investigation"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-project-number">
                      Project Number
                    </Label>
                    <Input
                      id="wizard-project-number"
                      value={projectNumber}
                      onChange={(e) => setProjectNumber(e.target.value)}
                      placeholder="e.g. PRJ-2024-001"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-client-name">Client Name</Label>
                    <Input
                      id="wizard-client-name"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      placeholder="e.g. Acme Construction Ltd"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="wizard-project-location">Location</Label>
                    <Input
                      id="wizard-project-location"
                      value={projectLocation}
                      onChange={(e) => setProjectLocation(e.target.value)}
                      placeholder="e.g. Manchester, UK"
                    />
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end pt-2">
                <Button onClick={handleStep1Next} disabled={projectLoading}>
                  {projectLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Borehole Details */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Borehole Details</h2>
                <p className="text-sm text-muted-foreground">
                  Enter the borehole information for project:{" "}
                  <span className="font-medium text-foreground">
                    {createdProjectName}
                  </span>
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="wizard-borehole-id">Borehole ID *</Label>
                  <Input
                    id="wizard-borehole-id"
                    value={boreholeIdField}
                    onChange={(e) => setBoreholeIdField(e.target.value)}
                    placeholder="e.g. BH01"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-location-desc">
                    Location Description
                  </Label>
                  <Input
                    id="wizard-location-desc"
                    value={locationDescription}
                    onChange={(e) => setLocationDescription(e.target.value)}
                    placeholder="e.g. NE corner of site"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-easting">Easting</Label>
                  <Input
                    id="wizard-easting"
                    type="number"
                    step="any"
                    value={easting}
                    onChange={(e) => setEasting(e.target.value)}
                    placeholder="e.g. 456789.12"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-northing">Northing</Label>
                  <Input
                    id="wizard-northing"
                    type="number"
                    step="any"
                    value={northing}
                    onChange={(e) => setNorthing(e.target.value)}
                    placeholder="e.g. 123456.78"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-ground-level">
                    Ground Level (mAOD)
                  </Label>
                  <Input
                    id="wizard-ground-level"
                    type="number"
                    step="any"
                    value={groundLevel}
                    onChange={(e) => setGroundLevel(e.target.value)}
                    placeholder="e.g. 45.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-scale">Scale</Label>
                  <Select
                    value={scale}
                    onValueChange={(val) => {
                      if (val) setScale(val);
                    }}
                  >
                    <SelectTrigger id="wizard-scale">
                      <SelectValue placeholder="Select scale" />
                    </SelectTrigger>
                    <SelectContent>
                      {SCALE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-hole-type">Hole Type</Label>
                  <Select
                    value={holeType}
                    onValueChange={(val) => {
                      if (val) setHoleType(val);
                    }}
                  >
                    <SelectTrigger id="wizard-hole-type">
                      <SelectValue placeholder="Select hole type" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOLE_TYPE_OPTIONS.map((opt) => (
                        <SelectItem key={opt} value={opt}>
                          {opt}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-start-date">Start Date</Label>
                  <Input
                    id="wizard-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-end-date">End Date</Label>
                  <Input
                    id="wizard-end-date"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="wizard-logged-by">Logged By</Label>
                  <Input
                    id="wizard-logged-by"
                    value={loggedBy}
                    onChange={(e) => setLoggedBy(e.target.value)}
                    placeholder="e.g. J. Smith"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleStep2Next} disabled={boreholeLoading}>
                  {boreholeLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Next
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Enter Data */}
          {currentStep === 3 && createdBoreholeId && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Enter Data</h2>
                <p className="text-sm text-muted-foreground">
                  Add strata, core runs, water strikes, installations, and hole
                  progress for borehole:{" "}
                  <span className="font-medium text-foreground">
                    {createdBoreholeLabel}
                  </span>
                </p>
              </div>

              <Tabs defaultValue="strata" className="w-full">
                <TabsList className="w-full justify-start overflow-x-auto">
                  <TabsTrigger value="strata">Strata</TabsTrigger>
                  <TabsTrigger value="core-runs">Core Runs</TabsTrigger>
                  <TabsTrigger value="water-strikes">Water Strikes</TabsTrigger>
                  <TabsTrigger value="installations">Installations</TabsTrigger>
                  <TabsTrigger value="hole-progress">Hole Progress</TabsTrigger>
                </TabsList>
                <TabsContent value="strata" className="mt-4">
                  <StrataTab
                    boreholeId={createdBoreholeId}
                    onSuccess={(msg) => setSuccessMessage(msg)}
                    onError={(msg) => setErrorMessage(msg)}
                  />
                </TabsContent>
                <TabsContent value="core-runs" className="mt-4">
                  <CoreRunsTab
                    boreholeId={createdBoreholeId}
                    onSuccess={(msg) => setSuccessMessage(msg)}
                    onError={(msg) => setErrorMessage(msg)}
                  />
                </TabsContent>
                <TabsContent value="water-strikes" className="mt-4">
                  <WaterStrikesTab
                    boreholeId={createdBoreholeId}
                    onSuccess={(msg) => setSuccessMessage(msg)}
                    onError={(msg) => setErrorMessage(msg)}
                  />
                </TabsContent>
                <TabsContent value="installations" className="mt-4">
                  <InstallationsTab
                    boreholeId={createdBoreholeId}
                    onSuccess={(msg) => setSuccessMessage(msg)}
                    onError={(msg) => setErrorMessage(msg)}
                  />
                </TabsContent>
                <TabsContent value="hole-progress" className="mt-4">
                  <HoleProgressTab
                    boreholeId={createdBoreholeId}
                    onSuccess={(msg) => setSuccessMessage(msg)}
                    onError={(msg) => setErrorMessage(msg)}
                  />
                </TabsContent>
              </Tabs>

              {/* Actions */}
              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleStep3Next}>
                  Next
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Generate PDF */}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold">Generate Report</h2>
                <p className="text-sm text-muted-foreground">
                  Review your borehole log and generate the PDF report.
                </p>
              </div>

              {/* Summary */}
              <div className="rounded-lg border bg-muted/30 p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Summary
                </h3>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Project</p>
                    <p className="font-medium">{createdProjectName}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Borehole ID</p>
                    <p className="font-medium">{createdBoreholeLabel}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Strata</p>
                    <p className="font-medium">
                      {summaryCounts.strata} layer
                      {summaryCounts.strata !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Core Runs</p>
                    <p className="font-medium">
                      {summaryCounts.coreRuns} run
                      {summaryCounts.coreRuns !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Water Strikes
                    </p>
                    <p className="font-medium">
                      {summaryCounts.waterStrikes} strike
                      {summaryCounts.waterStrikes !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Installations
                    </p>
                    <p className="font-medium">
                      {summaryCounts.installations} installation
                      {summaryCounts.installations !== 1 ? "s" : ""}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Hole Progress
                    </p>
                    <p className="font-medium">
                      {summaryCounts.holeProgress} entr
                      {summaryCounts.holeProgress !== 1 ? "ies" : "y"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Generate Button */}
              <div className="flex flex-col items-center gap-4 py-4">
                <Button
                  size="lg"
                  className="h-14 px-8 text-base font-semibold shadow-md"
                  onClick={handleGeneratePdf}
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="mr-2 h-5 w-5" />
                      Generate PDF
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  The PDF will be downloaded to your device.
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-start pt-2">
                <Button variant="outline" onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
