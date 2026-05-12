# Requirements Document

## Introduction

A simplified geotechnical borehole logging application for web and mobile platforms. The application enables geotechnical engineers and field geologists to record borehole data during drilling operations, manage borehole projects, and generate standardised PDF reports (Rotary Borehole Logs). The system focuses on the core workflow of authentication, data entry, storage, and report generation.

## Glossary

- **Application**: The geodata borehole logging web and mobile application
- **User**: A geotechnical engineer, geologist, or technician who uses the Application
- **Project**: A named collection of boreholes belonging to a single site investigation
- **Borehole**: A single drilled hole with associated geological and installation data
- **Stratum**: A distinct geological layer encountered during drilling, defined by depth interval and lithology
- **Lithology**: The classification of rock or soil type (e.g. sand, clay, gravel, sandstone)
- **Core_Run**: A record of a single core barrel run including depth interval, recovery, SCR, and RQD/TCR percentages
- **Installation**: Casing, screen, or other downhole equipment installed in the borehole
- **Water_Strike**: A groundwater encounter recorded during drilling, including depth and time
- **Hole_Progress**: A daily record of drilling depth, casing depth, and water level observations
- **PDF_Report**: A generated Rotary Borehole Log document in PDF format
- **Auth_Service**: The authentication and authorisation subsystem
- **Data_Store**: The persistent database where all application data is stored
- **PDF_Generator**: The subsystem responsible for producing PDF borehole log reports

## Requirements

### Requirement 1: User Authentication

**User Story:** As a User, I want to securely log in to the Application, so that my borehole data is protected and only accessible to authorised users.

#### Acceptance Criteria

1. WHEN a User provides valid credentials, THE Auth_Service SHALL authenticate the User and grant access to the Application within 3 seconds
2. WHEN a User provides invalid credentials, THE Auth_Service SHALL deny access and display an error message indicating invalid credentials
3. IF a User session expires, THEN THE Auth_Service SHALL redirect the User to the login screen
4. THE Auth_Service SHALL require a minimum password length of 8 characters containing at least one uppercase letter, one lowercase letter, and one digit
5. WHEN a User requests a password reset, THE Auth_Service SHALL send a reset link to the registered email address within 60 seconds

### Requirement 2: Project Management

**User Story:** As a User, I want to create and manage projects, so that I can organise boreholes by site investigation.

#### Acceptance Criteria

1. WHEN a User creates a new Project, THE Application SHALL store the Project with a name, project number, client name, and location
2. WHEN a User views the project list, THE Application SHALL display all Projects belonging to that User sorted by most recently modified
3. WHEN a User selects a Project, THE Application SHALL display all Boreholes associated with that Project
4. WHEN a User edits Project details, THE Data_Store SHALL persist the changes within 2 seconds
5. WHEN a User deletes a Project, THE Application SHALL request confirmation before permanently removing the Project and all associated Boreholes from the Data_Store

### Requirement 3: Borehole Creation and Header Data

**User Story:** As a User, I want to create boreholes and record header information, so that each borehole is uniquely identified with its location and drilling context.

#### Acceptance Criteria

1. WHEN a User creates a new Borehole within a Project, THE Application SHALL require a borehole identifier (e.g. BH01)
2. THE Application SHALL store the following Borehole header fields: borehole ID, location description, easting coordinate, northing coordinate, ground level (mAD), scale, hole type, start date, end date, and logged-by initials
3. WHEN a User saves Borehole header data, THE Data_Store SHALL persist all header fields and confirm successful save to the User
4. IF a User enters a duplicate borehole ID within the same Project, THEN THE Application SHALL display an error and prevent the duplicate from being saved

### Requirement 4: Strata and Lithology Data Entry

**User Story:** As a User, I want to record geological strata encountered during drilling, so that the borehole log accurately represents subsurface conditions.

#### Acceptance Criteria

1. WHEN a User adds a Stratum to a Borehole, THE Application SHALL capture the depth-from, depth-to, lithology type, and geological description
2. THE Application SHALL provide a predefined list of Lithology types including sand, clay, silt, gravel, sandstone, mudstone, limestone, chalk, and made ground, each associated with a distinct graphical hatch pattern image (e.g. stippled dots for sand, horizontal dashes for clay, brick pattern for sandstone) consistent with BS 5930 conventions
3. WHEN a User saves Stratum data, THE Data_Store SHALL persist the Stratum and associate it with the correct Borehole
4. IF a User enters overlapping depth intervals for two Strata in the same Borehole, THEN THE Application SHALL display a validation warning
5. WHEN a User edits an existing Stratum, THE Application SHALL update the record in the Data_Store and reflect the change in the strata list

### Requirement 5: Core Run Data Entry

**User Story:** As a User, I want to record core run information, so that core recovery and quality metrics are captured for each drilling run.

#### Acceptance Criteria

1. WHEN a User adds a Core_Run to a Borehole, THE Application SHALL capture the sample type, depth-from, depth-to, core recovery percentage, SCR percentage, and RQD/TCR percentage
2. THE Application SHALL validate that recovery, SCR, and RQD/TCR percentages are between 0 and 100 inclusive
3. WHEN a User saves Core_Run data, THE Data_Store SHALL persist the Core_Run and associate it with the correct Borehole
4. IF a User enters a Core_Run with depth-from greater than or equal to depth-to, THEN THE Application SHALL display a validation error and prevent saving

### Requirement 6: Water Level and Strike Recording

**User Story:** As a User, I want to record groundwater strikes and water level observations, so that hydrogeological conditions are documented.

#### Acceptance Criteria

1. WHEN a User adds a Water_Strike to a Borehole, THE Application SHALL capture the date, strike depth, casing depth at time of strike, and depth after a specified observation period
2. WHEN a User saves Water_Strike data, THE Data_Store SHALL persist the record and associate it with the correct Borehole
3. THE Application SHALL allow multiple Water_Strike records per Borehole

### Requirement 7: Installation Details

**User Story:** As a User, I want to record borehole installation details, so that casing and monitoring equipment positions are documented.

#### Acceptance Criteria

1. WHEN a User adds an Installation record to a Borehole, THE Application SHALL capture the installation type, depth-from, and depth-to
2. THE Application SHALL provide installation type options including plain casing, slotted casing, screen, gravel pack, bentonite seal, and cement grout
3. WHEN a User saves Installation data, THE Data_Store SHALL persist the record and associate it with the correct Borehole

### Requirement 8: Hole Progress Recording

**User Story:** As a User, I want to record daily drilling progress, so that the drilling timeline and conditions are documented.

#### Acceptance Criteria

1. WHEN a User adds a Hole_Progress entry to a Borehole, THE Application SHALL capture the date, hole depth, casing depth, and water depth (with options for dry or pumped water level)
2. WHEN a User saves Hole_Progress data, THE Data_Store SHALL persist the record and associate it with the correct Borehole
3. THE Application SHALL allow multiple Hole_Progress entries per Borehole, one per date

### Requirement 9: PDF Report Generation

**User Story:** As a User, I want to generate a PDF Rotary Borehole Log report, so that I can produce standardised documentation for clients and regulatory submissions.

#### Acceptance Criteria

1. WHEN a User requests PDF generation for a Borehole, THE PDF_Generator SHALL produce a PDF_Report within 10 seconds
2. THE PDF_Report SHALL include a header section containing: company information, project name, project number, borehole ID, location, easting/northing coordinates, ground level (mAD), scale, hole type, start date, end date, and logged-by initials
3. THE PDF_Report SHALL include a scaled depth column with depth markers in metres
4. THE PDF_Report SHALL include a strata column with high-quality graphical hatch pattern images representing each Lithology type, rendered as tiled fill patterns within the correct depth interval (e.g. stippled dots for sand, horizontal dashes for clay, diagonal lines for silt, circles for gravel, brick pattern for sandstone, wavy lines for mudstone, block pattern for limestone, cross-hatch for chalk, irregular fill for made ground)
5. THE PDF_Report SHALL include a description column displaying the geological description for each Stratum at the correct depth interval
6. THE PDF_Report SHALL include a core run data section displaying sample type, depth intervals, core recovery percentage, SCR percentage, and RQD/TCR percentage
7. THE PDF_Report SHALL include a water levels column displaying recorded water level data
8. THE PDF_Report SHALL include an installation column displaying casing and installation details at correct depth positions
9. THE PDF_Report SHALL include a remarks section containing equipment used, method, casing depth, groundwater notes, and installation summary
10. THE PDF_Report SHALL include a groundwater table displaying date, strike depth, casing depth, and depth after observation
11. THE PDF_Report SHALL include a hole progress table displaying date, hole depth, casing depth, and water depth
12. THE PDF_Report SHALL include a legend column displaying each Lithology hatch pattern image alongside its label, so the reader can identify all geological layers at a glance

### Requirement 10: Responsive Cross-Platform Interface

**User Story:** As a User, I want to access the Application on both desktop and mobile devices, so that I can log data in the field on a tablet or phone and review it on a desktop.

#### Acceptance Criteria

1. THE Application SHALL render correctly on screen widths from 320px to 2560px
2. THE Application SHALL support touch input for all data entry forms on mobile devices
3. WHEN a User accesses the Application on a mobile device, THE Application SHALL present a layout optimised for single-column viewing with appropriately sized touch targets (minimum 44x44px)
4. THE Application SHALL function on the latest two major versions of Chrome, Safari, Firefox, and Edge browsers

### Requirement 12: Professional Visual Design and Trust

**User Story:** As a User, I want the Application to look polished and professional, so that I feel confident using it and can present it credibly to clients and colleagues.

#### Acceptance Criteria

1. THE Application SHALL use a consistent colour palette with a primary brand colour, neutral backgrounds, and clear visual hierarchy across all pages
2. THE Application SHALL use professional typography with a clean sans-serif font family, consistent heading sizes, and adequate line spacing for readability
3. THE Application SHALL display a branded header with a company logo placeholder, application name, and navigation on every authenticated page
4. THE Application SHALL present data entry forms with clearly labelled fields, grouped sections with descriptive headings, and adequate spacing between form elements
5. THE Application SHALL provide visual feedback for all user interactions including hover states on buttons, focus indicators on form fields, and loading indicators during data operations
6. THE Application SHALL use a structured dashboard as the landing page after login, displaying a summary of recent Projects and quick-action buttons for common tasks
7. WHEN a User completes a save operation, THE Application SHALL display a styled success notification that auto-dismisses after 3 seconds
8. THE Application SHALL present validation errors inline next to the relevant form field with a distinct error colour and descriptive message
9. THE Application SHALL include a professional footer containing copyright information, version number, and support contact link on every page
10. THE Application SHALL use consistent iconography from a single icon library for navigation items, action buttons, and status indicators

### Requirement 11: Data Persistence and Integrity

**User Story:** As a User, I want my data to be reliably saved, so that I do not lose borehole records due to system issues.

#### Acceptance Criteria

1. WHEN a User saves any record, THE Data_Store SHALL confirm successful persistence before displaying a success message to the User
2. IF a save operation fails, THEN THE Application SHALL display an error message and retain the unsaved data in the form so the User can retry
3. THE Data_Store SHALL enforce referential integrity between Projects, Boreholes, Strata, Core_Runs, Water_Strikes, Installations, and Hole_Progress records
4. WHEN a User deletes a Borehole, THE Data_Store SHALL remove all associated Strata, Core_Runs, Water_Strikes, Installations, and Hole_Progress records (cascade delete)
