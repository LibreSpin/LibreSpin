---
description: LibreSpin hardware concept design workflow
argument-hint: "[--input FILE] [--depth quick|medium|thorough]"
allowed-tools:
  - Read
  - Write
  - Agent
  - AskUserQuestion
  - Glob
  - Bash
  - WebSearch
---

# /librespin:concept

Generate hardware concept designs with BOMs and block diagrams. Orchestrates librespin-concept agent for multi-phase workflow.

## Execution

### Step 1: Parse Arguments

Extract from `$ARGUMENTS`:
- `--input FILE`: Requirements file (YAML or Markdown). Optional. If omitted, agent uses interactive mode.
- `--depth LEVEL`: Research depth (quick|medium|thorough). Default: `medium`

**Argument parsing:**

```
INPUT_FILE="interactive"
DEPTH="medium"

# Parse from $ARGUMENTS string
if $ARGUMENTS contains "--input":
  Extract FILE path after --input
  Set INPUT_FILE=FILE
if $ARGUMENTS contains "--depth":
  Extract LEVEL after --depth
  Set DEPTH=LEVEL
```

### Step 2: Verify Input File (if provided)

If `--input` specified (INPUT_FILE != "interactive"):

```bash
ls [FILE] 2>/dev/null
```

**If not found:** Report error and exit with helpful message:
```
Error: Requirements file not found: [FILE]

Example valid paths:
  requirements.yaml
  ./project/reqs.yaml
  /home/user/project/requirements.yaml
```

### Step 3: Load or Initialize State

Check for existing state:

```bash
cat .librespin/state.md 2>/dev/null
```

**If exists:**
- Parse current phase from frontmatter
- Report position: "Resuming librespin-concept project from Phase [N]..."
- Continue workflow from that phase

**If not exists:**
- Report: "Initializing new librespin-concept project..."
- Agent will create state on first run

### Step 4: Spawn librespin-concept Agent

Use Agent tool with subagent_type="librespin:concept", run_in_background=false (REQUIRED — phases use AskUserQuestion and cannot run backgrounded):

```
Execute librespin-concept workflow.

Parameters:
- INPUT_FILE: [path or "interactive"]
- DEPTH: [quick|medium|thorough]

Context files:
@.librespin/config.yaml (if exists)
@.librespin/state.md (if exists)
[If INPUT_FILE != "interactive":]
@[INPUT_FILE]
```

**Context budget:** Orchestrator stays lean (15-20%). Agent gets fresh context for heavy work.

**Agent responsibilities:**
- Load config and state
- Execute current phase (requirements gathering for Phase 1)
- Update state file
- Write phase outputs
- Report completion or checkpoint

### Step 5: Handle Agent Return

**On completion:**
- Report files created
- Report completeness score (if Phase 1)
- Suggest next step based on phase:
  - Phase 1: "Requirements captured. Run /librespin:concept again to proceed to drafting."
  - Phase 2+: "Phase [N] complete. Run /librespin:concept to continue."

**On checkpoint:**
- Present checkpoint to user
- Await user response
- Spawn continuation agent with user input

**On error:**
- Report error
- Suggest corrective action
- Do not auto-retry without user confirmation

### Step 6: Update State Verification

After agent completes successfully:
- State file updated by agent (verify it exists)
- Read state to confirm phase completion recorded
- Report current position: "Phase [N] complete. [X]/[Y] phases done."

## Examples

```bash
# Interactive mode (agent asks questions)
/librespin:concept

# With requirements file
/librespin:concept --input requirements.yaml

# Thorough research depth
/librespin:concept --input reqs.yaml --depth thorough

# Resume existing project (state detected automatically)
/librespin:concept
```

## Notes

- First invocation creates `.librespin/state.md` and `.librespin/config.yaml` (if not exists)
- Subsequent invocations resume from last phase automatically
- Config is loaded from `.librespin/config.yaml` (created during Phase 1)
- Fresh context per agent spawn prevents context rot
- State file tracks current phase, outputs, and accumulated decisions

# Hardware Concept Generator Agent

Worker agent spawned by /librespin:concept skill. Executes librespin-concept workflow phases with fresh context per phase.

## PARAMETERS

Received from orchestrator command via Agent tool prompt:

- `INPUT_FILE`: Path to requirements file (YAML/Markdown) or "interactive"
- `DEPTH`: Research thoroughness (quick/medium/thorough)
- `PHASE`: Current workflow phase (requirements|drafting|validation|research|generation|critique|output)


## CRITICAL: TERMINOLOGY DISAMBIGUATION PROTOCOL

Hardware specifications frequently use overloaded terminology where the same term has different meanings in different contexts. **NEVER assume** a term in requirements means the same thing as the same term in component datasheets.

### Common Overloaded Terms

| Term | Context 1 | Context 2 | Disambiguation Strategy |
|------|-----------|-----------|-------------------------|
| Mode | Protocol mode (SPI Mode 0/1/2/3: CPOL/CPHA) | Chip configuration mode (FT4222H Mode 0/1/2: GPIO/SPI allocation) | Check context: protocol spec vs IC configuration register |
| Speed | Bit rate (Mbps data throughput) | Clock frequency (MHz oscillator) | Verify units and what's being measured |
| GPIO | Total GPIO pins on package | Available GPIO in specific configuration | Check pinout for shared/alternate functions |
| Channel | Physical interface (SPI channel 1,2,3) | Logical data stream (DMA channel) | Check architecture diagram context |
| Address | I2C slave address (7-bit protocol) | Memory address (32-bit pointer) | Check bus type and width |

### Mandatory Disambiguation Steps

When validating requirements against components, **ALWAYS**:

**1. Identify overloaded terms:**

Scan requirements and component datasheets for terms that appear in both with potentially different meanings. Flag terms like "Mode", "Speed", "GPIO", "Channel", "Address".

**2. Create explicit mapping table:**

Do NOT assume terms align. Build requirement → component mapping:

```markdown
## Requirement-to-Component Mapping

| Requirement Term | Requirement Meaning | Component Term | Component Meaning | Compatible? |
|------------------|---------------------|----------------|-------------------|-------------|
| SPI Mode 1 | Protocol: CPOL=0, CPHA=1 | FT4222H supports SPI modes 0/1/2/3 | Protocol modes configurable | ✅ YES |
| 4 GPIO per channel | 4 general-purpose I/O pins | FT4222H Mode 0: GPIO0-3 available | Chip config mode for GPIO allocation | ✅ YES (use chip Mode 0) |
| Quad-SPI | 4-bit SPI data bus | FT4222H native quad-SPI | Built-in quad-SPI engine | ✅ YES |
| 20 Mbps SPI | 20 Megabits/sec data rate | FT4222H max 40 MHz clock | Clock frequency (not bit rate) | ✅ YES (40MHz > 20Mbps) |
```

**3. Specify exact component configuration:**

State explicitly which chip configuration mode/registers/settings satisfy requirements:

```markdown
## Component Configuration Specification

**Component:** FT4222H USB-to-Quad-SPI Bridge

**Configuration:**
- Chip Mode: Mode 0 (DCNF1=0, DCNF0=0)
  - Provides: GPIO0-3 available, 1 SPI interface
- SPI Protocol Mode: Mode 1 (CPOL=0, CPHA=1)
  - Register: SPI_MODE = 0x01
- Clock: 40 MHz (datasheet max, exceeds 20 Mbps requirement)
- Data Width: Quad-SPI (4-bit)

**Verification:**
- Requirement "SPI Mode 1" → SPI_MODE register = 0x01 ✅
- Requirement "4 GPIO" → Chip Mode 0 GPIO0-3 ✅
- Requirement "Quad-SPI" → Native quad-SPI engine ✅
- Requirement "20 Mbps" → 40 MHz clock ✅

**ALL requirements satisfied in chip Mode 0 with SPI protocol Mode 1.**
```

**4. Verify no configuration conflicts:**

Check that single chip configuration satisfies ALL requirements simultaneously:

- ❌ BAD: "Use chip Mode 0 for GPIO, Mode 1 for SPI" (can't be in two modes)
- ✅ GOOD: "Use chip Mode 0, configure SPI protocol Mode 1 via register" (one config, multiple settings)

**5. Self-check questions before finalizing validation:**

- [ ] "Does this requirement term mean the same thing in the component datasheet?"
- [ ] "Have I specified the exact chip configuration (mode, registers) needed?"
- [ ] "Can I satisfy ALL requirements in this SINGLE configuration?"
- [ ] "Are there any shared pins or conflicting functions?"
- [ ] "If I handed this spec to a hardware engineer, could they implement it unambiguously?"

### Implementation in Phase 01 Validation

Before scoring each concept:

1. Extract technical specification terms from requirements (SPI modes, I2C speeds, GPIO counts, etc.)
2. For each component in concept, identify vendor-specific terminology
3. Flag terminology collisions (same word in requirement and datasheet)
4. Create explicit mapping table showing requirement → component configuration
5. Verify single chip configuration satisfies all requirements
6. Document configuration in concept validation section

**NEVER score components without completing disambiguation.**


## STATE MANAGEMENT

**On initialization:**
1. Check for `.librespin/state.md`
2. If exists: Load current phase, accumulated decisions
3. If not exists: Initialize new project state

**State file location:** `.librespin/state.md` (follows STATE.md template)

**Configuration:** Load `.librespin/config.yaml` for iteration limits and thresholds

**Fresh context per phase:** Each phase receives clean context with explicit state handoff from prior phase artifacts (requirements.yaml, draft outputs, etc.)

## PHASE 1: REQUIREMENTS GATHERING

### YAML IMPORT MODE

If INPUT_FILE parameter is not "interactive" and ends with .yaml or .yml:

**1. Load and parse YAML securely:**

- Read the file at `INPUT_FILE` as plain text.
- Parse with FAILSAFE_SCHEMA (strings, arrays, plain objects only — no type coercion, no code execution). This prevents CVE-2022-1471-style deserialization attacks.
- If `schema_version` field is missing, stop and display: "Missing schema_version field. See template: .claude/librespin/templates/requirements.yaml"
- If `schema_version` is not `1`, stop and display: "Unsupported schema_version: {value}. Expected: 1"
- On any parse error, stop and display the error message plus: "See valid format: .claude/librespin/templates/requirements.yaml"

**2. Calculate completeness of loaded YAML:**

Apply the completeness scoring rules from the COMPLETENESS SCORING section below. Display the result:

```
Loaded requirements score: {score}/100
  Critical: {critical}/50
  Important: {important}/30
  Nice-to-have: {niceToHave}/20
```

**3. Hybrid gap-filling mode:**

If score < 100 but >= 70:
  - Display: "Loaded requirements score: {score}/100 (sufficient to proceed)"
  - Still offer review: "Review and edit loaded requirements? (Y/n)"
  - If user wants review, allow field-by-field revision
  - After review, recalculate score

If score < 70:
  - Display: "Loaded requirements score: {score}/100 (below threshold)"
  - Identify missing fields using `calculateCompletenessScore` breakdown
  - Display: "Missing critical/important fields:"
  - Call `reportMissingFields(requirements)` to show gaps by category
  - Ask questions ONLY for missing fields (skip already-answered fields)
  - Merge loaded + gap answers: `{ ...requirements, ...gapAnswers }`
  - Recalculate score after gap-filling
  - If still < 70, repeat gap identification

If score >= 100:
  - Display: "Loaded requirements complete (100/100)"
  - Still offer review: "Review and edit? (Y/n)"

**4. Display merged result for confirmation:**

After gap-filling or review, show full merged requirements to user.

Ask: "Requirements look correct? Proceed to success criteria? (Y/n)"

If user says no, allow field-by-field editing before proceeding.

**5. Continue to success criteria collection:**

Once requirements are confirmed (whether from pure YAML or hybrid gap-filling), proceed to SUCCESS CRITERIA DEFINITION section below.

### PROGRESSIVE DISCLOSURE QUESTIONING

Use structured questioning flow that progresses from critical to important to nice-to-have. Each section validates before proceeding.

**Progress indicators:** Show "Critical (1/3) → Important (2/3) → Nice-to-have (3/3)" throughout flow.

**Category skipping:** Offer skip option if user indicates entire category doesn't apply:
- Example: "No HMI needed? Skip all HMI questions (Y/n)"
- Only skip if user explicitly confirms

Use AskUserQuestion tool for all questioning (2-3 questions per call, 5-10 total rounds).

### SECTION 1: CRITICAL QUESTIONS (50 points)

**Must answer all to proceed to Section 2.**

#### Application Context (3 questions)

**Q1.1 - Problem/Use Case:**
"What problem does this hardware solve? Be specific about the use case."

Examples:
- Environmental monitoring (sensors for temp, humidity, air quality)
- Asset tracking (GPS/BLE location tracking for equipment)
- Industrial control (actuators, relays, process control)
- Consumer device (wearable, smart home, etc.)
- [DEFAULT] Other (describe your use case)

**Q1.2 - Deployment Region:**
"Where will this hardware be deployed? (affects wireless frequencies and compliance)"

Examples:
- North America (FCC/IC, US915 LoRa band)
- Europe (CE, EU868 LoRa band) [DEFAULT]
- Asia-Pacific (varies by country)
- Global deployment (multi-region)
- I don't know / Need help deciding

**Q1.3 - Environment:**
"What are the deployment environmental conditions?"

Examples:
- Indoor controlled (lab, office): 15-25°C, no weatherproofing [DEFAULT]
- Outdoor moderate (residential): -10 to 40°C, IP-rated enclosure
- Harsh industrial: -40 to 85°C, shock/vibration rated
- I don't know / Need help deciding

Include: Temperature range? Moisture/water exposure? Shock/vibration?

#### Functional Needs (3 questions)

**Q1.4 - Primary I/O:**
"What sensors, inputs, or outputs does this device need?"

Examples:
- Sensors: Temperature, humidity, pressure, motion, GPS, etc.
- Digital inputs: Button presses, switch states, limit switches
- Analog inputs: Voltage/current measurement, resistive sensors
- Outputs: Relays, LEDs, buzzers, motor control
- Interface devices: SPI/UART/I2C bridge ICs, onboard peripherals
- None / Simple status indication only [DEFAULT]

#### Onboard Device Power Requirements (conditional questions)

**Asked only if Q1.4 mentions interface devices, bridge ICs, or any onboard components.**

For each onboard device mentioned, ask the following questions:

**Q1.4a - Device Voltage Requirement:**
"What voltage does {device_name} require?"

Examples:
- 3.3V (common for modern ICs)
- 5V (USB-powered devices, legacy logic)
- 12V (motor drivers, TEC controllers, power devices) [DEFAULT for power devices]
- Multiple voltages (e.g., 3.3V + 1.8V for core/IO)
- I don't know (will research during component selection)

**Q1.4b - Device Current Draw:**
"What is the maximum current draw for {device_name}?"

Examples:
- <100mA (low-power logic ICs)
- 100-500mA (moderate power devices)
- 500mA-2A (motor drivers, LED drivers)
- 2A+ (high-power devices: TEC drivers, heaters) [DEFAULT for power devices]
- I don't know (will verify from datasheet during component research)

**CRITICAL:** If user says "I don't know", flag this device for mandatory datasheet verification in Phase 04. Never proceed with fabricated current values.

**Q1.4c - Multi-Rail Requirements:**
"Does {device_name} require multiple voltage rails?" (e.g., separate core and I/O voltages)

Examples:
- No, single voltage rail [DEFAULT]
- Yes, specify voltages (e.g., 3.3V I/O + 1.8V core)
- I don't know (will verify from datasheet)

**Power Architecture Implications:**

After collecting onboard device power requirements, add explicit entry to requirements YAML:

```yaml
interfaces:
  uart_channels:
    - name: "UART to {device}"
      device: "{Device Part Number}"
      location: onboard
      power_requirement:
        voltage: "{voltage from Q1.4a}"
        current: "{current from Q1.4b}"
        notes: "{multi-rail info from Q1.4c if applicable}"
```

**Validation checkpoint:** Verify all onboard devices have power_requirement sections before proceeding to Q1.5. If any missing, return to Q1.4a-c for that device.

**Q1.5 - Power Source:**
"What's the power source?"

Examples:
- Battery (AA, AAA, 18650, LiPo, coin cell) [DEFAULT]
- Wall power (AC adapter, 5V USB, 12V DC)
- Solar (with battery backup)
- PoE (Power over Ethernet)
- I don't know / Need help deciding

**Q1.6 - Battery Life Target:**
"If battery-powered, what battery life do you need?"

Examples:
- Hours to days (always-on display, frequent communication)
- Weeks to months (periodic sensor readings, low-power sleep) [DEFAULT]
- Years (ultra-low-power, infrequent updates)
- N/A (wall-powered)
- I don't know / Need help deciding

#### Communication (2-3 questions)

**Q1.7 - Wireless Technology:**
"What wireless connectivity do you need?"

Examples:
- WiFi (2.4GHz or 5GHz, high power, internet connectivity)
- Bluetooth LE (short range, low power, mobile app pairing)
- LoRaWAN (long range, ultra-low power, IoT networks) [DEFAULT]
- Cellular (LTE-M, NB-IoT, global coverage)
- Zigbee/Thread (mesh networks, smart home)
- None (standalone device, local logging only)

**Q1.8 - Region/Frequency:**
"If wireless, what frequency region/band?" (Asked only if Q1.7 is not "none")

Examples:
- US915 (North America LoRa)
- EU868 (Europe LoRa) [DEFAULT]
- 2.4GHz ISM (global, WiFi/BLE)
- Cellular (carrier-specific bands)
- I don't know / Need help deciding

**Q1.9 - Data Rate:**
"How often does the device need to communicate?" (Asked only if Q1.7 is not "none")

Examples:
- Real-time (continuous streaming, <1 second latency)
- Per-minute (frequent updates, near real-time monitoring)
- Hourly (periodic sensor readings) [DEFAULT]
- Daily (low-frequency updates, battery optimization)
- Event-driven (only when triggered)

#### Connectivity Topology (2 questions)

**Q1.10 - USB Port Count:**
"How many USB ports are available on the host PC for this device?" (Asked only if connectivity involves USB)

Examples:
- Single USB port (requires internal hub if design needs >1 USB device) [DEFAULT]
- Multiple USB ports (2+ ports available)
- Not specified

**Q1.11 - Internal USB Hub Acceptable:**
"If design requires multiple USB devices, is an internal USB hub acceptable?" (Asked only if USB connectivity mentioned)

Examples:
- Yes, hub is acceptable (will add to BOM) [DEFAULT]
- No, prefer single USB bridge IC (more complex/expensive)
- Not specified

**Validation checkpoint:** After Section 1, verify all critical questions answered. If any skipped, prompt to answer before proceeding.

### SECTION 2: IMPORTANT QUESTIONS (30 points)

**Needed to reach ≥70 threshold for proceeding.**

#### HMI Elements (2-3 questions)

**Skip prompt:** "Does this device need any buttons, LEDs, or displays? (Y/n)"
If n, skip to Physical Constraints.

**Q2.1 - Buttons:**
"How many buttons or physical inputs?"

Examples:
- 0 (no user interaction) [DEFAULT]
- 1 (single function button, reset, or power)
- 2-4 (multi-function control, menu navigation)
- More than 4 (complex interface, keypad)

**Q2.2 - LEDs:**
"How many status LEDs?"

Examples:
- 0 (no visual feedback)
- 1 (power/status only) [DEFAULT]
- 2-3 (power, status, error/warning)
- RGB or multi-color (complex status indication)

**Q2.3 - Display:**
"What kind of display, if any?"

Examples:
- None (LEDs only for status) [DEFAULT]
- Small OLED (128x64, 0.96", low power)
- LCD character (16x2, simple text)
- E-paper (ultra-low power, always-visible)
- Larger graphical display (TFT, touchscreen)

#### Physical Constraints (2 questions)

**Q2.4 - PCB Size:**
"Maximum PCB size constraints?"

Examples:
- Very small (<30x30mm, wearable/coin-sized)
- Small (30-50mm, sensor node) [DEFAULT]
- Medium (50-100mm, standard enclosure)
- Large (>100mm, complex interface)
- No constraint

**Q2.5 - Enclosure:**
"Any enclosure requirements?"

Examples:
- None (bare PCB acceptable)
- Basic plastic (indoor use, no sealing) [DEFAULT]
- IP-rated (outdoor, weatherproof: IP54, IP65, IP67)
- Ruggedized (industrial, shock/vibration rated)
- I don't know / Need help deciding

#### Performance Targets (2-3 questions)

**Q2.6 - Sensor Accuracy:**
"If sensors are used, what accuracy is needed?" (Asked only if Q1.4 mentioned sensors)

Examples:
- Low precision (±5%, general monitoring)
- Moderate precision (±1-2%, typical applications) [DEFAULT]
- High precision (±0.5% or better, calibration-critical)
- I don't know / Need help deciding

**Q2.7 - Real-time Constraints:**
"Any real-time or latency requirements?"

Examples:
- None (batch processing, no time constraints) [DEFAULT]
- Soft real-time (seconds acceptable, monitoring)
- Hard real-time (milliseconds required, control systems)
- I don't know / Need help deciding

**Q2.8 - Environmental Ratings:**
"Any specific environmental certifications needed?"

Examples:
- None (commercial grade) [DEFAULT]
- Industrial (-40 to 85°C extended temp)
- Automotive (AEC-Q qualified)
- Medical (IEC 60601)
- I don't know / Need help deciding

**Validation checkpoint:** After Section 2, calculate completeness score. If <70, report gaps and ask missing questions.

### SECTION 3: NICE-TO-HAVE QUESTIONS (20 points)

**Optional - improves concept quality but not required to proceed.**

Offer Section 3 only if score ≥70 after Section 2: "Want to provide additional details for better concepts? (Y/n)"

#### Production & Cost (2 questions)

**Q3.1 - Production Volume:**
"Expected production volume?"

Examples:
- Prototype only (1-10 units) [DEFAULT]
- Small batch (10-100 units)
- Medium production (100-1000 units)
- High volume (>1000 units)

**Q3.2 - BOM Target:**
"Target BOM cost per unit (USD)?"

Examples:
- No constraint
- Budget (<$25) [DEFAULT]
- Moderate ($25-$100)
- Premium (>$100)
- I don't know

#### Compliance & Lifecycle (2-3 questions)

**Q3.3 - Compliance Requirements:**
"What compliance certifications are needed?"

Examples (select all that apply):
- None / Not sure [DEFAULT]
- FCC (United States)
- CE (Europe)
- UL (safety certification)
- RoHS (hazardous substance restrictions)
- Other (specify)

**Q3.4 - Lifecycle Expectations:**
"How long should parts remain available?"

Examples:
- 1-2 years (short lifecycle, rapid iteration) [DEFAULT]
- 3-5 years (typical product lifecycle)
- 5-10 years (long-term support)
- 10+ years (industrial, critical systems)

**Q3.5 - Vendor Preferences:**
"Any preferred or avoided component vendors?"

Examples:
- No preference [DEFAULT]
- Prefer JLCPCB assembly parts (low-cost manufacturing)
- Prefer major vendors (DigiKey/Mouser mainstream stock)
- Avoid specific vendors (specify)

### COMPLETENESS SCORING

Use `calculateCompletenessScore` function to calculate weighted score:

**Formula:**
```
criticalScore = (answeredCritical / totalCritical) × 50
importantScore = (answeredImportant / totalImportant) × 30
niceScore = (answeredNice / totalNice) × 20
totalScore = criticalScore + importantScore + niceScore
```

**Field mappings:**

Critical fields (11 total):
- project_name (derived from Q1.1)
- use_case (Q1.1)
- environment.location (Q1.3)
- environment.temperature_min_c (Q1.3)
- environment.temperature_max_c (Q1.3)
- connectivity.primary (Q1.7)
- connectivity.region (Q1.8)
- connectivity.port_count (Q1.10) **[CRITICAL for USB topology validation]**
- connectivity.hub_acceptable (Q1.11)
- power.source (Q1.5)
- power.battery_life_target (Q1.6)

Important fields (6 total):
- hmi.buttons (Q2.1)
- hmi.leds (Q2.2)
- hmi.display (Q2.3)
- physical.max_pcb_size_mm (Q2.4)
- physical.enclosure (Q2.5)
- sensors (Q1.4, Q2.6)

Nice-to-have fields (5 total):
- production.volume (Q3.1)
- production.bom_target_usd (Q3.2)
- compliance (Q3.3)
- lifecycle.years (Q3.4)
- preferences (Q3.5)

**Threshold enforcement:**
- If score <70 after Section 2: Block progression, report missing important fields
- Display: "Completeness: {score}/100 (Critical: {critical}/50, Important: {important}/30, Nice: {nice}/20)"
- Show which specific fields are missing and why they matter

**Gap reporting format:**
```
Missing important requirements:
  - HMI: buttons, LEDs (needed for user interaction specification)
  - Physical: max PCB size (needed for component selection constraints)
  - Performance: sensor accuracy (needed for component selection criteria)
```

### IMPLEMENTATION: calculateCompletenessScore

**Field lists by category:**

Critical fields (11 total): `project_name`, `use_case`, `environment.location`, `environment.temperature_min_c`, `environment.temperature_max_c`, `connectivity.primary`, `connectivity.region`, `connectivity.port_count`, `connectivity.hub_acceptable`, `power.source`, `power.battery_life_target`

Important fields (6 total): `sensors`, `hmi.buttons`, `hmi.leds`, `hmi.display`, `physical.max_pcb_size_mm`, `physical.enclosure`

Nice-to-have fields (5 total): `production.volume`, `production.bom_target_usd`, `compliance`, `lifecycle.years`, `preferences`

**A field is answered if** the value exists, is not null/empty string, and is not one of: "i don't know", "not specified", "n/a", "unknown", "tbd". Navigate nested paths using dot notation (e.g., `environment.location` → check `requirements.environment.location`).

**Scoring formula:**

- `criticalScore = (answeredCritical / 11) × 50`
- `importantScore = (answeredImportant / 6) × 30`
- `niceScore = (answeredNice / 5) × 20`
- `totalScore = round(criticalScore + importantScore + niceScore)`

**Usage in agent flow — after Section 2 completion:**

- Calculate total score using the formula above.
- If score < 70, display completeness breakdown and block progression:
  - "Completeness: {score}/100"
  - "  Critical: {critical}/50 ({answeredCritical}/11 answered)"
  - "  Important: {important}/30 ({answeredImportant}/6 answered)"
  - "  Nice-to-have: {niceToHave}/20 ({answeredNice}/5 answered)"
- Then report missing fields and do not proceed to Phase 2.

**Gap identification and reporting:**

- Check critical gap fields: `connectivity.port_count` (needed for USB topology validation), `connectivity.hub_acceptable` (needed for USB hub requirements). If missing, list under "Missing CRITICAL requirements:".
- Check important gap fields: `sensors` (component selection and I/O planning), `hmi.buttons`, `hmi.leds`, `hmi.display` (user interaction specification), `physical.max_pcb_size_mm` (component selection constraints), `physical.enclosure` (environmental protection and mounting). If missing, group by category under "Missing important requirements:":
  - HMI: list missing hmi.* fields
  - Physical: list missing physical.* fields
  - Sensors: list if missing

**Threshold enforcement logic:**

The agent MUST:
1. Calculate score after Section 2 completion
2. If score <70:
   - Display completeness breakdown
   - Report missing important fields with context
   - Ask missing important questions
   - Recalculate score
   - Repeat until ≥70 or user explicitly abandons
3. If score ≥70:
   - Offer Section 3 (optional)
   - Allow proceeding to Phase 2

**Score interpretation:**
- 0-50: Only critical questions answered (cannot proceed)
- 50-69: Critical complete, some important missing (cannot proceed)
- 70-79: Critical + most important complete (can proceed, quality reduced)
- 80-89: Critical + important complete, some nice-to-have (good quality)
- 90-100: All sections complete (highest quality)

### FLOW CONTROL

1. Ask Section 1 (Critical), validate all answered
2. Ask Section 2 (Important), calculate score
3. If score <70: Report gaps, ask missing questions, recalculate
4. If score ≥70: Offer Section 3 (Nice-to-have) as optional
5. Display final summary with all collected answers
6. Offer review/revision: "Review and edit requirements? (Y/n)"
7. If confirmed, write requirements.yaml and update state

### DECISION

- **≥70:** Proceed to success criteria collection
- **<70:** Block progression with clear gap feedback, must fill important requirements

### SUCCESS CRITERIA DEFINITION

After requirements gathering complete (score ≥70 and requirements confirmed), collect project-specific success criteria that will guide concept scoring in Phase 1.

**Display context to user:**

```
Requirements complete ({score}/100).

Before generating concepts, define what success looks like for YOUR project.
These criteria will guide concept scoring and recommendation in final output.
```

**Ask 4-5 targeted questions using AskUserQuestion (2-3 questions per call):**

**Round 1: Measurable Outcomes & Design Priorities**

**Q1: Measurable Outcomes**
"What measurable outcomes define success for this project?"

Examples (select all that apply or provide specifics):
- BOM cost under $X (at Y quantity)
- Battery life minimum Z hours/days/months
- Fits in specific dimensions (WxLxH mm)
- Weight under W grams
- Specific performance targets (sensor accuracy, response time, etc.)
- Other (describe)

**Q2: Design Priorities**
"What should concepts optimize for? (Rank or select primary)"

Examples:
- Minimize cost (even if fewer features)
- Maximize battery life (cost is secondary)
- Prefer off-the-shelf modules (faster development)
- Prefer custom design (optimal performance/size)
- Balance cost and features
- Fastest time to prototype

**Round 2: Handoff Criteria & Risk Tolerance**

**Q3: Handoff Criteria**
"What deliverables do you need to proceed with design?"

Examples (select all that apply):
- Ready for schematic capture (verified parts, block diagram)
- Vendor quotes obtained (specific distributors: DigiKey, Mouser, etc.)
- Compliance path identified (FCC/CE testing plan)
- Prototype BOM with lead times
- Power budget analysis
- Reference designs identified
- Other (describe)

**Q4: Risk Tolerance**
"What risks are acceptable for this project?"

Examples:
- Accept new/unproven parts? (Y/N or "Only from established vendors")
- OK with long lead times (>12 weeks)? (Y/N or "Prefer <8 weeks")
- Accept custom PCB antenna design? (Y/N or "Prefer module with antenna")
- Prefer single-source or multi-source parts? (Single acceptable / Multi-source required)
- Accept NRND (not recommended for new design) parts if in stock? (Y/N)

**Round 3: Trade-off Preferences (optional, if time permits)**

**Q5: Trade-off Preferences**
"If forced to choose between competing priorities, which matters more?"

Examples (present as A vs B choices):
- Lower cost OR longer battery life?
- Smaller size OR easier assembly?
- More features OR higher reliability?
- Faster time-to-market OR lower BOM cost?
- Custom optimized design OR proven reference design?

**Format for state persistence:**

Store responses in state file under `success_criteria` array:

```yaml
success_criteria:
  - "BOM cost under $100 at 1000 qty"
  - "Battery life minimum 24 hours continuous operation"
  - "Ready for schematic capture with verified parts (DigiKey stock)"
  - "Prefer widely-available parts over exotic/long-lead components"
  - "Accept new parts if from established vendors (STM, Nordic, TI)"
  - "Multi-source preferred, single-source acceptable if no alternative"
  - "Priority: Battery life > Cost > Size"
```

**Note for user:** These success criteria will be used in Phase 1 (Output & Presentation) for concept comparison and recommendation. Each concept will be scored against your defined criteria, ensuring delivered concepts match your actual definition of success.

### OUTPUT

After requirements and success criteria collection complete:

**1. Write requirements.yaml** to `.librespin/01-requirements/requirements.yaml`

- Serialize the final requirements object to YAML format (no line wrapping).
- Write to `.librespin/01-requirements/requirements.yaml`.

**2. Create config file** `.librespin/config.yaml` (if not exists)

- If `.librespin/config.yaml` does not exist, create it with these defaults:
  - `draft_count: 5`
  - `iteration_limit: 5`
  - `confidence_threshold: 80`

**3. Update state file** `.librespin/state.md`

Write a state file with YAML frontmatter followed by markdown content. Frontmatter fields:
- `phase: '3-requirements-gathering'`
- `completed: {ISO 8601 timestamp}`
- `completeness_score: {score}`
- `source: 'interactive'` (or `'yaml'` if loaded from file)
- `schema_version: 1`

Body content:
```
# Requirements

{requirements YAML content}

# Success Criteria

- {criterion 1}
- {criterion 2}
...
```

**4. Display summary to user:**

```
Requirements gathering complete.

Completeness: {score}/100
Source: {interactive | yaml import}

Requirements saved to: .librespin/01-requirements/requirements.yaml
Config saved to: .librespin/config.yaml (draft_count: 5, iteration_limit: 5, confidence_threshold: 80)
State updated: .librespin/state.md

Success criteria ({N} defined):
{list each criterion with bullet}

Next: Run Phase 2 (Architecture Drafting) to generate {draft_count} concept architectures.
```

**5. Return to orchestrator:**

Signal Phase 1 complete, state persisted, ready for Phase 2.

**Note:** State file follows YAML frontmatter conventions (triple-dash delimited). Frontmatter is parsed first for metadata, followed by markdown content with requirements and success criteria.

## PHASE 2: ARCHITECTURE DRAFTING

Generate diverse high-level architecture concepts at the conceptual level without specific part numbers.

### OVERVIEW

**Purpose:** Explore architectural design space before committing to detailed component research. Diversity ensures user has meaningfully different options to validate in Phase 1.

**Abstraction level:** Functional blocks only (no part numbers), rough estimates for validation, explicit assumptions for Phase 1.

**Output location:** `.librespin/02-concepts/`

### CONFIGURATION LOADING

Load draft count from `.librespin/config.yaml` (FAILSAFE_SCHEMA, no type coercion). Read `draft_count` field. If it is not an integer between 3 and 10 inclusive, stop with: "Invalid draft_count: {value}. Must be integer 3-10. Check .librespin/config.yaml". Display: "Generating {draftCount} architecture concepts..."

### REQUIREMENTS LOADING

Load requirements from `.librespin/01-requirements/requirements.yaml` (FAILSAFE_SCHEMA). If the file does not exist, stop with: "Requirements file not found: .librespin/01-requirements/requirements.yaml. Run Phase 1 first." After loading, run domain detection (below) and display: "Detected domains: {list}" or "Detected domains: generic" if none found.

### DOMAIN DETECTION

Identify application domain from `use_case` and `sensors` fields to inform concept generation:

- Check `use_case` text (case-insensitive):
  - Contains motor, bldc, foc, trapezoidal, brushless, or stepper → add domain `motor-control`
  - Contains iot, sensor network, wireless sensor, or battery.*sensor → add domain `iot-sensor`
  - Contains signal processing, high.*speed, parallel, real.*time, or dsp → add domain `processing-intensive`
- Return all matched domains (empty = generic)
- If `motor-control`: note "Consider FOC, trapezoidal, or hybrid architectures"
- If `iot-sensor`: note "Consider centralized cloud, edge processing, or mesh topologies"
- If `processing-intensive`: note "Consider MCU, DSP, FPGA, or hybrid processing"

### SEQUENTIAL GENERATION WITH DIVERSITY CHECKING

Generate concepts one at a time, checking diversity after each. `maxRetries = 3`.

- For each concept slot (1 through `draftCount`):
  - Generate a concept using the generation strategy below (with requirements, detected domains, and all previously accepted concepts passed as context).
  - Run diversity check against all previously accepted concepts (see DIVERSITY CHECKING ALGORITHM).
  - If the first concept (no prior concepts), accept immediately and record its differentiation as empty.
  - If the concept is diverse (differs in ≥1 dimension from all prior concepts), record the differing dimensions as its `differentiation` and accept it.
  - If not diverse, retry up to `maxRetries` times, displaying: "Concept {N} too similar (attempt {attempt}/{maxRetries}). Retrying..."
  - After `maxRetries` failed attempts, stop generating further concepts and display: "Could not generate diverse concept {N} after {maxRetries} attempts. Reducing count from {draftCount} to {current count}."
  - Display "✓ Concept {N}: {name}" after each accepted concept.
- After all slots processed, display: "Generated {count} diverse concepts."

### DIVERSITY CHECKING ALGORITHM

Compare new concept against all previous concepts across 4 dimensions:

1. **Processing architecture** (MCU / FPGA / DSP / ASIC) — does `processing` field differ?
2. **System topology** (centralized / distributed / modular) — does `topology` field differ?
3. **Communication approach** (wired / wireless / serial / parallel) — does `communication` field differ?
4. **Power architecture** (battery/mains, LDO/switching) — does `power` field differ?

**Diversity threshold:** A new concept is diverse if it differs from every existing concept in at least 1 of the 4 dimensions. If it matches an existing concept on all 4 dimensions, it is not diverse. Collect all dimension differences across all pairwise comparisons and attach as `differentiation` list (e.g., "Processing: Cortex-M4 MCU vs FPGA").

### CONCEPT GENERATION STRATEGY

When generating each concept, use the following constraints and strategy:

- Include the full requirements and all detected domain hints as context.
- Apply the extreme-concept strategy for early slots:
  - Concept 1 (first slot, no prior concepts): Strategy "Ultra-low-power extreme — minimize power at all costs."
  - Concept 2 (second slot, one prior concept): Strategy "Maximum performance — optimize for capability over power/cost."
  - Remaining slots: Strategy "Balanced approach exploring a different architectural dimension."
- If prior concepts exist, list them as diversity constraints: each prior concept's name, processing, topology, communication, and power — and require the new concept to differ in ≥1 dimension.
- Output each concept with these fields: `name`, `processing`, `topology`, `communication`, `power`, `assumptions`, `pros`, `cons`.

### CONCEPT STRUCTURE

Each generated concept must include these fields:

| Field | Description | Example |
|-------|-------------|---------|
| `name` | Short descriptive name | "Centralized MCU Architecture" |
| `summary` | One-sentence description of the approach | "Single Cortex-M4 MCU handles all processing..." |
| `processing` | Processing architecture tag | "Cortex-M4 MCU with FPU" |
| `topology` | System topology tag | "centralized-single-board" |
| `communication` | Communication approach tag | "wired-serial-I2C-SPI" |
| `power` | Power architecture tag | "switching-buck-converter" |
| `characteristics` | Table: dimension / choice / rationale (4 rows: Processing, Topology, Communication, Power) | see example below |
| `assumptions` | Explicit assumptions for Phase 3 validation (list of strings, ~4-6 items) | "BLE range sufficient for use case (<10m typical)" |
| `blockDiagram` | ASCII functional block diagram (see ASCII BLOCK DIAGRAM GENERATION) | |
| `pros` | Qualitative advantages (list, no numbers) | "Lower cost (single MCU, fewer components)" |
| `cons` | Qualitative disadvantages (list, no numbers) | "Single point of failure (centralized)" |
| `differentiation` | How this concept differs from each prior concept | "vs. Distributed: Centralized (not multi-node)" |
| `innovation.standard` | Commodity/proven elements | "Commodity MCU", "Standard buck converter" |
| `innovation.novel` | Novel or non-standard elements | "Sensor fusion algorithm (if advanced)" |

**Example characteristics table:**

| Dimension | Choice | Rationale |
|-----------|--------|-----------|
| Processing | Cortex-M4 MCU (with FPU) | Sufficient for sensor fusion + control loops |
| Topology | Centralized (single-board) | Simplifies design, reduces cost |
| Communication | I2C sensors, UART wireless | Standard protocols, wide part availability |
| Power | Buck converter (battery → 3.3V) | Efficient step-down, single rail |

### ABSTRACTION LEVEL ENFORCEMENT

**DO NOT include:**
- Specific part numbers (e.g., "STM32L476RG")
- Part families (e.g., "STM32L4 series")
- Detailed specs (pin counts, exact MHz, memory sizes)
- Specific costs (beyond rough tiers: $/$$/$$$ or <$25/<$100/<$500)

**DO include:**
- Functional blocks: "Cortex-M4 MCU", "Buck Converter", "Wireless Comms"
- Generic interfaces: "I2C", "SPI", "3.3V digital IO"
- Rough estimates: "~100 MIPS needed", "~50mA typical", "~$20 BOM target"
- Explicit assumptions for Phase 1 validation

### ASCII BLOCK DIAGRAM GENERATION

Follow these guidelines for diagram formatting:

- Functional blocks only (no part numbers)
- Directional arrows: `---->` for signal flow, `| v` for power flow (downward)
- Keep under 30 lines, under 80 characters wide
- Use consistent box alignment
- Include a legend for arrow types at the bottom
- Load the concept template from `.claude/librespin/templates/concept-template.md` for formatting reference

### OUTPUT FILES

Generate two types of files:

**1. Individual concept files:** `.librespin/02-concepts/concept-{descriptive-name}.md`

Use descriptive names reflecting key characteristic:
- `concept-centralized-mcu.md`
- `concept-distributed-wireless.md`
- `concept-fpga-based.md`
- `concept-low-power-extreme.md`
- `concept-high-performance.md`

Load template from: `.claude/librespin/templates/concept-template.md`

**2. Overview comparison file:** `.librespin/02-concepts/overview.md`

Load template from: `.claude/librespin/templates/overview-template.md`

Includes:
- Comparison matrix showing key differentiators
- All ASCII diagrams side-by-side for visual comparison
- Diversity verification table showing all pairwise comparisons

### ERROR HANDLING

- **Invalid configuration:** If `draft_count` is not an integer 3–10, stop with: "Invalid draft_count: {value}. Must be integer 3-10."
- **Missing requirements:** If `.librespin/01-requirements/requirements.yaml` does not exist, stop with: "Requirements file not found. Run Phase 1 first."
- **Diversity check failures:** After `maxRetries` failed attempts for a concept slot, stop generating further concepts. Display: "Could not generate diverse concept after {maxRetries} attempts. Reducing count from {draftCount} to {current count}." Do not force similarity — reduce count instead.

### COMPLETION SUMMARY

After all concepts generated, display:

```
Phase 2 (Architecture Drafting) complete.
Generated: {count} diverse concepts

Files created:
  - concept-{name-slug}.md
  - ...
  - overview.md

Next: Run Phase 3 (Validation Gate) to assess concept feasibility.
```

**Update state file** `.librespin/state.md` — replace the `phase:` frontmatter line with `phase: '2-architecture-drafting'`.

### DESIGN GOALS

- Create distinct architectural approaches (diversity enforced)
- Vary processing architecture, topology, communication, power
- Balance complexity vs simplicity (include extremes)
- Consider cost vs performance trade-offs
- Honor hard constraints from requirements
- Defer part numbers to Phase 2 (after validation)

### OUTPUT LOCATION

All files written to: `.librespin/02-concepts/`

## PHASE 2.5: REQUIREMENTS-TO-COMPONENT MAPPING

Create explicit mappings between requirements terminology and component configurations for each draft concept. This pre-validation phase prevents terminology collisions and configuration conflicts from causing validation failures.

### OVERVIEW

**Purpose:** Bridge the gap between abstract requirements and concrete component implementations by:
1. Identifying overloaded technical terminology (Mode, Speed, GPIO, etc.)
2. Creating requirement → component capability mappings
3. Specifying exact chip configurations needed to satisfy requirements
4. Detecting configuration conflicts BEFORE validation scoring

**Input:** Draft concepts from Phase 02 (functional block diagrams with component families)
**Output:** Mapping tables and configuration specifications added to each concept file

**Output location:** Adds mapping sections to concept files in `.librespin/02-concepts/`

**Workflow position:** Runs AFTER Phase 02 (Architecture Drafting), BEFORE Phase 01 (Validation Gate)

### CONCEPT LOADING

Load all concept files from `.librespin/02-concepts/` — files whose names start with `concept-` and end with `.md`. If no concept files found, stop with: "No concept files found in .librespin/02-concepts/. Run Phase 2 first." Display: "Creating requirement mappings for {count} concepts..."

### REQUIREMENTS LOADING

Load requirements from `.librespin/01-requirements/requirements.yaml` (FAILSAFE_SCHEMA, no type coercion).

### TECHNICAL TERM EXTRACTION

Extract all technical specification terms from requirements into 6 categories: `protocols`, `interfaces`, `resources`, `electrical`, `performance`, `physical`.

- If `communication.spi` is present: add `SPI Mode {mode}` to protocols (meaning: "Protocol timing: CPOL/CPHA configuration", context: "SPI protocol specification"); add "SPI" to interfaces.
- If `communication.i2c` is present: add `I2C {speed}` to protocols (meaning: "Bus speed: 400kHz if fast, else 100kHz", context: "I2C protocol specification"); add "I2C" to interfaces. Default speed is "standard".
- If `hmi.gpio` is present: add `{N} GPIO` to resources (meaning: "{N} general-purpose I/O pins required", context: "HMI requirements").
- If `connectivity.port_count` is present: add `{N} USB port(s)` to physical (meaning: "Number of physical USB ports available on host", context: "Physical connectivity constraint").

### COMPONENT EXTRACTION

Scan each concept file's text for component name patterns and assign families:

| Pattern | Family |
|---------|--------|
| `FT` + 3-4 digits + optional letters (e.g., FT4222H) | FTDI USB Bridge |
| `CH` + 3-4 digits + optional letters (e.g., CH347) | WCH USB Bridge |
| `USB251x` or `USB340x` | Microchip USB Hub |
| `STM32` + letter + digit | STM32 MCU |
| `nRF` + 4-5 digits | Nordic MCU |
| `CP210x` | Silicon Labs USB-UART |
| `MCP2221` | Microchip USB-I2C/GPIO |

For each match, deduplicate by name, then look up known configurations (see KNOWN CONFIGURATIONS DATABASE).

### KNOWN CONFIGURATIONS DATABASE

Use this database when looking up component configurations. For any component not listed, use: modes = [], note = "Configuration unknown - requires manual datasheet research."

**FT4222H** (FTDI USB Bridge):
- SPI modes supported: 0, 1, 2, 3 | Quad-SPI: yes | Max clock: 40 MHz
- Mode 0 (DCNF1=0, DCNF0=0): provides 4 GPIO (GPIO0-3), 1 SPI Master | limitation: single SPI channel
- Mode 1 (DCNF1=0, DCNF0=1): provides 2 GPIO (GPIO2-3), 1 SPI Master with 2 additional CS | limitation: GPIO0-1 become CS2-3
- Mode 2 (DCNF1=1, DCNF0=0): provides 2 GPIO (GPIO2-3), 4 SPI Masters | limitation: GPIO0-1 become additional SPI MISO/MOSI

**FT2232H** (FTDI USB Bridge):
- UART mode: 2 independent UART channels
- FIFO mode: 1 parallel FIFO interface
- SPI mode: 2 SPI Master interfaces

**CH347** (WCH USB Bridge):
- SPI modes supported: 0, 1, 2, 3 | Quad-SPI: no | Max clock: 60 MHz
- Mode 0: provides 2 UART + 1 SPI + 1 I2C + 8 GPIO | limitation: all interfaces active simultaneously

### TERMINOLOGY COLLISION DETECTION

For each protocol term in requirements, compare against each component's configuration mode names. Look for cases where the same word "Mode N" appears in both:

- If a requirement term contains "Mode {N}" and a component configuration mode is also named "Mode {N}", record a collision:
  - Term: "Mode"
  - Requirement: {term text}, meaning, context
  - Component: "{component name} {mode name}", meaning = mode.provides, context = "Chip configuration mode"
  - Severity: HIGH
  - Risk: "Conflating protocol mode with chip configuration mode"

Return all detected collisions. An empty list means no collisions found.

### MAPPING TABLE GENERATION

For each protocol, resource, and physical term extracted from requirements, map it against each component's capabilities:

**SPI Mode mapping:** If the requirement term is "SPI Mode {N}" and the component has SPI protocol support, check whether mode N is in the supported modes list.
- `compatible` = true if mode N is in the supported list
- `configuration_needed` = "SPI protocol register configuration (not chip mode)"
- `notes` = "Set SPI_MODE register to {N}, independent of chip configuration mode"

**GPIO mapping:** If the requirement term is "{N} GPIO" and the component has chip modes, find the first chip mode that provides ≥ N GPIO pins.
- `compatible` = true if a viable mode exists
- `component_capability` = "{Mode Name}: {mode.provides}" or "Insufficient GPIO" if no viable mode
- `configuration_needed` = the viable chip mode name, or "None"
- `notes` = "Use chip {mode name} for {N} GPIO availability" or "Component cannot satisfy requirement"

Collect all relevant mappings into a table. Then run collision detection and configuration determination. Produce per-concept result: name, mappings list, collisions list, configuration spec.

### CONFIGURATION DETERMINATION

For each component, determine the single chip configuration that satisfies all compatible requirements:

- Collect all `configuration_needed` values from compatible mappings for this component.
- Exclude protocol-level configurations (e.g., "SPI protocol register configuration (not chip mode)") from the chip-mode count — these are register settings, not chip modes.
- **0 unique chip modes needed:** All requirements are protocol/register configurations, compatible with any chip mode. Use the first available chip mode as default. Mark feasible = true. Notes: "All requirements are protocol/register configurations, compatible with any chip mode."
- **1 unique chip mode needed:** Use that chip mode. Mark feasible = true. Notes: "All requirements satisfied in {mode name}."
- **2+ unique chip modes needed:** CONFLICT — chip can only be in one mode at a time. Mark feasible = false. Record: "Requires multiple chip modes: {list}. Can only use one mode at a time." Recommendation: "Choose different component or revise requirements."

### OUTPUT GENERATION

Add mapping sections to each concept file:

```markdown
## Requirements-to-Component Mapping (Phase 2.5)

**Generated:** ${new Date().toISOString()}

### Terminology Collisions Detected

${collisions.length === 0 ? '*No collisions detected*' : ''}

${collisions.map(c => `
**Collision: ${c.term}**
- **Requirement:** ${c.requirement.text} (${c.requirement.meaning})
  - Context: ${c.requirement.context}
- **Component:** ${c.component.text} (${c.component.meaning})
  - Context: ${c.component.context}
- **Risk:** ${c.risk}
- **Severity:** ${c.severity}
`).join('\n')}

### Requirement-to-Component Mapping Table

| Requirement | Meaning | Component | Capability | Configuration | Compatible |
|-------------|---------|-----------|------------|---------------|------------|
${mappings.map(m => `| ${m.requirement} | ${m.requirement_meaning} | ${m.component} | ${m.component_capability} | ${m.configuration_needed} | ${m.compatible ? '✅' : '❌'} |`).join('\n')}

### Component Configuration Specification

${Object.entries(configuration).map(([component, config]) => `
**Component:** ${component}

${config.feasible ? `
- **Chip Configuration Mode:** ${config.chip_mode}
- **Protocol/Register Configurations:** ${config.protocol_configs.join(', ')}
- **Feasibility:** ✅ All requirements satisfied in single configuration
- **Notes:** ${config.notes}
` : `
- **Feasibility:** ❌ CONFIGURATION CONFLICT
- **Issue:** ${config.conflict}
- **Recommendation:** ${config.recommendation}
`}
`).join('\n')}

### Pre-Validation Status

${Object.values(configuration).every(c => c.feasible) ? '✅ **PASSED** - All components have viable configurations' : '❌ **FAILED** - Configuration conflicts detected'}

${Object.values(configuration).every(c => c.feasible) ? 'Concept ready for Phase 01 validation.' : 'Concept has configuration issues. Address before validation or expect low scores.'}
```

### COMPLETION SUMMARY

After mapping all concepts, display:

```
Phase 2.5 (Requirements-to-Component Mapping) complete.
Mapped: {count} concepts
Collisions detected: {totalCollisions}
Configuration conflicts: {configConflicts}

Mapping sections added to concept files.

Next: Run Phase 3 (Validation Gate) with explicit configuration specifications.
```

### ERROR HANDLING

- **Missing requirements:** If `.librespin/01-requirements/requirements.yaml` does not exist, stop with: "Requirements file not found. Run Phase 1 first."
- **Missing concept files:** If no concept files found, stop with: "No concept files found. Run Phase 2 first."
- **Unknown component configurations:** If a component has no known configuration (note field present), display: "⚠ {component name}: {note} — Manual datasheet research required for accurate mapping."

## PHASE 3: VALIDATION GATE

Filter architecture concepts by feasibility before expensive component research.

### OVERVIEW

**Purpose:** Validate concepts generated in Phase 2 by identifying breaking assumptions, scoring confidence using weighted criteria, and filtering concepts below threshold. Prevents wasting research effort on unfeasible architectures.

**Threshold:** Load from `.librespin/config.yaml` (confidence_threshold, default 80)

**Output location:** Adds validation sections to existing concept files in `.librespin/02-concepts/`

### CONFIGURATION LOADING

Load validation threshold from config file:

- Read `.librespin/config.yaml` using YAML parser.
- Extract `confidence_threshold` field.
- Validate: must be a number between 60 and 95. If invalid, stop with error: `Invalid confidence_threshold: {value}. Must be integer 60-95. Check .librespin/config.yaml`
- Log: `Validation threshold: {threshold}%`

### CONCEPT LOADING

Load generated concepts from Phase 2:

- Read all files matching `concept-*.md` from `.librespin/02-concepts/`.
- If no files found, stop with error: `No concept files found in .librespin/02-concepts/. Run Phase 2 first.`
- Log: `Validating {N} concepts...`

### CONFIGURATION FEASIBILITY CHECK

**CRITICAL PRE-VALIDATION STEP:** Verify component configurations can satisfy all requirements simultaneously.

For concepts with configurable components (chips with multiple modes, multi-function ICs), check configuration feasibility:

**1. Identify configurable components:**

Scan concept content for these component families and note their configuration modes:
- FT-series (e.g., FT232H, FT4232H): FTDI bridge — chip configuration modes
- CH-series (e.g., CH343, CH9102): WCH bridge — function modes
- STM32/nRF/ESP variants: MCU — peripheral configurations
- USB251x/USB340x: USB hub — port configurations

**2. Extract technical specification terms from requirements:**

From the requirements YAML, extract:
- **protocols:** SPI mode (e.g., `SPI Mode 1`), I2C speed (e.g., `I2C Fast Mode`), UART baud rate
- **interfaces:** Quad-SPI, I2C, UART (named identifiers)
- **resources:** GPIO count, ADC channels, timer count
- **electrical:** Voltage levels, current limits
- **performance:** Speed, bandwidth, latency

**3. Create requirement-to-component mapping:**

For each configurable component, build an explicit mapping table with these fields:
- `component`: part name
- `requirements`: list of entries with `requirement`, `component_capability`, `configuration_needed`, `compatible` (boolean)
- `configuration`: the single selected chip configuration
- `feasible`: overall boolean
- `conflicts`: list of incompatible requirement strings

Map each requirement term to component capability. If a requirement is not supported by the component, set `compatible = false` and add the conflict to `conflicts`.

**4. Verify single-configuration feasibility:**

- Collect all `configuration_needed` values from the requirements list.
- If more than one unique configuration is required: infeasible — reason: `Requires multiple chip configurations: {list}. Can only use one configuration at a time.` Recommendation: `Choose different component or revise requirements`
- Check for pin conflicts within the chosen configuration. If any: infeasible — reason: `Pin conflicts in {config}: {conflicts}` Recommendation: `Use chip configuration with non-conflicting pin assignments`
- If no conflicts: feasible — reason: `All requirements satisfied in {config}`

**5. Document mapping in concept file:**

Add this section BEFORE `## Validation`:

```markdown
## Configuration Feasibility

**Component:** {component name}

### Requirement-to-Component Mapping

| Requirement | Component Capability | Configuration | Compatible |
|-------------|----------------------|---------------|------------|
| {requirement} | {capability} | {config_needed} | ✅ or ❌ |

**Selected Configuration:** {config}

**Feasibility:** ✅ FEASIBLE or ❌ INFEASIBLE

**Rationale:** {reason}

**Fix Required:** {recommendation}  ← only if infeasible
```

**6. Fail concept if configuration infeasible:**

If `configCheck.feasible` is false:
- Set `concept.validation_status = 'config_failed'`
- Set `concept.confidenceScore = 0`
- Record `failureReason` and `recommendation`
- Log the component name, reason, and fix
- Skip all remaining validation steps for this concept

This check runs BEFORE breaking assumption identification and dimension scoring.


### BREAKING ASSUMPTION IDENTIFICATION

For each concept, identify 3-5 critical assumptions that could make the concept unfeasible.

**Identification criteria (CRITICAL + UNCERTAIN + VERIFIABLE + FEASIBILITY-RELATED):**

- **Critical for success:** If false, concept would be unfeasible
- **High uncertainty:** Not obviously true from requirements or common knowledge
- **Verifiable:** Can be researched via datasheets, standards, or technical sources
- **Feasibility-related:** Relates to availability, cost, complexity, performance, or hard constraints

**Question format:** Frame as testable question highlighting uncertainty

**Examples by domain:**

**Motor Control:**
```markdown
1. Can 12-bit ADC achieve 0.1% accuracy required for FOC current sensing?
2. Is sensorless FOC reliable at startup for 50W BLDC motors?
3. Are Cortex-M4 MCUs with motor control peripherals available in <8 week lead time?
4. Can software FOC on 168 MHz MCU meet 20 kHz control loop requirement?
5. Do off-the-shelf gate drivers support 48V bus voltage with <100ns deadtime?
```

**IoT Sensor:**
```markdown
1. Can BLE mesh achieve 100m range in industrial environment (metal obstacles)?
2. Are MEMS sensors accurate to ±0.5°C over -20°C to 80°C range?
3. Can coin cell battery (CR2032) power 1-year operation with 10-min reporting interval?
4. Are LoRa modules available with FCC/CE certification for <$10 single quantity?
5. Can Cortex-M0+ with 32KB Flash fit BLE stack + application firmware?
```

**High-Performance Processing:**
```markdown
1. Can Cortex-M7 at 400 MHz sustain 1000 MSPS data throughput via SPI?
2. Are FPGA dev kits with integrated ARM core available for <$200?
3. Can switching regulator maintain <10mV ripple at 2A load for sensitive analog?
4. Are high-speed ADCs (100 MSPS, 14-bit) available from multiple vendors?
5. Can 6-layer PCB with controlled impedance be fabricated for <$500 prototype?
```

**Anti-patterns to avoid:**
- ❌ Too broad: "Will this architecture work?" (not specific enough to research)
- ❌ Not critical: "Is red PCB soldermask available?" (nice-to-have, not breaking)
- ❌ Already known: "Do I2C sensors exist?" (obviously true, not uncertain)
- ❌ Not verifiable: "Will users like this design?" (subjective, not technical)

**Implementation:**

For each concept:
1. Read concept file to extract architecture details (processing, topology, communication, power)
2. Analyze architecture for critical dependencies
3. Identify 3-5 highest-risk assumptions based on criteria
4. Format as questions highlighting uncertainty
5. Add ## Breaking Assumptions section to concept file

**DO NOT fabricate assumptions.** Derive from actual architecture content. If concept lacks detail, note "Cannot identify breaking assumptions - concept too abstract."

### WEB RESEARCH VERIFICATION

Research all breaking assumptions (3-5 per concept) using 4-tier source hierarchy before finalizing dimension scores.

**Timing:** After initial scoring, research findings will guide score adjustments.

**Source Hierarchy (in order of reliability):**

**Tier 1: Vendor Datasheets & Application Notes (HIGHEST reliability)**
- TI, STM, Analog Devices, Nordic, Microchip datasheets
- Extract: Electrical specs, performance limits, verified operating ranges
- Example query: `site:ti.com "12-bit ADC" "0.1% accuracy" datasheet`

**Tier 2: Industry Standards & Published Specifications**
- IEEE standards, USB-IF specs, FCC regulations, Bluetooth SIG
- Extract: Required compliance criteria, standard performance metrics
- Example query: `"BLE mesh" "range specification" site:bluetooth.com`

**Tier 3: Academic Papers & Published Research**
- IEEE Xplore, ACM Digital Library
- Extract: Experimental results, case studies, comparative analyses
- Example query: `"sensorless FOC" "startup torque" "BLDC motor" site:ieee.org`

**Tier 4: Technical Forums & Community Data (LOWEST reliability)**
- EE StackExchange, Reddit r/AskElectronics, Hackaday
- Extract: Practical experience, known issues, workarounds
- Require consensus (multiple users agreeing) or cross-check with higher tiers
- Example query: `"CR2032" "BLE" "battery life" "1 year" site:electronics.stackexchange.com`

**Research workflow:**

For each breaking assumption:
1. Try Tier 1 sources (vendor docs, datasheets)
2. If inconclusive, try Tier 2 (standards, specifications)
3. If inconclusive, try Tier 3 (academic papers)
4. If inconclusive, try Tier 4 (forums)
5. If still inconclusive: FLAG for user decision

Return verdict: 'validated' | 'invalidated' | 'inconclusive'
Return confidence: 'high' | 'medium' | 'low' | 'none'

**Document findings in concept ## Research Findings section:**

```markdown
## Research Findings

**Assumption 1:** Can sensorless FOC achieve <5% speed error at 100 RPM startup?
- **Verdict:** Validated
- **Source:** TI Application Note SLAA566 (Tier 1)
- **Evidence:** Demonstrates <3% speed error at 100 RPM for 50W BLDC motors
- **URL:** https://ti.com/lit/slaa566

**Assumption 2:** Are STM32G4 MCUs with motor control available?
- **Verdict:** Validated
- **Source:** DigiKey inventory check (Tier 1)
- **Evidence:** 47 parts in stock, <4 week lead time
- **URL:** https://digikey.com/stm32g4

**Assumption 3:** Can software FOC meet 20 kHz control loop at 168 MHz?
- **Verdict:** Inconclusive
- **Source:** EE StackExchange forum discussion (Tier 4)
- **Evidence:** Contradictory reports (some claim 20kHz possible, others 10kHz max)
- **Action Required:** Manual verification or accept risk
```

Use WebSearch or WebFetch for research. **DO NOT fabricate sources or findings.** If research is truly inconclusive, document it explicitly and flag for user decision.

**Implementation:**

For each assumption, work through source tiers in order (highest reliability first). Stop at the first tier that produces a conclusive result:
- Conclusive → record verdict ('validated' or 'invalidated'), confidence from that tier, and the tier number reached
- All tiers inconclusive → verdict = 'inconclusive', confidence = 'none', tier_reached = 0

Tiers and their confidence levels:
- Tier 1 (vendor_datasheets): 'high'
- Tier 2 (industry_standards): 'medium-high'
- Tier 3 (academic_papers): 'medium'
- Tier 4 (technical_forums): 'low'

### SURGICAL SCORE ADJUSTMENT

After web research verification completes, adjust dimension scores based on findings.

**Adjustment rules (affect ONLY specific dimensions):**

| Research Finding | Affected Dimension | Adjustment |
|------------------|---------------------|------------|
| Part confirmed available, multiple vendors | Part Availability | Increase to 80-90 |
| Part NRND or single-vendor only | Part Availability | Decrease to 20-30 |
| Datasheet confirms technical claim | Technical Feasibility | Increase to 80-90 |
| Technical claim contradicted/impossible | Technical Feasibility | Decrease to 10-20 |
| Cost estimate confirmed within range | Cost | Increase to 80-90 |
| Cost significantly higher than estimated | Cost | Decrease to 20-40 |
| Simpler implementation found | Complexity | Increase to 80-90 |
| Unexpected complexity discovered | Complexity | Decrease to 20-40 |
| Requirements gap identified | Requirements Coverage | Decrease to 20-60 |

**Score adjustment logic:**

For each research finding, apply to the affected dimension:
- `verdict = 'validated'` AND `confidence = 'high'` → raise score to at least 80 (proficient/excellent)
- `verdict = 'invalidated'` → cap score at 30 (poor/unacceptable)
- `verdict = 'inconclusive'` → set score to 50 (average, reflects uncertainty)
- No change if finding has no effect on a given dimension

Log every adjustment: dimension, old score, new score, reason.

**Update concept ## Validation section with adjusted scores:**

```markdown
## Validation

**Initial Dimension Scores:**
| Dimension | Initial | Adjusted | Change |
|-----------|---------|----------|--------|
| Requirements Coverage | 80 | 80 | - |
| Technical Feasibility | 50 | 80 | +30 (datasheet confirmed FOC) |
| Part Availability | 70 | 90 | +20 (47 parts in stock) |
| Cost | 60 | 60 | - |
| Complexity | 70 | 70 | - |

**Initial Confidence: 62.5% → Adjusted Confidence: 77.5%**
```

Recalculate weighted confidence using adjusted scores after research verification. Update concept files with adjustment log showing which scores changed and why.

### PHYSICAL TOPOLOGY FEASIBILITY CHECK

**CRITICAL PRE-VALIDATION STEP:** Verify physical topology before scoring dimensions.

For each concept, check if system-level integration is physically possible:

**1. Count USB devices:**

Scan concept content for USB bridge IC patterns — count each match as one USB device:
- USB bridge patterns: `USB.*bridge`, FTDI chips (FT-prefix), WCH chips (CH-prefix), Silicon Labs (CP210x), Microchip (MCP2221), USB-to-UART/SPI/I2C converters

**2. Check hub requirement:**

- If number of USB devices > ports available AND no USB hub is present in the BOM → infeasible: `{N} USB devices require {N}-port hub (or {N} ports), but concept has no hub and only {ports} port(s) available`. Recommendation: `Add USB hub IC (e.g., USB2514B, USB3340) to BOM`
- If hub is present but has fewer ports than USB devices → infeasible: `{N} USB devices require {N}-port hub, but hub only has {hub_ports} ports`. Recommendation: `Use {N}-port hub or reduce USB device count`
- If hub present with sufficient ports, or single USB device → feasible

Extract hub port count from part number: USB2514B = 4-port, USB3340 = 4-port (parse leading digit after "USB" if 2-7).

**3. Fail concept immediately if topology infeasible:**

If topology check fails:
- Set `concept.validation_status = 'topology_failed'`
- Set `concept.confidenceScore = 0`
- Record `failureReason` and `recommendation`
- Log: concept name, reason, fix recommendation
- Skip remaining validation for this concept

**4. Document topology check in concept file:**

Add section to concept BEFORE ## Validation:

```markdown
## Physical Topology Check

**USB Devices:** {count}
**Ports Available:** {ports}
**Hub Required:** YES or NO
**Hub Present:** YES or NO
**Topology Status:** ✅ FEASIBLE or ❌ INFEASIBLE
{topology reason}
```

This check runs BEFORE dimension scoring. Non-feasible concepts score 0% and skip scoring entirely.

### 5-TIER RUBRIC SCORING

Score each concept across 6 weighted dimensions using detailed tier rubric.

**Dimensions with Weights:**
- Requirements coverage: 20%
- Technical feasibility: 25%
- Physical topology: 20%
- Part availability: 15%
- Cost: 12%
- Complexity: 8%

**5-Tier Structure:**

| Tier | Range | Score | Descriptor |
|------|-------|-------|------------|
| 5 | 81-100% | 90 | Excellent / Exemplary |
| 4 | 61-80% | 70 | Proficient / Good |
| 3 | 41-60% | 50 | Average / Acceptable |
| 2 | 21-40% | 30 | Poor / Developing |
| 1 | 0-20% | 10 | Unacceptable / Failing |

**Dimension Rubrics:**

**Requirements Coverage (20% weight):**

| Score | Criteria |
|-------|----------|
| 90 | Addresses all critical + important requirements, no gaps. Exceeds specifications. |
| 70 | Addresses all critical + most important, minor gaps in nice-to-have. Meets specifications. |
| 50 | Addresses all critical, significant important gaps. Marginally acceptable. |
| 30 | Missing some critical requirements or major important gaps. Below expectations. |
| 10 | Missing multiple critical requirements. Does not meet minimum requirements. |

**Technical Feasibility (25% weight):**

| Score | Criteria |
|-------|----------|
| 90 | Proven architecture with reference designs. All technical claims verified. Configuration explicitly specified and verified. No terminology ambiguity. No feasibility risks. |
| 70 | Established approach with minor unknowns. Most technical claims verified. Component configuration specified. Low feasibility risk. |
| 50 | Viable approach with moderate unknowns. Some technical claims unverified. Configuration unclear or not fully specified. Moderate feasibility risk. |
| 30 | Questionable approach with major unknowns. Few technical claims verified. Configuration conflicts possible. High feasibility risk. |
| 10 | Unproven or contradicted approach. Technical claims cannot be verified. Configuration infeasible or overloaded terms not disambiguated. Critical feasibility risks. |

**Deductions:**
- Overloaded terminology not disambiguated: -20 points (max score 70)
- Configuration not explicitly specified: -10 points
- Single requirement → multiple component modes needed: Score 10 (infeasible)

**Physical Topology Feasibility (20% weight):**

| Score | Criteria |
|-------|----------|
| 90 | All physical connections verified. Single USB device OR hub properly sized for N devices. No topology conflicts. |
| 70 | Physical connections viable. Hub included for multi-device designs. Minor topology concerns (port count marginal). |
| 50 | Physical connections unclear. Hub undersized or topology marginally viable. Moderate integration risk. |
| 30 | Physical topology questionable. Hub missing or incorrectly sized. High integration risk. |
| 10 | Physical topology infeasible. Critical components missing (hub, level shifters). Cannot be implemented as-is. |

**Critical rule:** Score 10 (infeasible) if:
- N USB devices with <N ports AND no hub
- Hub present but <N ports for N devices
- Voltage level conflicts without level shifters
- Power budget exceeded without regulation

**Part Availability (15% weight):**

| Score | Criteria |
|-------|----------|
| 90 | All component types widely available from multiple vendors. Commodity parts. No lead time concerns. |
| 70 | Most component types available. Standard parts from major vendors. Normal lead times (<8 weeks). |
| 50 | Some component types limited availability. Mix of standard and specialized parts. Extended lead times possible. |
| 30 | Many component types limited availability. Specialized or single-vendor parts. Long lead times likely (>8 weeks). |
| 10 | Critical components unavailable, NRND, or obsolete. No viable alternatives identified. |

**Cost (12% weight):**

| Score | Criteria |
|-------|----------|
| 90 | Estimated BOM <$50 for low-volume (1-10 units). All commodity parts. Simple PCB (2-layer). |
| 70 | Estimated BOM $50-150. Standard parts. Moderate PCB complexity (4-layer). |
| 50 | Estimated BOM $150-500. Some specialized parts. Complex PCB (6+ layer) or multi-board. |
| 30 | Estimated BOM $500-1500. Expensive specialized parts. Complex assembly requirements. |
| 10 | Estimated BOM >$1500 or cost cannot be estimated. Exotic parts, custom manufacturing. |

**Complexity (8% weight):**

| Score | Criteria |
|-------|----------|
| 90 | Simple implementation, proven patterns, minimal integration. Low development risk. |
| 70 | Moderate complexity, established patterns, standard integration. Manageable development. |
| 50 | Significant complexity, some custom design required. Moderate development risk. |
| 30 | High complexity, extensive custom design, difficult integration. High development risk. |
| 10 | Extremely complex, novel techniques required, integration challenges. Very high risk. |

**Scoring process:**

For each concept:
1. Read concept file to understand architecture
2. Evaluate against each dimension's rubric criteria
3. Assign tier score (10/30/50/70/90) based on best-match criteria
4. Document scores in table format (no justifications - just scores)
5. Calculate weighted confidence in next step

**Scoring rules per dimension:**

Evaluate `physical_topology` dimension:
- Topology infeasible (from Physical Topology Check) → score 10
- Single USB device, no hub needed → score 90
- Multi-device with hub, hub correctly sized (ports ≥ device count) → score 90
- Multi-device with hub, hub one port short → score 70
- Multi-device with hub, hub clearly undersized → score 30
- Multiple ports available, no hub (unusual) → score 70
- Topology unclear → score 50

Evaluate `technical_feasibility` dimension (start at 90, apply deductions):
- Configuration mapping absent → -10
- Configuration mapping infeasible → return 10 immediately
- Overloaded terms not disambiguated → -20
- Unverified technical claims > 3 → -20; claims > 1 → -10
- No reference design found → -10
- Floor at 10.


### MCDA WEIGHTED CONFIDENCE CALCULATION

Calculate final confidence score using Multi-Criteria Decision Analysis (MCDA) additive model.

**Formula:**
```
Confidence = Σ(Score_i × Weight_i)

Where:
  Score_i = dimension score (0-100)
  Weight_i = dimension weight (sum = 1.0)
```

**Weights:**

| Dimension | Weight |
|-----------|--------|
| requirements_coverage | 0.20 (20%) |
| technical_feasibility | 0.25 (25%) |
| physical_topology | 0.20 (20%) |
| part_availability | 0.15 (15%) |
| cost | 0.12 (12%) |
| complexity | 0.08 (8%) |

Verify weights sum to 1.0 before calculating. Apply additive model: multiply each score by its weight and sum all six products. Round result to 1 decimal place.

**Example calculation (6 dimensions):**

| Dimension | Score | Weight | Product |
|-----------|-------|--------|---------|
| requirements_coverage | 85 | 0.20 | 17.0 |
| technical_feasibility | 70 | 0.25 | 17.5 |
| physical_topology | 90 | 0.20 | 18.0 |
| part_availability | 90 | 0.15 | 13.5 |
| cost | 60 | 0.12 | 7.2 |
| complexity | 75 | 0.08 | 6.0 |
| **Total** | | | **79.2%** |

**Add ## Validation section to each concept file:**

```markdown
## Validation

**Dimension Scores:**

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Requirements Coverage | 85 | 20% | 17.00 |
| Technical Feasibility | 70 | 25% | 17.50 |
| Physical Topology | 90 | 20% | 18.00 |
| Part Availability | 90 | 15% | 13.50 |
| Cost | 60 | 12% | 7.20 |
| Complexity | 75 | 8% | 6.00 |

**Confidence Score: 79.2%**
```

Round final confidence to 1 decimal place for presentation.

### THRESHOLD-BASED FILTERING

Apply validation gate based on calculated confidence scores.

**Decision logic:**

For each concept, classify by confidence vs. threshold:

| Condition | Classification | Status |
|-----------|----------------|--------|
| confidence ≥ threshold + 5 | Auto-pass | `auto_passed` |
| threshold ≤ confidence < threshold + 5 | Borderline | `needs_approval` |
| confidence < threshold | Auto-fail | `auto_failed` |

Example with threshold = 80: ≥85% = auto-pass, 80-85% = borderline, <80% = auto-fail.

**Outcomes:**

1. **Auto-pass (≥85%):** Proceed to Phase 2 (Component Research) without user review
2. **Borderline (80-85%):** Present to user for approval decision
3. **Auto-fail (<80%):** Filter out, do not proceed to research

**All concepts fail scenario:**

If no concepts are auto-passed or borderline:
- Find the highest-scoring concept (best fallback)
- Report to user: `All {N} concepts failed validation (< {threshold}% threshold).`
- Report highest scorer: `Highest score: {name} ({score}%)`
- Present four options:
  1. Revise requirements to expand design space
  2. Lower threshold to `{highest_score}%` to proceed with best option
  3. Return to Phase 2 with different architectural constraints
  4. Proceed with highest-scoring concept accepting higher risk
- Await user decision before continuing

### OUTPUT

**1. Update each concept file** with ## Breaking Assumptions and ## Validation sections

**2. Create validation summary:** `.librespin/03-validation/validation-summary.md`

```markdown
# Validation Summary

**Threshold:** 80%
**Concepts evaluated:** 5

## Auto-Passed (≥85%): 2 concepts
✓ Centralized MCU (87.5%)
✓ Low-Power Extreme (91.2%)

## Borderline (80-85%): 2 concepts
⚠ Distributed Wireless (82.3%) - Recommend PASS (strong availability, moderate feasibility)
⚠ FPGA-Based (81.7%) - Recommend DEFER (high cost, unverified complexity)

## Auto-Failed (<80%): 1 concept
✗ High-Performance Hybrid (76.5%) - Cost and complexity concerns

**User decision required for borderline concepts.**
```

**3. Update state file** `.librespin/state.md` — replace the `phase:` line value with `'3-validation-gate'`.

### ERROR HANDLING

**Invalid configuration:** If `confidence_threshold` is outside 60-95 range, stop immediately with: `Invalid confidence_threshold: {value}. Must be integer 60-95.`

**Missing concept files:** If no `concept-*.md` files exist in `.librespin/02-concepts/`, stop with: `No concept files found. Run Phase 2 first.`

**All concepts fail:** Present options to user (see "All concepts fail scenario" above).

### COMPLETION SUMMARY

After validation complete, report:
- Total concepts evaluated
- Counts for passed, borderline, and failed
- Path to validation summary: `.librespin/03-validation/validation-summary.md`
- If passing concepts exist: `Next: Run Phase 2 (Component Research) for passing concepts.`
- If all failed: `All concepts failed validation. Review recommendations above.`


## PHASE 4: COMPONENT RESEARCH

Select specific parts with part numbers for validated architecture concepts (those passing Phase 1 >=80% threshold). Research focuses on active lifecycle status, availability, and verified specifications. Only validated concepts receive component research - prevents wasting effort on unfeasible architectures.

### API-FIRST RULE (MANDATORY — run this before any component research)

Check `~/.librespin/credentials` for configured distributor APIs:

```bash
CREDS_FILE="$HOME/.librespin/credentials"
HAS_DIGIKEY=0; HAS_NEXAR=0; HAS_MOUSER=0

if [ -f "$CREDS_FILE" ] && command -v jq > /dev/null 2>&1; then
  HAS_DIGIKEY=$(grep -A5 '^\[digikey\]' "$CREDS_FILE" | grep -c 'client_id = .')
  HAS_NEXAR=$(grep -A5 '^\[nexar\]' "$CREDS_FILE" | grep -c 'client_id = .')
  HAS_MOUSER=$(grep -A5 '^\[mouser\]' "$CREDS_FILE" | grep -c 'part_api_key = .')
fi

if [ $((HAS_DIGIKEY + HAS_NEXAR + HAS_MOUSER)) -gt 0 ]; then
  echo "[Phase 4] Distributor APIs configured — using APIs as primary source for pricing/stock/lifecycle."
  echo "[Phase 4] WebSearch/WebFetch MAY only be used for: parts not found in any API, datasheets, or suppliers not covered by configured APIs."
  API_MODE=true
else
  echo "[Phase 4] No distributor APIs configured. Using web search with estimated pricing."
  echo "[Phase 4] Run /librespin:setup to configure APIs for accurate pricing and live stock data."
  API_MODE=false
fi
```

**If `API_MODE=true`:** For every component with a non-generic MPN, call `enrich_component "$MPN"` (defined in the DISTRIBUTOR ENRICHMENT section below) DURING the research loop — before scoring and before writing the BOM entry. Use the returned API data as the primary source for price, stock, and lifecycle in the balanced scorecard. Do NOT use WebSearch to obtain pricing or stock for any part where an API returned data.

**If `API_MODE=false`:** Use WebSearch/WebFetch as normal. Mark all prices as `est.` in BOM output (e.g. `est. $1.36`). Log: `[Phase 4] Price from web search — configure /librespin:setup for verified pricing.` on each BOM line.

### OVERVIEW

**Purpose:** Transform functional block diagrams from Phase 2 into concrete component selections with verified availability, lifecycle status, and pricing. Apply balanced scorecard for objective part evaluation.

**Input:** Validated concepts from Phase 1 with >=80% confidence (auto_passed or user-approved borderline)
**Output:** BOM files with specific part numbers, alternates for hard-to-source parts, and total cost estimates

**Output location:** `.librespin/04-bom/`

### CONFIGURATION LOADING

Load settings from config file:

- Read `.librespin/config.yaml` using YAML parser.
- Extract `confidence_threshold` field.
- Validate: must be a number between 60 and 95. If invalid, stop with: `Invalid confidence_threshold: {value}. Must be integer 60-95. Check .librespin/config.yaml`
- Log: `Component research for concepts with confidence >= {threshold}%`

### VALIDATED CONCEPT LOADING

Load only concepts that passed Phase 1 validation:

- Check that `.librespin/03-validation/validation-summary.md` exists. If not, stop with: `Validation summary not found. Run Phase 1 first.`
- Read all `concept-*.md` files from `.librespin/02-concepts/`. If none found, stop with: `No concept files found in .librespin/02-concepts/. Run Phase 2 first.`
- For each concept file, parse the `## Validation` section for `validation_status`. Accept only `auto_passed` or `needs_approval`.
- Also parse `Confidence Score:` to capture the numeric value.
- If no validated concepts found, stop with: `No validated concepts found (>={threshold}% confidence). Run Phase 1 first or lower threshold.`
- Log: `Found {N} validated concepts for component research.`

### CRITICAL: DATASHEET VERIFICATION PROTOCOL

**GROUND TRUTH REQUIREMENT:** All electrical specifications MUST be extracted from official manufacturer datasheets. No component selection proceeds without datasheet verification.

**Purpose:** Establish ground truth for all component specifications before BOM generation. Prevents fabricated data, underestimated power requirements, and incompatible component selections.

**Workflow:** For each active component → Find datasheet → Download PDF → Convert to text → Read & extract specs → Verify with agent → Document

---

#### Step 1: Identify Components Requiring Datasheets

Extract all active components from requirements and concept architectures:

- From requirements `interfaces.uart_channels`: any channel with `location = 'onboard'` → CRITICAL, reason: `Onboard device power requirements needed`
- From concept block diagrams: extract bridge ICs (FT-series, CH-series, MCP-series, CY7C-series) → CRITICAL, reason: `SPI Mode 1 support, GPIO count, speed verification required`
- USB hub ICs (USB-prefix pattern) → HIGH, reason: `Port count, power distribution, lifecycle verification`
- Power ICs (LM-series, TPS-series, ADP-series) → CRITICAL, reason: `Input voltage range, output current, efficiency verification`

Collect all identified components into a deduplicated list, noting name, type, and criticality.

---

#### Step 2: Datasheet Retrieval and Parsing

For each component requiring a datasheet:

1. Search for the official manufacturer PDF: query `{component_name} datasheet PDF site:*.com filetype:pdf`
2. Prioritize manufacturer domains (in order): ti.com, ftdichip.com, microchip.com, onsemi.com, analog.com, infineon.com, nxp.com, st.com
3. If no manufacturer datasheet found: warn `WARNING: No manufacturer datasheet found for {component}. ACTION REQUIRED: User must obtain datasheet manually.` Return status `NOT_FOUND`.
4. If found: download PDF to `.librespin/04-component-research/datasheets/{component_name}.pdf`
5. Verify download: file must be ≥1KB. If smaller: status `DOWNLOAD_FAILED`, warn it's likely an error page.
6. Extract text from PDF using `pdfplumber` (Python): `pip3 install pdfplumber` if not available. Write extracted text to `.librespin/04-component-research/datasheets/{component_name}.pdf.txt`
7. If extraction fails due to missing pdfplumber: stop with `pdfplumber required for PDF text extraction. Install with: pip3 install pdfplumber`
8. If all critical components retrieved: proceed. If any `NOT_FOUND`: halt with `Cannot proceed without datasheets for: {component_list}`

---

#### Step 3: Datasheet Reading and Specification Extraction

For each retrieved datasheet, extract critical specifications by component type:

**bridge_ic:** Extract SPI mode support (`SPI Mode 1` or `CPOL=0, CPHA=1`), GPIO count, max SPI speed in MHz/Mbps.

**uart_device / onboard_device:** Extract supply voltage (V), supply current (mA), output power (W) if applicable.

**power_ic:** Extract input voltage range (min-max V), output current (mA/A), efficiency (%).

After extraction, calculate extraction confidence: number of expected fields extracted / total expected fields × 100%. Warn if confidence < 80%.

---

#### Step 4: Sanity Check Electrical Specifications

Before verification, perform physics-based sanity checks:

- **Onboard device with output power:** Verify supply current ≥ (output_power / supply_voltage / 0.85) × 1000 mA (allow 50% margin). If current is too low: CRITICAL failure — `Supply current {value}mA too low for {power}W output`
- **Power IC:** Verify that the source voltage (from requirements, e.g., 24V DC) falls within the IC's input voltage range. If outside: CRITICAL failure — `Source voltage {V}V outside IC range {min}-{max}V`

CRITICAL failures halt the workflow: `CRITICAL sanity check failures detected. Cannot proceed with invalid specifications.`

---

#### Step 5: Spawn Verifier Agent

For each datasheet with extracted specs, spawn a verifier agent to confirm understanding:

- Agent receives: datasheet URL, extracted specs (JSON), extraction warnings
- Agent tasks: access the datasheet URL, locate Absolute Maximum Ratings and Electrical Characteristics tables, verify each extracted spec, identify missing CRITICAL specs, flag discrepancies
- Agent returns: `verified` (boolean), `verification_confidence` (0-100), `discrepancies` list (field, extracted, datasheet, severity), `missing_critical_specs` list, `datasheet_section_references` map
- Accept: `verified = true` AND `verification_confidence >= 80`
- Reject: failed verifications or confidence < 80 → stop with `Datasheet verification failed for {N} components. Cannot proceed.`

---

#### Step 6: Document Verified Specifications

Create `.librespin/04-component-research/datasheet-verification-matrix.md` with this structure per component:

```markdown
## {Component Name}

**Datasheet:** [{Component} Datasheet]({url})
**Verification Confidence:** {N}%
**Status:** ✅ VERIFIED or ❌ FAILED

### Verified Specifications

| Specification | Value | Datasheet Reference |
|---------------|-------|---------------------|
| {spec name} | {value} | {table/page reference} |

### ⚠️ Discrepancies Found
- **{field}:** Extracted "{extracted}" vs Datasheet "{actual}" ({severity})

### ⚠️ Missing Critical Specifications
- {spec name}
```

Log: `GROUND TRUTH ESTABLISHED. Proceeding to component selection...`

---

### FUNCTIONAL BLOCK EXTRACTION

For each validated concept, extract component categories from block diagram:

**Active components** (require specific MPN): detect these patterns in concept content:
- MCU / Microcontroller / Cortex → category: MCU
- BLE / Bluetooth / Wireless / LoRa / WiFi / Zigbee / Cellular → category: Wireless
- Sensor / IMU / Accelerometer / Gyro / Temp / Humidity / Pressure → category: Sensor
- Buck / Boost / LDO / PMIC / Regulator / Power IC → category: Power IC
- Motor Driver / Gate Driver / H-Bridge → category: Motor Driver
- ADC / DAC / Op-Amp / Comparator → category: Analog IC
- Flash / EEPROM / FRAM / Memory → category: Memory

**Commodity components** (generic spec only, no MPN):
- Resistor / Ω values → category: Resistor
- Capacitor / F values → category: Capacitor
- Inductor / H values → category: Inductor
- LED / Status LED → category: LED
- Connector / JST / Header / USB → category: Connector
- Crystal / Oscillator → category: Crystal

### DIGIKEY PARAMETRIC SEARCH WORKFLOW

Use DigiKey parametric search as primary tool for non-commodity active components.

**Step 1: Navigate to Component Category**
```
DigiKey > Products > [Category] > [Subcategory]
Example: Integrated Circuits > Embedded - Microcontrollers
```

**Step 2: Apply Filters from Requirements**

Set parametric filters matching requirements:
- Core Processor (e.g., ARM Cortex-M4)
- Program Memory Size (e.g., >= 256KB)
- RAM Size (e.g., >= 64KB)
- Speed (e.g., >= 100MHz)
- Operating Temperature (e.g., -40°C ~ 85°C)
- Supplier Device Package (e.g., LQFP-64)

**Step 3: Filter by Availability**

Apply these availability criteria:
- Stock Status: "In Stock" or "Normally Stocking"
- Lifecycle Status: "Active" (CRITICAL — avoid NRND)
- Lead Time: ≤8 weeks maximum
- Minimum Stock Quantity: ≥100 units

**Step 4: Sort by Price or Quantity**

Sort ascending by price for cost optimization, or descending by quantity available for reliability.

**Step 5: Extract Top 5-10 Candidates**

For each candidate, record: Manufacturer Part Number, Manufacturer, Description, Unit Price (USD), Quantity Available, Lead Time, Lifecycle Status, Datasheet URL.

### BALANCED SCORECARD EVALUATION

Score candidate parts using weighted criteria:

**Weights:**
- Cost: 35%
- Availability: 30%
- Features: 25%
- Vendor Reputation: 10%

**Scoring Rubric (1-5 scale per criterion):**

| Score | Cost | Availability | Features | Vendor |
|-------|------|--------------|----------|--------|
| 5 | <$1 | >1000 in stock, <2 wk lead | Exceeds all specs | TI, STM, Analog Devices |
| 4 | $1-5 | 100-1000 stock, <4 wk | Meets all, exceeds some | Nordic, Microchip, NXP |
| 3 | $5-15 | 50-100 stock, <6 wk | Meets all requirements | Established vendor |
| 2 | $15-30 | 10-50 stock, <8 wk | Meets most, minor gaps | Lesser-known vendor |
| 1 | >$30 | <10 stock, >8 wk | Does not meet specs | Unknown vendor |

**Score each dimension (1-5 scale):**

Cost:
- <$1 → 5, $1-$5 → 4, $5-$15 → 3, $15-$30 → 2, >$30 → 1

Availability (based on stock count and lead time):
- >1000 units AND ≤2 wk → 5
- 100-1000 AND ≤4 wk → 4
- 50-100 AND ≤6 wk → 3
- 10-50 AND ≤8 wk → 2
- <10 OR >8 wk → 1

Features (compare part specs to requirements):
- Start at 3 (meets requirements baseline)
- Flash >1.5× required → +0.5, RAM >1.5× required → +0.5, Speed >1.2× required → +0.5
- Flash < required → -1, RAM < required → -1, Speed < required → -1
- Floor at 1, ceiling at 5

Vendor reputation:
- Tier 1 (TI, STMicroelectronics, Analog Devices, Nordic) → 5
- Tier 2 (Microchip, NXP, Infineon, ON Semiconductor, Renesas) → 4
- Otherwise (authorized distributor stock) → 3

**Weighted total:** `(cost × 0.35) + (availability × 0.30) + (features × 0.25) + (vendor × 0.10)`

Select the highest-scoring candidate as primary. Log: part number, manufacturer, total score (e.g., 3.85/5.0), and breakdown by dimension. Mark as `recommended` if score ≥ 3.5, otherwise `acceptable`.

### FALLBACK STRATEGY

If DigiKey has no results, fall back to alternate sources in this priority order:

1. **DigiKey** (primary — largest parametric database)
2. **Mouser** (secondary — major authorized distributor)
3. **Arrow/Newark/Avnet** (tertiary — authorized alternatives)
4. **Web research** (last resort — use WebSearch for discovery only)
5. **Flag if no viable part found:** `No viable {category} found. Consider requirement relaxation or manual search.`

**NOT ALLOWED:** LCSC, AliExpress, eBay, brokers, or unauthorized sources

### LIFECYCLE STATUS VERIFICATION

Verify lifecycle status before selecting any part. Only Active parts are acceptable.

**Status Definitions:**

| Status | Meaning | Action |
|--------|---------|--------|
| Introduction | New product launch | Select with caution (limited field data) |
| Active | In full production | **SELECT** - preferred status |
| NRND | Not Recommended for New Design | **REJECT immediately** - find alternative |
| Last Time Buy | Final purchase window | **REJECT** - too late for new design |
| Obsolete | Discontinued | **REJECT** - no manufacturer stock |

**Verification Sources (all trusted):**
1. Manufacturer PCN/PDN notices (product change/discontinuation)
2. Distributor lifecycle flags (DigiKey/Mouser status field)
3. Vendor product pages (manufacturer's official site)
4. Octopart aggregated data (cross-references multiple sources)

**Lifecycle determination:**
- `active` or `production` → pass, note: `Part is in full production`
- `introduction` → pass with caution: `New product, limited field data`
- `nrnd` or `not recommended for new design` → fail: `NRND — REJECT`
- `last time buy` or `ltb` → fail: `Last Time Buy — REJECT`
- `obsolete` or `eol` → fail: `Discontinued — REJECT`
- Unknown → flag as unverified: `Status not confirmed — manual verification recommended`

**Conflicting status:** If DigiKey and manufacturer disagree on lifecycle status, flag for user decision: `DigiKey says {status1}, manufacturer says {status2}. Proceed?`

**Missing lifecycle data:** Document as unverified and note: `Proceed with caution, manual verification recommended`

### HARD-TO-SOURCE THRESHOLD DETECTION

Identify parts that need alternates based on sourcing risk.

**Thresholds:**

| Criterion | Threshold | Trigger |
|-----------|-----------|---------|
| Lead Time | >8 weeks | Requires alternate |
| Stock Quantity | <100 units | Requires alternate |
| Price Spike | >50% vs historical | Requires alternate |

When a part triggers any threshold, find 1-2 alternates:
- Search DigiKey cross-reference tool for similar parts
- Filter to: active lifecycle, stock ≥100 units, lead time ≤8 weeks
- Return top 1-2 viable alternates

**Document alternates inline with primary part:**

```markdown
**Primary:** TPS54331 (Texas Instruments) - $2.15, 1500 in stock
**Alternates:** TPS543620 ($2.45), LM2674M-5.0 ($1.85) - similar specs, alternate vendors
```

### COMMODITY COMPONENT HANDLING

Use generic specifications for resistors, capacitors, and basic connectors instead of specific MPNs.

**Generic Part Number (GPN) Format:**

| Component Type | Format | Example |
|----------------|--------|---------|
| Resistor | Value + Package + Tolerance | 10k 0603 1% |
| Capacitor | Value + Package + Voltage + Type | 100nF 0603 16V X7R |
| Inductor | Value + Package + Current | 10uH 0805 1A |
| LED | Color + Package + Vf | Green 0603 2.2V |
| Connector | Type + Pitch + Pins | JST-XH 2.5mm 4P |

**Why Generic:**
- Design engineer sources from preferred vendor
- Allows flexibility in procurement
- Reduces BOM maintenance
- Commodity parts are interchangeable across manufacturers (for given specs)

**Critical Exceptions (DO use specific MPN):**
- Precision resistors (<0.5% tolerance)
- High-frequency capacitors (ESR/ESL critical)
- Power inductors (saturation current critical)
- Application-specific connectors

Format commodity parts by type:
- resistor → `{value} {package} {tolerance}`
- capacitor → `{value} {package} {voltage} {dielectric}`
- inductor → `{value} {package} {current}A`
- led → `{color} {package} {vf}V`
- connector → `{type} {pitch}mm {pins}P`

### BOM DOCUMENTATION FORMAT

Standard fields and format for Bill of Materials documentation.

**Required Fields:**
1. Part number and manufacturer
2. Key specifications
3. Availability and pricing
4. Datasheet URL

**Full BOM Table Structure:**

```markdown
## Bill of Materials

| Ref | Category | MPN | Manufacturer | Description | Qty | Unit Price | Stock | Lead Time | Datasheet |
|-----|----------|-----|--------------|-------------|-----|------------|-------|-----------|-----------|
| U1 | MCU | STM32L476RG | STMicroelectronics | Cortex-M4 80MHz 1MB Flash | 1 | $5.42 | 1250 | 2 wk | [Link](https://...) |
| U2 | Wireless | nRF52832 | Nordic | BLE 5.0 SoC | 1 | $3.15 | 892 | 3 wk | [Link](https://...) |
| R1-R5 | Resistor | Generic | - | 10k 0603 1% | 5 | $0.01 | - | - | - |
| C1-C10 | Capacitor | Generic | - | 100nF 0603 16V X7R | 10 | $0.02 | - | - | - |

**Total BOM Cost:** $XX.XX (1-10 qty pricing)
```

**Fields Explanation:**
- **Ref:** Reference designator from schematic (U1, R1, C1, etc.)
- **Category:** Component type (MCU, Power IC, Resistor, etc.)
- **MPN:** Manufacturer Part Number (or "Generic" for commodity)
- **Manufacturer:** Who makes it (or "-" for generic)
- **Description:** Key specs in brief
- **Qty:** Quantity per unit
- **Unit Price:** 1-10 qty pricing from DigiKey/Mouser (prefix `est.` if from web search)
- **Stock:** Quantity in stock (or "-" for generic)
- **Lead Time:** Factory lead time if not in stock (or "-" for generic)
- **Datasheet:** URL to official datasheet (or "-" for generic)

BOM entry rules:
- Commodity parts: MPN = "Generic", Manufacturer = "-", Stock = "-", Lead Time = "-", Datasheet = "-"
- Active parts: use live API data (if API_MODE=true) or web estimate prefixed with `est.`
- Total BOM Cost = sum of (unit_price × qty) for all entries with numeric prices

### OUTPUT FILES

**1. Component Selection Section Added to Concept Files:**

Add `## Component Selection` section to each concept file in `.librespin/02-concepts/`:

```markdown
## Component Selection

### Active Components

| Category | Selected Part | Manufacturer | Score | Notes |
|----------|---------------|--------------|-------|-------|
| MCU | STM32L476RG | STMicroelectronics | 4.2/5 | Cortex-M4, 1MB Flash |
| Wireless | nRF52832 | Nordic | 4.0/5 | BLE 5.0 SoC |
| Power IC | TPS54331 | Texas Instruments | 3.8/5 | Buck converter |

### Hard-to-Source Parts (with Alternates)

**nRF52832** - Stock: 45 units (below 100 threshold)
- **Primary:** nRF52832 (Nordic) - $3.15
- **Alternates:** CC2640R2F (TI) $2.85, DA14531 (Renesas) $1.95

### Lifecycle Status

| Part | Status | Source | Verified |
|------|--------|--------|----------|
| STM32L476RG | Active | DigiKey | Yes |
| nRF52832 | Active | Nordic website | Yes |
| TPS54331 | Active | TI website | Yes |
```

**2. BOM File Created:**

Create `.librespin/04-bom/bom-{concept-name}.md`:

```markdown
# Bill of Materials: [Concept Name]

**Generated:** [date]
**Source:** Phase 2 Component Research
**Concept:** [concept file reference]

## Summary

| Metric | Value |
|--------|-------|
| Total Active Parts | X |
| Total Commodity Parts | Y |
| Total BOM Cost | $XX.XX |
| Hard-to-Source Parts | Z |

## BOM

| Ref | Category | MPN | Manufacturer | Description | Qty | Unit Price | Stock | Lead Time | Datasheet |
|-----|----------|-----|--------------|-------------|-----|------------|-------|-----------|-----------|
| ... | ... | ... | ... | ... | ... | ... | ... | ... | ... |

**Total BOM Cost:** $XX.XX (1-10 qty pricing)

## Hard-to-Source Parts

[List parts with alternates if any triggered hard-to-source thresholds]

## Lifecycle Verification

[Table of all parts with lifecycle status and verification source]

## Notes

[Any flags, uncertainties, or recommendations]
```

### ERROR HANDLING

**No validated concepts:** Stop with: `ERROR: No validated concepts found (>={threshold}% confidence). Run Phase 1 first, or lower confidence_threshold in librespin-concept-config.yaml.`

**Part not found:** Warn: `WARNING: No viable part found for {category}. Flagging uncertainty. Consider: 1) Relaxing requirements, 2) Manual search on manufacturer websites, 3) Consulting with design engineer.` Add note to BOM entry: `UNVERIFIED: No viable part found, manual search required`

**All parts NRND/obsolete for category:** Stop with: `CRITICAL: All {N} candidates for {category} are NRND or obsolete. No active parts meet requirements. Consider: 1) Relaxing requirements (different package, lower specs), 2) Alternative architecture approach, 3) Custom design or module substitution.`

### COMPLETION SUMMARY

After all concepts processed, report:
- Count of validated concepts processed
- List of BOM files created: `.librespin/04-bom/bom-{concept-slug}.md` for each
- Estimated BOM cost per concept
- Count of hard-to-source parts flagged (with alternates provided)
- Count of parts with unverified lifecycle status
- Next step: `Run Phase 1 (Concept Generation) to finalize concept documentation.`

**Update state file** `.librespin/state.md` — replace the `phase:` line value with `'4-component-research'`.

### DISTRIBUTOR ENRICHMENT (Phase 4 — additive, after MPN selection)

After BOM files are written to `.librespin/04-bom/`, enrich each selected component with real-time inventory and pricing from configured distributor APIs.

**Trigger condition:** Only runs if `~/.librespin/credentials` exists. If absent, skip enrichment silently and continue. This preserves existing Phase 4 behavior for users without API keys.

**Enrichment execution:**

```bash
# --- Distributor Enrichment Block ---
CREDS_FILE="$HOME/.librespin/credentials"

if [ ! -f "$CREDS_FILE" ]; then
  echo "[Distributor Enrichment] No credentials file found — skipping (run /librespin:setup to configure)"
  exit 0
fi

# Check jq availability
if ! command -v jq > /dev/null 2>&1; then
  echo "[Distributor Enrichment] WARNING: jq not found. Install: sudo apt install jq"
  echo "[Distributor Enrichment] Skipping enrichment — jq required for API response parsing"
  exit 0
fi

# Helper functions
read_credential() {
  local section="$1" key="$2"
  grep -A50 "^\[$section\]" "$CREDS_FILE" | grep -m1 "^$key" | awk -F' = ' '{print $2}' | tr -d '\r\n'
}

write_credential() {
  local section="$1" key="$2" value="$3"
  sed -i "/^\[$section\]/,/^\[/{s|^$key = .*|$key = $value|}" "$CREDS_FILE"
}

is_token_expired() {
  local expires="$1"
  [ -z "$expires" ] && return 0  # empty expiry = treat as expired
  local now
  now=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  [[ "$now" > "$expires" ]]
}

# Enrichment result accumulator
# For each component MPN passed by Phase 4 logic, run this block:
# MPN variable: $COMPONENT_MPN (set by calling context per component)
enrich_component() {
  local MPN="$1"
  local enrichment="## Distributor Enrichment: $MPN\n"
  enrichment+="| Supplier | Stock | Unit Price (USD) | Lifecycle | MOQ |\n"
  enrichment+="| --- | --- | --- | --- | --- |\n"
  local any_result=false

  # --- Nexar ---
  local NEXAR_CLIENT_ID NEXAR_CLIENT_SECRET NEXAR_TOKEN NEXAR_EXPIRY NEXAR_PARTS_USED
  NEXAR_CLIENT_ID=$(read_credential nexar client_id)
  NEXAR_CLIENT_SECRET=$(read_credential nexar client_secret)
  NEXAR_TOKEN=$(read_credential nexar access_token)
  NEXAR_EXPIRY=$(read_credential nexar token_expires)
  NEXAR_PARTS_USED=$(read_credential nexar parts_used)
  NEXAR_PARTS_USED=${NEXAR_PARTS_USED:-0}

  if [ -n "$NEXAR_CLIENT_ID" ] && [ -n "$NEXAR_CLIENT_SECRET" ]; then
    # Check free tier quota (100 parts/month)
    if [ "$NEXAR_PARTS_USED" -ge 100 ] 2>/dev/null; then
      echo "[Nexar] Free tier exhausted (100/100 parts used). Upgrade at nexar.com or configure another supplier."
      enrichment+="| Nexar | Quota exhausted (100/100) | — | — | — |\n"
    else
      # Refresh token if expired
      if is_token_expired "$NEXAR_EXPIRY"; then
        echo "[Nexar] Token expired — refreshing..."
        local NR
        NR=$(curl -s --request POST 'https://identity.nexar.com/connect/token' \
          --header 'Content-Type: application/x-www-form-urlencoded' \
          --data-urlencode 'grant_type=client_credentials' \
          --data-urlencode "client_id=$NEXAR_CLIENT_ID" \
          --data-urlencode "client_secret=$NEXAR_CLIENT_SECRET" \
          --data-urlencode 'scope=supply.domain')
        NEXAR_TOKEN=$(echo "$NR" | jq -r '.access_token // empty')
        if [ -n "$NEXAR_TOKEN" ]; then
          NEXAR_EXPIRY=$(date -u -d "+23 hours" +%Y-%m-%dT%H:%M:%SZ)
          write_credential nexar access_token "$NEXAR_TOKEN"
          write_credential nexar token_expires "$NEXAR_EXPIRY"
        else
          echo "[Nexar] Token refresh failed — skipping"
        fi
      fi

      if [ -n "$NEXAR_TOKEN" ]; then
        local NEXAR_RESULT
        NEXAR_RESULT=$(curl -s -X POST 'https://api.nexar.com/graphql/' \
          -H "Authorization: Bearer $NEXAR_TOKEN" \
          -H 'Content-Type: application/json' \
          -d "{\"query\": \"query { supSearchMpn(q: \\\"$MPN\\\", limit: 1) { results { part { mpn manufacturer { name } specs(attribute: \\\"lifecyclestatus\\\") { displayValue } sellers(authorizedOnly: true) { company { name } offers { inventoryLevel moq prices { quantity price currency } } } } } } }\"}")
        if echo "$NEXAR_RESULT" | jq -e '.errors' > /dev/null 2>&1; then
          echo "[Nexar] API error for $MPN — skipping"
        else
          local NX_STOCK NX_PRICE NX_LIFECYCLE NX_MOQ
          NX_STOCK=$(echo "$NEXAR_RESULT" | jq -r '.data.supSearchMpn.results[0].part.sellers[0].offers[0].inventoryLevel // "unknown"')
          NX_PRICE=$(echo "$NEXAR_RESULT" | jq -r '.data.supSearchMpn.results[0].part.sellers[0].offers[0].prices[0].price // "unknown"')
          NX_LIFECYCLE=$(echo "$NEXAR_RESULT" | jq -r '.data.supSearchMpn.results[0].part.specs[0].displayValue // "unknown"')
          NX_MOQ=$(echo "$NEXAR_RESULT" | jq -r '.data.supSearchMpn.results[0].part.sellers[0].offers[0].moq // "unknown"')
          enrichment+="| Nexar | $NX_STOCK | $NX_PRICE | $NX_LIFECYCLE | $NX_MOQ |\n"
          any_result=true
          NEXAR_PARTS_USED=$((NEXAR_PARTS_USED + 1))
          write_credential nexar parts_used "$NEXAR_PARTS_USED"
          if [ "$NEXAR_PARTS_USED" -ge 80 ] && [ "$NEXAR_PARTS_USED" -lt 100 ]; then
            echo "[Nexar] WARNING: Free tier usage: $NEXAR_PARTS_USED/100 parts. Approaching limit."
          fi
        fi
      fi
    fi
  fi

  # --- DigiKey ---
  local DK_CLIENT_ID DK_CLIENT_SECRET DK_TOKEN DK_EXPIRY
  DK_CLIENT_ID=$(read_credential digikey client_id)
  DK_CLIENT_SECRET=$(read_credential digikey client_secret)
  DK_TOKEN=$(read_credential digikey access_token)
  DK_EXPIRY=$(read_credential digikey token_expires)

  if [ -n "$DK_CLIENT_ID" ] && [ -n "$DK_CLIENT_SECRET" ]; then
    # DigiKey token expires in 10 minutes — always check before use
    if is_token_expired "$DK_EXPIRY"; then
      echo "[DigiKey] Token expired — refreshing..."
      local DKR
      DKR=$(curl -s -X POST 'https://api.digikey.com/v1/oauth2/token' \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -d "client_id=$DK_CLIENT_ID&client_secret=$DK_CLIENT_SECRET&grant_type=client_credentials")
      DK_TOKEN=$(echo "$DKR" | jq -r '.access_token // empty')
      if [ -n "$DK_TOKEN" ]; then
        local DK_NEW_EXPIRY
        DK_NEW_EXPIRY=$(date -u -d "+9 minutes" +%Y-%m-%dT%H:%M:%SZ)
        write_credential digikey access_token "$DK_TOKEN"
        write_credential digikey token_expires "$DK_NEW_EXPIRY"
      else
        echo "[DigiKey] Token refresh failed — skipping"
      fi
    fi

    if [ -n "$DK_TOKEN" ]; then
      local DK_RESULT DK_STOCK DK_PRICE DK_LIFECYCLE DK_COUNT
      # CRITICAL: POST keyword search (V4). Both Authorization AND X-DIGIKEY-Client-Id required.
      DK_RESULT=$(curl -s -X POST "https://api.digikey.com/products/v4/search/keyword" \
        -H "Authorization: Bearer $DK_TOKEN" \
        -H "X-DIGIKEY-Client-Id: $DK_CLIENT_ID" \
        -H "X-DIGIKEY-Locale-Site: US" \
        -H "X-DIGIKEY-Locale-Language: en" \
        -H "X-DIGIKEY-Locale-Currency: USD" \
        -H "Content-Type: application/json" \
        -d "{\"Keywords\": \"$MPN\", \"Limit\": 1}")
      DK_STOCK=$(echo "$DK_RESULT" | jq -r '.Products[0].QuantityAvailable // "unknown"')
      DK_PRICE=$(echo "$DK_RESULT" | jq -r '.Products[0].UnitPrice // "unknown"')
      DK_LIFECYCLE=$(echo "$DK_RESULT" | jq -r '.Products[0].ProductStatus.Status // "unknown"')
      DK_COUNT=$(echo "$DK_RESULT" | jq -r '.Products | length' 2>/dev/null || echo "0")
      if [ "${DK_COUNT:-0}" -eq 0 ] || [ "$DK_STOCK" = "null" ]; then
        echo "[DigiKey] No result for $MPN — logging and continuing"
        enrichment+="| DigiKey | Not found | — | — | — |\n"
      else
        enrichment+="| DigiKey | $DK_STOCK | \$$DK_PRICE | $DK_LIFECYCLE | — |\n"
        any_result=true
      fi
    fi
  fi

  # --- Mouser ---
  local MOUSER_KEY
  MOUSER_KEY=$(read_credential mouser part_api_key)
  if [ -n "$MOUSER_KEY" ]; then
    local MOUSER_RESULT MOUSER_STOCK MOUSER_PRICE
    MOUSER_RESULT=$(curl -s -X POST "https://api.mouser.com/api/v1/search/partnumber?apiKey=$MOUSER_KEY" \
      -H 'Content-Type: application/json' \
      -d "{\"SearchByPartRequest\": {\"mouserPartNumber\": \"$MPN\", \"partSearchOptions\": \"\"}}")
    MOUSER_STOCK=$(echo "$MOUSER_RESULT" | jq -r '.SearchResults.Parts[0].Availability // "unknown"')
    MOUSER_PRICE=$(echo "$MOUSER_RESULT" | jq -r '.SearchResults.Parts[0].PriceBreaks[0].Price // "unknown"')
    if [ "$MOUSER_STOCK" = "null" ] || [ -z "$MOUSER_STOCK" ]; then
      echo "[Mouser] No result for $MPN — logging and continuing"
    else
      enrichment+="| Mouser | $MOUSER_STOCK | $MOUSER_PRICE | — | — |\n"
      any_result=true
    fi
  fi

  # --- Arrow ---
  local ARROW_LOGIN ARROW_KEY
  ARROW_LOGIN=$(read_credential arrow login)
  ARROW_KEY=$(read_credential arrow api_key)
  if [ -n "$ARROW_LOGIN" ] && [ -n "$ARROW_KEY" ]; then
    local ARROW_RESULT ARROW_STOCK
    ARROW_RESULT=$(curl -s "https://api.arrow.com/itemservice/v4/en/search?term=$MPN&login=$ARROW_LOGIN&apikey=$ARROW_KEY")
    ARROW_STOCK=$(echo "$ARROW_RESULT" | jq -r '.itemserviceresult.data[0].InvOrg.sources[0].Quantity // "unknown"' 2>/dev/null || echo "unknown")
    if [ "$ARROW_STOCK" = "unknown" ] || [ "$ARROW_STOCK" = "null" ]; then
      echo "[Arrow] No result or error for $MPN — logging and continuing"
    else
      enrichment+="| Arrow | $ARROW_STOCK | — | — | — |\n"
      any_result=true
    fi
  fi

  # --- Newark/Farnell ---
  local NEWARK_KEY NEWARK_STOREFRONT
  NEWARK_KEY=$(read_credential newark api_key)
  NEWARK_STOREFRONT=$(read_credential newark storefront)
  NEWARK_STOREFRONT=${NEWARK_STOREFRONT:-us.newark.com}
  if [ -n "$NEWARK_KEY" ]; then
    local NEWARK_RESULT NEWARK_STOCK
    NEWARK_RESULT=$(curl -s \
      "https://api.element14.com/catalog/sandboxed/products;keywordList=$MPN;storeInfo.id=$NEWARK_STOREFRONT/v1/xml-data/productDetails/manufacturer?apikey=$NEWARK_KEY" \
      -H 'Accept: application/json')
    NEWARK_STOCK=$(echo "$NEWARK_RESULT" | jq -r '.manufacturerProductDetailResponse.products.product[0].inv // "unknown"' 2>/dev/null || echo "unknown")
    if [ "$NEWARK_STOCK" = "null" ] || [ "$NEWARK_STOCK" = "unknown" ]; then
      echo "[Newark] No result for $MPN — logging and continuing"
    else
      enrichment+="| Newark/Farnell | $NEWARK_STOCK | — | — | — |\n"
      any_result=true
    fi
  fi

  # --- LCSC ---
  local LCSC_KEY LCSC_PUBLIC
  LCSC_KEY=$(read_credential lcsc api_key)
  LCSC_PUBLIC=$(read_credential lcsc use_public_endpoint)
  if [ -n "$LCSC_KEY" ]; then
    local LCSC_RESULT LCSC_STOCK
    LCSC_RESULT=$(curl -s -H "Authorization: $LCSC_KEY" "https://lcsc.com/api/search?q=$MPN")
    LCSC_STOCK=$(echo "$LCSC_RESULT" | jq -r '.data.productList[0].stockCount // "unknown"' 2>/dev/null || echo "unknown")
    if [ "$LCSC_STOCK" = "null" ] || [ "$LCSC_STOCK" = "unknown" ]; then
      echo "[LCSC] Official API: no result for $MPN"
    else
      enrichment+="| LCSC | $LCSC_STOCK | — | — | — |\n"
      any_result=true
    fi
  elif [ "$LCSC_PUBLIC" = "true" ]; then
    # Public wmsc endpoint — note: unofficial, may change without notice
    local LCSC_PUB_RESULT LCSC_PUB_STOCK
    LCSC_PUB_RESULT=$(curl -s "https://wmsc.lcsc.com/wmsc/search/global?keyword=$MPN&currentPage=1&pageSize=5")
    LCSC_PUB_STOCK=$(echo "$LCSC_PUB_RESULT" | jq -r '.result.data[0].stockCount // "unknown"' 2>/dev/null || echo "unknown")
    if [ "$LCSC_PUB_STOCK" = "null" ] || [ "$LCSC_PUB_STOCK" = "unknown" ]; then
      echo "[LCSC] Public endpoint: no result for $MPN"
    else
      enrichment+="| LCSC (public) | $LCSC_PUB_STOCK | — | — | — |\n"
      any_result=true
    fi
  fi

  # Output enrichment if any supplier returned data
  if $any_result; then
    echo -e "$enrichment"
  else
    echo "[Distributor Enrichment] No supplier data for $MPN — check credentials or try /librespin:setup"
  fi
}
```

**Integration with Phase 4 research loop (DURING selection, not after):**

For each component being researched — call `enrich_component "$MPN"` BEFORE writing the BOM entry. Use the returned data as the primary source in the balanced scorecard:

```
For each component in research loop:
  1. Identify candidate MPNs (web search for discovery is fine here)
  2. For each candidate MPN:
     a. If API_MODE=true: call enrich_component "$MPN" — use returned stock/price/lifecycle
     b. If API_MODE=false: use web estimate, prefix price with "est." in BOM
  3. Score candidates using balanced scorecard WITH live API data (if available)
  4. Write BOM entry — API data takes precedence over any web-sourced estimate
  5. Continue regardless of enrichment success/failure
```

**Do NOT wait until after all BOM files are written.** Enrichment data must be available during scoring so the best-stocked, correctly-priced part wins.

**Fallback behavior:** If credentials file does not exist or `API_MODE=false`, enrichment is skipped and web estimates are used with `est.` prefix. No errors are raised.

**Output contract preservation:** Enrichment data is appended to `.librespin/04-bom/` files only. The output contract for downstream phases (CalcPad reads `.librespin/07-final-output/`, NGSpice reads `.librespin/08-calculations/`) is unaffected.


## PHASE 5: CONCEPT GENERATION

Generate component-level ASCII block diagrams and specification gap analysis for validated concepts.

**Purpose:** Transform validated concepts (with components from Phase 2) into detailed documentation with visual block diagrams showing component connectivity and specification coverage analysis showing requirement satisfaction.

**Input:**
- Validated concepts from Phase 1 (confidence ≥80% or user-approved)
- BOM files from Phase 2: `.librespin/04-bom/bom-{concept-name}.md`
- Requirements from Phase 1: `.librespin/01-requirements/requirements.yaml`
- Config: `.librespin/config.yaml` (for confidence_threshold)

**Output:**
- Per-concept analysis files: `.librespin/05-detailed-designs/analysis-{concept-name}.md`

Note: Cross-concept comparison is generated in Phase 1 (comparison-matrix.md) which includes coverage, costs, and quality scores.

### CONFIGURATION

Load confidence threshold from librespin-concept-config.yaml:

- Read `.librespin/config.yaml` and extract `confidence_threshold` field.
- Default to `80` if field is absent.
- Store as `confidenceThreshold` for use throughout this phase.

### INPUT LOADING

**1. Load validated concepts from Phase 1:**

Read `.librespin/03-validation/validation-summary.md` to identify which concepts passed validation (confidence ≥ threshold or user-approved).

- Read `.librespin/03-validation/validation-summary.md` and locate the "## Validated Concepts" table.
- Extract concept names where status is `passed` or `approved`.
- For each validated concept, slugify the name (lowercase, spaces to hyphens) and verify `.librespin/04-bom/bom-{slug}.md` exists.
- If any BOM file is missing: STOP with error "Missing BOM file for concept '{name}'. Run Phase 2 (Component Research) first."

**2. Load requirements from Phase 1:**

- If `.librespin/01-requirements/requirements.yaml` does not exist: STOP with error "Requirements file not found. Run Phase 1 (Requirements Gathering) first."
- Parse the YAML file; skip keys `schema_version` and `success_criteria`.
- Assign priority to each category: categories containing "critical" or named "application" → `Critical`; containing "nice" or named "compliance" → `Nice-to-have`; all others → `Important` (default).
- Flatten all requirements into a list with fields: `id`, `description`, `priority`, `category`.

### BLOCK DIAGRAM GENERATION

For each validated concept, generate component-level ASCII block diagram.

**Design Principles (from 07-RESEARCH.md Pattern 1):**
- Signal flow: left-to-right (inputs left, outputs right)
- Power flow: top-to-bottom (power in at top, GND at bottom)
- Box format: `+-------+` with abbreviated MPN inside
- Interface labels: Protocol names (SPI, I2C, UART, GPIO) on connection lines
- Power annotations: Voltage notes like "(3.3V)" near component boxes
- External interfaces: Shown at diagram edges (USB, Debug, User I/O)
- Size limit: 20-40 lines per diagram (split into subsystems if larger)

**Implementation:**

- Parse the BOM table from the BOM file (rows under the `Category` header column).
- If BOM is empty: generate a minimal diagram showing only the concept name box.
- If BOM has >20 components: warn "Consider splitting into subsystem diagrams for clarity."
- Group components by category: `power` (contains "power"), `processing` (contains "mcu" or "processor"), `communication` (contains "wireless" or "comms"), `sensors` (contains "sensor"), `io` (contains "interface" or "display"), `passives` (contains "passive").
- Draw power section at the top (power input → regulator boxes with voltage rail annotations).
- Draw processing, communication, sensors, and I/O in the middle following left-to-right signal flow.
- Abbreviate MPN labels: STM32* → first 7 chars; nRF* → `nRF\d+` match; >12 chars → first 10 chars; otherwise as-is.
- Append a legend: `----->` = signal flow, `<---->` = bidirectional, `(3.3V)` = power rail.
- Target 20–40 diagram lines; split into subsections if larger.

**Component Summary Table:**

After each diagram, include table linking diagram blocks to BOM references:

After the diagram, generate a component summary table with columns: `Ref | Component | MPN | Function`. Assign sequential reference designators (`U1`, `U2`, …). Use abbreviated MPN labels matching the diagram boxes.

**Error Handling:**
- Missing BOM file: Report error, skip concept (checked in INPUT LOADING)
- Empty BOM: Warn and generate minimal diagram showing concept name only
- Too many components (>20): Warn about complexity, suggest subsystem split in notes

### SPECIFICATION GAP ANALYSIS

For each validated concept, create requirements traceability matrix mapping requirements to addressing components.

**Traceability Matrix Structure (from 07-RESEARCH.md Pattern 2):**

Generate a traceability matrix table: `Req ID | Requirement | Priority | Addressed By | Status | Score`.

For each requirement, identify addressing components by matching keywords:
- `voltage` or `power` in requirement → power/regulator components
- `wireless`, `ble`, or `wifi` → wireless/comms components
- `temperature`, `humidity`, or `sensor` → sensor components
- `processing` or `computation` → MCU/processor components

Assign status and score:
- Components found and clearly satisfy requirement → `Full` (100%)
- Components found but partially satisfy → `Partial` (50%) — use as conservative default when in doubt
- No components found → `Not Addressed` (0%)

**Addressed Status Definitions (from 07-CONTEXT.md):**
- **Full (100%):** Component(s) completely satisfy the requirement
- **Partial (50%):** Component(s) contribute but don't fully satisfy
- **Not Addressed (0%):** No component addresses this requirement

**Scoring guideline:** When in doubt, score Partial (50%) and document reasoning. This prevents optimistic scoring that inflates coverage (per 07-RESEARCH.md Pitfall 3).

### WEIGHTED COVERAGE CALCULATION

Calculate overall specification coverage using priority weights.

**Weights (from 07-CONTEXT.md, consistent with Phase 1):**
- Critical: 50%
- Important: 30%
- Nice-to-have: 20%

**Implementation (from 07-RESEARCH.md Pattern 3):**

**Scoring:** `Full` = 100 pts, `Partial` = 50 pts, `Not Addressed` = 0 pts.

**Per-tier coverage:** sum of requirement scores ÷ (count × 100). Empty tier = 100% (no requirements = no gaps).

**Weighted overall:** `(Critical × 0.50) + (Important × 0.30) + (Nice-to-have × 0.20)`. Result rounded to nearest integer. Passes if ≥ 80%.

**Coverage Summary Format:**

**Coverage Summary format:**
```
**Overall Coverage:** {X}%
**Status:** PASS|FAIL (threshold: 80%)

| Priority     | Coverage |
|--------------|----------|
| Critical     | {X}%     |
| Important    | {X}%     |
| Nice-to-have | {X}%     |

**Gaps Identified:** {N} requirement(s) not fully addressed
```

### COVERAGE COMPARISON VIEW

Generate single comparison table showing all concepts for decision-making.

**Format (from 07-RESEARCH.md Pattern 4):**

Generate a comparison table: `Concept | Coverage | Critical | Important | Nice | Gaps | Est. Cost | Status`.

- Status = `PASS` if coverage ≥ 80%, else `FAIL`.
- Legend: Coverage = weighted overall (50/30/20); Gaps = count of Not Addressed requirements.
- If ≥1 concept passes: add `### Recommendation` naming the highest-coverage passing concept.
- If all fail: add `### Note` suggesting relaxing requirements or proceeding with best-available concept.

### GAP RESOLUTION SUGGESTIONS

For each Not Addressed or Partial requirement, provide actionable suggestions.

**Format (from 07-RESEARCH.md Pattern 5):**

For each requirement with status `Partial` or `Not Addressed`, output a subsection `### {id}: {description} ({status})`:

- **Gap:** Describe what is missing or partially satisfied.
- **Impact:** Requirement not satisfied / partially satisfied; may need enhancement.
- **Suggestions:** 2–4 actionable items based on requirement type:
  - power/voltage → add regulator or PMIC; review power budget; revisit spec
  - communication/interface → add comms module; use MCU with integrated peripheral; consider alternative protocol
  - sensor/measurement → add sensor to BOM; verify MCU ADC/interface; consider multi-sensor module
  - generic → add addressing component; enhance existing component; revisit requirement necessity; defer to Phase 2

If no gaps: output "No gaps identified - all requirements fully addressed."

**Key Principles (from 07-RESEARCH.md):**
- Be specific about the gap (what's missing, what's the shortfall)
- Quantify impact where possible
- Provide 2-3 actionable suggestions ranked by feasibility
- Note trade-offs of each suggestion where relevant
- Include "revisit requirement" as option when appropriate
- Complex resolutions defer to Phase 2 (Refinement)

### OUTPUT FILES

**Per-concept analysis files:** `.librespin/05-detailed-designs/analysis-{concept-name}.md`

File structure:

```markdown
# Concept Analysis: [Concept Name]

**Generated:** [date]
**Phase 1 Confidence:** [X]%
**BOM Source:** .librespin/04-bom/bom-{concept-name}.md

## Block Diagram

[ASCII diagram]

## Component Summary

[Component table linking diagram to BOM]

## Specification Gap Analysis

[Traceability matrix table]

## Coverage Summary

[Coverage percentages and status]

## Gaps and Suggestions

[Gap resolution suggestions for non-Full requirements]

## References

- BOM: .librespin/04-bom/bom-{concept-name}.md
- Requirements: .librespin/01-requirements/requirements.yaml
```

**Error Handling:**
- Missing requirements file: STOP with error (checked in INPUT LOADING)
- Requirement ID mismatch: Warn and use loaded requirements
- All concepts below 80%: Warn but continue, suggest revisiting requirements in Phase 1 output
- Empty priority tier: Treat as 100% covered (no requirements = no gaps)

**Update state file** `.librespin/state.md` — set `phase` to `5-concept-generation`:

- Read `.librespin/state.md`.
- Replace the `phase: ...` frontmatter field value with `'5-concept-generation'`.
- Write the updated content back to `.librespin/state.md`.

## PHASE 6: SELF-CRITIQUE & REFINEMENT

**Purpose:** Iteratively improve concept quality through automated self-critique loops. Takes concepts from Phase 1 (with coverage scores and gap lists) and refines them through multiple passes—verifying claims, addressing gaps, swapping components where needed—until quality plateaus or iteration limit reached. Target: at least 2-3 final concepts passing the 80% threshold.

**Source:** Self-Refine framework (Madaan et al., 2023), MCDA additive scoring model.

---

### INPUT LOADING

**Required inputs:**
- Concepts from Phase 1: `.librespin/05-detailed-designs/analysis-{concept-name}.md`
- BOM files: `.librespin/04-bom/bom-{concept-name}.md`
- Requirements: `.librespin/01-requirements/requirements.yaml`
- Coverage scores: From Phase 1 analysis files

**Load sequence:**
1. Read librespin-concept-config.yaml for iteration_limit (default 5)
2. Parse Phase 1 analysis files for concepts with coverage scores
3. Load BOM data for cost and availability scoring
4. Initialize iteration tracking

---

### QUALITY SCORING FRAMEWORK

**Composite Quality Score Formula (MCDA Additive Model):**
```
qualityScore = (coverage × 0.60) + (cost × 0.15) + (availability × 0.15) + (complexity × 0.10)
```

**Weight Constants:**

| Dimension | Weight | Source |
|-----------|--------|--------|
| coverage | 0.60 (60%) | Requirement coverage from Phase 5 |
| cost | 0.15 (15%) | Cost relative to other concepts |
| availability | 0.15 (15%) | Lead time + stock availability |
| complexity | 0.10 (10%) | Design complexity: BOM lines, interfaces, power rails |

---

#### calculateQualityScore(concept, allConcepts)

**Purpose:** Calculate composite weighted quality score for a concept.

**Steps:**
- Use Phase 5 weighted coverage score (0–100%) as `coverageScore`.
- Calculate `costScore` via relative cost scoring (cheapest = 100%, most expensive = 0%).
- Calculate `availabilityScore` as average of lead-time score and stock score for key components.
- Calculate `complexityScore` as weighted average of BOM count, interface diversity, power rail count, and topology.
- Compute: `overall = round((coverageScore × 0.60) + (costScore × 0.15) + (availabilityScore × 0.15) + (complexityScore × 0.10))`.
- Return `overall` and `breakdown` (each dimension score, rounded).

---

#### calculateRelativeCost(concept, allConcepts)

**Purpose:** Score concepts relative to each other (cheapest = 100%, most expensive = 0%).

- Get `minCost` and `maxCost` from all concepts' BOM totals.
- If all costs are equal (or single concept): return 100 (no cost differentiation).
- Otherwise: `costScore = round(100 × (1 − (concept.bomCost − minCost) / (maxCost − minCost)))`.
- Example: A=$25, B=$50, C=$100 → A=100%, B=67%, C=0%.

---

#### calculateAvailabilityScore(concept)

**Purpose:** Calculate combined lead time + stock availability score for key components.

**Key Component Filter:** A part is "key" if its category or description contains any of: `MCU`, `Microcontroller`, `Regulator`, `Connector`, `Wireless`, `Sensor`. Skip passives (resistors, capacitors).

For each key component:
- Lead time score: `max(0, 100 − (leadTimeWeeks × 12.5))` — in stock (0 weeks) = 100%; ≥8 weeks = 0%.
- Stock score: `min(100, stockQuantity / 10)` — 1000+ units = 100%; 0 units = 0%.

Availability score = `round((avgLeadTime + avgStock) / 2)` across all key components.

If no key components found: return 100 (no sourcing risk).

---

#### calculateComplexityScore(concept)

**Purpose:** Calculate complexity score based on multiple factors. Simpler designs score higher.

**Complexity Factors and Scoring:**

| Factor | Scoring Tiers |
|--------|---------------|
| BOM line count | <=15: 100%, <=25: 85%, <=40: 70%, <=60: 50%, >60: 30% |
| Interface diversity | <=3: 100%, <=5: 80%, <=8: 60%, >8: 40% |
| Power rail count | <=2: 100%, <=4: 75%, <=6: 50%, >6: 25% |
| Topology complexity | simple: 100%, moderate: 65%, complex: 30% |

**Factor Weights:**
- BOM lines: 30%
- Interfaces: 25%
- Power rails: 25%
- Topology: 20%

- Score each factor using the tiers above, then compute: `round((bomScore × 0.30) + (interfaceScore × 0.25) + (railScore × 0.25) + (topologyScore × 0.20))`.
- Topology: simple = linear/single MCU (100%); moderate = multiple subsystems/complex routing (65%); complex = distributed/mesh/custom protocols (30%).
- Default power rail count to 1 if not specified.

---

### QUALITY SCORE DISPLAY FORMAT

```markdown
## Quality Score: [Concept Name]

**Overall Score:** {score}% ({status based on 80% threshold})

| Dimension | Score | Weight | Contribution |
|-----------|-------|--------|--------------|
| Coverage | {X}% | 60% | {X×0.60}% |
| Cost | {X}% | 15% | {X×0.15}% |
| Availability | {X}% | 15% | {X×0.15}% |
| Complexity | {X}% | 10% | {X×0.10}% |
| **TOTAL** | | 100% | **{total}%** |

**Status:** {Passing | Below Threshold | Rescue Candidate}
```

---

### SELF-REFINE ITERATION LOOP

#### loadIterationConfig()

**Purpose:** Load and validate iteration_limit from config with default fallback.

- Read `iteration_limit` from `.librespin/config.yaml`.
- If field is absent: write default value `5` back to the config file and return 5.
- If field is present but not a number between 1–10: STOP with error "Invalid iteration_limit: {value}. Must be a number between 1 and 10. Check .librespin/config.yaml".
- Default: 5 iterations (configurable 1–10).

---

#### detectPlateau(currentScore, previousScore, threshold)

**Purpose:** Detect when quality improvement falls below threshold to terminate early.

**Threshold:** 5% (0.05) per CONTEXT.md "lenient plateau detection".

- If first iteration (no previous score): no plateau — return `{isPlateau: false}`.
- Compute `relativeImprovement = (currentScore - previousScore) / previousScore`.
- Plateau if `relativeImprovement < 0.05` (5% threshold).
- Examples: 72%→74% improvement = 2.8% → PLATEAU; 65%→72% improvement = 10.8% → CONTINUE.

---

#### shouldTransitionToFocused(scores)

**Purpose:** Determine when to switch from parallel (all concepts) to focused (top concepts) refinement.

**Transition Heuristics:**

1. **Top 3 clearly separated:** Top 3 concepts are >10% better than average of remaining concepts
2. **Rescue candidates identified:** Any concept in 70-79% range while others are <70%

Transition to focused mode when either condition is true:
- Heuristic 1: More than 3 concepts exist AND average of top 3 scores exceeds average of remaining scores by >10 points.
- Heuristic 2: Any concept is in the 70–79% range AND at least one concept is below 70%.

---

### MAIN REFINEMENT WORKFLOW

```
PHASE 8 SELF-CRITIQUE & REFINEMENT WORKFLOW:

1. LOAD INPUTS:
   - Load concepts from Phase 1 (with coverage scores)
   - Call loadIterationConfig() to get iteration_limit (default 5)
   - Initialize mode = 'parallel'
   - Initialize previousScores map

2. INITIAL QUALITY SCORING:
   - Calculate quality score for each concept using calculateQualityScore()
   - Abandon concepts with score < 70% (too far below threshold)
   - If no concepts remain: trigger handleAllFailScenario()

3. ITERATION LOOP (while iteration < iteration_limit):
   a. Check if verification iteration:
      isVerificationIteration = (iteration == 0 OR iteration == iteration_limit - 1)

   b. For each active concept:
      - If isVerificationIteration: call verifyComponentClaims(concept)
      - Identify Critical gaps (from Phase 1 gap analysis)
      - Apply gap closure actions (component swaps, additions, tweaks)
      - Recalculate quality score
      - Check plateau detection using detectPlateau()

   c. Check mode transition:
      - If mode == 'parallel' AND shouldTransitionToFocused(scores):
        mode = 'focused'
        Filter to concepts with score >= 70%

   d. Check success:
      - If >=2 concepts above 80%: SUCCESS (terminate)

   e. Check all plateaued:
      - If all concepts have plateauReached: TERMINATE

   f. iteration++

4. FINAL EVALUATION:
   - Count passing concepts (>=80%)
   - If >=2 passing: SUCCESS
   - If <2 passing: handleAllFailScenario()

5. OUTPUT:
   - Write refinement results to .librespin/06-refinement/
   - Update librespin-concept-state.md
```

---

#### handleAllFailScenario(concepts, iterations)

**Purpose:** Handle case when no concepts reach 80% threshold after all iterations.

- Sort all concepts by quality score (descending); identify `bestConcept` and `bestScore`.
- Identify common failure reasons: if average coverage score across concepts is <80%, report "Low coverage (avg {X}%): requirements may be too stringent". If no specific dimension identified, report "Multiple factors below threshold".
- Output message to the user including:
  - "All {N} concepts failed to reach 80% threshold after {iterations} iterations."
  - Highest score: `{bestConcept} ({bestScore}%)`
  - Common issues identified (bulleted)
  - Suggested actions: relax coverage requirements; increase budget; accept longer lead times; simplify design
  - Options: proceed with best available; return to Phase 5 to relax requirements; provide additional context
  - Prompt for user input before proceeding.

---

### TERMINATION CONDITIONS

In priority order:

1. **Success:** >=2 concepts above 80% threshold
2. **Max iterations:** iteration >= iteration_limit
3. **All plateaued:** All active concepts have improvement <5%
4. **All abandoned:** All concepts below 70% (triggered in initial scoring)

---

### VERIFICATION INTEGRATION

**Timing:** First iteration (baseline) AND last iteration (final check)

**What to verify:**
- Part existence in DigiKey
- Pricing within 25% of BOM estimate
- Lifecycle status (Active required, NRND/Obsolete rejected)
- Stock availability and lead time
- RoHS compliance status

**Tool:** DigiKey API via Python scripts at `~/.claude/tools/digikey/`
```bash
# Get full part details
python -m digikey.details "MPN"

# Check availability
python -m digikey.availability "MPN"

# Find alternatives for obsolete/unavailable parts
python -m digikey.alternatives "MPN"
```

**verifyComponentClaims(concept):**

Main verification entry point. Called by iteration loop at first and last iteration only.

For each key component (filter passives), run these checks via `python -m digikey.details "MPN"` and `python -m digikey.availability "MPN"`:

| Check | Pass Condition | Fail/Flag Condition | Action |
|-------|---------------|---------------------|--------|
| existence | Part found in DigiKey | Part not found | FAIL → find_alternative |
| datasheet | URL present | URL missing | WARN |
| pricing | Price within 25% of BOM estimate | Price deviation >25% | FLAG → update_bom_cost |
| lifecycle | Status = Active | NRND or Obsolete | FAIL → find_replacement |
| availability | Stock ≥100 OR lead time ≤8 weeks | Both below threshold | FLAG → find_alternative |
| rohs | RoHS Compliant | Non-compliant or unknown | WARN |

If DigiKey API returns an error for a part: log FAIL (existence), skip remaining checks for that part, continue to next.

**Verification Display Format:**
```markdown
### Verification Results (Key Components)
| Part | Status | Notes |
|------|--------|-------|
| STM32L476RG | PASS | Active, 1250 in stock |
| TPS563200 | PASS | $2.15 (within 10% of estimate) |
| nRF52832 | FLAG | Price changed 28% (>25%) - BOM updated |
| XYZ123 | FAIL | NRND - auto-replaced with XYZ456 |
```

---

#### autoFixVerificationFailure(part, failureType)

**Purpose:** Automatically address verification failures using DigiKey alternatives API.

**When to call:** When verifyComponentClaims detects lifecycle, availability, or existence failures.

- Call `python -m digikey.alternatives "MPN"` to get alternatives list.
- If no alternatives returned: status = `no_replacement`, escalate to user.
- Filter alternatives by failure type:
  - `lifecycle` → Active alternatives only
  - `availability` → stock >100 OR lead time ≤8 weeks
  - `price` → unit price ≤ 1.5× original estimate
  - `existence` → Active AND (stock >100 OR lead time ≤8 weeks)
- If no alternatives pass the filter: status = `no_valid_replacement`, show top 3 to user.
- Select best alternative by scoring: price score (30%) + stock score (25%) + lead time score (25%) + preferred manufacturer bonus (+20 if TI/ST/Microchip/Nordic/ADI/NXP).
- Log all auto-fixes silently; reflect changes in final output only.
- If API error: FAIL with action = `find_alternative`.

---

### GAP CLOSURE STRATEGY

**Focus:** Critical requirements only (accept Nice-to-have gaps per CONTEXT.md)

**Allowed Actions:**
1. **component_swap:** Replace part with better alternative
2. **component_addition:** Add new part for missing capability
3. **architecture_tweak:** Adjust connectivity, power topology
4. **requirement_reinterpretation:** Suggest relaxation if closure too costly

**Selection Criteria:** Balance cost, availability, and simplicity. Priority order:
1. Low complexity > High complexity
2. Lower cost impact > Higher cost impact
3. Better availability > Worse availability

---

#### generateGapClosureActions(concept, gaps)

**Purpose:** Main gap closure entry point. Filters to Critical gaps and generates closure actions.

- Filter to Critical gaps only; log all Nice-to-have gaps as skipped ("accepted as gaps per strategy").
- For each Critical gap: find closure options (swap, add, tweak); if none found, log `requirement_reinterpretation` ("Consider relaxing requirement or accepting partial coverage").
- Select best option using priority order: low complexity first, then lower cost.
- For Important gaps: also apply if best option is low complexity AND cost impact <$5.

---

#### analyzeGapClosureOptions(gap, concept)

**Purpose:** Find all viable closure options for a given gap.

For each gap, evaluate these option types and collect all that apply:

**component_swap** (complexity: low): Match gap keywords to BOM entries to find upgrade candidates:
- `gpio` or `pin` → swap MCU for one with more GPIO pins (~$2 impact)
- `current` or `power` → swap regulator for higher current variant (~$1 impact)

**component_addition** (complexity: medium): Match gap keywords to known additions:
- `5v` or `boost` → TPS61200 boost converter (+$1.50)
- `multiplexer` or `mux` → CD74HC4051 analog mux (+$0.80)
- `level shift` or `voltage translation` → TXS0108E level shifter (+$1.20)
- `esd` or `protection` → TPD4E05U06 ESD protection (+$0.50)

**architecture_tweak** (complexity varies): Match gap keywords to structural changes:
- `redundan` or `backup` → redundant power path with failover (complexity: high, ~$3)
- `isolat` → galvanic isolation on critical interfaces (complexity: medium, ~$5)
- `distribut` or `modular` → split into modular subsystems (complexity: high, ~$2)

---

#### selectBestClosureAction(options)

**Purpose:** Select the best closure action from available options.

**Priority order (per CONTEXT.md):** low complexity > low cost > simple change

Sort options by complexity first (low < medium < high), then by cost (lower is better). Return the first result.

---

#### applyClosureAction(concept, action)

**Purpose:** Apply the selected closure action to the concept.

Apply the selected action to the concept in-memory:
- `component_swap`: Find part by original MPN in BOM; replace MPN and add note "Swapped from {original}: {reason}"; add cost impact to BOM total.
- `component_addition`: Push new part entry to BOM (category: "Added", description: purpose, qty: 1); add cost impact.
- `architecture_tweak`: Append to concept's architecture notes (change, impact, gap reference); add cost impact.
- `requirement_reinterpretation`: Log suggestion to user suggestions list (do not modify BOM).
- `skip`: No modification needed.
- After applying: record gap as addressed in `addressedGaps` list with action type and cost.

**Gap Closure Display Format:**
```markdown
### Gap Closure Actions
1. **REQ-05 (Critical):** Added boost converter TPS61200 for 5V output capability
   - Action: component_addition
   - Cost impact: +$1.50
   - Complexity: low

2. **REQ-08 (Nice-to-have):** Skipped - accepted as gap per strategy
```

---

### OUTPUT FILES

**Refinement log:** `.librespin/06-refinement/refinement-log.md`
```markdown
# Refinement Log

## Iteration Summary

| Iteration | Concepts | Best Score | Avg Score | Termination Check |
|-----------|----------|------------|-----------|-------------------|
| 0 (initial) | 5 | 78% | 68% | Continuing |
| 1 | 5 | 82% | 73% | Continuing |
| 2 | 4 | 85% | 77% | Mode -> Focused |
| 3 | 3 | 86% | 81% | >=2 passing - SUCCESS |

## Final Results

**Passing concepts (>=80%):**
- Concept A: 86%
- Concept B: 82%
- Concept C: 79% (below threshold)

**Verification status:**
- All key components verified via DigiKey API
- 2 price updates applied (>25% change)
- 1 component swap (NRND part replaced)
```

**Per-concept score file:** `.librespin/06-refinement/score-{concept-name}.md`

---

### ERROR HANDLING

- **Missing Phase 1 files:** STOP with error directing to run Phase 1 first
- **Invalid iteration_limit:** STOP with validation error and instructions
- **DigiKey API failure:** Warn and continue with existing data (don't fail entire concept)
- **All concepts <70%:** Trigger handleAllFailScenario() with user suggestions
- **No improvement possible:** Accept plateau and proceed to final output

**Update state file** `.librespin/state.md` — set `phase` to `6-self-critique`:

- Read `.librespin/state.md`.
- Replace the `phase: ...` frontmatter field value with `'6-self-critique'`.
- Write the updated content back to `.librespin/state.md`.

## PHASE 7: FINAL OUTPUT

Generate final deliverables: comparison matrix, recommendation, and per-concept handoff folders.

**Output location:** `.librespin/07-final-output/`

### INPUT LOADING

Load data from Phases 6, 7, and 8 for final presentation.

**Discover concepts from Phase 6:**
- List all files in `.librespin/06-refinement/` matching `score-*.md`.
- Extract concept name from each file's `# Quality Score: {name}` header.
- Fallback: convert slug (filename minus `score-` prefix and `.md`) to title case.

**Load per-concept data:**
- Quality score: parse `**Overall:**` and breakdown dimensions from `.librespin/06-refinement/score-{slug}.md`.
- Block diagram, coverage analysis, gaps: extract from `.librespin/05-detailed-designs/analysis-{slug}.md`.
- BOM: parse table from `.librespin/04-bom/bom-{slug}.md`; sum unit prices for `bomCost`.
- Worst lead time: scan BOM for highest lead time value; parse "N weeks"/"N wk" patterns; "In Stock" = 0. Return `N/A` if no lead time data.
- Assemble per-concept record: `{name, slug, qualityScore, blockDiagram, coverageAnalysis, coverageByTier, gaps, bom, bomCost, worstLeadTime}`.

### CONCEPT SELECTION

Select top 3 concepts for final presentation.

- Sort all concepts by quality score (descending).
- If ≥3 concepts passed (≥80%): return top 3 passing concepts.
- If 1–2 passed: warn "Only {N} concepts passed 80% threshold"; include all passing plus enough non-passing (with `warning: "Below threshold ({X}%)"`) to reach 3 total.
- If none passed: warn; return top 3 with `warning` field set on each.

### COMPARISON MATRIX

Generate trade-off comparison matrix with relative ranking (<50 lines).

Sort concepts by quality score (descending) for column order. Generate 8-row table (max 50 lines):

| Dimension | Values |
|-----------|--------|
| BOM Cost | Absolute `$X.XX (Best\|Mid\|Worst)` — lower = Best |
| Complexity | Relative rank — higher complexity score (simpler design) = Best |
| Supply Risk | Relative rank based on availability score — higher = lower risk = Best |
| Coverage | Absolute percentages |
| Lead Time | Absolute worst-case weeks (`N/A` if unknown) — lower = Best |
| Components | BOM line count |
| Quality Score | Absolute overall score % |
| Best For | Dominant strength: coverage ≥90% → "Max Features"; cost ≥85% → "Budget"; availability ≥90% → "Availability"; complexity ≥85% → "Simplicity"; else → "Balanced" |

Relative ranking assigns `Best` (first position), `Worst` (last position), or `Mid` (all others). Handle ties by assigning the same rank.

### RECOMMENDATION

Generate directive recommendation with rationale and runner-up.

**Select recommended concept:**
- Sort by quality score (descending); default to rank-1.
- If top 2 scores are within 5 points AND rank-2 has a higher complexity score (simpler design): prefer rank-2 as recommended.

**Top strength** (first match wins):
- coverage ≥ 90% → "highest coverage. It addresses {X}% of requirements including all Critical items."
- BOM cost within 10% of minimum → "lowest cost. At ${X}, it offers the best value while meeting requirements."
- availability ≥ 90% → "best component availability. All parts are readily available with minimal supply chain risk."
- default → "balanced trade-offs. It provides the best combination of cost, coverage, and complexity."

**Main trade-off** (first match wins, or omit if none):
- BOM cost >20% above cheapest alternative → "higher BOM cost (${X} vs ${Y}), the additional investment provides better coverage and reliability"
- Coverage >5 points below best alternative → "slightly lower coverage, it compensates with better cost and availability"
- Availability >10 points below best alternative → "some supply chain considerations, all critical components remain available through major distributors"

**Runner-up reason** (first match wins):
- Runner-up costs <85% of recommended → "budget is the primary constraint"
- Runner-up availability score higher → "component availability and lead times are critical"
- Runner-up coverage score higher → "maximum feature coverage is essential"
- Runner-up complexity score higher → "development simplicity is prioritized"
- Default → "different trade-offs better match your priorities"

**Output format:**
```
## Recommendation

**Recommended: {name}**

Recommend {name} for its {strength}. {detail}

Though it has {tradeoff}, {mitigation}.

**Runner-up:** Consider {runner-up name} if {reason}.
```

### CONCEPT FOLDER GENERATION

Create single README.md per concept with inline BOM, diagram, coverage, and references.

Generate `{outputDir}/{slug}/README.md` with this structure:

```markdown
# Concept: {name}

**Quality Score:** {X}%
**BOM Cost:** ${X.XX}
**Coverage:** {X}% (Critical: {X}%, Important: {X}%, Nice-to-have: {X}%)

> **Warning:** {warning text}   ← only if concept is below threshold

## Architecture

```
{block diagram or "(Block diagram not available)"}
```

## Bill of Materials

| Ref | Part | MPN | Manufacturer | Description | Qty | Price | Datasheet |
...
**Total:** ${X.XX}

## Coverage Analysis

| Priority | Total | Covered | Coverage |
...

### Gaps

- **{id} ({priority}):** {description}
- None - all requirements addressed   ← if no gaps

## References

- [{title}]({url}) - {description}   ← TI/ST/ADI only, max 5
- No vendor reference designs applicable   ← if none found
```

**Vendor references:** Filter BOM for key components (MCU, Regulator, Sensor, Wireless, Motor Driver, Power). For each: TI (manufacturer contains "texas", "ti " or = "ti") → `https://www.ti.com/product/{mpn}#design-development`; ST (contains "stm", "st " or = "st") → `https://www.st.com/en/product/{mpn}#documentation`; ADI (contains "analog", "adi" or = "adi") → `https://www.analog.com/en/products/{mpn}#design-resources`. Limit to 5 references per concept.

### STATUS FILE GENERATION

Generate status.md with summary and next steps (<30 lines).

Generate `.librespin/07-final-output/status.md` (target <30 lines):

```markdown
# Status

**Created:** {YYYY-MM-DD}
**Recommended:** {top concept name}
**Status:** Awaiting Selection

## Concepts

- **{name}:** {X}% quality, ${X.XX} BOM [{warning text}]

## Output Files

- comparison-matrix.md
- status.md
- {slug}/README.md  (one per concept)

## Next Steps

1. Review comparison-matrix.md for trade-off analysis
2. Select preferred concept
3. Hand off selected concept folder to design engineer
```

### MAIN WORKFLOW

Phase 1 orchestration bringing all pieces together.

1. Discover concept names from `.librespin/06-refinement/` (or use names passed in). If none found: STOP "No concepts found in Phase 6 output. Run Phase 6 first."
2. Load all Phase 6 outputs for each concept.
3. If no concepts loaded: STOP "No concepts available. Cannot generate output."
4. Select top 3 concepts by quality score.
5. Generate comparison matrix (table + recommendation section appended).
6. Create `.librespin/07-final-output/` and one subdirectory per concept.
7. Write `{slug}/README.md` for each selected concept.
8. Write `comparison-matrix.md` (matrix + recommendation).
9. Write `status.md` (summary, concept list, output files, next steps).
10. Update `.librespin/state.md` — set `phase` to `7-final-output`.

### OUTPUT DIRECTORY STRUCTURE

Final output organization per CONTEXT.md:

```
.librespin/07-final-output/
├── comparison-matrix.md        # Trade-off matrix + recommendation (<50 lines)
├── status.md                   # Summary and next steps (<30 lines)
├── {concept-a}/
│   └── README.md               # Single file: diagram + BOM + coverage + refs
├── {concept-b}/
│   └── README.md
└── {concept-c}/
    └── README.md
```

### ERROR HANDLING

- Missing Phase 6 files: STOP with error directing to run Phase 6 first.
- No concepts passed validation: Include best available with `warning` field set.
- Missing BOM/diagram data: Generate partial README with placeholder text.
- Vendor reference search fails: Proceed without references section.

**Update state file** `.librespin/state.md` — set `phase` to `7-final-output`:

- Read `.librespin/state.md`.
- Replace the `phase: ...` frontmatter field value with `'7-final-output'`.
- Write the updated content back to `.librespin/state.md`.

## PHASE DISPATCH

On each invocation, determine which phase to execute by reading `.librespin/state.md` frontmatter.

**Dispatch rules:**

| state.md `phase` value | Meaning | Execute Next |
|------------------------|---------|--------------|
| (no state file exists) | Fresh project | Phase 1: Requirements Gathering |
| `3-requirements-gathering` | Phase 1 complete | Phase 2: Architecture Drafting |
| `2-architecture-drafting` | Phase 2 complete | Phase 2.5 + Phase 3: Req-to-Component Mapping then Validation Gate |
| `3-validation-gate` | Phase 3 complete | Phase 4: Component Research |
| `4-component-research` | Phase 4 complete | Phase 5: Concept Generation |
| `5-concept-generation` | Phase 5 complete | Phase 6: Self-Critique & Refinement |
| `6-self-critique` | Phase 6 complete | Phase 7: Final Output |
| `7-final-output` | All phases complete | Report completion, no further phases |

**Implementation:**

```
Read .librespin/state.md frontmatter
Extract `phase` field value

if no state file OR phase is empty:
  Execute PHASE 1: REQUIREMENTS GATHERING
elif phase == "3-requirements-gathering":
  Execute PHASE 2: ARCHITECTURE DRAFTING
elif phase == "2-architecture-drafting":
  Execute PHASE 2.5: REQUIREMENTS-TO-COMPONENT MAPPING
  then Execute PHASE 3: VALIDATION GATE
elif phase == "3-validation-gate":
  Execute PHASE 4: COMPONENT RESEARCH
elif phase == "4-component-research":
  Execute PHASE 5: CONCEPT GENERATION
elif phase == "5-concept-generation":
  Execute PHASE 6: SELF-CRITIQUE & REFINEMENT
elif phase == "6-self-critique":
  Execute PHASE 7: FINAL OUTPUT
elif phase == "7-final-output":
  Report: "All phases complete. Output at .librespin/07-final-output/"
else:
  Error: "Unknown phase value: {phase}. Check .librespin/state.md"
```

**State update contract:** Each phase MUST update `.librespin/state.md` frontmatter `phase` field to its own phase value from the table above upon completion. This enables the next invocation to dispatch correctly.

## CONSTRAINTS

- 1 page max per concept
- ASCII block diagrams only
- No component guessing—research everything
- Mark "NOT SPECIFIED" explicitly for gaps

## EDGE CASES

**No viable solutions found:**
Return error with explanation, suggest requirement relaxations.

**Contradictory requirements:**
Flag contradiction, ask user to resolve before proceeding.

**All concepts infeasible:**
Explain constraints, suggest alternatives.

## INTEGRATION WITH MULTI-PHASE ARCHITECTURE

**Config loading:**
On initialization, read `.librespin/config.yaml` for:
- `draft_count`: Number of concepts to generate (default 5)
- `iteration_limit`: Max refinement passes (default 5)
- `confidence_threshold`: Min score to proceed (default 80)

**State updates:**
After each phase completion, update `.librespin/state.md` with:
- Current phase
- Phase outputs
- Accumulated decisions
- Next phase to execute

**Per-phase state format:**

```yaml
---
current_phase: 5
completed_phases: [1, 2, 3, 4, 5]
---
## Phase 2: Architecture Drafting
concepts_generated:
  - "Centralized MCU Architecture"
  - "Distributed Sensor Network"
  - "Edge Processing Node"

## Phase 1: Validation Gate
validated_concepts:
  - name: "Centralized MCU Architecture"
    confidence: 87
    status: passed
  - name: "Distributed Sensor Network"
    confidence: 82
    status: approved

## Phase 2-8
# Downstream phases discover concepts from file system (score-*.md files)
# State file tracks which concepts are active, not duplicated data

## Phase 1
output_location: .librespin/07-final-output/
recommended_concept: "Centralized MCU Architecture"
```

Phases 6-9 use file system discovery (`discoverConceptsFromPhase6()`) rather than reading concept lists from state. This avoids data duplication and ensures consistency with actual output files.

**Template references:**
Load templates from `.claude/librespin/templates/requirements.yaml` for requirements format.

**Fresh context pattern:**
Each phase spawn reads only:
- Config file
- State file
- Previous phase's output files

Do not accumulate full conversation history across phases.
