// === Domain Types ===

export interface Project {
  id: string;
  user_id: string;
  name: string;
  project_number: string;
  client_name: string;
  location: string;
  created_at: string;
  updated_at: string;
}

export interface Borehole {
  id: string;
  project_id: string;
  borehole_id: string;
  location_description: string;
  easting: number;
  northing: number;
  ground_level: number;
  scale: string;
  hole_type: string;
  start_date: string;
  end_date: string;
  logged_by: string;
  created_at: string;
  updated_at: string;
}

export type LithologyType =
  | "sand"
  | "clay"
  | "silt"
  | "gravel"
  | "sandstone"
  | "mudstone"
  | "limestone"
  | "chalk"
  | "made_ground";

export interface Stratum {
  id: string;
  borehole_id: string;
  depth_from: number;
  depth_to: number;
  lithology: LithologyType;
  description: string;
  created_at: string;
}

export interface CoreRun {
  id: string;
  borehole_id: string;
  sample_type: string;
  depth_from: number;
  depth_to: number;
  recovery_percent: number;
  scr_percent: number;
  rqd_tcr_percent: number;
  created_at: string;
}

export interface WaterStrike {
  id: string;
  borehole_id: string;
  date: string;
  strike_depth: number;
  casing_depth: number;
  depth_after_period: number;
  created_at: string;
}

export type InstallationType =
  | "plain_casing"
  | "slotted_casing"
  | "screen"
  | "gravel_pack"
  | "bentonite_seal"
  | "cement_grout";

export interface Installation {
  id: string;
  borehole_id: string;
  installation_type: InstallationType;
  depth_from: number;
  depth_to: number;
  created_at: string;
}

export interface HoleProgress {
  id: string;
  borehole_id: string;
  date: string;
  hole_depth: number;
  casing_depth: number;
  water_depth: number | null;
  water_status: "measured" | "dry" | "pumped";
  created_at: string;
}

// === Supabase Database Type (for typed client) ===

export interface Database {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Project, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "projects_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      boreholes: {
        Row: Borehole;
        Insert: Omit<Borehole, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Borehole, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "boreholes_project_id_fkey";
            columns: ["project_id"];
            isOneToOne: false;
            referencedRelation: "projects";
            referencedColumns: ["id"];
          }
        ];
      };
      strata: {
        Row: Stratum;
        Insert: Omit<Stratum, "id" | "created_at">;
        Update: Partial<Omit<Stratum, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "strata_borehole_id_fkey";
            columns: ["borehole_id"];
            isOneToOne: false;
            referencedRelation: "boreholes";
            referencedColumns: ["id"];
          }
        ];
      };
      core_runs: {
        Row: CoreRun;
        Insert: Omit<CoreRun, "id" | "created_at">;
        Update: Partial<Omit<CoreRun, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "core_runs_borehole_id_fkey";
            columns: ["borehole_id"];
            isOneToOne: false;
            referencedRelation: "boreholes";
            referencedColumns: ["id"];
          }
        ];
      };
      water_strikes: {
        Row: WaterStrike;
        Insert: Omit<WaterStrike, "id" | "created_at">;
        Update: Partial<Omit<WaterStrike, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "water_strikes_borehole_id_fkey";
            columns: ["borehole_id"];
            isOneToOne: false;
            referencedRelation: "boreholes";
            referencedColumns: ["id"];
          }
        ];
      };
      installations: {
        Row: Installation;
        Insert: Omit<Installation, "id" | "created_at">;
        Update: Partial<Omit<Installation, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "installations_borehole_id_fkey";
            columns: ["borehole_id"];
            isOneToOne: false;
            referencedRelation: "boreholes";
            referencedColumns: ["id"];
          }
        ];
      };
      hole_progress: {
        Row: HoleProgress;
        Insert: Omit<HoleProgress, "id" | "created_at">;
        Update: Partial<Omit<HoleProgress, "id" | "created_at">>;
        Relationships: [
          {
            foreignKeyName: "hole_progress_borehole_id_fkey";
            columns: ["borehole_id"];
            isOneToOne: false;
            referencedRelation: "boreholes";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      lithology_type: LithologyType;
      installation_type: InstallationType;
      water_status: "measured" | "dry" | "pumped";
    };
  };
}
