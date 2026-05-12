/**
 * Test factory functions for generating mock domain objects.
 * Each factory produces a valid object with sensible defaults that can be overridden.
 */

import type {
  Project,
  Borehole,
  Stratum,
  CoreRun,
  WaterStrike,
  Installation,
  HoleProgress,
  LithologyType,
  InstallationType,
} from "@/types/database";

let counter = 0;

function nextId(): string {
  counter++;
  return `00000000-0000-4000-a000-${String(counter).padStart(12, "0")}`;
}

function isoNow(): string {
  return new Date().toISOString();
}

function dateStr(daysOffset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split("T")[0];
}

export function resetFactoryCounter(): void {
  counter = 0;
}

// --- Project ---

export function createProject(overrides: Partial<Project> = {}): Project {
  return {
    id: nextId(),
    user_id: nextId(),
    name: `Test Project ${counter}`,
    project_number: `TP-${String(counter).padStart(4, "0")}`,
    client_name: "Test Client Ltd",
    location: "Test Site, London",
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  };
}

// --- Borehole ---

export function createBorehole(overrides: Partial<Borehole> = {}): Borehole {
  return {
    id: nextId(),
    project_id: nextId(),
    borehole_id: `BH${String(counter).padStart(2, "0")}`,
    location_description: "Northwest corner of site",
    easting: 523456.78,
    northing: 178901.23,
    ground_level: 45.5,
    scale: "1:50",
    hole_type: "Rotary",
    start_date: dateStr(-7),
    end_date: dateStr(),
    logged_by: "JD",
    created_at: isoNow(),
    updated_at: isoNow(),
    ...overrides,
  };
}

// --- Stratum ---

const LITHOLOGY_TYPES: LithologyType[] = [
  "sand",
  "clay",
  "silt",
  "gravel",
  "sandstone",
  "mudstone",
  "limestone",
  "chalk",
  "made_ground",
];

export function createStratum(overrides: Partial<Stratum> = {}): Stratum {
  const depthFrom = overrides.depth_from ?? counter * 2;
  const depthTo = overrides.depth_to ?? depthFrom + 2;
  return {
    id: nextId(),
    borehole_id: nextId(),
    depth_from: depthFrom,
    depth_to: depthTo,
    lithology: LITHOLOGY_TYPES[counter % LITHOLOGY_TYPES.length],
    description: `${LITHOLOGY_TYPES[counter % LITHOLOGY_TYPES.length]} layer at ${depthFrom}m`,
    created_at: isoNow(),
    ...overrides,
  };
}


// --- CoreRun ---

export function createCoreRun(overrides: Partial<CoreRun> = {}): CoreRun {
  const depthFrom = overrides.depth_from ?? counter * 3;
  const depthTo = overrides.depth_to ?? depthFrom + 3;
  return {
    id: nextId(),
    borehole_id: nextId(),
    sample_type: "U100",
    depth_from: depthFrom,
    depth_to: depthTo,
    recovery_percent: 85,
    scr_percent: 70,
    rqd_tcr_percent: 60,
    created_at: isoNow(),
    ...overrides,
  };
}

// --- WaterStrike ---

export function createWaterStrike(
  overrides: Partial<WaterStrike> = {}
): WaterStrike {
  return {
    id: nextId(),
    borehole_id: nextId(),
    date: dateStr(-counter),
    strike_depth: 5.5 + counter,
    casing_depth: 3.0 + counter,
    depth_after_period: 4.2 + counter,
    created_at: isoNow(),
    ...overrides,
  };
}

// --- Installation ---

const INSTALLATION_TYPES: InstallationType[] = [
  "plain_casing",
  "slotted_casing",
  "screen",
  "gravel_pack",
  "bentonite_seal",
  "cement_grout",
];

export function createInstallation(
  overrides: Partial<Installation> = {}
): Installation {
  const depthFrom = overrides.depth_from ?? counter * 2;
  const depthTo = overrides.depth_to ?? depthFrom + 4;
  return {
    id: nextId(),
    borehole_id: nextId(),
    installation_type:
      INSTALLATION_TYPES[counter % INSTALLATION_TYPES.length],
    depth_from: depthFrom,
    depth_to: depthTo,
    created_at: isoNow(),
    ...overrides,
  };
}

// --- HoleProgress ---

export function createHoleProgress(
  overrides: Partial<HoleProgress> = {}
): HoleProgress {
  return {
    id: nextId(),
    borehole_id: nextId(),
    date: dateStr(-counter),
    hole_depth: 10.0 + counter * 2,
    casing_depth: 5.0 + counter,
    water_depth: 3.5 + counter,
    water_status: "measured",
    created_at: isoNow(),
    ...overrides,
  };
}

// --- Utility exports ---

export { LITHOLOGY_TYPES, INSTALLATION_TYPES };
