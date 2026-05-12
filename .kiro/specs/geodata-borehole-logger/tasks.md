# Implementation Plan: Geodata Borehole Logger

## Overview

This plan implements a full-stack geotechnical borehole logging application using Next.js 14 (App Router), Supabase (PostgreSQL with RLS), PDFKit for PDF generation, and shadcn/ui + Tailwind CSS for the UI. Tasks are ordered to build foundational layers first (project setup, database, auth), then domain features (CRUD for each entity), and finally the PDF report generator. Each task builds incrementally on previous work.

## Tasks

- [x] 1. Project setup and configuration
  - [x] 1.1 Initialize Next.js 14 project with TypeScript, Tailwind CSS, and shadcn/ui
    - Run `create-next-app` with App Router and TypeScript
    - Install and configure Tailwind CSS
    - Initialize shadcn/ui with default theme
    - Install dependencies: `@supabase/supabase-js`, `@supabase/auth-helpers-nextjs`, `pdfkit`, `fast-check`, `vitest`
    - Create `.env.local` template with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
    - _Requirements: 10.1, 10.4, 12.1, 12.2_

  - [x] 1.2 Set up Supabase client utilities and TypeScript types
    - Create `src/lib/supabase/client.ts` for browser-side Supabase client
    - Create `src/lib/supabase/server.ts` for server-side Supabase client (using cookies)
    - Create `src/types/database.ts` with all domain interfaces (Project, Borehole, Stratum, CoreRun, WaterStrike, Installation, HoleProgress, LithologyType, InstallationType)
    - _Requirements: 11.1, 11.3_

  - [x] 1.3 Create database migration SQL file
    - Create `supabase/migrations/001_initial_schema.sql` with all tables (projects, boreholes, strata, core_runs, water_strikes, installations, hole_progress)
    - Include all CHECK constraints, UNIQUE constraints, and foreign keys with ON DELETE CASCADE
    - Include Row Level Security policies for all tables
    - _Requirements: 11.3, 11.4, 3.4, 5.2, 5.4, 8.3_

  - [x] 1.4 Set up Vitest configuration and test utilities
    - Create `vitest.config.ts` with path aliases and test environment
    - Create `tests/` directory structure (unit, property, integration)
    - Create test utility helpers for generating mock data
    - _Requirements: 11.1_

- [x] 2. Authentication system
  - [x] 2.1 Implement authentication pages and forms
    - Create `src/app/(auth)/login/page.tsx` with email/password login form
    - Create `src/app/(auth)/register/page.tsx` with registration form
    - Create `src/app/(auth)/reset-password/page.tsx` with password reset request form
    - Implement client-side password validation (min 8 chars, uppercase, lowercase, digit)
    - Display inline validation errors and success notifications
    - _Requirements: 1.1, 1.2, 1.4, 1.5, 12.4, 12.5, 12.8_

  - [x] 2.2 Implement auth middleware and session management
    - Create `src/middleware.ts` to protect authenticated routes
    - Redirect unauthenticated users to login page
    - Handle session expiry with redirect to login
    - Create `src/lib/auth/validators.ts` with password validation function
    - _Requirements: 1.1, 1.3_

  - [ ]* 2.3 Write property test for password validation
    - **Property 2: Password validation rules**
    - Test that for any random string, the validator accepts iff length ≥ 8 AND has uppercase AND has lowercase AND has digit
    - **Validates: Requirements 1.4**

- [x] 3. Application layout and navigation
  - [x] 3.1 Create authenticated app layout with branded header and footer
    - Create `src/app/(app)/layout.tsx` with header (logo placeholder, app name, navigation, user menu)
    - Create `src/components/layout/Header.tsx` with responsive navigation
    - Create `src/components/layout/Footer.tsx` with copyright, version, support link
    - Implement mobile-responsive hamburger menu for navigation
    - Use consistent colour palette, typography, and iconography (Lucide icons)
    - _Requirements: 12.1, 12.2, 12.3, 12.9, 12.10, 10.1, 10.3_

  - [x] 3.2 Create shared UI components
    - Create `src/components/ui/SuccessNotification.tsx` (auto-dismiss after 3 seconds)
    - Create `src/components/ui/ErrorNotification.tsx` for save failures
    - Create `src/components/ui/LoadingSpinner.tsx` for data operations
    - Create `src/components/ui/ConfirmDialog.tsx` for delete confirmations
    - _Requirements: 12.5, 12.7, 11.2_

- [x] 4. Project management
  - [x] 4.1 Implement project API routes
    - Create `src/app/api/projects/route.ts` (GET list, POST create)
    - Create `src/app/api/projects/[id]/route.ts` (PUT update, DELETE with cascade)
    - GET returns projects sorted by `updated_at` descending
    - Validate required fields: name, project_number, client_name, location
    - Return appropriate error responses (400, 404, 409, 500)
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 11.1, 11.2_

  - [x] 4.2 Implement dashboard and project list pages
    - Create `src/app/(app)/dashboard/page.tsx` with recent projects summary and quick-action buttons
    - Create `src/app/(app)/projects/page.tsx` with full project list (sorted by most recently modified)
    - Create `src/components/projects/ProjectCard.tsx` for project display
    - Create `src/components/projects/ProjectForm.tsx` for create/edit with validation
    - Implement delete with confirmation dialog
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 12.4, 12.6_

  - [ ]* 4.3 Write property test for project list sort order
    - **Property 3: Project list sort order**
    - Test that for any set of projects with varying updated_at timestamps, the list is returned in strictly descending order
    - **Validates: Requirements 2.2**

- [x] 5. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Borehole management
  - [x] 6.1 Implement borehole API routes
    - Create `src/app/api/projects/[id]/boreholes/route.ts` (GET list boreholes in project)
    - Create `src/app/api/boreholes/route.ts` (POST create borehole)
    - Create `src/app/api/boreholes/[id]/route.ts` (PUT update, DELETE with cascade)
    - Enforce unique borehole_id within project (return 409 on duplicate)
    - Validate all header fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 11.3, 11.4_

  - [x] 6.2 Implement borehole list and editor pages
    - Create `src/app/(app)/projects/[id]/page.tsx` showing project detail with borehole list
    - Create `src/app/(app)/boreholes/[id]/page.tsx` as the borehole editor with tabbed interface
    - Create `src/components/boreholes/BoreholeForm.tsx` for header data entry (borehole ID, location, easting, northing, ground level, scale, hole type, dates, logged-by)
    - Display duplicate borehole ID error inline
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 2.3, 12.4, 12.8_

  - [ ]* 6.3 Write property test for borehole ID uniqueness
    - **Property 4: Borehole ID uniqueness within project**
    - Test that duplicate borehole IDs within the same project are rejected, but the same ID in different projects is accepted
    - **Validates: Requirements 3.4**

- [x] 7. Strata and lithology data entry
  - [x] 7.1 Implement strata API routes with validation
    - Create `src/app/api/boreholes/[id]/strata/route.ts` (GET list, POST create)
    - Create `src/app/api/strata/[id]/route.ts` (PUT update, DELETE)
    - Validate depth_from < depth_to
    - Validate lithology is one of the allowed enum values
    - Implement strata overlap detection (return warning if overlapping intervals exist)
    - _Requirements: 4.1, 4.3, 4.4, 4.5_

  - [x] 7.2 Implement strata tab UI with lithology picker
    - Create `src/components/boreholes/StrataTab.tsx` displaying strata list sorted by depth
    - Create `src/components/boreholes/StratumForm.tsx` for add/edit stratum
    - Create `src/components/boreholes/LithologyPicker.tsx` with pattern preview thumbnails for each lithology type
    - Display inline validation errors for depth intervals and overlap warnings
    - _Requirements: 4.1, 4.2, 4.4, 4.5, 12.4, 12.8_

  - [x] 7.3 Create BS 5930 hatch pattern PNG assets
    - Create `public/patterns/` directory with 64x64px PNG tile images for each lithology
    - Files: `sand.png`, `clay.png`, `silt.png`, `gravel.png`, `sandstone.png`, `mudstone.png`, `limestone.png`, `chalk.png`, `made_ground.png`
    - Create `src/lib/patterns.ts` mapping lithology types to pattern files and labels
    - _Requirements: 4.2, 9.4, 9.12_

  - [ ]* 7.4 Write property tests for depth interval and overlap validation
    - **Property 5: Depth interval validation**
    - Test that depth_from ≥ depth_to is rejected, depth_from < depth_to is accepted
    - **Property 6: Strata overlap detection**
    - Test that overlapping intervals produce a warning, non-overlapping do not
    - **Validates: Requirements 4.4, 5.4**

- [x] 8. Core run data entry
  - [x] 8.1 Implement core run API routes
    - Create `src/app/api/boreholes/[id]/core-runs/route.ts` (GET list, POST create)
    - Create `src/app/api/core-runs/[id]/route.ts` (PUT update, DELETE)
    - Validate depth_from < depth_to
    - Validate recovery_percent, scr_percent, rqd_tcr_percent are in [0, 100]
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 8.2 Implement core runs tab UI
    - Create `src/components/boreholes/CoreRunsTab.tsx` displaying core run list
    - Create `src/components/boreholes/CoreRunForm.tsx` for add/edit with percentage validation
    - Display inline validation errors for depth and percentage fields
    - _Requirements: 5.1, 5.2, 5.4, 12.4, 12.8_

  - [ ]* 8.3 Write property test for percentage range validation
    - **Property 7: Percentage range validation**
    - Test that values in [0, 100] are accepted, values outside are rejected
    - **Validates: Requirements 5.2**

- [x] 9. Water strikes, installations, and hole progress
  - [x] 9.1 Implement water strikes API routes and UI
    - Create `src/app/api/boreholes/[id]/water-strikes/route.ts` (GET, POST)
    - Create `src/app/api/water-strikes/[id]/route.ts` (DELETE)
    - Create `src/components/boreholes/WaterStrikesTab.tsx` with list and form
    - Capture date, strike depth, casing depth, depth after period
    - _Requirements: 6.1, 6.2, 6.3_

  - [x] 9.2 Implement installations API routes and UI
    - Create `src/app/api/boreholes/[id]/installations/route.ts` (GET, POST)
    - Create `src/app/api/installations/[id]/route.ts` (DELETE)
    - Create `src/components/boreholes/InstallationsTab.tsx` with list and form
    - Provide installation type dropdown (plain_casing, slotted_casing, screen, gravel_pack, bentonite_seal, cement_grout)
    - Validate depth_from < depth_to
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 9.3 Implement hole progress API routes and UI
    - Create `src/app/api/boreholes/[id]/hole-progress/route.ts` (GET, POST)
    - Create `src/app/api/hole-progress/[id]/route.ts` (DELETE)
    - Create `src/components/boreholes/HoleProgressTab.tsx` with list and form
    - Capture date, hole depth, casing depth, water depth, water status (measured/dry/pumped)
    - Enforce one entry per date per borehole (return 409 on duplicate date)
    - _Requirements: 8.1, 8.2, 8.3_

  - [ ]* 9.4 Write property test for hole progress date uniqueness
    - **Property 8: Hole progress date uniqueness**
    - Test that duplicate dates for the same borehole are rejected
    - **Validates: Requirements 8.3**

- [x] 10. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 11. PDF report generation
  - [x] 11.1 Implement PDF data assembly function
    - Create `src/lib/pdf/data-assembly.ts` that fetches all borehole data (header, strata, core runs, water strikes, installations, hole progress) and assembles into a structured object for PDF rendering
    - Include all fields required by the PDF report specification
    - Handle edge cases: no strata, missing data fields
    - _Requirements: 9.2, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11_

  - [x] 11.2 Implement PDF depth scale and layout calculator
    - Create `src/lib/pdf/layout.ts` with functions to calculate depth markers, column positions, and pixel bounds for strata based on scale factor
    - Calculate y-positions for each stratum based on depth interval and scale
    - Generate depth markers at regular intervals (e.g. every 1m or 5m depending on scale)
    - _Requirements: 9.3, 9.4_

  - [x] 11.3 Implement PDF renderer with PDFKit
    - Create `src/lib/pdf/renderer.ts` using PDFKit to generate the full borehole log PDF
    - Render header section (company info, project details, borehole header fields)
    - Render depth column with scale markers
    - Render strata column with tiled PNG hatch patterns (load pattern image, clip to depth interval, tile repeatedly)
    - Render description column with geological descriptions at correct depths
    - Render core run data section with sample type, depths, recovery/SCR/RQD percentages
    - Render water levels column
    - Render installation column with type and depth positions
    - Render remarks section
    - Render groundwater table
    - Render hole progress table
    - Render legend with distinct lithology patterns and labels used in the borehole
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.9, 9.10, 9.11, 9.12_

  - [x] 11.4 Implement PDF generation API route
    - Create `src/app/api/boreholes/[id]/generate-pdf/route.ts`
    - Call data assembly → layout calculator → renderer pipeline
    - Store generated PDF in Supabase Storage
    - Return download URL to client
    - Handle timeout (10 second limit) and error cases
    - _Requirements: 9.1_

  - [x] 11.5 Add PDF generation button to borehole editor
    - Add "Generate PDF" button to borehole editor page
    - Show loading state during generation
    - Display download link or error on completion
    - _Requirements: 9.1, 12.5_

  - [ ]* 11.6 Write property tests for PDF generation logic
    - **Property 9: PDF data assembly completeness**
    - Test that all input data fields are present in the assembled output without loss
    - **Property 10: PDF depth scale calculation**
    - Test that depth markers span from 0 to total depth with correct pixel spacing
    - **Property 11: PDF strata pattern layout**
    - Test that each stratum gets the correct pattern file and proportional pixel bounds
    - **Property 12: PDF legend contains used lithologies**
    - Test that the legend contains exactly the distinct lithology types present in strata
    - **Validates: Requirements 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8, 9.12**

- [ ] 12. Data integrity and cascade operations
  - [x] 12.1 Implement cascade delete verification and error handling
    - Verify cascade delete works correctly for Project → Boreholes → all child records
    - Verify cascade delete works for Borehole → Strata, CoreRuns, WaterStrikes, Installations, HoleProgress
    - Implement proper error handling for failed save operations (retain form data, show error)
    - Implement retry logic with exponential backoff for network errors
    - _Requirements: 2.5, 11.2, 11.3, 11.4_

  - [ ]* 12.2 Write property tests for referential integrity and cascade delete
    - **Property 13: Referential integrity enforcement**
    - Test that child records with non-existent parent references are rejected
    - **Property 14: Cascade delete removes all children**
    - Test that deleting a borehole removes all associated child records
    - **Validates: Requirements 11.3, 11.4**

- [x] 13. Responsive design and cross-platform polish
  - [x] 13.1 Implement responsive layouts and touch optimization
    - Ensure all pages render correctly from 320px to 2560px
    - Implement single-column layout for mobile with 44x44px minimum touch targets
    - Test and fix form layouts on mobile viewports
    - Ensure tabbed borehole editor works well on mobile (scrollable tabs or accordion)
    - Add appropriate meta viewport tags and PWA manifest
    - _Requirements: 10.1, 10.2, 10.3, 10.4_

  - [x] 13.2 Apply professional visual design polish
    - Ensure consistent colour palette, typography, and spacing across all pages
    - Verify hover states, focus indicators, and loading indicators are present
    - Verify success notifications auto-dismiss after 3 seconds
    - Verify inline validation errors display correctly with error colour
    - Ensure iconography is consistent (Lucide icons throughout)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.7, 12.8, 12.10_

- [x] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- The hatch pattern PNG assets (task 7.3) should be created as simple placeholder images initially; they can be refined to match exact BS 5930 specifications later
- Supabase local development (via Docker) is recommended for integration testing
