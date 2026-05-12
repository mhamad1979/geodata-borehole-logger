import { describe, it, expect, beforeEach } from "vitest";
import {
  createProject,
  createBorehole,
  createStratum,
  createCoreRun,
  createWaterStrike,
  createInstallation,
  createHoleProgress,
  resetFactoryCounter,
  LITHOLOGY_TYPES,
  INSTALLATION_TYPES,
} from "../helpers/factories";

describe("Test Factories", () => {
  beforeEach(() => {
    resetFactoryCounter();
  });

  it("creates a valid Project with defaults", () => {
    const project = createProject();
    expect(project.id).toBeDefined();
    expect(project.user_id).toBeDefined();
    expect(project.name).toContain("Test Project");
    expect(project.project_number).toMatch(/^TP-\d{4}$/);
    expect(project.client_name).toBe("Test Client Ltd");
    expect(project.location).toBe("Test Site, London");
  });

  it("creates a valid Project with overrides", () => {
    const project = createProject({ name: "Custom Project", client_name: "ACME" });
    expect(project.name).toBe("Custom Project");
    expect(project.client_name).toBe("ACME");
  });

  it("creates a valid Borehole with defaults", () => {
    const borehole = createBorehole();
    expect(borehole.borehole_id).toMatch(/^BH\d{2}$/);
    expect(borehole.easting).toBeGreaterThan(0);
    expect(borehole.northing).toBeGreaterThan(0);
    expect(borehole.scale).toBe("1:50");
    expect(borehole.hole_type).toBe("Rotary");
  });

  it("creates a valid Stratum with correct depth ordering", () => {
    const stratum = createStratum();
    expect(stratum.depth_from).toBeLessThan(stratum.depth_to);
    expect(LITHOLOGY_TYPES).toContain(stratum.lithology);
    expect(stratum.description).toBeDefined();
  });

  it("creates a valid CoreRun with percentages in range", () => {
    const coreRun = createCoreRun();
    expect(coreRun.depth_from).toBeLessThan(coreRun.depth_to);
    expect(coreRun.recovery_percent).toBeGreaterThanOrEqual(0);
    expect(coreRun.recovery_percent).toBeLessThanOrEqual(100);
    expect(coreRun.scr_percent).toBeGreaterThanOrEqual(0);
    expect(coreRun.scr_percent).toBeLessThanOrEqual(100);
    expect(coreRun.rqd_tcr_percent).toBeGreaterThanOrEqual(0);
    expect(coreRun.rqd_tcr_percent).toBeLessThanOrEqual(100);
  });

  it("creates a valid WaterStrike", () => {
    const ws = createWaterStrike();
    expect(ws.strike_depth).toBeGreaterThan(0);
    expect(ws.casing_depth).toBeGreaterThan(0);
    expect(ws.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("creates a valid Installation with correct depth ordering", () => {
    const installation = createInstallation();
    expect(installation.depth_from).toBeLessThan(installation.depth_to);
    expect(INSTALLATION_TYPES).toContain(installation.installation_type);
  });

  it("creates a valid HoleProgress", () => {
    const hp = createHoleProgress();
    expect(hp.hole_depth).toBeGreaterThan(0);
    expect(hp.casing_depth).toBeGreaterThan(0);
    expect(hp.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(["measured", "dry", "pumped"]).toContain(hp.water_status);
  });

  it("generates unique IDs across factory calls", () => {
    const p1 = createProject();
    const p2 = createProject();
    expect(p1.id).not.toBe(p2.id);
  });
});
