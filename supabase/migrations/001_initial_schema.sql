-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  project_number TEXT NOT NULL,
  client_name TEXT NOT NULL,
  location TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Boreholes table
CREATE TABLE boreholes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  borehole_id TEXT NOT NULL,
  location_description TEXT DEFAULT '',
  easting DOUBLE PRECISION NOT NULL,
  northing DOUBLE PRECISION NOT NULL,
  ground_level DOUBLE PRECISION NOT NULL,
  scale TEXT NOT NULL DEFAULT '1:50',
  hole_type TEXT NOT NULL DEFAULT 'Rotary',
  start_date DATE,
  end_date DATE,
  logged_by TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, borehole_id)
);

-- Strata table
CREATE TABLE strata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borehole_id UUID NOT NULL REFERENCES boreholes(id) ON DELETE CASCADE,
  depth_from DOUBLE PRECISION NOT NULL,
  depth_to DOUBLE PRECISION NOT NULL,
  lithology TEXT NOT NULL CHECK (lithology IN ('sand', 'clay', 'silt', 'gravel', 'sandstone', 'mudstone', 'limestone', 'chalk', 'made_ground')),
  description TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (depth_from < depth_to)
);

-- Core runs table
CREATE TABLE core_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borehole_id UUID NOT NULL REFERENCES boreholes(id) ON DELETE CASCADE,
  sample_type TEXT NOT NULL,
  depth_from DOUBLE PRECISION NOT NULL,
  depth_to DOUBLE PRECISION NOT NULL,
  recovery_percent DOUBLE PRECISION NOT NULL CHECK (recovery_percent >= 0 AND recovery_percent <= 100),
  scr_percent DOUBLE PRECISION NOT NULL CHECK (scr_percent >= 0 AND scr_percent <= 100),
  rqd_tcr_percent DOUBLE PRECISION NOT NULL CHECK (rqd_tcr_percent >= 0 AND rqd_tcr_percent <= 100),
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (depth_from < depth_to)
);

-- Water strikes table
CREATE TABLE water_strikes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borehole_id UUID NOT NULL REFERENCES boreholes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  strike_depth DOUBLE PRECISION NOT NULL,
  casing_depth DOUBLE PRECISION NOT NULL,
  depth_after_period DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Installations table
CREATE TABLE installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borehole_id UUID NOT NULL REFERENCES boreholes(id) ON DELETE CASCADE,
  installation_type TEXT NOT NULL CHECK (installation_type IN ('plain_casing', 'slotted_casing', 'screen', 'gravel_pack', 'bentonite_seal', 'cement_grout')),
  depth_from DOUBLE PRECISION NOT NULL,
  depth_to DOUBLE PRECISION NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  CHECK (depth_from < depth_to)
);

-- Hole progress table
CREATE TABLE hole_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  borehole_id UUID NOT NULL REFERENCES boreholes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hole_depth DOUBLE PRECISION NOT NULL,
  casing_depth DOUBLE PRECISION NOT NULL,
  water_depth DOUBLE PRECISION,
  water_status TEXT NOT NULL DEFAULT 'measured' CHECK (water_status IN ('measured', 'dry', 'pumped')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(borehole_id, date)
);

-- Row Level Security policies
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE boreholes ENABLE ROW LEVEL SECURITY;
ALTER TABLE strata ENABLE ROW LEVEL SECURITY;
ALTER TABLE core_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_strikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE hole_progress ENABLE ROW LEVEL SECURITY;

-- Projects: users can only access their own
CREATE POLICY "Users can CRUD own projects" ON projects
  FOR ALL USING (auth.uid() = user_id);

-- Boreholes: users can access boreholes in their projects
CREATE POLICY "Users can CRUD boreholes in own projects" ON boreholes
  FOR ALL USING (
    project_id IN (SELECT id FROM projects WHERE user_id = auth.uid())
  );

-- Strata: users can access strata in their boreholes
CREATE POLICY "Users can CRUD strata in own boreholes" ON strata
  FOR ALL USING (
    borehole_id IN (
      SELECT b.id FROM boreholes b
      JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

-- Similar policies for core_runs, water_strikes, installations, hole_progress
CREATE POLICY "Users can CRUD core_runs in own boreholes" ON core_runs
  FOR ALL USING (
    borehole_id IN (
      SELECT b.id FROM boreholes b
      JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can CRUD water_strikes in own boreholes" ON water_strikes
  FOR ALL USING (
    borehole_id IN (
      SELECT b.id FROM boreholes b
      JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can CRUD installations in own boreholes" ON installations
  FOR ALL USING (
    borehole_id IN (
      SELECT b.id FROM boreholes b
      JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can CRUD hole_progress in own boreholes" ON hole_progress
  FOR ALL USING (
    borehole_id IN (
      SELECT b.id FROM boreholes b
      JOIN projects p ON b.project_id = p.id
      WHERE p.user_id = auth.uid()
    )
  );
