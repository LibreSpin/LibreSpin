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

Load draft count from config file:

```javascript
const yaml = require('js-yaml');
const fs = require('fs');

// Read configuration
const configPath = '.librespin/config.yaml';
const config = yaml.load(fs.readFileSync(configPath, 'utf8'), {
  schema: yaml.FAILSAFE_SCHEMA
});

// Validate draft_count
const draftCount = config.draft_count;
if (typeof draftCount !== 'number' || draftCount < 3 || draftCount > 10) {
  throw new Error(`Invalid draft_count: ${draftCount}. Must be integer 3-10. Check ${configPath}`);
}

console.log(`Generating ${draftCount} architecture concepts...`);
```

### REQUIREMENTS LOADING

Load validated requirements from Phase 1:

```javascript
const requirementsPath = '.librespin/01-requirements/requirements.yaml';
if (!fs.existsSync(requirementsPath)) {
  throw new Error(`Requirements file not found: ${requirementsPath}. Run Phase 1 first.`);
}

const requirements = yaml.load(fs.readFileSync(requirementsPath, 'utf8'), {
  schema: yaml.FAILSAFE_SCHEMA
});

// Parse domain indicators from requirements
const domainIndicators = identifyDomain(requirements);
console.log(`Detected domains: ${domainIndicators.join(', ') || 'generic'}`);
```

### DOMAIN DETECTION

Identify application domain from requirements to inform concept generation:

```javascript
function identifyDomain(requirements) {
  const domains = [];
  const useCaseText = (requirements.use_case || '').toLowerCase();
  const sensorsText = (JSON.stringify(requirements.sensors || [])).toLowerCase();

  // Motor control domain
  if (/motor|bldc|foc|trapezoidal|brushless|stepper/i.test(useCaseText)) {
    domains.push('motor-control');
  }

  // IoT sensor domain
  if (/iot|sensor network|wireless sensor|battery.*sensor/i.test(useCaseText)) {
    domains.push('iot-sensor');
  }

  // Processing-intensive domain
  if (/signal processing|high.*speed|parallel|real.*time|dsp/i.test(useCaseText)) {
    domains.push('processing-intensive');
  }

  return domains;
}
```

### SEQUENTIAL GENERATION WITH DIVERSITY CHECKING

Generate concepts one at a time, checking diversity after each:

```javascript
const concepts = [];
const maxRetries = 3;

for (let i = 0; i < draftCount; i++) {
  let attempts = 0;
  let newConcept = null;
  let diversityResult = null;

  while (attempts < maxRetries) {
    // Generate concept with constraints
    const prompt = buildConceptPrompt(requirements, domainIndicators, concepts, i);
    newConcept = await generateConcept(prompt);

    // Check diversity against all previous concepts
    diversityResult = checkDiversity(newConcept, concepts);

    if (diversityResult.isDiverse || concepts.length === 0) {
      // Document differentiation
      newConcept.differentiation = diversityResult.differences || [];
      break;
    }

    attempts++;
    console.log(`Concept ${i+1} too similar (attempt ${attempts}/${maxRetries}). Retrying...`);
  }

  if (newConcept && (diversityResult.isDiverse || concepts.length === 0)) {
    concepts.push(newConcept);
    console.log(`✓ Concept ${i+1}: ${newConcept.name}`);
  } else {
    console.warn(`Could not generate diverse concept ${i+1} after ${maxRetries} attempts.`);
    console.warn(`Reducing count from ${draftCount} to ${concepts.length}`);
    break; // Reduce count rather than forcing similarity
  }
}

console.log(`\nGenerated ${concepts.length} diverse concepts.`);
```

### DIVERSITY CHECKING ALGORITHM

Compare new concept against all previous concepts across 4 dimensions:

```javascript
function checkDiversity(newConcept, existingConcepts) {
  if (existingConcepts.length === 0) {
    return { isDiverse: true, differences: [] };
  }

  const allDifferences = [];

  for (const existing of existingConcepts) {
    const differences = [];

    // Dimension 1: Processing architecture (MCU/FPGA/DSP/ASIC)
    if (newConcept.processing !== existing.processing) {
      differences.push(`Processing: ${newConcept.processing} vs ${existing.processing}`);
    }

    // Dimension 2: System topology (centralized/distributed/modular)
    if (newConcept.topology !== existing.topology) {
      differences.push(`Topology: ${newConcept.topology} vs ${existing.topology}`);
    }

    // Dimension 3: Communication approach (wired/wireless/serial/parallel)
    if (newConcept.communication !== existing.communication) {
      differences.push(`Communication: ${newConcept.communication} vs ${existing.communication}`);
    }

    // Dimension 4: Power architecture (battery/mains, LDO/switching)
    if (newConcept.power !== existing.power) {
      differences.push(`Power: ${newConcept.power} vs ${existing.power}`);
    }

    // Diversity threshold: Must differ in ≥1 major dimension (moderate standard)
    if (differences.length < 1) {
      return {
        isDiverse: false,
        reason: `Too similar to ${existing.name}`,
        differences: []
      };
    }

    allDifferences.push(...differences);
  }

  return {
    isDiverse: true,
    differences: allDifferences
  };
}
```

### CONCEPT GENERATION STRATEGY

Build prompt for concept generation with diversity and extreme constraints:

```javascript
function buildConceptPrompt(requirements, domains, existingConcepts, conceptIndex) {
  let prompt = `Generate a hardware architecture concept meeting these requirements:\n`;
  prompt += `${JSON.stringify(requirements, null, 2)}\n\n`;

  // Domain-specific patterns
  if (domains.includes('motor-control')) {
    prompt += `Domain: Motor control. Consider FOC, trapezoidal, or hybrid architectures.\n`;
  }
  if (domains.includes('iot-sensor')) {
    prompt += `Domain: IoT sensor. Consider centralized cloud, edge processing, or mesh topologies.\n`;
  }
  if (domains.includes('processing-intensive')) {
    prompt += `Domain: Processing. Consider MCU, DSP, FPGA, or hybrid processing.\n`;
  }

  // Extreme concepts for boundary exploration
  if (conceptIndex === 0 && existingConcepts.length === 0) {
    prompt += `\nStrategy: Ultra-low-power extreme. Minimize power at all costs.\n`;
  } else if (conceptIndex === 1 && existingConcepts.length === 1) {
    prompt += `\nStrategy: Maximum performance. Optimize for capability over power/cost.\n`;
  } else {
    prompt += `\nStrategy: Balanced approach exploring different architectural dimension.\n`;
  }

  // Diversity constraints
  if (existingConcepts.length > 0) {
    prompt += `\nExisting concepts (must differ in ≥1 dimension):\n`;
    existingConcepts.forEach(c => {
      prompt += `- ${c.name}: ${c.processing}, ${c.topology}, ${c.communication}, ${c.power}\n`;
    });
  }

  prompt += `\nOutput structured concept with: name, processing, topology, communication, power, assumptions, pros, cons.\n`;

  return prompt;
}
```

### CONCEPT STRUCTURE

Each generated concept must include:

```javascript
{
  name: "Centralized MCU Architecture",
  summary: "Single Cortex-M4 MCU handles all processing, sensors via I2C/SPI, wireless via UART.",

  // Architectural dimensions (for diversity checking)
  processing: "Cortex-M4 MCU with FPU",
  topology: "centralized-single-board",
  communication: "wired-serial-I2C-SPI",
  power: "switching-buck-converter",

  // Characteristics table
  characteristics: [
    { dimension: "Processing", choice: "Cortex-M4 MCU (with FPU)", rationale: "Sufficient for sensor fusion + control loops" },
    { dimension: "Topology", choice: "Centralized (single-board)", rationale: "Simplifies design, reduces cost" },
    { dimension: "Communication", choice: "I2C sensors, UART wireless", rationale: "Standard protocols, wide part availability" },
    { dimension: "Power", choice: "Buck converter (battery → 3.3V)", rationale: "Efficient step-down, single rail" }
  ],

  // Explicit assumptions for Phase 1 validation
  assumptions: [
    "BLE range sufficient for use case (<10m typical)",
    "Single-sided PCB acceptable",
    "Sensor data rates <1kHz (I2C bandwidth adequate)",
    "No galvanic isolation required",
    "~100 MIPS processing headroom sufficient",
    "Typical current draw ~50mA (est. 6-month battery life on 2000mAh)"
  ],

  // ASCII block diagram (functional blocks only)
  blockDiagram: `
                    +-------------------+
                    |   Battery Pack    |
                    |    (3.7V Li-Ion)  |
                    +---------+---------+
                              |
                              v (power)
                    +---------+---------+
                    |   Buck Converter  |
                    |   (3.7V → 3.3V)   |
                    +---------+---------+
                              |
                              v (3.3V)
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
+-------+-------+     +-------+-------+     +-------+-------+
|  Cortex-M4    |     |  Sensor Array |     | Wireless Comm |
|  MCU (Main)   |<--->|  (I2C/SPI)    |     |  (BLE/LoRa)   |
+-------+-------+     +---------------+     +-------+-------+
        |
        v (control)
+-------+-------+
| Motor Driver  |
| (PWM output)  |
+---------------+

Legend:
  ----> : Signal flow
  <---> : Bidirectional communication
  |  v  : Power flow (downward)
`,

  // Qualitative trade-offs (no numbers yet)
  pros: [
    "Lower cost (single MCU, fewer components)",
    "Simpler BOM (commodity parts)",
    "Easier firmware development (single core)",
    "Standard peripherals (I2C, SPI, UART)"
  ],

  cons: [
    "Limited processing headroom (single MCU)",
    "Single point of failure (centralized)",
    "I2C bandwidth limits sensor scalability",
    "Battery life constrained (always-on MCU)"
  ],

  // Differentiation from other concepts
  differentiation: [
    "vs. Distributed: Centralized (not multi-node)",
    "vs. FPGA-based: MCU processing (not FPGA)",
    "vs. Low-power extreme: Moderate power (not ultra-low)"
  ],

  // Innovation marking
  innovation: {
    standard: ["Commodity MCU", "Standard buck converter", "I2C sensor interface", "UART wireless"],
    novel: ["Sensor fusion algorithm (if advanced)"]
  }
}
```

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

```javascript
function formatBlockDiagram(concept) {
  // Guidelines:
  // - Functional blocks only (no part numbers)
  // - Directional arrows: ----> for signal, | v for power
  // - Keep under 30 lines, under 80 characters wide
  // - Use consistent box alignment
  // - Include legend for arrow types

  // Load template from .claude/librespin/templates/concept-template.md
  // Follow Pattern 2 from 04-RESEARCH.md
}
```

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

**Invalid configuration:**
```javascript
if (draftCount < 3 || draftCount > 10) {
  throw new Error(`Invalid draft_count: ${draftCount}. Must be integer 3-10.`);
}
```

**Missing requirements:**
```javascript
if (!fs.existsSync(requirementsPath)) {
  throw new Error(`Requirements file not found: ${requirementsPath}. Run Phase 1 first.`);
}
```

**Diversity check failures:**
```javascript
if (attempts >= maxRetries) {
  console.warn(`Could not generate diverse concept after ${maxRetries} attempts.`);
  console.warn(`Reducing count from ${draftCount} to ${concepts.length}`);
  break; // Reduce count rather than forcing similarity
}
```

### COMPLETION SUMMARY

After all concepts generated:

```javascript
console.log(`\nPhase 2 (Architecture Drafting) complete.`);
console.log(`Generated: ${concepts.length} diverse concepts`);
console.log(`\nFiles created:`);
concepts.forEach(c => {
  console.log(`  - concept-${c.name.toLowerCase().replace(/\s+/g, '-')}.md`);
});
console.log(`  - overview.md`);
console.log(`\nNext: Run Phase 1 (Validation Gate) to assess concept feasibility.`);
```

**Update state file** `.librespin/state.md` — set `phase` to `2-architecture-drafting`:

```javascript
const existingState = fs.readFileSync('.librespin/state.md', 'utf8');
const updatedState = existingState.replace(/^phase: .+$/m, `phase: '2-architecture-drafting'`);
fs.writeFileSync('.librespin/state.md', updatedState);
```

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

Load generated concepts from Phase 02:

```javascript
const conceptsDir = '.librespin/02-concepts/';
const conceptFiles = fs.readdirSync(conceptsDir)
  .filter(f => f.startsWith('concept-') && f.endsWith('.md'));

if (conceptFiles.length === 0) {
  throw new Error(`No concept files found in ${conceptsDir}. Run Phase 2 first.`);
}

console.log(`Creating requirement mappings for ${conceptFiles.length} concepts...`);
```

### REQUIREMENTS LOADING

Load requirements to extract technical specification terms:

```javascript
const requirementsPath = '.librespin/01-requirements/requirements.yaml';
const requirements = yaml.load(fs.readFileSync(requirementsPath, 'utf8'), {
  schema: yaml.FAILSAFE_SCHEMA
});
```

### TECHNICAL TERM EXTRACTION

Extract all technical specification terms from requirements:

```javascript
function extractTechnicalTerms(requirements) {
  const terms = {
    protocols: [],      // SPI Mode 1, I2C Fast Mode, UART 115200
    interfaces: [],     // Quad-SPI, I2C, UART
    resources: [],      // GPIO count, ADC channels, timers
    electrical: [],     // Voltage levels, current limits
    performance: [],    // Speed, bandwidth, latency
    physical: []        // Port count, connector type
  };

  // Communication protocols
  if (requirements.communication?.spi) {
    const mode = requirements.communication.spi.mode;
    if (mode !== undefined) {
      terms.protocols.push({
        term: `SPI Mode ${mode}`,
        meaning: `Protocol timing: CPOL/CPHA configuration`,
        context: 'SPI protocol specification'
      });
    }
    terms.interfaces.push('SPI');
  }

  if (requirements.communication?.i2c) {
    const speed = requirements.communication.i2c.speed || 'standard';
    terms.protocols.push({
      term: `I2C ${speed}`,
      meaning: `Bus speed: ${speed === 'fast' ? '400kHz' : '100kHz'}`,
      context: 'I2C protocol specification'
    });
    terms.interfaces.push('I2C');
  }

  // Resources
  if (requirements.hmi?.gpio) {
    terms.resources.push({
      term: `${requirements.hmi.gpio} GPIO`,
      meaning: `${requirements.hmi.gpio} general-purpose I/O pins required`,
      context: 'HMI requirements'
    });
  }

  // Physical connectivity
  if (requirements.connectivity?.port_count) {
    terms.physical.push({
      term: `${requirements.connectivity.port_count} USB port(s)`,
      meaning: `Number of physical USB ports available on host`,
      context: 'Physical connectivity constraint'
    });
  }

  return terms;
}
```

### COMPONENT EXTRACTION

Extract component names and families from each concept:

```javascript
function extractComponents(concept) {
  const componentPatterns = [
    { pattern: /FT\d{3,4}[A-Z]*/gi, family: 'FTDI USB Bridge' },
    { pattern: /CH\d{3,4}[A-Z]*/gi, family: 'WCH USB Bridge' },
    { pattern: /USB251\d|USB340\d/gi, family: 'Microchip USB Hub' },
    { pattern: /STM32[A-Z]\d/gi, family: 'STM32 MCU' },
    { pattern: /nRF\d{4,5}/gi, family: 'Nordic MCU' },
    { pattern: /CP210\d/gi, family: 'Silicon Labs USB-UART' },
    { pattern: /MCP2221/gi, family: 'Microchip USB-I2C/GPIO' }
  ];

  const components = [];
  const content = concept.content;

  componentPatterns.forEach(({ pattern, family }) => {
    const matches = content.match(pattern) || [];
    const unique = [...new Set(matches)];
    unique.forEach(name => {
      components.push({
        name,
        family,
        configurations: getKnownConfigurations(name, family)
      });
    });
  });

  return components;
}
```

### KNOWN CONFIGURATIONS DATABASE

Maintain database of known component configurations for common families:

```javascript
function getKnownConfigurations(componentName, family) {
  const configDatabase = {
    'FTDI USB Bridge': {
      'FT4222H': {
        modes: [
          {
            name: 'Mode 0',
            registers: 'DCNF1=0, DCNF0=0',
            provides: '4 GPIO (GPIO0-3), 1 SPI Master',
            limitations: 'Single SPI channel'
          },
          {
            name: 'Mode 1',
            registers: 'DCNF1=0, DCNF0=1',
            provides: '2 GPIO (GPIO2-3), 1 SPI Master with 2 additional CS',
            limitations: 'GPIO0-1 become CS2-3'
          },
          {
            name: 'Mode 2',
            registers: 'DCNF1=1, DCNF0=0',
            provides: '2 GPIO (GPIO2-3), 4 SPI Masters',
            limitations: 'GPIO0-1 become additional SPI MISO/MOSI'
          }
        ],
        protocols: {
          spi_modes: [0, 1, 2, 3],
          quad_spi: true,
          max_clock_mhz: 40
        }
      },
      'FT2232H': {
        modes: [
          {
            name: 'UART',
            provides: '2 independent UART channels'
          },
          {
            name: 'FIFO',
            provides: '1 parallel FIFO interface'
          },
          {
            name: 'SPI',
            provides: '2 SPI Master interfaces'
          }
        ]
      }
    },
    'WCH USB Bridge': {
      'CH347': {
        modes: [
          {
            name: 'Mode 0',
            provides: '2 UART + 1 SPI + 1 I2C + 8 GPIO',
            limitations: 'All interfaces active simultaneously'
          }
        ],
        protocols: {
          spi_modes: [0, 1, 2, 3],
          quad_spi: false,
          max_clock_mhz: 60
        }
      }
    }
  };

  return configDatabase[family]?.[componentName] || {
    modes: [],
    note: 'Configuration unknown - requires manual datasheet research'
  };
}
```

### TERMINOLOGY COLLISION DETECTION

Identify when same term appears in requirements and component specs with potentially different meanings:

```javascript
function detectTerminologyCollisions(technicalTerms, components) {
  const collisions = [];

  technicalTerms.protocols.forEach(reqTerm => {
    components.forEach(component => {
      // Check if component mentions same term
      const componentModes = component.configurations.modes || [];
      componentModes.forEach(mode => {
        // Look for "Mode" collision
        if (reqTerm.term.includes('Mode') && mode.name.includes('Mode')) {
          const reqModeNum = reqTerm.term.match(/Mode (\d+)/)?.[1];
          const compModeNum = mode.name.match(/Mode (\d+)/)?.[1];

          if (reqModeNum === compModeNum) {
            collisions.push({
              term: 'Mode',
              requirement: {
                text: reqTerm.term,
                meaning: reqTerm.meaning,
                context: reqTerm.context
              },
              component: {
                text: `${component.name} ${mode.name}`,
                meaning: mode.provides,
                context: `Chip configuration mode`
              },
              severity: 'HIGH',
              risk: 'Conflating protocol mode with chip configuration mode'
            });
          }
        }
      });
    });
  });

  return collisions;
}
```

### MAPPING TABLE GENERATION

Create explicit requirement → component mapping for each concept:

```javascript
function createMappingTable(concept, technicalTerms, components) {
  const mappings = [];

  // Map each requirement to component capabilities
  [...technicalTerms.protocols, ...technicalTerms.resources, ...technicalTerms.physical].forEach(reqTerm => {
    components.forEach(component => {
      const mapping = mapRequirementToComponent(reqTerm, component);
      if (mapping.relevant) {
        mappings.push(mapping);
      }
    });
  });

  return {
    concept: concept.name,
    mappings,
    collisions: detectTerminologyCollisions(technicalTerms, components),
    configuration: determineOptimalConfiguration(mappings, components)
  };
}

function mapRequirementToComponent(reqTerm, component) {
  // Example: Map "SPI Mode 1" to FT4222H capabilities
  if (reqTerm.term.includes('SPI Mode')) {
    const modeNum = parseInt(reqTerm.term.match(/Mode (\d+)/)?.[1]);
    const supportedModes = component.configurations.protocols?.spi_modes || [];

    return {
      relevant: true,
      requirement: reqTerm.term,
      requirement_meaning: reqTerm.meaning,
      component: component.name,
      component_capability: `Supports SPI modes ${supportedModes.join(', ')}`,
      compatible: supportedModes.includes(modeNum),
      configuration_needed: 'SPI protocol register configuration (not chip mode)',
      notes: `Set SPI_MODE register to ${modeNum}, independent of chip configuration mode`
    };
  }

  // Example: Map "4 GPIO" to FT4222H modes
  if (reqTerm.term.includes('GPIO')) {
    const gpioCount = parseInt(reqTerm.term.match(/(\d+) GPIO/)?.[1]);
    const modes = component.configurations.modes || [];

    const viableModes = modes.filter(mode => {
      const modeGpio = parseInt(mode.provides.match(/(\d+) GPIO/)?.[1] || '0');
      return modeGpio >= gpioCount;
    });

    return {
      relevant: true,
      requirement: reqTerm.term,
      requirement_meaning: reqTerm.meaning,
      component: component.name,
      component_capability: viableModes.length > 0 ? `${viableModes[0].name}: ${viableModes[0].provides}` : 'Insufficient GPIO',
      compatible: viableModes.length > 0,
      configuration_needed: viableModes.length > 0 ? viableModes[0].name : 'None',
      notes: viableModes.length > 0 ? `Use chip ${viableModes[0].name} for ${gpioCount} GPIO availability` : 'Component cannot satisfy requirement'
    };
  }

  return { relevant: false };
}
```

### CONFIGURATION DETERMINATION

Determine single chip configuration that satisfies all requirements:

```javascript
function determineOptimalConfiguration(mappings, components) {
  const configurationsByComponent = {};

  // Group mappings by component
  components.forEach(component => {
    const componentMappings = mappings.filter(m => m.component === component.name && m.compatible);

    const requiredConfigs = componentMappings.map(m => m.configuration_needed);
    const uniqueConfigs = [...new Set(requiredConfigs.filter(c => c !== 'SPI protocol register configuration (not chip mode)'))];

    // Check if single chip config can satisfy all
    if (uniqueConfigs.length === 0) {
      // All requirements are protocol-level (registers), any chip mode works
      configurationsByComponent[component.name] = {
        chip_mode: component.configurations.modes[0]?.name || 'Default',
        protocol_configs: requiredConfigs,
        feasible: true,
        notes: 'All requirements are protocol/register configurations, compatible with any chip mode'
      };
    } else if (uniqueConfigs.length === 1) {
      // Single chip mode needed
      configurationsByComponent[component.name] = {
        chip_mode: uniqueConfigs[0],
        protocol_configs: requiredConfigs.filter(c => c !== uniqueConfigs[0]),
        feasible: true,
        notes: `All requirements satisfied in ${uniqueConfigs[0]}`
      };
    } else {
      // Multiple chip modes needed - CONFLICT
      configurationsByComponent[component.name] = {
        chip_mode: null,
        protocol_configs: [],
        feasible: false,
        conflict: `Requires multiple chip modes: ${uniqueConfigs.join(', ')}. Can only use one mode at a time.`,
        recommendation: 'Choose different component or revise requirements'
      };
    }
  });

  return configurationsByComponent;
}
```

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

After mapping all concepts:

```javascript
console.log(`\nPhase 2.5 (Requirements-to-Component Mapping) complete.`);
console.log(`Mapped: ${concepts.length} concepts`);
console.log(`Collisions detected: ${totalCollisions}`);
console.log(`Configuration conflicts: ${configConflicts}`);
console.log(`\nMapping sections added to concept files.`);
console.log(`\nNext: Run Phase 1 (Validation Gate) with explicit configuration specifications.`);
```

### ERROR HANDLING

**Missing requirements:**
```javascript
if (!fs.existsSync(requirementsPath)) {
  throw new Error(`Requirements file not found: ${requirementsPath}. Run Phase 1 first.`);
}
```

**Missing concept files:**
```javascript
if (conceptFiles.length === 0) {
  throw new Error(`No concept files found. Run Phase 2 first.`);
}
```

**Unknown component configurations:**
```javascript
if (component.configurations.note) {
  console.warn(`⚠ ${component.name}: ${component.configurations.note}`);
  console.warn(`  Manual datasheet research required for accurate mapping.`);
}
```

## PHASE 3: VALIDATION GATE

Filter architecture concepts by feasibility before expensive component research.

### OVERVIEW

**Purpose:** Validate concepts generated in Phase 2 by identifying breaking assumptions, scoring confidence using weighted criteria, and filtering concepts below threshold. Prevents wasting research effort on unfeasible architectures.

**Threshold:** Load from `.librespin/config.yaml` (confidence_threshold, default 80)

**Output location:** Adds validation sections to existing concept files in `.librespin/02-concepts/`

### CONFIGURATION LOADING

Load validation threshold from config file:

```javascript
const yaml = require('js-yaml');
const fs = require('fs');

// Read configuration
const configPath = '.librespin/config.yaml';
const config = yaml.load(fs.readFileSync(configPath, 'utf8'), {
  schema: yaml.FAILSAFE_SCHEMA
});

// Validate confidence_threshold
const threshold = config.confidence_threshold;
if (typeof threshold !== 'number' || threshold < 60 || threshold > 95) {
  throw new Error(`Invalid confidence_threshold: ${threshold}. Must be integer 60-95. Check ${configPath}`);
}

console.log(`Validation threshold: ${threshold}%`);
```

### CONCEPT LOADING

Load generated concepts from Phase 2:

```javascript
const conceptsDir = '.librespin/02-concepts/';
const conceptFiles = fs.readdirSync(conceptsDir)
  .filter(f => f.startsWith('concept-') && f.endsWith('.md'));

if (conceptFiles.length === 0) {
  throw new Error(`No concept files found in ${conceptsDir}. Run Phase 2 first.`);
}

console.log(`Validating ${conceptFiles.length} concepts...`);
```


### CONFIGURATION FEASIBILITY CHECK

**CRITICAL PRE-VALIDATION STEP:** Verify component configurations can satisfy all requirements simultaneously.

For concepts with configurable components (chips with multiple modes, multi-function ICs), check configuration feasibility:

**1. Identify configurable components:**

```javascript
function identifyConfigurableComponents(concept) {
  const configurablePatterns = [
    { pattern: /FT\d{3,4}[A-Z]*/gi, type: 'FTDI bridge', modes: 'chip configuration modes' },
    { pattern: /CH\d{3,4}[A-Z]*/gi, type: 'WCH bridge', modes: 'function modes' },
    { pattern: /STM32.*|nRF.*|ESP.*/gi, type: 'MCU', modes: 'peripheral configurations' },
    { pattern: /USB251\d|USB340\d/gi, type: 'USB hub', modes: 'port configurations' }
  ];

  const components = [];
  configurablePatterns.forEach(({ pattern, type, modes }) => {
    const matches = concept.content.match(pattern) || [];
    matches.forEach(match => {
      components.push({ name: match, type, modes });
    });
  });

  return components;
}
```

**2. Extract technical specification terms from requirements:**

```javascript
function extractTechnicalTerms(requirements) {
  const terms = {
    protocols: [],      // SPI Mode 1, I2C Fast Mode, UART 115200
    interfaces: [],     // Quad-SPI, I2C, UART
    resources: [],      // GPIO count, ADC channels, timers
    electrical: [],     // Voltage levels, current limits
    performance: []     // Speed, bandwidth, latency
  };

  // Extract from requirements YAML
  if (requirements.communication) {
    if (requirements.communication.spi) {
      terms.protocols.push(`SPI Mode ${requirements.communication.spi.mode || 'unspecified'}`);
      terms.interfaces.push('SPI');
    }
    if (requirements.communication.i2c) {
      terms.protocols.push(`I2C ${requirements.communication.i2c.speed || 'unspecified'}`);
      terms.interfaces.push('I2C');
    }
  }

  if (requirements.hmi?.gpio) {
    terms.resources.push(`${requirements.hmi.gpio} GPIO`);
  }

  return terms;
}
```

**3. Create requirement-to-component mapping:**

For each configurable component, build explicit mapping table:

```javascript
function createRequirementMapping(component, requirements, technicalTerms) {
  const mapping = {
    component: component.name,
    requirements: [],
    configuration: null,
    feasible: true,
    conflicts: []
  };

  // Map each requirement term to component capability
  technicalTerms.protocols.forEach(term => {
    const componentSupport = checkComponentSupport(component, term);
    mapping.requirements.push({
      requirement: term,
      component_capability: componentSupport.capability,
      configuration_needed: componentSupport.config,
      compatible: componentSupport.compatible
    });

    if (!componentSupport.compatible) {
      mapping.feasible = false;
      mapping.conflicts.push(`${term} not supported by ${component.name}`);
    }
  });

  // Determine single configuration that satisfies all requirements
  mapping.configuration = determineOptimalConfiguration(component, mapping.requirements);

  return mapping;
}
```

**4. Verify single-configuration feasibility:**

```javascript
function verifySingleConfiguration(mapping) {
  // Check if all requirements can be satisfied in ONE chip configuration
  const configs = mapping.requirements.map(r => r.configuration_needed);
  const uniqueConfigs = [...new Set(configs)];

  if (uniqueConfigs.length > 1) {
    return {
      feasible: false,
      reason: `Requires multiple chip configurations: ${uniqueConfigs.join(', ')}. Can only use one configuration at a time.`,
      recommendation: `Choose different component or revise requirements`
    };
  }

  // Check for pin conflicts in chosen configuration
  const pinConflicts = checkPinConflicts(mapping.configuration, mapping.requirements);
  if (pinConflicts.length > 0) {
    return {
      feasible: false,
      reason: `Pin conflicts in ${mapping.configuration}: ${pinConflicts.join(', ')}`,
      recommendation: `Use chip configuration with non-conflicting pin assignments`
    };
  }

  return {
    feasible: true,
    configuration: mapping.configuration,
    reason: `All requirements satisfied in ${mapping.configuration}`
  };
}
```

**5. Document mapping in concept file:**

Add section BEFORE ## Validation:

```markdown
## Configuration Feasibility

**Component:** ${component.name}

### Requirement-to-Component Mapping

| Requirement | Component Capability | Configuration | Compatible |
|-------------|----------------------|---------------|------------|
${mapping.requirements.map(r => `| ${r.requirement} | ${r.component_capability} | ${r.configuration_needed} | ${r.compatible ? '✅' : '❌'} |`).join('\n')}

**Selected Configuration:** ${mapping.configuration}

**Feasibility:** ${configCheck.feasible ? '✅ FEASIBLE' : '❌ INFEASIBLE'}

**Rationale:** ${configCheck.reason}

${configCheck.feasible ? '' : `\n**Fix Required:** ${configCheck.recommendation}`}
```

**6. Fail concept if configuration infeasible:**

```javascript
const configCheck = verifySingleConfiguration(mapping);

if (!configCheck.feasible) {
  concept.validation_status = 'config_failed';
  concept.confidenceScore = 0;
  concept.failureReason = configCheck.reason;
  concept.recommendation = configCheck.recommendation;

  console.log(`❌ ${concept.name}: CONFIGURATION FAILURE`);
  console.log(`   Component: ${component.name}`);
  console.log(`   Reason: ${configCheck.reason}`);
  console.log(`   Fix: ${configCheck.recommendation}`);

  // Skip remaining validation for this concept
  continue;
}
```

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

```javascript
async function verifyAssumptionWithHierarchy(assumption) {
  const sourceHierarchy = [
    { tier: 1, name: 'vendor_datasheets', confidence: 'high' },
    { tier: 2, name: 'industry_standards', confidence: 'medium-high' },
    { tier: 3, name: 'academic_papers', confidence: 'medium' },
    { tier: 4, name: 'technical_forums', confidence: 'low' }
  ];

  const findings = {
    assumption: assumption.question,
    sources: [],
    verdict: null,
    confidence: null,
    tier_reached: null
  };

  // Try each tier in order (highest reliability first)
  for (const tier of sourceHierarchy) {
    const results = await searchTier(tier, assumption.keywords);

    if (results.length > 0) {
      findings.sources.push(...results.map(r => ({
        ...r,
        tier: tier.tier,
        tier_name: tier.name
      })));

      // Analyze results from this tier
      const analysis = analyzeResults(results, assumption);

      if (analysis.isConclusive) {
        findings.verdict = analysis.verdict; // 'validated' or 'invalidated'
        findings.confidence = tier.confidence;
        findings.tier_reached = tier.tier;
        break; // Stop at first conclusive tier
      }
    }
  }

  // If no conclusive results from any tier
  if (findings.verdict === null) {
    findings.verdict = 'inconclusive';
    findings.confidence = 'none';
    findings.tier_reached = 0;
  }

  return findings;
}
```

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

**Implementation:**

```javascript
function adjustScoreBasedOnResearch(initialScores, findings) {
  const adjusted = { ...initialScores };
  const log = [];

  findings.forEach(finding => {
    const dim = finding.affects_dimension;
    const oldScore = adjusted[dim];
    let newScore = oldScore;

    if (finding.verdict === 'validated' && finding.confidence === 'high') {
      newScore = Math.max(oldScore, 80); // Move to proficient/excellent
    } else if (finding.verdict === 'invalidated') {
      newScore = Math.min(oldScore, 30); // Move to poor/unacceptable
    } else if (finding.verdict === 'inconclusive') {
      newScore = 50; // Move to average (reflects uncertainty)
    }

    if (newScore !== oldScore) {
      adjusted[dim] = newScore;
      log.push({ dim, oldScore, newScore, reason: finding.verdict });
    }
  });

  return { adjusted, log };
}
```

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

```javascript
function countUsbDevices(concept) {
  const usbDevicePatterns = [
    /USB.*bridge/gi,
    /FT\d{3,4}[A-Z]*/gi,  // FTDI chips
    /CH\d{3,4}[A-Z]*/gi,  // WCH chips
    /CP210\d/gi,          // Silicon Labs
    /MCP2221/gi,          // Microchip
    /USB.*UART|USB.*SPI|USB.*I2C/gi
  ];

  let deviceCount = 0;
  const content = concept.content.toLowerCase();
  const devices = [];

  // Count each USB bridge IC as 1 USB device
  usbDevicePatterns.forEach(pattern => {
    const matches = content.match(pattern) || [];
    deviceCount += matches.length;
    devices.push(...matches);
  });

  return {
    count: deviceCount,
    devices: devices
  };
}
```

**2. Check hub requirement:**

```javascript
function checkTopologyFeasibility(concept, requirements) {
  const usbDevices = countUsbDevices(concept);
  const portsAvailable = requirements.connectivity?.port_count || 1;

  // Check if hub is present in BOM/concept
  const hasHub = /USB.*hub|hub.*USB|USB251\d|USB340\d/gi.test(concept.content);

  if (usbDevices.count > portsAvailable && !hasHub) {
    return {
      feasible: false,
      reason: `${usbDevices.count} USB devices require ${usbDevices.count}-port hub (or ${usbDevices.count} ports), but concept has no hub and only ${portsAvailable} port(s) available`,
      recommendation: `Add USB hub IC (e.g., USB2514B, USB3340) to BOM`,
      devices: usbDevices.devices
    };
  }

  if (usbDevices.count > portsAvailable && hasHub) {
    // Verify hub has enough ports
    const hubPorts = extractHubPortCount(concept);
    if (hubPorts && hubPorts < usbDevices.count) {
      return {
        feasible: false,
        reason: `${usbDevices.count} USB devices require ${usbDevices.count}-port hub, but hub only has ${hubPorts} ports`,
        recommendation: `Use ${usbDevices.count}-port hub or reduce USB device count`
      };
    }
  }

  return {
    feasible: true,
    reason: usbDevices.count <= 1 ? 'Single USB device, no hub needed' : `Hub present for ${usbDevices.count} USB devices`
  };
}

function extractHubPortCount(concept) {
  // Extract hub port count from part number or description
  // Examples: "USB2514B" = 4-port, "USB3340" = 4-port
  const hubMatch = concept.content.match(/USB(\d)(\d{2,3})[A-Z]?/i);
  if (hubMatch) {
    const portCount = parseInt(hubMatch[1], 10);
    if (portCount >= 2 && portCount <= 7) {
      return portCount;
    }
  }
  return null; // Unknown port count
}
```

**3. Fail concept immediately if topology infeasible:**

```javascript
const topologyCheck = checkTopologyFeasibility(concept, requirements);

if (!topologyCheck.feasible) {
  concept.validation_status = 'topology_failed';
  concept.confidenceScore = 0;
  concept.failureReason = topologyCheck.reason;
  concept.recommendation = topologyCheck.recommendation;

  console.log(`❌ ${concept.name}: TOPOLOGY FAILURE`);
  console.log(`   Reason: ${topologyCheck.reason}`);
  console.log(`   Fix: ${topologyCheck.recommendation}`);

  // Skip remaining validation for this concept
  continue;
}
```

**4. Document topology check in concept file:**

Add section to concept BEFORE ## Validation:

```markdown
## Physical Topology Check

**USB Devices:** ${usbDevices.count}
**Ports Available:** ${portsAvailable}
**Hub Required:** ${usbDevices.count > portsAvailable ? 'YES' : 'NO'}
**Hub Present:** ${hasHub ? 'YES' : 'NO'}
**Topology Status:** ${topologyCheck.feasible ? '✅ FEASIBLE' : '❌ INFEASIBLE'}

${topologyCheck.reason}
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

**Implementation:**

```javascript
// Evaluate concept against rubric
const dimensionScores = {
  requirements_coverage: evaluateRequirementsCoverage(concept, requirements),
  technical_feasibility: evaluateTechnicalFeasibility(concept),
  physical_topology: evaluatePhysicalTopology(concept, requirements),
  part_availability: evaluatePartAvailability(concept),
  cost: evaluateCost(concept),
  complexity: evaluateComplexity(concept)
};

// Each evaluation function returns tier score: 10, 30, 50, 70, or 90
```

**Physical Topology evaluation function:**

```javascript
function evaluatePhysicalTopology(concept, requirements) {
  const topologyCheck = checkTopologyFeasibility(concept, requirements);

  if (!topologyCheck.feasible) {
    return 10; // Infeasible - critical failure
  }

  const usbDevices = countUsbDevices(concept);
  const portsAvailable = requirements.connectivity?.port_count || 1;
  const hasHub = /USB.*hub|hub.*USB|USB251\d|USB340\d/gi.test(concept.content);

  // Single device, no hub needed
  if (usbDevices.count === 1) {
    return 90; // Excellent - simple topology
  }

  // Multi-device with properly sized hub
  if (usbDevices.count > 1 && hasHub) {
    const hubPorts = extractHubPortCount(concept);
    if (hubPorts >= usbDevices.count) {
      return 90; // Excellent - hub properly sized
    } else if (hubPorts >= usbDevices.count - 1) {
      return 70; // Good - marginal but viable
    } else {
      return 30; // Poor - hub undersized
    }
  }

  // Multi-port available, no hub needed
  if (usbDevices.count <= portsAvailable) {
    return 70; // Good - viable but uncommon for embedded
  }

  return 50; // Average - unclear topology
}
```


**Technical Feasibility evaluation function:**

```javascript
function evaluateTechnicalFeasibility(concept) {
  let score = 90; // Start optimistic

  // Check configuration feasibility
  const configMapping = concept.configurationMapping;
  if (!configMapping) {
    score -= 10; // Configuration not specified
  } else if (!configMapping.feasible) {
    return 10; // Configuration infeasible - critical failure
  } else if (configMapping.disambiguated === false) {
    score -= 20; // Overloaded terms not disambiguated
  }

  // Check technical claims verification (existing logic)
  const unverifiedClaims = countUnverifiedTechnicalClaims(concept);
  if (unverifiedClaims > 3) {
    score -= 20; // Many unknowns
  } else if (unverifiedClaims > 1) {
    score -= 10; // Some unknowns
  }

  // Check for reference designs
  const hasReferenceDesign = /reference.*design|eval.*board|dev.*kit/gi.test(concept.content);
  if (!hasReferenceDesign) {
    score -= 10; // No proven starting point
  }

  return Math.max(10, score); // Floor at 10
}
```


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
```javascript
const weights = {
  requirements_coverage: 0.20,  // 20%
  technical_feasibility: 0.25,  // 25%
  physical_topology: 0.20,      // 20%
  part_availability: 0.15,      // 15%
  cost: 0.12,                   // 12%
  complexity: 0.08              // 8%
};
```

**Implementation:**

```javascript
function calculateWeightedConfidence(dimensionScores, weights) {
  // Verify weights sum to 1.0
  const weightSum = Object.values(weights).reduce((sum, w) => sum + w, 0);
  if (Math.abs(weightSum - 1.0) > 0.01) {
    throw new Error(`Weights must sum to 1.0, got ${weightSum}`);
  }

  // Apply additive model: V = Σ(Score_i × Weight_i)
  const confidence =
    (dimensionScores.requirements_coverage * weights.requirements_coverage) +
    (dimensionScores.technical_feasibility * weights.technical_feasibility) +
    (dimensionScores.physical_topology * weights.physical_topology) +
    (dimensionScores.part_availability * weights.part_availability) +
    (dimensionScores.cost * weights.cost) +
    (dimensionScores.complexity * weights.complexity);

  return Math.round(confidence * 10) / 10; // Round to 1 decimal place
}
```

**Example calculation (6 dimensions):**

```javascript
// Example scores
const scores = {
  requirements_coverage: 85,
  technical_feasibility: 70,
  physical_topology: 90,
  part_availability: 90,
  cost: 60,
  complexity: 75
};

// Calculate
const confidence =
  (85 * 0.20) +  // 17.0
  (70 * 0.25) +  // 17.5
  (90 * 0.20) +  // 18.0 (physical topology)
  (90 * 0.15) +  // 13.5
  (60 * 0.12) +  // 7.2
  (75 * 0.08);   // 6.0
// = 79.2%
```

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

```javascript
function applyValidationGate(concepts, threshold) {
  const passed = [];
  const failed = [];
  const borderline = [];

  concepts.forEach(concept => {
    const confidence = concept.confidenceScore;

    if (confidence >= threshold + 5) {
      // Auto-pass: High confidence (≥85% if threshold=80)
      passed.push({
        ...concept,
        validation_status: 'auto_passed',
        reason: `High confidence (≥${threshold + 5}%)`
      });
    } else if (confidence >= threshold && confidence < threshold + 5) {
      // Borderline: Request user approval (80-85% if threshold=80)
      borderline.push({
        ...concept,
        validation_status: 'needs_approval',
        reason: `Borderline confidence (${threshold}-${threshold + 5}%)`
      });
    } else {
      // Auto-fail: Below threshold
      failed.push({
        ...concept,
        validation_status: 'auto_failed',
        reason: `Low confidence (${confidence.toFixed(1)}% < ${threshold}%)`
      });
    }
  });

  return { passed, failed, borderline };
}
```

**Outcomes:**

1. **Auto-pass (≥85%):** Proceed to Phase 2 (Component Research) without user review
2. **Borderline (80-85%):** Present to user for approval decision
3. **Auto-fail (<80%):** Filter out, do not proceed to research

**All concepts fail scenario:**

If all concepts score <threshold:
```javascript
if (passed.length === 0 && borderline.length === 0) {
  const highestScore = Math.max(...concepts.map(c => c.confidenceScore));
  const highestConcept = concepts.find(c => c.confidenceScore === highestScore);

  console.log(`All ${concepts.length} concepts failed validation (< ${threshold}% threshold).`);
  console.log(`Highest score: ${highestConcept.name} (${highestScore.toFixed(1)}%)`);
  console.log('\nRecommendations:');
  console.log('1. Revise requirements to expand design space');
  console.log(`2. Lower threshold to ${highestScore.toFixed(0)}% to proceed with best option`);
  console.log('3. Return to Phase 2 with different architectural constraints');
  console.log('4. Proceed with highest-scoring concept accepting higher risk');

  // Request user decision
}
```

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

**3. Update state file** `.librespin/state.md` — set `phase` to `3-validation-gate`:

```javascript
const existingState = fs.readFileSync('.librespin/state.md', 'utf8');
const updatedState = existingState.replace(/^phase: .+$/m, `phase: '3-validation-gate'`);
fs.writeFileSync('.librespin/state.md', updatedState);
```

### ERROR HANDLING

**Invalid configuration:**
```javascript
if (threshold < 60 || threshold > 95) {
  throw new Error(`Invalid confidence_threshold: ${threshold}. Must be integer 60-95.`);
}
```

**Missing concept files:**
```javascript
if (conceptFiles.length === 0) {
  throw new Error(`No concept files found. Run Phase 2 first.`);
}
```

**All concepts fail:**
```javascript
// Present options to user (see "All concepts fail scenario" above)
```

### COMPLETION SUMMARY

After validation complete:

```javascript
console.log(`\nPhase 3 (Validation Gate) complete.`);
console.log(`Evaluated: ${concepts.length} concepts`);
console.log(`Passed: ${passed.length}, Borderline: ${borderline.length}, Failed: ${failed.length}`);
console.log(`\nValidation summary: .librespin/03-validation/validation-summary.md`);
if (passed.length > 0 || borderline.length > 0) {
  console.log(`\nNext: Run Phase 2 (Component Research) for passing concepts.`);
} else {
  console.log(`\nAll concepts failed validation. Review recommendations above.`);
}
```

## PHASE 4: COMPONENT RESEARCH

Select specific parts with part numbers for validated architecture concepts (those passing Phase 1 >=80% threshold). Research focuses on active lifecycle status, availability, and verified specifications. Only validated concepts receive component research - prevents wasting effort on unfeasible architectures.

### API-FIRST RULE (MANDATORY — run this before any component research)

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

```javascript
const yaml = require('js-yaml');
const fs = require('fs');

// Read configuration
const configPath = '.librespin/config.yaml';
const config = yaml.load(fs.readFileSync(configPath, 'utf8'), {
  schema: yaml.FAILSAFE_SCHEMA
});

// Validate confidence_threshold (used to filter validated concepts)
const threshold = config.confidence_threshold;
if (typeof threshold !== 'number' || threshold < 60 || threshold > 95) {
  throw new Error(`Invalid confidence_threshold: ${threshold}. Must be integer 60-95. Check ${configPath}`);
}

console.log(`Component research for concepts with confidence >= ${threshold}%`);
```

### VALIDATED CONCEPT LOADING

Load only concepts that passed Phase 1 validation:

```javascript
const conceptsDir = '.librespin/02-concepts/';
const validationSummaryPath = '.librespin/03-validation/validation-summary.md';

// Check validation summary exists
if (!fs.existsSync(validationSummaryPath)) {
  throw new Error(`Validation summary not found: ${validationSummaryPath}. Run Phase 1 first.`);
}

// Read all concept files
const conceptFiles = fs.readdirSync(conceptsDir)
  .filter(f => f.startsWith('concept-') && f.endsWith('.md'));

if (conceptFiles.length === 0) {
  throw new Error(`No concept files found in ${conceptsDir}. Run Phase 2 first.`);
}

// Filter to validated concepts only
const validatedConcepts = [];

conceptFiles.forEach(file => {
  const content = fs.readFileSync(`${conceptsDir}/${file}`, 'utf8');

  // Parse validation status from ## Validation section
  const validationMatch = content.match(/validation_status:\s*['"]?(auto_passed|needs_approval)['"]?/i);
  const confidenceMatch = content.match(/Confidence Score:\s*([\d.]+)%/);

  if (validationMatch) {
    const status = validationMatch[1];
    const confidence = confidenceMatch ? parseFloat(confidenceMatch[1]) : 0;

    // Accept auto_passed (>=85%) or needs_approval (80-85%, user approved)
    if (status === 'auto_passed' || status === 'needs_approval') {
      validatedConcepts.push({
        file,
        status,
        confidence,
        content
      });
    }
  }
});

if (validatedConcepts.length === 0) {
  throw new Error(`No validated concepts found (>=${threshold}% confidence). Run Phase 1 first or lower threshold.`);
}

console.log(`Found ${validatedConcepts.length} validated concepts for component research.`);
```

### CRITICAL: DATASHEET VERIFICATION PROTOCOL

**GROUND TRUTH REQUIREMENT:** All electrical specifications MUST be extracted from official manufacturer datasheets. No component selection proceeds without datasheet verification.

**Purpose:** Establish ground truth for all component specifications before BOM generation. Prevents fabricated data, underestimated power requirements, and incompatible component selections.

**Workflow:** For each active component → Find datasheet → Download PDF → Convert to text → Read & extract specs → Verify with agent → Document

---

#### Step 1: Identify Components Requiring Datasheets

Extract all active components from requirements and concept architectures:

```javascript
function identifyDatasheetRequirements(requirements, concepts) {
  const componentsNeedingDatasheets = new Set();

  // From requirements: onboard devices
  if (requirements.interfaces?.uart_channels) {
    requirements.interfaces.uart_channels.forEach(channel => {
      if (channel.location === 'onboard') {
        componentsNeedingDatasheets.add({
          name: channel.device,
          type: 'uart_device',
          criticality: 'CRITICAL',
          reason: 'Onboard device power requirements needed'
        });
      }
    });
  }

  // From concepts: bridge ICs, USB hubs, power ICs
  concepts.forEach(concept => {
    // Extract from block diagram or assumptions section
    const blockDiagram = extractBlockDiagram(concept.content);

    // USB-to-SPI/UART bridge ICs (CRITICAL)
    const bridgeICs = blockDiagram.match(/FT\d+[A-Z]+|CH\d+[A-Z]+|MCP\d+|CY7C\d+/g);
    if (bridgeICs) {
      bridgeICs.forEach(ic => {
        componentsNeedingDatasheets.add({
          name: ic,
          type: 'bridge_ic',
          criticality: 'CRITICAL',
          reason: 'SPI Mode 1 support, GPIO count, speed verification required'
        });
      });
    }

    // USB hubs (if present)
    const hubICs = blockDiagram.match(/USB\d+[A-Z]*/g);
    if (hubICs) {
      hubICs.forEach(ic => {
        componentsNeedingDatasheets.add({
          name: ic,
          type: 'usb_hub',
          criticality: 'HIGH',
          reason: 'Port count, power distribution, lifecycle verification'
        });
      });
    }

    // Power ICs (buck converters, LDOs)
    const powerICs = blockDiagram.match(/LM\d+[A-Z]*|TPS\d+[A-Z]*|ADP\d+[A-Z]*/g);
    if (powerICs) {
      powerICs.forEach(ic => {
        componentsNeedingDatasheets.add({
          name: ic,
          type: 'power_ic',
          criticality: 'CRITICAL',
          reason: 'Input voltage range, output current, efficiency verification'
        });
      });
    }
  });

  return Array.from(componentsNeedingDatasheets);
}

const requiredDatasheets = identifyDatasheetRequirements(requirements, validatedConcepts);
console.log(`Identified ${requiredDatasheets.length} components requiring datasheet verification.`);
```

---

#### Step 2: Datasheet Retrieval and Parsing

For each component, attempt to retrieve official manufacturer datasheet:

```javascript
async function retrieveAndParseDatasheet(component) {
  console.log(`\n[DATASHEET] Retrieving: ${component.name}`);

  // Step 2a: Search for official datasheet PDF
  const datasheetSearch = await WebSearch({
    query: `${component.name} datasheet PDF site:*.com filetype:pdf`
  });

  // Prioritize manufacturer domains (ti.com, ftdichip.com, microchip.com, etc.)
  const manufacturerDomains = ['ti.com', 'ftdichip.com', 'microchip.com', 'onsemi.com',
                               'analog.com', 'infineon.com', 'nxp.com', 'st.com'];

  const datasheetURL = datasheetSearch.links.find(link =>
    manufacturerDomains.some(domain => link.url.includes(domain)) &&
    link.url.toLowerCase().includes('pdf')
  );

  if (!datasheetURL) {
    console.warn(`⚠️  WARNING: No manufacturer datasheet found for ${component.name}`);
    console.warn(`   Searched: ${datasheetSearch.query}`);
    console.warn(`   ACTION REQUIRED: User must obtain datasheet manually`);
    return {
      component: component.name,
      status: 'NOT_FOUND',
      verified: false,
      error: 'Manufacturer datasheet PDF not accessible via web search'
    };
  }

  console.log(`[DATASHEET] Found: ${datasheetURL.url}`);

  // Step 2b: Download PDF to local disk
  const datasheetDir = '.librespin/04-component-research/datasheets';
  const pdfFilename = `${component.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`;
  const pdfPath = `${datasheetDir}/${pdfFilename}`;
  const txtPath = `${datasheetDir}/${pdfFilename}.txt`;

  console.log(`[DATASHEET] Downloading to: ${pdfPath}`);

  // Create datasheets directory if doesn't exist
  await Bash({
    command: `mkdir -p "${datasheetDir}"`,
    description: 'Create datasheets directory'
  });

  // Download PDF using curl
  const downloadResult = await Bash({
    command: `curl -L -o "${pdfPath}" "${datasheetURL.url}"`,
    description: `Download ${component.name} datasheet PDF`,
    timeout: 30000  // 30 second timeout for large PDFs
  });

  if (downloadResult.exitCode !== 0) {
    console.error(`   DOWNLOAD FAILED: ${downloadResult.stderr}`);
    return {
      component: component.name,
      status: 'DOWNLOAD_FAILED',
      url: datasheetURL.url,
      verified: false,
      error: `PDF download failed: ${downloadResult.stderr}`
    };
  }

  // Verify PDF downloaded and has content
  const pdfSizeResult = await Bash({
    command: `stat -f%z "${pdfPath}" 2>/dev/null || stat -c%s "${pdfPath}" 2>/dev/null`,
    description: 'Check PDF file size'
  });

  const pdfSize = parseInt(pdfSizeResult.stdout.trim());
  if (pdfSize < 1000) {  // Less than 1KB likely indicates error page
    console.error(`   DOWNLOAD FAILED: PDF too small (${pdfSize} bytes), likely error page`);
    return {
      component: component.name,
      status: 'DOWNLOAD_FAILED',
      url: datasheetURL.url,
      verified: false,
      error: `Downloaded file too small (${pdfSize} bytes), likely not actual datasheet`
    };
  }

  console.log(`[DATASHEET] Downloaded: ${pdfSize} bytes`);

  // Step 2c: Extract text from PDF using Python pdfplumber
  console.log(`[DATASHEET] Extracting text from PDF...`);

  const extractResult = await Bash({
    command: `python3 -c "
import sys
try:
    import pdfplumber
except ImportError:
    print('ERROR: pdfplumber not installed. Install with: pip3 install pdfplumber', file=sys.stderr)
    sys.exit(1)

pdf_path = '${pdfPath}'
txt_path = '${txtPath}'

try:
    with pdfplumber.open(pdf_path) as pdf:
        text = ''
        for i, page in enumerate(pdf.pages):
            text += f'\\n--- PAGE {i+1} ---\\n'
            text += page.extract_text() or ''

        with open(txt_path, 'w', encoding='utf-8') as f:
            f.write(text)

        print(f'Extracted {len(text)} characters from {len(pdf.pages)} pages')
except Exception as e:
    print(f'ERROR: {str(e)}', file=sys.stderr)
    sys.exit(1)
"`,
    description: `Extract text from ${component.name} PDF using pdfplumber`,
    timeout: 60000  // 60 second timeout for large PDFs
  });

  if (extractResult.exitCode !== 0) {
    console.error(`   EXTRACTION FAILED: ${extractResult.stderr}`);

    // If pdfplumber not installed, provide clear instructions
    if (extractResult.stderr.includes('pdfplumber not installed')) {
      console.error(`\n   ⚠️  CRITICAL: pdfplumber not installed`);
      console.error(`      Install with: pip3 install pdfplumber`);
      console.error(`      Or use alternative: pip3 install PyPDF2`);
      throw new Error('pdfplumber required for PDF text extraction. Install with: pip3 install pdfplumber');
    }

    return {
      component: component.name,
      status: 'EXTRACTION_FAILED',
      url: datasheetURL.url,
      pdf_path: pdfPath,
      verified: false,
      error: `PDF text extraction failed: ${extractResult.stderr}`
    };
  }

  console.log(`[DATASHEET] Extraction: ${extractResult.stdout.trim()}`);

  // Step 2d: Read extracted text file
  const datasheetContent = await Read({
    file_path: txtPath
  });

  console.log(`[DATASHEET] Text file read: ${datasheetContent.split('\n').length} lines`);

  return {
    component: component.name,
    status: 'RETRIEVED',
    url: datasheetURL.url,
    pdf_path: pdfPath,
    txt_path: txtPath,
    content: datasheetContent,
    verified: false  // Not yet verified
  };
}

// Retrieve all datasheets in parallel (with rate limiting)
const datasheetPromises = requiredDatasheets.map(comp => retrieveAndParseDatasheet(comp));
const retrievedDatasheets = await Promise.all(datasheetPromises);

// Separate into retrieved vs not found
const successfulRetrievals = retrievedDatasheets.filter(d => d.status === 'RETRIEVED');
const failedRetrievals = retrievedDatasheets.filter(d => d.status === 'NOT_FOUND');

console.log(`\n[DATASHEET] Retrieved: ${successfulRetrievals.length}/${requiredDatasheets.length}`);
if (failedRetrievals.length > 0) {
  console.error(`\n⚠️  CRITICAL: ${failedRetrievals.length} datasheets NOT FOUND:`);
  failedRetrievals.forEach(d => console.error(`   - ${d.component}`));
  console.error(`\n   ACTION: User must manually obtain datasheets for above components.`);
  console.error(`   WORKFLOW: HALT until all datasheets retrieved.`);
  throw new Error(`Cannot proceed without datasheets for: ${failedRetrievals.map(d => d.component).join(', ')}`);
}
```

---

#### Step 3: Datasheet Reading and Specification Extraction

For each retrieved datasheet, extract critical specifications:

```javascript
function extractCriticalSpecifications(datasheet, componentType) {
  const specs = {
    component: datasheet.component,
    datasheet_url: datasheet.url,
    extracted_specs: {},
    extraction_confidence: 0,
    warnings: []
  };

  // Type-specific extraction
  switch(componentType) {
    case 'bridge_ic':
      // SPI Mode support (CRITICAL)
      const spiModeMatch = datasheet.content.match(/SPI.*(Mode|CPOL|CPHA)/gi);
      if (spiModeMatch) {
        specs.extracted_specs.spi_modes = spiModeMatch;
        specs.extracted_specs.spi_mode_1_supported = datasheet.content.match(/Mode 1|CPOL=0.*CPHA=1/i) ? 'YES' : 'VERIFY';
      } else {
        specs.warnings.push('SPI mode information not found in extracted content');
      }

      // GPIO count
      const gpioMatch = datasheet.content.match(/(\d+).*GPIO/i);
      if (gpioMatch) {
        specs.extracted_specs.gpio_count = parseInt(gpioMatch[1]);
      }

      // Max SPI speed
      const speedMatch = datasheet.content.match(/(\d+)\s*(MHz|Mbps).*SPI/i);
      if (speedMatch) {
        specs.extracted_specs.max_spi_speed = `${speedMatch[1]} ${speedMatch[2]}`;
      }
      break;

    case 'uart_device':
    case 'onboard_device':
      // Supply voltage (CRITICAL)
      const voltageMatch = datasheet.content.match(/Supply Voltage.*?(\d+\.?\d*)\s*V/i);
      if (voltageMatch) {
        specs.extracted_specs.supply_voltage = `${voltageMatch[1]}V`;
      } else {
        specs.warnings.push('CRITICAL: Supply voltage not found');
      }

      // Supply current (CRITICAL)
      const currentMatch = datasheet.content.match(/Supply Current.*?(\d+\.?\d*)\s*(mA|A)/i);
      if (currentMatch) {
        specs.extracted_specs.supply_current = `${currentMatch[1]} ${currentMatch[2]}`;
      } else {
        specs.warnings.push('CRITICAL: Supply current not found');
      }

      // Output power (for power calculation sanity check)
      const powerMatch = datasheet.content.match(/Output Power.*?(\d+\.?\d*)\s*W/i);
      if (powerMatch) {
        specs.extracted_specs.output_power = `${powerMatch[1]}W`;
      }
      break;

    case 'power_ic':
      // Input voltage range
      const vinMatch = datasheet.content.match(/Input Voltage.*?(\d+\.?\d*)\s*-\s*(\d+\.?\d*)\s*V/i);
      if (vinMatch) {
        specs.extracted_specs.input_voltage_range = `${vinMatch[1]}-${vinMatch[2]}V`;
      }

      // Output current
      const ioutMatch = datasheet.content.match(/Output Current.*?(\d+\.?\d*)\s*(mA|A)/i);
      if (ioutMatch) {
        specs.extracted_specs.output_current = `${ioutMatch[1]} ${ioutMatch[2]}`;
      }

      // Efficiency
      const effMatch = datasheet.content.match(/Efficiency.*?(\d+)%/i);
      if (effMatch) {
        specs.extracted_specs.efficiency = `${effMatch[1]}%`;
      }
      break;
  }

  // Calculate extraction confidence (0-100%)
  const expectedFields = {
    'bridge_ic': ['spi_modes', 'gpio_count', 'max_spi_speed'],
    'uart_device': ['supply_voltage', 'supply_current'],
    'power_ic': ['input_voltage_range', 'output_current']
  };

  const expected = expectedFields[componentType] || [];
  const extracted = Object.keys(specs.extracted_specs);
  specs.extraction_confidence = (extracted.length / expected.length) * 100;

  if (specs.extraction_confidence < 80) {
    specs.warnings.push(`LOW EXTRACTION CONFIDENCE: ${specs.extraction_confidence}% (expected ${expected.length} fields, found ${extracted.length})`);
  }

  return specs;
}

const extractedSpecs = successfulRetrievals.map(ds => {
  const componentType = requiredDatasheets.find(c => c.name === ds.component)?.type;
  return extractCriticalSpecifications(ds, componentType);
});

console.log(`\n[SPECS] Extracted specifications from ${extractedSpecs.length} datasheets.`);
```

---

#### Step 4: Sanity Check Electrical Specifications

Before verification, perform physics-based sanity checks:

```javascript
function sanityCheckElectricalSpecs(specs) {
  const failures = [];

  // For onboard devices with output power: verify supply current makes sense
  if (specs.extracted_specs.output_power && specs.extracted_specs.supply_current) {
    const outputPower = parseFloat(specs.extracted_specs.output_power);
    const supplyCurrent = parseFloat(specs.extracted_specs.supply_current);
    const supplyVoltage = parseFloat(specs.extracted_specs.supply_voltage);

    // Minimum supply current = output power / supply voltage / efficiency (assume 85%)
    const minSupplyCurrent = (outputPower / supplyVoltage / 0.85) * 1000; // in mA

    if (supplyCurrent < minSupplyCurrent * 0.5) {  // Allow 50% margin for error
      failures.push({
        component: specs.component,
        check: 'supply_current_vs_output_power',
        issue: `Supply current ${supplyCurrent}mA too low for ${outputPower}W output`,
        calculation: `Minimum: ${outputPower}W / ${supplyVoltage}V / 0.85 = ${minSupplyCurrent.toFixed(0)}mA`,
        severity: 'CRITICAL'
      });
    }
  }

  // For power ICs: verify input voltage range includes source voltage
  if (specs.extracted_specs.input_voltage_range) {
    const sourceVoltage = 24; // From requirements (24V DC input)
    const vinRange = specs.extracted_specs.input_voltage_range.match(/(\d+)-(\d+)V/);
    if (vinRange) {
      const vinMin = parseFloat(vinRange[1]);
      const vinMax = parseFloat(vinRange[2]);

      if (sourceVoltage < vinMin || sourceVoltage > vinMax) {
        failures.push({
          component: specs.component,
          check: 'input_voltage_compatibility',
          issue: `Source voltage ${sourceVoltage}V outside IC range ${vinMin}-${vinMax}V`,
          severity: 'CRITICAL'
        });
      }
    }
  }

  return failures;
}

const sanityCheckFailures = extractedSpecs.flatMap(spec => sanityCheckElectricalSpecs(spec));

if (sanityCheckFailures.length > 0) {
  console.error(`\n⚠️  SANITY CHECK FAILURES: ${sanityCheckFailures.length} issues detected`);
  sanityCheckFailures.forEach(failure => {
    console.error(`   [${failure.severity}] ${failure.component}: ${failure.issue}`);
    if (failure.calculation) console.error(`      Calculation: ${failure.calculation}`);
  });

  // CRITICAL failures halt workflow
  const criticalFailures = sanityCheckFailures.filter(f => f.severity === 'CRITICAL');
  if (criticalFailures.length > 0) {
    throw new Error(`CRITICAL sanity check failures detected. Cannot proceed with invalid specifications.`);
  }
}
```

---

#### Step 5: Spawn Verifier Agent

For each datasheet, spawn a specialized verifier agent to confirm understanding:

```javascript
async function verifyDatasheetUnderstanding(datasheetSpecs) {
  console.log(`\n[VERIFY] Spawning verifier agent for: ${datasheetSpecs.component}`);

  const verifierPrompt = `You are a datasheet verification agent. Your task is to verify the extracted specifications for ${datasheetSpecs.component} are correct and complete.

DATASHEET URL: ${datasheetSpecs.datasheet_url}
EXTRACTED SPECIFICATIONS:
${JSON.stringify(datasheetSpecs.extracted_specs, null, 2)}

EXTRACTION WARNINGS:
${datasheetSpecs.warnings.join('\n')}

VERIFICATION TASKS:
1. Access the datasheet at the URL above
2. Locate the "Absolute Maximum Ratings" and "Electrical Characteristics" tables
3. Verify each extracted specification matches the datasheet
4. Identify any missing CRITICAL specifications
5. Flag any discrepancies between extracted values and datasheet

CRITICAL SPECIFICATIONS (must verify):
- Supply voltage (exact value with min/typ/max)
- Supply current (typ and max values)
- Operating temperature range
- Key functional parameters (SPI modes for bridge ICs, output current for power ICs)

OUTPUT FORMAT:
{
  "component": "${datasheetSpecs.component}",
  "verified": true/false,
  "verification_confidence": 0-100,
  "discrepancies": [
    {"field": "...", "extracted": "...", "datasheet": "...", "severity": "CRITICAL/HIGH/LOW"}
  ],
  "missing_critical_specs": ["...", "..."],
  "datasheet_section_references": {
    "supply_voltage": "Table 1, page 5",
    "supply_current": "Table 2, page 6"
  }
}`;

  const verifierAgent = await Agent({
    subagent_type: 'general-purpose',
    description: `Verify ${datasheetSpecs.component} datasheet specs`,
    prompt: verifierPrompt
  });

  return JSON.parse(verifierAgent.output);
}

// Verify all datasheets sequentially (to avoid rate limits)
const verificationResults = [];
for (const specs of extractedSpecs) {
  const verification = await verifyDatasheetUnderstanding(specs);
  verificationResults.push(verification);

  if (!verification.verified) {
    console.error(`\n❌ VERIFICATION FAILED: ${specs.component}`);
    console.error(`   Confidence: ${verification.verification_confidence}%`);
    if (verification.discrepancies.length > 0) {
      console.error(`   Discrepancies:`);
      verification.discrepancies.forEach(d => {
        console.error(`      - ${d.field}: Extracted "${d.extracted}" vs Datasheet "${d.datasheet}" (${d.severity})`);
      });
    }
  } else {
    console.log(`✅ VERIFIED: ${specs.component} (${verification.verification_confidence}% confidence)`);
  }
}

// Check for verification failures
const failedVerifications = verificationResults.filter(v => !v.verified || v.verification_confidence < 80);
if (failedVerifications.length > 0) {
  console.error(`\n⚠️  ${failedVerifications.length} components failed verification:`);
  failedVerifications.forEach(v => console.error(`   - ${v.component} (${v.verification_confidence}% confidence)`));
  throw new Error(`Datasheet verification failed for ${failedVerifications.length} components. Cannot proceed.`);
}
```

---

#### Step 6: Document Verified Specifications

Create verification matrix documenting ground truth:

```javascript
function generateVerificationMatrix(verificationResults, extractedSpecs) {
  let matrix = `# Datasheet Verification Matrix\n\n`;
  matrix += `**Generated:** ${new Date().toISOString()}\n`;
  matrix += `**Components Verified:** ${verificationResults.length}\n\n`;
  matrix += `---\n\n`;

  verificationResults.forEach((verification, idx) => {
    const specs = extractedSpecs[idx];

    matrix += `## ${verification.component}\n\n`;
    matrix += `**Datasheet:** [${verification.component} Datasheet](${specs.datasheet_url})\n`;
    matrix += `**Verification Confidence:** ${verification.verification_confidence}%\n`;
    matrix += `**Status:** ${verification.verified ? '✅ VERIFIED' : '❌ FAILED'}\n\n`;

    matrix += `### Verified Specifications\n\n`;
    matrix += `| Specification | Value | Datasheet Reference |\n`;
    matrix += `|---------------|-------|---------------------|\n`;

    Object.entries(specs.extracted_specs).forEach(([key, value]) => {
      const reference = verification.datasheet_section_references?.[key] || 'See datasheet';
      matrix += `| ${key.replace(/_/g, ' ')} | ${value} | ${reference} |\n`;
    });

    if (verification.discrepancies && verification.discrepancies.length > 0) {
      matrix += `\n### ⚠️ Discrepancies Found\n\n`;
      verification.discrepancies.forEach(d => {
        matrix += `- **${d.field}:** Extracted "${d.extracted}" vs Datasheet "${d.datasheet}" (${d.severity})\n`;
      });
    }

    if (verification.missing_critical_specs && verification.missing_critical_specs.length > 0) {
      matrix += `\n### ⚠️ Missing Critical Specifications\n\n`;
      verification.missing_critical_specs.forEach(spec => {
        matrix += `- ${spec}\n`;
      });
    }

    matrix += `\n---\n\n`;
  });

  return matrix;
}

const verificationMatrix = generateVerificationMatrix(verificationResults, extractedSpecs);

// Write verification matrix to file
fs.writeFileSync(
  '.librespin/04-component-research/datasheet-verification-matrix.md',
  verificationMatrix
);

console.log(`\n✅ DATASHEET VERIFICATION COMPLETE`);
console.log(`   Verified: ${verificationResults.length} components`);
console.log(`   Matrix: .librespin/04-component-research/datasheet-verification-matrix.md`);
console.log(`\n   GROUND TRUTH ESTABLISHED. Proceeding to component selection...\n`);
```

---

### FUNCTIONAL BLOCK EXTRACTION

For each validated concept, extract component categories from block diagram:

```javascript
function extractFunctionalBlocks(conceptContent) {
  const blocks = {
    active: [],      // MCUs, wireless modules, sensor ICs, power ICs - require MPN
    commodity: []    // Resistors, capacitors, connectors - generic spec only
  };

  // Parse block diagram section
  const diagramMatch = conceptContent.match(/## Block Diagram[\s\S]*?```[\s\S]*?```/);
  const diagram = diagramMatch ? diagramMatch[0] : '';

  // Active component detection patterns
  const activePatterns = [
    { pattern: /MCU|Microcontroller|Cortex/i, category: 'MCU' },
    { pattern: /BLE|Bluetooth|Wireless|LoRa|WiFi|Zigbee|Cellular/i, category: 'Wireless' },
    { pattern: /Sensor|IMU|Accelerometer|Gyro|Temp|Humidity|Pressure/i, category: 'Sensor' },
    { pattern: /Buck|Boost|LDO|PMIC|Regulator|Power IC/i, category: 'Power IC' },
    { pattern: /Motor Driver|Gate Driver|H-Bridge/i, category: 'Motor Driver' },
    { pattern: /ADC|DAC|Op-Amp|Comparator/i, category: 'Analog IC' },
    { pattern: /Flash|EEPROM|FRAM|Memory/i, category: 'Memory' }
  ];

  // Commodity component detection patterns
  const commodityPatterns = [
    { pattern: /Resistor|(\d+[kK]?Ω)|(\d+R)/i, category: 'Resistor' },
    { pattern: /Capacitor|(\d+[nupμ]F)/i, category: 'Capacitor' },
    { pattern: /Inductor|(\d+[nupμ]H)/i, category: 'Inductor' },
    { pattern: /LED|Status LED/i, category: 'LED' },
    { pattern: /Connector|JST|Header|USB/i, category: 'Connector' },
    { pattern: /Crystal|Oscillator/i, category: 'Crystal' }
  ];

  // Extract active components
  activePatterns.forEach(({ pattern, category }) => {
    if (pattern.test(conceptContent)) {
      if (!blocks.active.includes(category)) {
        blocks.active.push(category);
      }
    }
  });

  // Extract commodity components
  commodityPatterns.forEach(({ pattern, category }) => {
    if (pattern.test(conceptContent)) {
      if (!blocks.commodity.includes(category)) {
        blocks.commodity.push(category);
      }
    }
  });

  return blocks;
}
```

### DIGIKEY PARAMETRIC SEARCH WORKFLOW

Use DigiKey parametric search as primary tool for non-commodity active components.

**Step 1: Navigate to Component Category**
```
DigiKey > Products > [Category] > [Subcategory]
Example: Integrated Circuits > Embedded - Microcontrollers
```

**Step 2: Apply Filters from Requirements**
```javascript
// Parametric search pattern (manual via web interface)
const searchParams = {
  category: "Microcontrollers",
  filters: {
    "Core Processor": requirements.mcu_core,           // e.g., "ARM Cortex-M4"
    "Program Memory Size": `>= ${requirements.flash}`, // e.g., ">= 256KB"
    "RAM Size": `>= ${requirements.ram}`,              // e.g., ">= 64KB"
    "Speed": `>= ${requirements.mhz}`,                 // e.g., ">= 100MHz"
    "Operating Temperature": requirements.tempRange,   // e.g., "-40°C ~ 85°C"
    "Supplier Device Package": requirements.package    // e.g., "LQFP-64"
  }
};
```

**Step 3: Filter by Availability**
```javascript
const availabilityFilters = {
  "Stock Status": "In Stock",           // OR "Normally Stocking"
  "Lifecycle Status": "Active"          // CRITICAL: avoid NRND
};

// Additional availability criteria
const availabilityCriteria = {
  leadTimeWeeks: 8,       // Max acceptable lead time
  stockQuantity: 100      // Min acceptable stock
};
```

**Step 4: Sort by Price or Quantity**
```
Sort by: Price (ascending) for cost optimization
     OR: Quantity Available (descending) for availability
```

**Step 5: Extract Top 5-10 Candidates**
```javascript
// Extract key fields from search results
const candidateFields = [
  'Manufacturer Part Number',
  'Manufacturer',
  'Description',
  'Unit Price (USD)',
  'Quantity Available',
  'Lead Time',
  'Lifecycle Status',
  'Datasheet URL'
];
```

### BALANCED SCORECARD EVALUATION

Score candidate parts using weighted criteria (per CONTEXT.md decisions):

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

**Implementation:**

```javascript
function evaluateComponent(part, requirements) {
  // Weights from CONTEXT.md decisions
  const weights = {
    cost: 0.35,
    availability: 0.30,
    features: 0.25,
    vendor: 0.10
  };

  // Score each dimension (1-5 scale)
  const scores = {
    cost: scoreCost(part.unitPrice),
    availability: scoreAvailability(part.stock, part.leadTimeWeeks),
    features: scoreFeatures(part.specs, requirements),
    vendor: scoreVendor(part.manufacturer)
  };

  // Calculate weighted total
  const totalScore =
    (scores.cost * weights.cost) +
    (scores.availability * weights.availability) +
    (scores.features * weights.features) +
    (scores.vendor * weights.vendor);

  return {
    partNumber: part.mpn,
    manufacturer: part.manufacturer,
    totalScore: Math.round(totalScore * 100) / 100, // e.g., 3.85
    breakdown: scores,
    recommendation: totalScore >= 3.5 ? 'recommended' : 'acceptable'
  };
}

function scoreCost(unitPrice) {
  if (unitPrice < 1) return 5;
  if (unitPrice < 5) return 4;
  if (unitPrice < 15) return 3;
  if (unitPrice < 30) return 2;
  return 1;
}

function scoreAvailability(stock, leadTimeWeeks) {
  if (stock > 1000 && leadTimeWeeks <= 2) return 5;
  if (stock > 100 && leadTimeWeeks <= 4) return 4;
  if (stock > 50 && leadTimeWeeks <= 6) return 3;
  if (stock > 10 && leadTimeWeeks <= 8) return 2;
  return 1;
}

function scoreVendor(manufacturer) {
  const tier1 = ['Texas Instruments', 'STMicroelectronics', 'Analog Devices', 'Nordic Semiconductor'];
  const tier2 = ['Microchip', 'NXP', 'Infineon', 'ON Semiconductor', 'Renesas'];

  if (tier1.includes(manufacturer)) return 5;
  if (tier2.includes(manufacturer)) return 4;
  return 3; // Unknown but authorized distributor stock
}

function scoreFeatures(partSpecs, requirements) {
  // Compare part specs against requirements
  // Return 5 if exceeds all, 4 if meets all + some exceed, 3 if meets all, etc.
  let score = 3; // Base: meets requirements

  // Increment for exceeds
  if (partSpecs.flash > requirements.flash * 1.5) score += 0.5;
  if (partSpecs.ram > requirements.ram * 1.5) score += 0.5;
  if (partSpecs.speed > requirements.speed * 1.2) score += 0.5;

  // Decrement for gaps
  if (partSpecs.flash < requirements.flash) score -= 1;
  if (partSpecs.ram < requirements.ram) score -= 1;
  if (partSpecs.speed < requirements.speed) score -= 1;

  return Math.max(1, Math.min(5, Math.round(score)));
}
```

**Selection Process:**

```javascript
function selectBestPart(candidates, requirements) {
  // Score all candidates
  const scored = candidates.map(part => evaluateComponent(part, requirements));

  // Sort by total score descending
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // Select highest scoring part as primary
  const primary = scored[0];

  console.log(`Selected: ${primary.partNumber} (${primary.manufacturer})`);
  console.log(`  Score: ${primary.totalScore}/5.0`);
  console.log(`  Breakdown: Cost=${primary.breakdown.cost}, Avail=${primary.breakdown.availability}, Features=${primary.breakdown.features}, Vendor=${primary.breakdown.vendor}`);

  return primary;
}
```

### FALLBACK STRATEGY

If DigiKey has no results, fall back to alternate sources:

```javascript
async function searchComponentWithFallback(category, requirements) {
  // 1. Try DigiKey first (primary)
  let candidates = await searchDigiKey(category, requirements);

  if (candidates.length > 0) {
    console.log(`DigiKey: Found ${candidates.length} candidates for ${category}`);
    return { source: 'DigiKey', candidates };
  }

  // 2. Try Mouser (secondary)
  console.log(`DigiKey: No results for ${category}. Trying Mouser...`);
  candidates = await searchMouser(category, requirements);

  if (candidates.length > 0) {
    console.log(`Mouser: Found ${candidates.length} candidates for ${category}`);
    return { source: 'Mouser', candidates };
  }

  // 3. Try Arrow/Newark/Avnet (tertiary)
  console.log(`Mouser: No results for ${category}. Trying Arrow/Newark...`);
  candidates = await searchArrowNewark(category, requirements);

  if (candidates.length > 0) {
    console.log(`Arrow/Newark: Found ${candidates.length} candidates for ${category}`);
    return { source: 'Arrow/Newark', candidates };
  }

  // 4. Web research (last resort)
  console.log(`No distributor results for ${category}. Performing web research...`);
  const webResults = await webSearchComponent(category, requirements);

  if (webResults.length > 0) {
    return { source: 'WebSearch', candidates: webResults };
  }

  // 5. Flag if no viable part found
  console.warn(`WARNING: No viable part found for ${category}`);
  return {
    source: 'NONE',
    candidates: [],
    flag: `No viable ${category} found. Consider requirement relaxation or manual search.`
  };
}
```

**Distributor Priority (per CONTEXT.md):**
1. DigiKey (primary - largest parametric database)
2. Mouser (secondary - major authorized distributor)
3. Arrow/Newark/Avnet (tertiary - authorized alternatives)

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

**Verification Sources (all trusted per CONTEXT.md):**
1. Manufacturer PCN/PDN notices (product change/discontinuation)
2. Distributor lifecycle flags (DigiKey/Mouser status field)
3. Vendor product pages (manufacturer's official site)
4. Octopart aggregated data (cross-references multiple sources)

**Implementation:**

```javascript
function verifyLifecycleStatus(partInfo) {
  const status = partInfo.lifecycleStatus?.toLowerCase() || 'unknown';

  const statusMap = {
    'active': { pass: true, note: 'Part is in full production' },
    'production': { pass: true, note: 'Part is in full production' },
    'introduction': { pass: true, note: 'New product, limited field data' },
    'nrnd': { pass: false, note: 'Not Recommended for New Design - REJECT' },
    'not recommended for new design': { pass: false, note: 'NRND - REJECT' },
    'last time buy': { pass: false, note: 'Final purchase window - REJECT for new design' },
    'ltb': { pass: false, note: 'Last Time Buy - REJECT' },
    'obsolete': { pass: false, note: 'Discontinued - REJECT' },
    'eol': { pass: false, note: 'End of Life - REJECT' },
    'unknown': { pass: null, note: 'Status not confirmed - flag for verification' }
  };

  const result = statusMap[status] || statusMap['unknown'];

  return {
    status: status,
    acceptable: result.pass,
    note: result.note,
    action: result.pass === false ? 'find_alternative' :
            result.pass === null ? 'flag_as_unverified' : 'proceed'
  };
}
```

**Handling Conflicting Status:**

When sources disagree, flag for user decision:

```javascript
function checkConflictingStatus(digikeyStatus, manufacturerStatus) {
  if (digikeyStatus !== manufacturerStatus) {
    return {
      conflict: true,
      digikeyStatus,
      manufacturerStatus,
      message: `DigiKey says ${digikeyStatus}, manufacturer says ${manufacturerStatus}. Proceed?`,
      action: 'flag_for_user_decision'
    };
  }

  return { conflict: false };
}
```

**Missing Lifecycle Data:**

If lifecycle status is unavailable, flag as unverified (per CONTEXT.md):

```markdown
**Lifecycle Status:** Unverified (status not confirmed from distributor or manufacturer)
**Action:** Proceed with caution, manual verification recommended
```

### HARD-TO-SOURCE THRESHOLD DETECTION

Identify parts that need alternates based on sourcing risk.

**Thresholds (per CONTEXT.md):**

| Criterion | Threshold | Trigger |
|-----------|-----------|---------|
| Lead Time | >8 weeks | Requires alternate |
| Stock Quantity | <100 units | Requires alternate |
| Price Spike | >50% vs historical | Requires alternate |

**Implementation:**

```javascript
function checkHardToSource(part) {
  const thresholds = {
    leadTimeWeeks: 8,
    stockQuantity: 100,
    priceSpikePct: 50
  };

  const issues = [];

  // Lead time check
  if (part.leadTimeWeeks > thresholds.leadTimeWeeks) {
    issues.push({
      criterion: 'lead_time',
      value: part.leadTimeWeeks,
      threshold: thresholds.leadTimeWeeks,
      message: `Lead time ${part.leadTimeWeeks} weeks exceeds ${thresholds.leadTimeWeeks} week threshold`
    });
  }

  // Stock quantity check
  if (part.stockQuantity < thresholds.stockQuantity) {
    issues.push({
      criterion: 'stock',
      value: part.stockQuantity,
      threshold: thresholds.stockQuantity,
      message: `Stock ${part.stockQuantity} units below ${thresholds.stockQuantity} unit threshold`
    });
  }

  // Price spike check (if historical data available)
  if (part.priceSpikePct && part.priceSpikePct > thresholds.priceSpikePct) {
    issues.push({
      criterion: 'price_spike',
      value: part.priceSpikePct,
      threshold: thresholds.priceSpikePct,
      message: `Price spike ${part.priceSpikePct}% exceeds ${thresholds.priceSpikePct}% threshold`
    });
  }

  return {
    isHardToSource: issues.length > 0,
    issues: issues,
    action: issues.length > 0 ? 'provide_alternates' : 'proceed'
  };
}
```

**Alternate Selection:**

When part is hard-to-source, provide 1-2 alternates meeting same specs:

```javascript
async function findAlternates(primaryPart, requirements) {
  // Use DigiKey Cross Reference tool
  const alternates = await searchSimilarParts(primaryPart.mpn);

  // Filter to active lifecycle, in-stock parts
  const viable = alternates.filter(alt =>
    verifyLifecycleStatus(alt).acceptable &&
    alt.stockQuantity >= 100 &&
    alt.leadTimeWeeks <= 8
  );

  // Return top 1-2 alternates
  return viable.slice(0, 2);
}
```

**Alternate Documentation Format:**

Document alternates inline with primary part:

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

**Implementation:**

```javascript
function formatCommodityPart(component) {
  switch (component.type) {
    case 'resistor':
      return `${component.value} ${component.package} ${component.tolerance}`;
    case 'capacitor':
      return `${component.value} ${component.package} ${component.voltage} ${component.dielectric}`;
    case 'inductor':
      return `${component.value} ${component.package} ${component.current}A`;
    case 'led':
      return `${component.color} ${component.package} ${component.vf}V`;
    case 'connector':
      return `${component.type} ${component.pitch}mm ${component.pins}P`;
    default:
      return component.description;
  }
}
```

### BOM DOCUMENTATION FORMAT

Standard fields and format for Bill of Materials documentation.

**Required Fields (per CONTEXT.md):**
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
- **Unit Price:** 1-10 qty pricing from DigiKey/Mouser
- **Stock:** Quantity in stock (or "-" for generic)
- **Lead Time:** Factory lead time if not in stock (or "-" for generic)
- **Datasheet:** URL to official datasheet (or "-" for generic)

**BOM Entry Generation:**

```javascript
function generateBOMEntry(part, refDes, quantity, isCommodity = false) {
  if (isCommodity) {
    // Generic specification for commodity parts
    return {
      ref: refDes,
      category: part.category,
      mpn: 'Generic',
      manufacturer: '-',
      description: part.genericSpec, // e.g., "10k 0603 1%"
      qty: quantity,
      unitPrice: part.estimatedPrice || '$0.01',
      stock: '-',
      leadTime: '-',
      datasheet: '-'
    };
  }

  // Full specification for active parts
  return {
    ref: refDes,
    category: part.category,
    mpn: part.mpn,
    manufacturer: part.manufacturer,
    description: part.description,
    qty: quantity,
    unitPrice: `$${part.unitPrice.toFixed(2)}`,
    stock: part.stockQuantity,
    leadTime: part.leadTimeWeeks ? `${part.leadTimeWeeks} wk` : 'In Stock',
    datasheet: part.datasheetUrl ? `[Link](${part.datasheetUrl})` : '-'
  };
}
```

**BOM Table Formatting:**

```javascript
function formatBOMTable(entries) {
  let markdown = '| Ref | Category | MPN | Manufacturer | Description | Qty | Unit Price | Stock | Lead Time | Datasheet |\n';
  markdown += '|-----|----------|-----|--------------|-------------|-----|------------|-------|-----------|----------|\n';

  entries.forEach(entry => {
    markdown += `| ${entry.ref} | ${entry.category} | ${entry.mpn} | ${entry.manufacturer} | ${entry.description} | ${entry.qty} | ${entry.unitPrice} | ${entry.stock} | ${entry.leadTime} | ${entry.datasheet} |\n`;
  });

  return markdown;
}
```

**Total BOM Cost Calculation:**

```javascript
function calculateTotalBOMCost(entries) {
  const total = entries
    .filter(e => e.unitPrice !== '-')
    .reduce((sum, entry) => {
      const price = parseFloat(entry.unitPrice.replace('$', ''));
      return sum + (price * entry.qty);
    }, 0);

  return `$${total.toFixed(2)}`;
}
```

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

**No validated concepts:**
```javascript
if (validatedConcepts.length === 0) {
  console.error(`ERROR: No validated concepts found (>=${threshold}% confidence).`);
  console.error(`Run Phase 1 first, or lower confidence_threshold in librespin-concept-config.yaml.`);
  process.exit(1);
}
```

**Part not found:**
```javascript
if (searchResult.source === 'NONE') {
  console.warn(`WARNING: No viable part found for ${category}`);
  console.warn(`Flagging uncertainty. Consider:`);
  console.warn(`  1. Relaxing requirements for this component`);
  console.warn(`  2. Manual search on manufacturer websites`);
  console.warn(`  3. Consulting with design engineer`);

  // Flag in BOM output
  bomEntry.note = 'UNVERIFIED: No viable part found, manual search required';
}
```

**All parts NRND/obsolete for category:**
```javascript
if (candidates.every(c => !verifyLifecycleStatus(c).acceptable)) {
  console.error(`CRITICAL: All ${candidates.length} candidates for ${category} are NRND or obsolete.`);
  console.error(`No active parts meet requirements. Consider:`);
  console.error(`  1. Relaxing requirements (different package, lower specs)`);
  console.error(`  2. Alternative architecture approach`);
  console.error(`  3. Custom design or module substitution`);

  // Flag critical issue in output
  return {
    critical: true,
    message: `No active parts available for ${category}`,
    suggestion: 'Requirement relaxation needed'
  };
}
```

### COMPLETION SUMMARY

After all concepts processed:

```javascript
console.log(`\nPhase 4 (Component Research) complete.`);
console.log(`Processed: ${validatedConcepts.length} validated concepts`);
console.log(`\nBOM files created:`);
validatedConcepts.forEach(concept => {
  const conceptSlug = concept.name.toLowerCase().replace(/\s+/g, '-');
  const bomPath = `.librespin/04-bom/bom-${conceptSlug}.md`;
  console.log(`  - ${bomPath}`);
});

// Report total costs
console.log(`\nEstimated BOM costs:`);
validatedConcepts.forEach(concept => {
  console.log(`  - ${concept.name}: ${concept.bomCost}`);
});

// Report any issues
if (hardToSourceParts.length > 0) {
  console.log(`\n${hardToSourceParts.length} hard-to-source parts flagged (alternates provided)`);
}

if (unverifiedParts.length > 0) {
  console.log(`\n${unverifiedParts.length} parts have unverified lifecycle status`);
}

console.log(`\nNext: Run Phase 1 (Concept Generation) to finalize concept documentation.`);
```

**Update state file** `.librespin/state.md` — set `phase` to `4-component-research`:

```javascript
const existingState = fs.readFileSync('.librespin/state.md', 'utf8');
const updatedState = existingState.replace(/^phase: .+$/m, `phase: '4-component-research'`);
fs.writeFileSync('.librespin/state.md', updatedState);
```

### DISTRIBUTOR ENRICHMENT (Phase 4 — additive, after MPN selection)

After BOM files are written to `.librespin/04-bom/`, enrich each selected component with real-time inventory and pricing from configured distributor APIs.

**Trigger condition:** Only runs if `~/.librespin/credentials` exists. If absent, skip enrichment silently and continue. This preserves existing Phase 4 behavior for users without API keys (D-13).

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
    # Check free tier quota
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
          # Increment parts_used
          NEXAR_PARTS_USED=$((NEXAR_PARTS_USED + 1))
          write_credential nexar parts_used "$NEXAR_PARTS_USED"
          # Warn at 80 parts used
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
        # 9-minute window (599s - 60s buffer)
        local DK_NEW_EXPIRY
        DK_NEW_EXPIRY=$(date -u -d "+9 minutes" +%Y-%m-%dT%H:%M:%SZ)
        write_credential digikey access_token "$DK_TOKEN"
        write_credential digikey token_expires "$DK_NEW_EXPIRY"
      else
        echo "[DigiKey] Token refresh failed — skipping"
      fi
    fi

    if [ -n "$DK_TOKEN" ]; then
      local DK_RESULT DK_STOCK DK_PRICE DK_LIFECYCLE
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
    local ARROW_RESULT
    ARROW_RESULT=$(curl -s "https://api.arrow.com/itemservice/v4/en/search?term=$MPN&login=$ARROW_LOGIN&apikey=$ARROW_KEY")
    local ARROW_STOCK
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
  5. Continue regardless of enrichment success/failure (D-17)
```

**Do NOT wait until after all BOM files are written.** Enrichment data must be available during scoring so the best-stocked, correctly-priced part wins.

**Fallback behavior (D-13):** If credentials file does not exist or `API_MODE=false`, enrichment is skipped and web estimates are used with `est.` prefix. No errors are raised.

**Output contract preservation (D-14):** Enrichment data is appended to `.librespin/04-bom/` files only. The output contract for downstream phases (CalcPad reads `.librespin/07-final-output/`, NGSpice reads `.librespin/08-calculations/`) is unaffected.

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

```javascript
const config = yaml.load(fs.readFileSync('.librespin/config.yaml', 'utf8'));
const confidenceThreshold = config.confidence_threshold || 80;
```

### INPUT LOADING

**1. Load validated concepts from Phase 1:**

Read `.librespin/03-validation/validation-summary.md` to identify which concepts passed validation (confidence ≥ threshold or user-approved).

```javascript
// Extract validated concepts from Phase 1 validation-summary.md
// Parse the "Validated Concepts" section to get concept names
const validationSummaryPath = '.librespin/03-validation/validation-summary.md';
const validationSummary = fs.readFileSync(validationSummaryPath, 'utf-8');

// Extract concept names from validated concepts table (status: passed or approved)
const validatedConcepts = [];  // Array of concept name strings
const conceptTableMatch = validationSummary.match(/## Validated Concepts[\s\S]*?\n\n/);
if (conceptTableMatch) {
  const lines = conceptTableMatch[0].split('\n').filter(l => l.startsWith('|') && !l.includes('---'));
  for (const line of lines.slice(1)) {  // Skip header
    const cols = line.split('|').map(c => c.trim()).filter(c => c);
    if (cols.length >= 2 && (cols[1] === 'passed' || cols[1] === 'approved')) {
      validatedConcepts.push(cols[0]);  // Concept name
    }
  }
}

// For each validated concept, check if BOM exists (using slugified name)
for (const conceptName of validatedConcepts) {
  const conceptSlug = conceptName.toLowerCase().replace(/\s+/g, '-');
  const bomPath = `.librespin/04-bom/bom-${conceptSlug}.md`;
  if (!fs.existsSync(bomPath)) {
    console.error(`ERROR: Missing BOM file for concept "${conceptName}": ${bomPath}`);
    console.error('Run Phase 2 (Component Research) first.');
    process.exit(1);
  }
}
```

**2. Load requirements from Phase 1:**

```javascript
const requirementsPath = '.librespin/01-requirements/requirements.yaml';
if (!fs.existsSync(requirementsPath)) {
  console.error('ERROR: Requirements file not found:', requirementsPath);
  console.error('Run Phase 1 (Requirements Gathering) first.');
  process.exit(1);
}

const requirements = yaml.load(fs.readFileSync(requirementsPath, 'utf8'), {
  schema: yaml.FAILSAFE_SCHEMA
});

// Extract requirements with priority categorization
const reqsList = [];
for (const [category, items] of Object.entries(requirements)) {
  if (category === 'schema_version' || category === 'success_criteria') continue;

  // Determine priority based on category name or metadata
  let priority = 'Important';  // Default
  if (category.toLowerCase().includes('critical') || category === 'application') {
    priority = 'Critical';
  } else if (category.toLowerCase().includes('nice') || category === 'compliance') {
    priority = 'Nice-to-have';
  }

  for (const [reqId, reqText] of Object.entries(items)) {
    reqsList.push({
      id: reqId,
      description: reqText,
      priority: priority,
      category: category
    });
  }
}

console.log(`Loaded ${reqsList.length} requirements from Phase 1`);
```

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

```javascript
function generateBlockDiagram(conceptName, bomPath) {
  // 1. Parse BOM to extract components
  const bomContent = fs.readFileSync(bomPath, 'utf8');
  const components = parseBomComponents(bomContent);

  if (components.length === 0) {
    console.warn(`WARNING: Empty BOM for concept "${conceptName}". Generating minimal diagram.`);
    return generateMinimalDiagram(conceptName);
  }

  if (components.length > 20) {
    console.warn(`WARNING: Concept "${conceptName}" has ${components.length} components.`);
    console.warn('Consider splitting into subsystem diagrams for clarity.');
  }

  // 2. Group components by function
  const groups = {
    power: components.filter(c => c.category.toLowerCase().includes('power')),
    processing: components.filter(c => c.category.toLowerCase().includes('mcu') ||
                                       c.category.toLowerCase().includes('processor')),
    communication: components.filter(c => c.category.toLowerCase().includes('wireless') ||
                                          c.category.toLowerCase().includes('comms')),
    sensors: components.filter(c => c.category.toLowerCase().includes('sensor')),
    io: components.filter(c => c.category.toLowerCase().includes('interface') ||
                               c.category.toLowerCase().includes('display')),
    passives: components.filter(c => c.category.toLowerCase().includes('passive'))
  };

  // 3. Generate ASCII diagram following conventions
  let diagram = `Block Diagram: ${conceptName}\n`;
  diagram += '='.repeat(50) + '\n\n';

  // Power section (top)
  if (groups.power.length > 0) {
    diagram += generatePowerSection(groups.power);
  }

  // Processing and communication (middle)
  diagram += generateProcessingSection(groups.processing, groups.communication, groups.sensors, groups.io);

  // Legend
  diagram += '\n\nLegend:\n';
  diagram += '  -----> : Signal flow (unidirectional)\n';
  diagram += '  <----> : Bidirectional data\n';
  diagram += '  (3.3V) : Power rail annotation\n';

  return diagram;
}

function parseBomComponents(bomContent) {
  const components = [];
  const lines = bomContent.split('\n');
  let inTable = false;

  for (const line of lines) {
    if (line.startsWith('|') && line.includes('Category')) {
      inTable = true;
      continue;
    }
    if (inTable && line.startsWith('|---')) continue;
    if (inTable && line.startsWith('|')) {
      const parts = line.split('|').map(p => p.trim()).filter(p => p);
      if (parts.length >= 4) {
        components.push({
          category: parts[0],
          mpn: parts[1],
          manufacturer: parts[2],
          description: parts[3]
        });
      }
    }
  }

  return components;
}

function generatePowerSection(powerComponents) {
  if (powerComponents.length === 0) return '';

  let section = '+---------------+\n';
  section += '|   Power Input |\n';
  section += '|   (USB/Batt)  |\n';
  section += '+-------+-------+\n';
  section += '        |\n';
  section += '        v 5V/Batt\n';

  for (const comp of powerComponents) {
    const abbrev = abbreviateMPN(comp.mpn);
    section += `+-------+-------+\n`;
    section += `|   ${abbrev.padEnd(11)} |-----(3.3V)----+\n`;
    section += `| ${comp.category.substring(0, 11).padEnd(11)} |               |\n`;
    section += `+---------------+               |\n`;
    section += '                                v\n';
  }

  return section;
}

function abbreviateMPN(mpn) {
  // Extract key identifier from MPN
  // E.g., "STM32L476RGT6" -> "STM32L4"
  //       "nRF52832-QFAA" -> "nRF52832"
  //       "TPS563200DDCR" -> "TPS563200"

  if (mpn.startsWith('STM32')) {
    return mpn.substring(0, 7);  // "STM32L4"
  }
  if (mpn.startsWith('nRF')) {
    const match = mpn.match(/nRF\d+/);
    return match ? match[0] : mpn.substring(0, 10);
  }
  if (mpn.length > 12) {
    return mpn.substring(0, 10);
  }
  return mpn;
}
```

**Component Summary Table:**

After each diagram, include table linking diagram blocks to BOM references:

```javascript
function generateComponentSummary(components) {
  let table = '\n## Component Summary\n\n';
  table += '| Ref | Component | MPN | Function |\n';
  table += '|-----|-----------|-----|----------|\n';

  components.forEach((comp, idx) => {
    const ref = `U${idx + 1}`;  // Simple sequential reference designators
    const abbrev = abbreviateMPN(comp.mpn);
    table += `| ${ref} | ${comp.category} | ${abbrev} | ${comp.description} |\n`;
  });

  return table;
}
```

**Error Handling:**
- Missing BOM file: Report error, skip concept (checked in INPUT LOADING)
- Empty BOM: Warn and generate minimal diagram showing concept name only
- Too many components (>20): Warn about complexity, suggest subsystem split in notes

### SPECIFICATION GAP ANALYSIS

For each validated concept, create requirements traceability matrix mapping requirements to addressing components.

**Traceability Matrix Structure (from 07-RESEARCH.md Pattern 2):**

```javascript
function generateTraceabilityMatrix(conceptName, requirements, components) {
  let matrix = '\n## Specification Gap Analysis\n\n';
  matrix += '| Req ID | Requirement | Priority | Addressed By | Status | Score |\n';
  matrix += '|--------|-------------|----------|--------------|--------|-------|\n';

  const componentMap = mapRequirementsToComponents(requirements, components);

  requirements.forEach(req => {
    const addressing = componentMap[req.id] || { components: '-', status: 'Not Addressed' };
    const score = { 'Full': '100%', 'Partial': '50%', 'Not Addressed': '0%' }[addressing.status];

    matrix += `| ${req.id} | ${req.description} | ${req.priority} | `;
    matrix += `${addressing.components} | ${addressing.status} | ${score} |\n`;
  });

  return matrix;
}

function mapRequirementsToComponents(requirements, components) {
  // Map each requirement to component(s) that address it
  // This requires analyzing requirement text and component descriptions

  const componentMap = {};

  requirements.forEach(req => {
    const reqLower = req.description.toLowerCase();
    const addressing = [];

    // Check each component for relevance to requirement
    components.forEach(comp => {
      const compLower = comp.description.toLowerCase();
      const categoryLower = comp.category.toLowerCase();

      // Example heuristics (expand based on domain):
      // Power requirements
      if (reqLower.includes('voltage') || reqLower.includes('power')) {
        if (categoryLower.includes('power') || categoryLower.includes('regulator')) {
          addressing.push(comp.mpn);
        }
      }

      // Communication requirements
      if (reqLower.includes('wireless') || reqLower.includes('ble') || reqLower.includes('wifi')) {
        if (categoryLower.includes('wireless') || categoryLower.includes('comms')) {
          addressing.push(comp.mpn);
        }
      }

      // Sensor requirements
      if (reqLower.includes('temperature') || reqLower.includes('humidity') || reqLower.includes('sensor')) {
        if (categoryLower.includes('sensor')) {
          addressing.push(comp.mpn);
        }
      }

      // Processing requirements
      if (reqLower.includes('processing') || reqLower.includes('computation')) {
        if (categoryLower.includes('mcu') || categoryLower.includes('processor')) {
          addressing.push(comp.mpn);
        }
      }
    });

    // Determine status based on addressing components
    if (addressing.length === 0) {
      componentMap[req.id] = {
        components: '-',
        status: 'Not Addressed'
      };
    } else {
      // Determine if Full or Partial based on requirement specifics
      // Default to Partial when in doubt (per 07-RESEARCH.md Pitfall 3)
      componentMap[req.id] = {
        components: addressing.join(', '),
        status: 'Partial',  // Conservative default
        partialReason: 'Component contributes but may not fully satisfy requirement'
      };

      // Upgrade to Full if component clearly satisfies requirement
      // (This requires domain-specific logic)
    }
  });

  return componentMap;
}
```

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

```javascript
function calculateWeightedCoverage(requirements, componentMap) {
  const weights = {
    'Critical': 0.50,
    'Important': 0.30,
    'Nice-to-have': 0.20
  };

  const scores = {
    'Full': 100,
    'Partial': 50,
    'Not Addressed': 0
  };

  // Group requirements by priority
  const groups = {
    'Critical': [],
    'Important': [],
    'Nice-to-have': []
  };

  requirements.forEach(req => {
    const addressing = componentMap[req.id];
    const score = scores[addressing.status];
    groups[req.priority].push({ req, score });
  });

  // Calculate per-tier coverage
  const tierCoverage = {};
  for (const [priority, reqs] of Object.entries(groups)) {
    if (reqs.length === 0) {
      // Empty tier = 100% covered (no requirements = no gaps)
      tierCoverage[priority] = 1.0;
      continue;
    }
    const totalPossible = reqs.length * 100;
    const actualScore = reqs.reduce((sum, r) => sum + r.score, 0);
    tierCoverage[priority] = actualScore / totalPossible;
  }

  // Weighted sum
  const overall =
    tierCoverage['Critical'] * weights['Critical'] +
    tierCoverage['Important'] * weights['Important'] +
    tierCoverage['Nice-to-have'] * weights['Nice-to-have'];

  return {
    overall: Math.round(overall * 100),  // percentage
    byTier: {
      'Critical': Math.round(tierCoverage['Critical'] * 100),
      'Important': Math.round(tierCoverage['Important'] * 100),
      'Nice-to-have': Math.round(tierCoverage['Nice-to-have'] * 100)
    },
    passes: overall >= 0.80,
    threshold: 80
  };
}
```

**Coverage Summary Format:**

```javascript
function generateCoverageSummary(coverage, gapCount) {
  let summary = '\n## Coverage Summary\n\n';
  summary += `**Overall Coverage:** ${coverage.overall}%\n`;
  summary += `**Status:** ${coverage.passes ? 'PASS' : 'FAIL'} (threshold: ${coverage.threshold}%)\n\n`;

  summary += '| Priority | Coverage |\n';
  summary += '|----------|----------|\n';
  summary += `| Critical | ${coverage.byTier['Critical']}% |\n`;
  summary += `| Important | ${coverage.byTier['Important']}% |\n`;
  summary += `| Nice-to-have | ${coverage.byTier['Nice-to-have']}% |\n\n`;

  summary += `**Gaps Identified:** ${gapCount} requirement(s) not fully addressed\n`;

  return summary;
}
```

### COVERAGE COMPARISON VIEW

Generate single comparison table showing all concepts for decision-making.

**Format (from 07-RESEARCH.md Pattern 4):**

```javascript
function generateComparisonTable(conceptAnalyses) {
  let comparison = '# Coverage Comparison\n\n';
  comparison += '| Concept | Coverage | Critical | Important | Nice | Gaps | Est. Cost | Status |\n';
  comparison += '|---------|----------|----------|-----------|------|------|-----------|--------|\n';

  conceptAnalyses.forEach(analysis => {
    const status = analysis.coverage.overall >= 80 ? 'PASS' : 'FAIL';
    comparison += `| ${analysis.conceptName} | ${analysis.coverage.overall}% | `;
    comparison += `${analysis.coverage.byTier['Critical']}% | `;
    comparison += `${analysis.coverage.byTier['Important']}% | `;
    comparison += `${analysis.coverage.byTier['Nice-to-have']}% | `;
    comparison += `${analysis.gapCount} | $${analysis.bomCost.toFixed(2)} | ${status} |\n`;
  });

  comparison += '\n### Legend\n';
  comparison += '- **Coverage:** Weighted overall coverage (50/30/20)\n';
  comparison += '- **Critical/Important/Nice:** Per-tier coverage percentages\n';
  comparison += '- **Gaps:** Count of Not Addressed requirements\n';
  comparison += '- **Status:** PASS (>=80%) or FAIL (<80%)\n\n';

  // Recommendation
  const passingConcepts = conceptAnalyses.filter(a => a.coverage.overall >= 80);
  if (passingConcepts.length > 0) {
    const best = passingConcepts.sort((a, b) => b.coverage.overall - a.coverage.overall)[0];
    comparison += '### Recommendation\n';
    comparison += `**${best.conceptName}** recommended for highest coverage (${best.coverage.overall}%) `;
    comparison += `with ${best.gapCount} gap(s).\n`;
  } else {
    comparison += '### Note\n';
    comparison += 'All concepts below 80% threshold. Review gap suggestions and consider:\n';
    comparison += '- Relaxing requirements that may be overly strict\n';
    comparison += '- Proceeding with best-available concept and addressing gaps in Phase 2 (Refinement)\n';
  }

  return comparison;
}
```

### GAP RESOLUTION SUGGESTIONS

For each Not Addressed or Partial requirement, provide actionable suggestions.

**Format (from 07-RESEARCH.md Pattern 5):**

```javascript
function generateGapSuggestions(requirements, componentMap) {
  const gaps = requirements.filter(req => {
    const addressing = componentMap[req.id];
    return addressing.status !== 'Full';
  });

  if (gaps.length === 0) {
    return '\n## Gaps and Suggestions\n\nNo gaps identified - all requirements fully addressed.\n';
  }

  let suggestions = '\n## Gaps and Suggestions\n\n';

  gaps.forEach(req => {
    const addressing = componentMap[req.id];
    suggestions += `### ${req.id}: ${req.description} (${addressing.status})\n\n`;

    // Describe the gap specifically
    if (addressing.status === 'Not Addressed') {
      suggestions += `**Gap:** No component currently addresses this requirement.\n`;
      suggestions += `**Impact:** Requirement not satisfied in current design.\n`;
    } else {
      suggestions += `**Gap:** ${addressing.partialReason || 'Component partially satisfies requirement.'}\n`;
      suggestions += `**Impact:** Requirement partially satisfied; may need enhancement.\n`;
    }

    // Provide actionable suggestions
    suggestions += '**Suggestions:**\n';
    suggestions += generateSuggestionsForRequirement(req, addressing);
    suggestions += '\n';
  });

  return suggestions;
}

function generateSuggestionsForRequirement(req, addressing) {
  // Generate 2-3 actionable suggestions based on requirement type
  // This is domain-specific and requires reasoning about the requirement

  let suggestions = '';
  const reqLower = req.description.toLowerCase();

  // Example suggestions based on common requirement patterns
  if (reqLower.includes('power') || reqLower.includes('voltage')) {
    suggestions += '1. Add appropriate voltage regulator or power management IC\n';
    suggestions += '2. Review power budget and consider higher-capacity power supply\n';
    suggestions += '3. Revisit requirement to confirm if voltage spec is truly needed\n';
  } else if (reqLower.includes('communication') || reqLower.includes('interface')) {
    suggestions += '1. Add dedicated communication module (e.g., BLE, WiFi, LoRa)\n';
    suggestions += '2. Use MCU with integrated communication peripherals\n';
    suggestions += '3. Consider alternative communication protocol if requirement allows\n';
  } else if (reqLower.includes('sensor') || reqLower.includes('measurement')) {
    suggestions += '1. Add specific sensor component to BOM\n';
    suggestions += '2. Verify MCU has appropriate ADC/interface for sensor\n';
    suggestions += '3. Consider multi-sensor module if measuring multiple parameters\n';
  } else {
    // Generic suggestions when specific domain pattern not matched
    suggestions += '1. Add component to address this requirement\n';
    suggestions += '2. Enhance existing component capability if possible\n';
    suggestions += '3. Revisit requirement to confirm necessity and specifications\n';
    suggestions += '4. Defer to Phase 2 (Refinement) for detailed resolution\n';
  }

  return suggestions;
}
```

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

```javascript
const existingState = fs.readFileSync('.librespin/state.md', 'utf8');
const updatedState = existingState.replace(/^phase: .+$/m, `phase: '5-concept-generation'`);
fs.writeFileSync('.librespin/state.md', updatedState);
```

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
```javascript
const weights = {
  coverage: 0.60,    // 60% - Requirement coverage (from Phase 1)
  cost: 0.15,        // 15% - Cost relative to other concepts
  availability: 0.15, // 15% - Lead time + stock availability
  complexity: 0.10   // 10% - Design complexity (BOM lines, interfaces, rails)
};
```

---

#### calculateQualityScore(concept, allConcepts)

**Purpose:** Calculate composite weighted quality score for a concept.

**Implementation:**
```javascript
function calculateQualityScore(concept, allConcepts) {
  const weights = { coverage: 0.60, cost: 0.15, availability: 0.15, complexity: 0.10 };

  // Coverage: Use Phase 1 weighted coverage (0-100%)
  const coverageScore = concept.coverageScore; // Already calculated in Phase 1

  // Cost: Relative scoring (cheapest = 100%, most expensive = 0%)
  const costScore = calculateRelativeCost(concept, allConcepts);

  // Availability: Combined lead time + stock (average of sub-scores)
  const availabilityScore = calculateAvailabilityScore(concept);

  // Complexity: Multi-factor assessment
  const complexityScore = calculateComplexityScore(concept);

  // Composite weighted score
  const qualityScore =
    (coverageScore * weights.coverage) +
    (costScore * weights.cost) +
    (availabilityScore * weights.availability) +
    (complexityScore * weights.complexity);

  return {
    overall: Math.round(qualityScore),
    breakdown: {
      coverage: Math.round(coverageScore),
      cost: Math.round(costScore),
      availability: Math.round(availabilityScore),
      complexity: Math.round(complexityScore)
    },
    weights: weights
  };
}
```

---

#### calculateRelativeCost(concept, allConcepts)

**Purpose:** Score concepts relative to each other (cheapest = 100%, most expensive = 0%).

**Implementation:**
```javascript
function calculateRelativeCost(concept, allConcepts) {
  // Get all BOM costs
  const costs = allConcepts.map(c => c.bomCost);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  // Handle edge case: all same cost OR single concept
  if (minCost === maxCost) {
    return 100; // All concepts equally good on cost
  }

  // Linear interpolation: cheapest = 100%, most expensive = 0%
  const costScore = 100 * (1 - (concept.bomCost - minCost) / (maxCost - minCost));

  return Math.round(costScore);
}

// Example:
// Concepts: A=$25, B=$50, C=$100
// A: 100 * (1 - (25-25)/(100-25)) = 100%
// B: 100 * (1 - (50-25)/(100-25)) = 67%
// C: 100 * (1 - (100-25)/(100-25)) = 0%
```

---

#### calculateAvailabilityScore(concept)

**Purpose:** Calculate combined lead time + stock availability score for key components.

**Key Component Filter:**
```javascript
function isKeyComponent(part) {
  const keyCategories = ['MCU', 'Microcontroller', 'Regulator', 'Connector', 'Wireless', 'Sensor'];
  return keyCategories.some(cat =>
    part.category?.includes(cat) || part.description?.includes(cat)
  );
}
```

**Implementation:**
```javascript
function calculateAvailabilityScore(concept) {
  let totalLeadTimeScore = 0;
  let totalStockScore = 0;
  let keyComponentCount = 0;

  // Only score key components (MCU, regulators, connectors)
  // Skip passives (resistors, capacitors)
  concept.bom
    .filter(part => isKeyComponent(part))
    .forEach(part => {
      // Lead time score (0-100%)
      // In stock (0 weeks) = 100%, 8+ weeks = 0%, linear interpolation
      const leadTimeScore = Math.max(0, 100 - (part.leadTimeWeeks * 12.5));

      // Stock score (0-100%)
      // 1000+ units = 100%, 0 units = 0%, linear interpolation
      const stockScore = Math.min(100, part.stockQuantity / 10);

      totalLeadTimeScore += leadTimeScore;
      totalStockScore += stockScore;
      keyComponentCount++;
    });

  // Handle no-key-components edge case
  if (keyComponentCount === 0) return 100; // No key components = no sourcing risk

  // Average of lead time and stock scores
  const avgLeadTime = totalLeadTimeScore / keyComponentCount;
  const avgStock = totalStockScore / keyComponentCount;

  // Combined score (average of both sub-scores)
  return Math.round((avgLeadTime + avgStock) / 2);
}
```

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

**Implementation:**
```javascript
function calculateComplexityScore(concept) {
  // BOM line count
  const bomLines = concept.bom.length;
  const bomScore = bomLines <= 15 ? 100 :
                   bomLines <= 25 ? 85 :
                   bomLines <= 40 ? 70 :
                   bomLines <= 60 ? 50 : 30;

  // Interface diversity (count unique interface types)
  const interfaces = new Set(concept.interfaces || []);
  const interfaceScore = interfaces.size <= 3 ? 100 :
                         interfaces.size <= 5 ? 80 :
                         interfaces.size <= 8 ? 60 : 40;

  // Power rail count
  const railCount = concept.powerRails?.length || 1;
  const railScore = railCount <= 2 ? 100 :
                    railCount <= 4 ? 75 :
                    railCount <= 6 ? 50 : 25;

  // Topology complexity (qualitative assessment)
  // Simple: linear, single MCU
  // Moderate: multiple subsystems or complex routing
  // Complex: distributed, mesh, custom protocols
  const topologyScore = concept.topologyComplexity === 'simple' ? 100 :
                        concept.topologyComplexity === 'moderate' ? 65 : 30;

  // Weighted average (30/25/25/20)
  return Math.round(
    (bomScore * 0.30) +
    (interfaceScore * 0.25) +
    (railScore * 0.25) +
    (topologyScore * 0.20)
  );
}
```

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

**Implementation:**
```javascript
function loadIterationConfig() {
  // Read librespin-concept-config.yaml
  const configPath = '.librespin/config.yaml';
  const config = readYAML(configPath);

  // Check for iteration_limit field
  if (config.iteration_limit === undefined) {
    // Create field with default value 5
    config.iteration_limit = 5;
    writeYAML(configPath, config);
    return 5;
  }

  // Validate it's a number between 1-10
  const limit = config.iteration_limit;
  if (typeof limit !== 'number' || limit < 1 || limit > 10) {
    // STOP with error message (per CLAUDE.md error handling)
    throw new Error(
      `Invalid iteration_limit: ${limit}. ` +
      `Must be a number between 1 and 10. ` +
      `Check .librespin/config.yaml`
    );
  }

  return limit;
}
```

**Default:** 5 iterations (configurable 1-10).

---

#### detectPlateau(currentScore, previousScore, threshold)

**Purpose:** Detect when quality improvement falls below threshold to terminate early.

**Threshold:** 5% (0.05) per CONTEXT.md "lenient plateau detection".

**Implementation:**
```javascript
function detectPlateau(currentScore, previousScore, threshold = 0.05) {
  // First iteration has no previous score
  if (previousScore === null || previousScore === 0) {
    return { isPlateau: false, improvement: null, message: 'First iteration - no baseline' };
  }

  // Calculate relative improvement
  const absoluteImprovement = currentScore - previousScore;
  const relativeImprovement = absoluteImprovement / previousScore;

  // Plateau if improvement < threshold (5%)
  const isPlateau = relativeImprovement < threshold;

  return {
    isPlateau,
    improvement: Math.round(relativeImprovement * 100), // As percentage
    absoluteImprovement: Math.round(absoluteImprovement * 10) / 10,
    message: isPlateau
      ? `Plateau detected: ${(relativeImprovement * 100).toFixed(1)}% improvement < 5% threshold`
      : `Continuing: ${(relativeImprovement * 100).toFixed(1)}% improvement >= 5% threshold`
  };
}

// Example:
// Previous: 72%, Current: 74%
// Improvement: (74-72)/72 = 2.8% < 5% -> PLATEAU
//
// Previous: 65%, Current: 72%
// Improvement: (72-65)/65 = 10.8% >= 5% -> CONTINUE
```

---

#### shouldTransitionToFocused(scores)

**Purpose:** Determine when to switch from parallel (all concepts) to focused (top concepts) refinement.

**Transition Heuristics:**

1. **Top 3 clearly separated:** Top 3 concepts are >10% better than average of remaining concepts
2. **Rescue candidates identified:** Any concept in 70-79% range while others are <70%

**Implementation:**
```javascript
function shouldTransitionToFocused(scores) {
  const sortedScores = scores.map(s => s.score).sort((a, b) => b - a);

  // Heuristic 1: Top 3 concepts clearly separated from rest
  if (scores.length > 3) {
    const topThreeAvg = (sortedScores[0] + sortedScores[1] + sortedScores[2]) / 3;
    const restAvg = sortedScores.slice(3).reduce((a, b) => a + b, 0) / (sortedScores.length - 3);

    // Transition if top 3 are >10% better than rest
    if ((topThreeAvg - restAvg) > 10) {
      return true;
    }
  }

  // Heuristic 2: Rescue candidates identified
  const rescueCandidates = scores.filter(s => s.score >= 70 && s.score < 80);
  const belowRescue = scores.filter(s => s.score < 70);
  if (rescueCandidates.length > 0 && belowRescue.length > 0) {
    return true;
  }

  return false;
}
```

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

**Implementation:**
```javascript
function handleAllFailScenario(concepts, iterations) {
  const sortedByScore = concepts
    .map(c => ({ name: c.name, score: calculateQualityScore(c).overall }))
    .sort((a, b) => b.score - a.score);

  const bestScore = sortedByScore[0].score;
  const bestConcept = sortedByScore[0].name;

  // Analyze common issues across concepts
  const commonIssues = analyzeCommonFailureReasons(concepts);

  return {
    status: 'all_failed',
    iterations: iterations,
    bestScore: bestScore,
    bestConcept: bestConcept,
    conceptScores: sortedByScore,
    commonIssues: commonIssues,
    message: `
All ${concepts.length} concepts failed to reach 80% threshold after ${iterations} iterations.

**Highest score:** ${bestConcept} (${bestScore.toFixed(1)}%)

**Common issues identified:**
${commonIssues.map(i => `- ${i}`).join('\n')}

**Suggested actions:**
1. Relax requirements that caused most coverage failures
2. Increase budget if cost was limiting factor
3. Extend timeline if availability was the constraint
4. Simplify design if complexity dominated

**Options:**
- Proceed with best available concept (${bestConcept})
- Return to Phase 1 to relax requirements
- Provide additional context to improve concept quality

User input required to proceed.`,
    suggestions: [
      'Relax requirements causing coverage gaps',
      'Increase cost budget',
      'Accept longer lead times',
      'Simplify design complexity',
      'Proceed with best available'
    ]
  };
}

function analyzeCommonFailureReasons(concepts) {
  const issues = [];

  // Check coverage dimension
  const avgCoverage = concepts.reduce((sum, c) => sum + c.coverageScore, 0) / concepts.length;
  if (avgCoverage < 80) {
    issues.push(`Low coverage (avg ${avgCoverage.toFixed(0)}%): requirements may be too stringent`);
  }

  // Check cost dimension (would need allConcepts context for relative scoring)
  // Check availability dimension
  // These would analyze breakdown scores if available

  return issues.length > 0 ? issues : ['Multiple factors below threshold'];
}
```

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

```javascript
async function verifyComponentClaims(concept) {
  const verificationResults = [];

  // Get key components only (MCU, regulators, connectors)
  // Skip passives (resistors, capacitors)
  const keyComponents = concept.bom.filter(part => isKeyComponent(part));

  for (const part of keyComponents) {
    const result = { mpn: part.mpn, category: part.category, checks: [] };

    // Call DigiKey API: python -m digikey.details "MPN"
    const details = await callDigiKeyDetails(part.mpn);

    if (!details || details.error) {
      result.checks.push({
        check: 'existence',
        status: 'FAIL',
        message: `Part not found in DigiKey: ${part.mpn}`,
        action: 'find_alternative'
      });
      verificationResults.push(result);
      continue;
    }

    // Check 1: Datasheet URL accessible
    result.checks.push({
      check: 'datasheet',
      status: details.datasheet_url ? 'PASS' : 'WARN',
      value: details.datasheet_url || 'Not available'
    });

    // Check 2: Price within 25% of BOM estimate (threshold per CONTEXT.md)
    const priceChange = Math.abs(details.unit_price - part.estimatedPrice) / part.estimatedPrice;
    result.checks.push({
      check: 'pricing',
      status: priceChange <= 0.25 ? 'PASS' : 'FLAG',
      bomPrice: part.estimatedPrice,
      actualPrice: details.unit_price,
      change: `${(priceChange * 100).toFixed(0)}%`,
      action: priceChange > 0.25 ? 'update_bom_cost' : null
    });

    // Check 3: Lifecycle status (Active required, NRND/Obsolete = FAIL)
    if (details.lifecycle === 'Active') {
      result.checks.push({ check: 'lifecycle', status: 'PASS', value: 'Active' });
    } else {
      result.checks.push({
        check: 'lifecycle',
        status: 'FAIL',
        value: details.lifecycle,
        message: `Part is ${details.lifecycle}`,
        action: 'find_replacement'
      });
    }

    // Check 4: Stock and lead time (threshold: >8 weeks or <100 stock)
    const availability = await callDigiKeyAvailability(part.mpn);
    const stockOk = availability.stock >= 100;
    const leadTimeOk = availability.lead_time_weeks <= 8;
    result.checks.push({
      check: 'availability',
      status: (stockOk || leadTimeOk) ? 'PASS' : 'FLAG',
      stock: availability.stock,
      leadTime: `${availability.lead_time_weeks} weeks`,
      action: (!stockOk && !leadTimeOk) ? 'find_alternative' : null
    });

    // Check 5: RoHS compliance status
    result.checks.push({
      check: 'rohs',
      status: details.rohs_status === 'Compliant' ? 'PASS' : 'WARN',
      value: details.rohs_status || 'Unknown'
    });

    verificationResults.push(result);
  }

  return verificationResults;
}
```

**Verification Result Format:**
```javascript
{
  mpn: string,
  category: string,
  checks: [
    { check: 'existence', status: 'PASS'|'FAIL', ... },
    { check: 'datasheet', status: 'PASS'|'WARN', value: url },
    { check: 'pricing', status: 'PASS'|'FLAG', bomPrice: X, actualPrice: Y, change: 'N%' },
    { check: 'lifecycle', status: 'PASS'|'FAIL', value: 'Active'|'NRND'|'Obsolete' },
    { check: 'availability', status: 'PASS'|'FLAG', stock: N, leadTime: 'X weeks' },
    { check: 'rohs', status: 'PASS'|'WARN', value: 'Compliant'|... }
  ]
}
```

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

```javascript
async function autoFixVerificationFailure(part, failureType) {
  // Find alternatives using DigiKey API
  // python -m digikey.alternatives "MPN"
  const alternatives = await callDigiKeyAlternatives(part.mpn);

  if (!alternatives || alternatives.length === 0) {
    return {
      status: 'no_replacement',
      message: `No alternatives found for ${part.mpn}`,
      originalPart: part.mpn,
      action: 'suggest_to_user'
    };
  }

  // Filter alternatives based on failure type
  let validAlternatives;

  if (failureType === 'lifecycle') {
    // Find Active alternatives only
    validAlternatives = alternatives.filter(alt =>
      alt.lifecycle === 'Active'
    );
  } else if (failureType === 'availability') {
    // Find in-stock (>100) or short lead time (<=8 weeks)
    validAlternatives = alternatives.filter(alt =>
      alt.stock > 100 || alt.lead_time_weeks <= 8
    );
  } else if (failureType === 'price') {
    // Find within 50% of original estimate
    validAlternatives = alternatives.filter(alt =>
      alt.unit_price <= part.estimatedPrice * 1.5
    );
  } else if (failureType === 'existence') {
    // Any valid alternative is acceptable
    validAlternatives = alternatives.filter(alt =>
      alt.lifecycle === 'Active' && (alt.stock > 100 || alt.lead_time_weeks <= 8)
    );
  }

  if (!validAlternatives || validAlternatives.length === 0) {
    return {
      status: 'no_valid_replacement',
      message: `Alternatives found but none meet criteria for ${part.mpn}`,
      originalPart: part.mpn,
      alternatives: alternatives.slice(0, 3), // Show top 3 for user
      action: 'suggest_to_user'
    };
  }

  // Select best alternative: balance cost, availability, vendor reputation
  const selectedAlt = selectBestAlternative(validAlternatives, part.estimatedPrice);

  return {
    status: 'auto_fixed',
    originalPart: part.mpn,
    replacement: selectedAlt.mpn,
    manufacturer: selectedAlt.manufacturer,
    reason: `Replaced due to ${failureType} issue`,
    newPrice: selectedAlt.unit_price,
    newStock: selectedAlt.stock,
    newLeadTime: selectedAlt.lead_time_weeks
  };
}

function selectBestAlternative(alternatives, originalPrice) {
  // Score alternatives: balance cost, availability, simplicity (vendor reputation)
  // Per CONTEXT.md: prefer DigiKey > Mouser > Arrow/Newark
  const preferredManufacturers = [
    'Texas Instruments', 'STMicroelectronics', 'Microchip',
    'Nordic Semiconductor', 'Analog Devices', 'NXP'
  ];

  return alternatives
    .map(alt => {
      // Lower price relative to original = higher score
      const priceScore = 100 - Math.min(100, (alt.unit_price / originalPrice) * 50);

      // More stock = higher score (capped at 1000)
      const stockScore = Math.min(100, alt.stock / 10);

      // Shorter lead time = higher score
      const leadTimeScore = Math.max(0, 100 - (alt.lead_time_weeks * 12.5));

      // Preferred manufacturer bonus
      const vendorBonus = preferredManufacturers.some(m =>
        alt.manufacturer?.includes(m)) ? 20 : 0;

      return {
        ...alt,
        score: (priceScore * 0.30) + (stockScore * 0.25) +
               (leadTimeScore * 0.25) + vendorBonus
      };
    })
    .sort((a, b) => b.score - a.score)
    [0];
}

async function callDigiKeyAlternatives(mpn) {
  // Execute: python -m digikey.alternatives "MPN"
  // Returns array of alternative parts
  const result = await execBash(`python -m digikey.alternatives "${mpn}"`);
  if (result.error) return null;
  return JSON.parse(result.stdout);
}
```

**Auto-fix Error Handling:**
- If DigiKey API returns error or part not found: status = 'FAIL', action = 'find_alternative'
- If no alternative found: status = 'no_replacement', escalate to user
- Log all auto-fixes silently (reflected in final output, per CONTEXT.md)
```

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

```javascript
function generateGapClosureActions(concept, gaps) {
  const actions = [];

  // Filter gaps to Critical priority only (per CONTEXT.md: "Targeted gap closure")
  const criticalGaps = gaps.filter(gap => gap.priority === 'Critical');

  // Skip Nice-to-have gaps explicitly (per CONTEXT.md: "accept Nice-to-have gaps")
  const skippedGaps = gaps.filter(gap => gap.priority === 'Nice-to-have');
  if (skippedGaps.length > 0) {
    actions.push({
      type: 'skip',
      gaps: skippedGaps.map(g => g.id || g.requirement),
      reason: 'Nice-to-have requirements accepted as gaps per strategy',
      count: skippedGaps.length
    });
  }

  // Process Important gaps with lower priority
  const importantGaps = gaps.filter(gap => gap.priority === 'Important');

  // Process Critical gaps first
  for (const gap of criticalGaps) {
    // Determine best closure action
    const closureOptions = analyzeGapClosureOptions(gap, concept);

    if (closureOptions.length === 0) {
      // No viable closure - suggest requirement reinterpretation
      actions.push({
        type: 'requirement_reinterpretation',
        gap: gap.id || gap.requirement,
        requirement: gap.description || gap.requirement,
        message: `No viable closure found for: ${gap.description || gap.requirement}`,
        suggestion: `Consider relaxing requirement or accepting partial coverage`,
        cost: 0,
        complexity: 'low'
      });
      continue;
    }

    // Select best option (balance cost, availability, simplicity)
    const selectedAction = selectBestClosureAction(closureOptions);
    actions.push(selectedAction);
  }

  // Optionally process Important gaps if resources allow
  for (const gap of importantGaps) {
    const closureOptions = analyzeGapClosureOptions(gap, concept);
    if (closureOptions.length > 0) {
      const selectedAction = selectBestClosureAction(closureOptions);
      // Only include if low complexity and low cost
      if (selectedAction.complexity === 'low' && selectedAction.cost < 5) {
        actions.push(selectedAction);
      }
    }
  }

  return actions;
}
```

---

#### analyzeGapClosureOptions(gap, concept)

**Purpose:** Find all viable closure options for a given gap.

```javascript
function analyzeGapClosureOptions(gap, concept) {
  const options = [];

  // Option 1: Component swap
  // Find existing component that partially addresses gap and find better replacement
  const swapOption = findComponentSwap(gap, concept);
  if (swapOption) {
    options.push({
      type: 'component_swap',
      gap: gap.id || gap.requirement,
      original: swapOption.originalPart,
      replacement: swapOption.newPart,
      reason: swapOption.reason,
      cost: swapOption.costImpact,
      complexity: 'low'  // Swaps are typically low complexity
    });
  }

  // Option 2: Component addition
  // Identify new component that addresses gap
  const addOption = findComponentAddition(gap, concept);
  if (addOption) {
    options.push({
      type: 'component_addition',
      gap: gap.id || gap.requirement,
      newPart: addOption.part,
      purpose: addOption.purpose,
      cost: addOption.costImpact,
      complexity: 'medium'  // Additions add to design complexity
    });
  }

  // Option 3: Architecture tweak
  // Assess if connectivity/topology change helps
  const tweakOption = findArchitectureTweak(gap, concept);
  if (tweakOption) {
    options.push({
      type: 'architecture_tweak',
      gap: gap.id || gap.requirement,
      change: tweakOption.description,
      impact: tweakOption.impact,
      cost: tweakOption.costImpact,
      complexity: tweakOption.complexity
    });
  }

  return options;
}

function findComponentSwap(gap, concept) {
  // Analyze gap requirements and find existing component that could be upgraded
  // Example: gap needs more GPIO -> find MCU with more GPIO pins

  const gapKeywords = (gap.description || gap.requirement || '').toLowerCase();

  // Common swap patterns
  if (gapKeywords.includes('gpio') || gapKeywords.includes('pin')) {
    // Find MCU in BOM
    const mcu = concept.bom.find(p => isKeyComponent(p) &&
      (p.category?.includes('MCU') || p.description?.includes('Microcontroller')));
    if (mcu) {
      return {
        originalPart: mcu.mpn,
        newPart: '[Search for MCU with more GPIO]',
        reason: 'Upgrade to MCU with more GPIO pins',
        costImpact: 2  // Estimate
      };
    }
  }

  if (gapKeywords.includes('current') || gapKeywords.includes('power')) {
    // Find regulator in BOM
    const regulator = concept.bom.find(p =>
      p.category?.includes('Regulator') || p.description?.includes('Regulator'));
    if (regulator) {
      return {
        originalPart: regulator.mpn,
        newPart: '[Search for higher current regulator]',
        reason: 'Upgrade to regulator with higher current capability',
        costImpact: 1
      };
    }
  }

  return null;  // No swap identified
}

function findComponentAddition(gap, concept) {
  // Identify new component that could address the gap
  const gapKeywords = (gap.description || gap.requirement || '').toLowerCase();

  // Common addition patterns
  if (gapKeywords.includes('5v') || gapKeywords.includes('boost')) {
    return {
      part: 'TPS61200 (Boost converter)',
      purpose: 'Provide 5V output from lower voltage rail',
      costImpact: 1.50
    };
  }

  if (gapKeywords.includes('multiplexer') || gapKeywords.includes('mux')) {
    return {
      part: 'CD74HC4051 (Analog mux)',
      purpose: 'Expand analog input channels',
      costImpact: 0.80
    };
  }

  if (gapKeywords.includes('level shift') || gapKeywords.includes('voltage translation')) {
    return {
      part: 'TXS0108E (Level shifter)',
      purpose: 'Voltage level translation between logic domains',
      costImpact: 1.20
    };
  }

  if (gapKeywords.includes('esd') || gapKeywords.includes('protection')) {
    return {
      part: 'TPD4E05U06 (ESD protection)',
      purpose: 'ESD protection for external interfaces',
      costImpact: 0.50
    };
  }

  return null;  // No addition identified
}

function findArchitectureTweak(gap, concept) {
  // Assess if architecture change addresses gap
  const gapKeywords = (gap.description || gap.requirement || '').toLowerCase();

  // Common architecture tweaks
  if (gapKeywords.includes('redundan') || gapKeywords.includes('backup')) {
    return {
      description: 'Add redundant power path with automatic failover',
      impact: 'Improves reliability but adds complexity',
      costImpact: 3,
      complexity: 'high'
    };
  }

  if (gapKeywords.includes('isolat')) {
    return {
      description: 'Add galvanic isolation on critical interfaces',
      impact: 'Improves safety and noise immunity',
      costImpact: 5,
      complexity: 'medium'
    };
  }

  if (gapKeywords.includes('distribut') || gapKeywords.includes('modular')) {
    return {
      description: 'Split into modular subsystems with defined interfaces',
      impact: 'Improves maintainability and testability',
      costImpact: 2,
      complexity: 'high'
    };
  }

  return null;  // No tweak identified
}
```

---

#### selectBestClosureAction(options)

**Purpose:** Select the best closure action from available options.

**Priority order (per CONTEXT.md):** low complexity > low cost > simple change

```javascript
function selectBestClosureAction(options) {
  // Sort by: complexity (low first), then cost (low first)
  const complexityOrder = { low: 0, medium: 1, high: 2 };

  return options.sort((a, b) => {
    // Primary: Complexity (low is better)
    const complexityDiff = complexityOrder[a.complexity] - complexityOrder[b.complexity];
    if (complexityDiff !== 0) return complexityDiff;

    // Secondary: Cost (lower is better)
    return a.cost - b.cost;
  })[0];
}
```

---

#### applyClosureAction(concept, action)

**Purpose:** Apply the selected closure action to the concept.

```javascript
function applyClosureAction(concept, action) {
  switch (action.type) {
    case 'component_swap':
      // Replace part in BOM
      const bomIndex = concept.bom.findIndex(p => p.mpn === action.original);
      if (bomIndex >= 0) {
        concept.bom[bomIndex].mpn = action.replacement;
        concept.bom[bomIndex].note = `Swapped from ${action.original}: ${action.reason}`;
      }
      // Update concept cost estimate
      concept.bomCost += action.cost;
      break;

    case 'component_addition':
      // Add part to BOM
      concept.bom.push({
        mpn: action.newPart,
        category: 'Added',
        description: action.purpose,
        quantity: 1,
        estimatedPrice: action.cost,
        note: `Added to address gap: ${action.gap}`
      });
      concept.bomCost += action.cost;
      break;

    case 'architecture_tweak':
      // Document change in concept notes
      concept.architectureNotes = concept.architectureNotes || [];
      concept.architectureNotes.push({
        change: action.change,
        impact: action.impact,
        gap: action.gap
      });
      concept.bomCost += action.cost;
      break;

    case 'requirement_reinterpretation':
      // Log suggestion for user (do not auto-apply)
      concept.userSuggestions = concept.userSuggestions || [];
      concept.userSuggestions.push({
        requirement: action.requirement,
        suggestion: action.suggestion,
        message: action.message
      });
      break;

    case 'skip':
      // Already logged in actions, no concept modification needed
      break;
  }

  // Mark gap as addressed (or suggested)
  concept.addressedGaps = concept.addressedGaps || [];
  concept.addressedGaps.push({
    gap: action.gap || action.gaps,
    action: action.type,
    cost: action.cost
  });

  return concept;
}
```

**Closure Action Format:**
```javascript
{
  type: 'component_swap' | 'component_addition' | 'architecture_tweak' | 'requirement_reinterpretation',
  gap: string,  // Gap ID/description
  // For swap:
  original: string,
  replacement: string,
  // For addition:
  newPart: string,
  purpose: string,
  // For tweak:
  change: string,
  impact: string,
  // For reinterpretation:
  message: string,
  suggestion: string,
  // Common:
  cost: number,  // Cost impact
  complexity: 'low' | 'medium' | 'high'
}
```

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

```javascript
const existingState = fs.readFileSync('.librespin/state.md', 'utf8');
const updatedState = existingState.replace(/^phase: .+$/m, `phase: '6-self-critique'`);
fs.writeFileSync('.librespin/state.md', updatedState);
```

## PHASE 7: FINAL OUTPUT

Generate final deliverables: comparison matrix, recommendation, and per-concept handoff folders.

**Output location:** `.librespin/07-final-output/`

### INPUT LOADING

Load data from Phases 6, 7, and 8 for final presentation.

```javascript
// Discover concept names from Phase 2 score files
function discoverConceptsFromPhase6() {
  const phase6Dir = '.librespin/06-refinement';
  const files = fs.readdirSync(phase6Dir).filter(f => f.startsWith('score-') && f.endsWith('.md'));

  // Extract concept names from filenames: score-{concept-slug}.md -> concept-slug
  const conceptSlugs = files.map(f => f.replace(/^score-/, '').replace(/\.md$/, ''));

  // Convert slugs back to readable names by reading each file's header
  const conceptNames = [];
  for (const slug of conceptSlugs) {
    const filePath = `${phase6Dir}/score-${slug}.md`;
    const content = fs.readFileSync(filePath, 'utf-8');
    // Extract name from "# Quality Score: [Concept Name]" header
    const nameMatch = content.match(/^# Quality Score: (.+)$/m);
    if (nameMatch) {
      conceptNames.push(nameMatch[1]);
    } else {
      // Fallback: convert slug to title case
      conceptNames.push(slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '));
    }
  }

  return conceptNames;
}

// Load all Phase 2 outputs for final presentation
function loadPhase6Outputs(conceptNames) {
  const concepts = [];

  for (const name of conceptNames) {
    const conceptSlug = name.toLowerCase().replace(/\s+/g, '-');

    // Load quality scores from Phase 2
    const scoreFile = `.librespin/06-refinement/score-${conceptSlug}.md`;
    const qualityScore = parseScoreFile(scoreFile);

    // Load refinement log from Phase 2
    const refinementLog = `.librespin/06-refinement/refinement-log.md`;
    const refinementActions = parseRefinementLog(refinementLog, name);

    // Load block diagram and coverage from Phase 1
    const analysisFile = `.librespin/05-detailed-designs/analysis-${conceptSlug}.md`;
    const blockDiagram = extractBlockDiagram(analysisFile);
    const coverageAnalysis = extractCoverageAnalysis(analysisFile);
    const gaps = extractGaps(analysisFile);

    // Load BOM from Phase 2 (may be updated in Phase 2)
    const bomFile = `.librespin/04-bom/bom-${conceptSlug}.md`;
    const bom = parseBom(bomFile);
    const bomCost = calculateBomTotal(bom);
    const datasheetLinks = extractDatasheetLinks(bom);

    concepts.push({
      name: name,
      slug: conceptSlug,
      qualityScore: qualityScore,
      refinementActions: refinementActions,
      blockDiagram: blockDiagram,
      coverageAnalysis: coverageAnalysis,
      coverageByTier: coverageAnalysis.byTier,
      gaps: gaps,
      bom: bom,
      bomCost: bomCost,
      datasheetLinks: datasheetLinks,
      worstLeadTime: extractWorstLeadTime(bom)
    });
  }

  return concepts;
}

// Parse quality score file from Phase 2
function parseScoreFile(filePath) {
  // Read score-{concept}.md
  // Extract: overall score, breakdown by dimension
  // Format:
  // **Overall:** 85%
  // **Breakdown:**
  // - Coverage: 90%
  // - Cost: 80%
  // - Availability: 85%
  // - Complexity: 75%

  return {
    overall: /* extracted overall percentage */,
    breakdown: {
      coverage: /* 60% weight */,
      cost: /* 15% weight */,
      availability: /* 15% weight */,
      complexity: /* 10% weight */
    }
  };
}

// Extract worst-case lead time from BOM
function extractWorstLeadTime(bom) {
  let worstWeeks = 0;

  for (const part of bom) {
    if (part.leadTime) {
      const weeks = parseLeadTimeToWeeks(part.leadTime);
      if (weeks > worstWeeks) {
        worstWeeks = weeks;
      }
    }
  }

  return worstWeeks > 0 ? worstWeeks : 'N/A';
}

function parseLeadTimeToWeeks(leadTimeStr) {
  // Parse "4 weeks", "2 wk", "In Stock" -> number
  if (leadTimeStr.toLowerCase().includes('stock')) return 0;
  const match = leadTimeStr.match(/(\d+)\s*w/i);
  return match ? parseInt(match[1]) : 0;
}
```

### CONCEPT SELECTION

Select top 3 concepts for final presentation.

```javascript
// Select top 3 concepts by quality score
function selectTop3Concepts(concepts) {
  // Sort by composite quality score (descending)
  const sorted = concepts.sort((a, b) =>
    b.qualityScore.overall - a.qualityScore.overall
  );

  // Filter to concepts that passed 80% threshold
  const passing = sorted.filter(c => c.qualityScore.overall >= 80);

  if (passing.length >= 3) {
    // Normal case: take top 3 passing concepts
    return passing.slice(0, 3);
  }

  if (passing.length > 0) {
    // Partial case: include best available with warning
    console.warn(`WARNING: Only ${passing.length} concepts passed 80% threshold`);
    const selected = [...passing];

    // Add best non-passing concepts to reach 3 (if available)
    const notPassing = sorted.filter(c => c.qualityScore.overall < 80);
    for (const concept of notPassing) {
      if (selected.length >= 3) break;
      concept.warning = `Below threshold (${concept.qualityScore.overall}%)`;
      selected.push(concept);
    }

    return selected;
  }

  // No concepts passed - return best 3 with warnings
  console.warn('WARNING: No concepts passed 80% threshold');
  return sorted.slice(0, 3).map(c => ({
    ...c,
    warning: `Below threshold (${c.qualityScore.overall}%)`
  }));
}
```

### COMPARISON MATRIX

Generate trade-off comparison matrix with relative ranking (<50 lines).

```javascript
// Generate comparison matrix with relative ranking
// Output: markdown table under 50 lines per ROADMAP.md
function generateComparisonMatrix(concepts) {
  // Sort by quality score (highest first) for column order
  const sorted = [...concepts].sort((a, b) =>
    b.qualityScore.overall - a.qualityScore.overall
  );

  // Calculate relative rankings for each dimension
  const rankings = {
    bomCost: rankByValue(sorted, c => c.bomCost, 'asc'),         // lower = Best
    complexity: rankByValue(sorted, c => c.qualityScore.breakdown.complexity, 'desc'), // higher = simpler = Best
    risk: rankByValue(sorted, c => c.qualityScore.breakdown.availability, 'desc'),     // higher availability = lower risk = Best
    leadTime: rankByValue(sorted, c => typeof c.worstLeadTime === 'number' ? c.worstLeadTime : 99, 'asc') // lower = Best
  };

  // Build markdown table (8 rows max per CONTEXT.md)
  let md = `# Comparison Matrix\n\n`;
  md += `| Dimension | ${sorted.map(c => c.name).join(' | ')} |\n`;
  md += `|-----------|${sorted.map(() => ':--------:').join('|')}|\n`;

  // Row 1: BOM Cost (absolute values + ranking)
  md += `| BOM Cost | ${sorted.map((c, i) => `$${c.bomCost.toFixed(2)} (${rankings.bomCost[i]})`).join(' | ')} |\n`;

  // Row 2: Complexity (relative ranking)
  md += `| Complexity | ${rankings.complexity.join(' | ')} |\n`;

  // Row 3: Supply Risk (relative ranking based on availability score)
  md += `| Supply Risk | ${rankings.risk.join(' | ')} |\n`;

  // Row 4: Coverage (absolute percentages)
  md += `| Coverage | ${sorted.map(c => `${c.qualityScore.breakdown.coverage}%`).join(' | ')} |\n`;

  // Row 5: Lead Time (absolute values)
  md += `| Lead Time | ${sorted.map(c => typeof c.worstLeadTime === 'number' ? `${c.worstLeadTime} wk` : 'N/A').join(' | ')} |\n`;

  // Row 6: Component Count
  md += `| Components | ${sorted.map(c => c.bom.length.toString()).join(' | ')} |\n`;

  // Row 7: Quality Score (absolute)
  md += `| Quality Score | ${sorted.map(c => `${c.qualityScore.overall}%`).join(' | ')} |\n`;

  // Row 8: Best For (qualitative summary)
  md += `| Best For | ${sorted.map(c => determineBestFor(c)).join(' | ')} |\n`;

  return md;
}

// Rank concepts by a value (returns array of 'Best'/'Mid'/'Worst' strings)
// Handles ties by assigning same rank
function rankByValue(concepts, getValue, order) {
  const values = concepts.map(getValue);

  // Sort values to determine ranks
  const sortedValues = [...values].sort((a, b) =>
    order === 'asc' ? a - b : b - a
  );

  // Assign ranks handling ties
  return values.map(v => {
    const position = sortedValues.indexOf(v);
    const reversePosition = sortedValues.length - 1 - sortedValues.lastIndexOf(v);

    // If first position (best)
    if (position === 0) return 'Best';

    // If last position (worst)
    if (reversePosition === 0) return 'Worst';

    // Otherwise middle
    return 'Mid';
  });
}

// Determine "Best For" summary based on concept strengths
function determineBestFor(concept) {
  const score = concept.qualityScore;

  // Check for dominant strength
  if (score.breakdown.coverage >= 90) return 'Max Features';
  if (score.breakdown.cost >= 85) return 'Budget';
  if (score.breakdown.availability >= 90) return 'Availability';
  if (score.breakdown.complexity >= 85) return 'Simplicity';

  // Default to balanced
  return 'Balanced';
}
```

### RECOMMENDATION

Generate directive recommendation with rationale and runner-up.

```javascript
// Generate recommendation section
// Per CONTEXT.md: directive tone, brief rationale, trade-off, runner-up
function generateRecommendation(concepts) {
  // Sort by quality score
  const sorted = [...concepts].sort((a, b) =>
    b.qualityScore.overall - a.qualityScore.overall
  );

  let recommended = sorted[0];
  const runnerUp = sorted[1];

  // If scores within 5%, favor simpler (lower complexity = higher complexity score)
  if (sorted.length >= 2) {
    const scoreDiff = sorted[0].qualityScore.overall - sorted[1].qualityScore.overall;
    if (scoreDiff <= 5) {
      // Favor concept with higher complexity score (simpler design)
      if (sorted[1].qualityScore.breakdown.complexity > sorted[0].qualityScore.breakdown.complexity) {
        recommended = sorted[1];
      }
    }
  }

  // Build rationale
  const strength = findTopStrength(recommended, sorted);
  const tradeoff = findMainTradeoff(recommended, sorted);
  const runnerUpReason = findRunnerUpReason(runnerUp, recommended);

  let md = `\n## Recommendation\n\n`;
  md += `**Recommended: ${recommended.name}**\n\n`;

  // Directive tone: "Recommend X because..."
  md += `Recommend ${recommended.name} for its ${strength.description}. `;
  md += `${strength.detail}\n\n`;

  // Trade-off acknowledgment
  if (tradeoff) {
    md += `Though it has ${tradeoff.description}, ${tradeoff.mitigation}.\n\n`;
  }

  // Runner-up
  if (runnerUp) {
    md += `**Runner-up:** Consider ${runnerUp.name} if ${runnerUpReason}.\n`;
  }

  return md;
}

// Find the top strength of the recommended concept
function findTopStrength(recommended, allConcepts) {
  const score = recommended.qualityScore;

  // Check if highest coverage
  if (score.breakdown.coverage >= 90) {
    return {
      description: 'highest coverage',
      detail: `It addresses ${score.breakdown.coverage}% of requirements including all Critical items.`
    };
  }

  // Check if lowest cost (within 10% of minimum)
  const costs = allConcepts.map(c => c.bomCost);
  const minCost = Math.min(...costs);
  if (recommended.bomCost <= minCost * 1.1) {
    return {
      description: 'lowest cost',
      detail: `At $${recommended.bomCost.toFixed(2)}, it offers the best value while meeting requirements.`
    };
  }

  // Check if best availability
  if (score.breakdown.availability >= 90) {
    return {
      description: 'best component availability',
      detail: `All parts are readily available with minimal supply chain risk.`
    };
  }

  // Default to balanced trade-offs
  return {
    description: 'balanced trade-offs',
    detail: 'It provides the best combination of cost, coverage, and complexity.'
  };
}

// Find the main trade-off of the recommended concept
function findMainTradeoff(recommended, allConcepts) {
  // Compare recommended to others
  const others = allConcepts.filter(c => c !== recommended);
  if (others.length === 0) return null;

  // Find where recommended is weakest relative to others
  const minOtherCost = Math.min(...others.map(c => c.bomCost));
  const maxOtherCoverage = Math.max(...others.map(c => c.qualityScore.breakdown.coverage));
  const maxOtherAvailability = Math.max(...others.map(c => c.qualityScore.breakdown.availability));

  // Check if cost is notably higher
  if (recommended.bomCost > minOtherCost * 1.2) {
    return {
      description: `higher BOM cost ($${recommended.bomCost.toFixed(2)} vs $${minOtherCost.toFixed(2)})`,
      mitigation: 'the additional investment provides better coverage and reliability'
    };
  }

  // Check if coverage is lower
  if (recommended.qualityScore.breakdown.coverage < maxOtherCoverage - 5) {
    return {
      description: 'slightly lower coverage',
      mitigation: 'it compensates with better cost and availability'
    };
  }

  // Check if availability is worse
  if (recommended.qualityScore.breakdown.availability < maxOtherAvailability - 10) {
    return {
      description: 'some supply chain considerations',
      mitigation: 'all critical components remain available through major distributors'
    };
  }

  return null; // No notable trade-off
}

// Find reason to consider the runner-up
function findRunnerUpReason(runnerUp, recommended) {
  if (!runnerUp) return 'no alternatives available';

  // Find runner-up's strength relative to recommended
  if (runnerUp.bomCost < recommended.bomCost * 0.85) {
    return 'budget is the primary constraint';
  }

  if (runnerUp.qualityScore.breakdown.availability > recommended.qualityScore.breakdown.availability) {
    return 'component availability and lead times are critical';
  }

  if (runnerUp.qualityScore.breakdown.coverage > recommended.qualityScore.breakdown.coverage) {
    return 'maximum feature coverage is essential';
  }

  if (runnerUp.qualityScore.breakdown.complexity > recommended.qualityScore.breakdown.complexity) {
    return 'development simplicity is prioritized';
  }

  return 'different trade-offs better match your priorities';
}
```

### CONCEPT FOLDER GENERATION

Create single README.md per concept with inline BOM, diagram, coverage, and references.

```javascript
// Generate concept README with all content inline
// Per CONTEXT.md: single file with block diagram, BOM, coverage, references
function generateConceptReadme(concept) {
  let md = `# Concept: ${concept.name}\n\n`;

  // Summary stats at top
  md += `**Quality Score:** ${concept.qualityScore.overall}%\n`;
  md += `**BOM Cost:** $${concept.bomCost.toFixed(2)}\n`;
  md += `**Coverage:** ${concept.qualityScore.breakdown.coverage}%`;
  if (concept.coverageByTier) {
    md += ` (Critical: ${concept.coverageByTier.Critical || 0}%, `;
    md += `Important: ${concept.coverageByTier.Important || 0}%, `;
    md += `Nice-to-have: ${concept.coverageByTier['Nice-to-have'] || 0}%)`;
  }
  md += `\n\n`;

  // Warning if below threshold
  if (concept.warning) {
    md += `> **Warning:** ${concept.warning}\n\n`;
  }

  // Architecture section with inline block diagram
  md += `## Architecture\n\n`;
  md += '```\n';
  md += concept.blockDiagram || '(Block diagram not available)';
  md += '\n```\n\n';

  // Bill of Materials section
  md += `## Bill of Materials\n\n`;
  md += generateBomTable(concept.bom);
  md += `\n**Total:** $${concept.bomCost.toFixed(2)}\n\n`;

  // Coverage Analysis section
  md += `## Coverage Analysis\n\n`;
  md += generateCoverageTable(concept);

  // Gaps section
  md += `\n### Gaps\n\n`;
  if (concept.gaps && concept.gaps.length > 0) {
    for (const gap of concept.gaps) {
      md += `- **${gap.id} (${gap.priority}):** ${gap.description}\n`;
    }
  } else {
    md += `- None - all requirements addressed\n`;
  }
  md += '\n';

  // References section (vendor app notes only: TI, ADI, ST)
  md += `## References\n\n`;
  const references = findVendorReferences(concept);
  if (references.length > 0) {
    for (const ref of references) {
      md += `- [${ref.title}](${ref.url}) - ${ref.description}\n`;
    }
  } else {
    md += `- No vendor reference designs applicable\n`;
  }

  return md;
}

// Generate BOM table with datasheet links inline
function generateBomTable(bom) {
  let md = '| Ref | Part | MPN | Manufacturer | Description | Qty | Price | Datasheet |\n';
  md += '|-----|------|-----|--------------|-------------|-----|-------|----------|\n';

  for (const part of bom) {
    const datasheet = part.datasheetUrl
      ? `[Link](${part.datasheetUrl})`
      : '-';
    const manufacturer = part.manufacturer || '-';
    const mpn = part.mpn || 'Generic';

    md += `| ${part.ref} | ${part.category || part.part} | ${mpn} | ${manufacturer} | ${part.description} | ${part.qty} | $${part.unitPrice.toFixed(2)} | ${datasheet} |\n`;
  }

  return md;
}

// Generate coverage analysis table
function generateCoverageTable(concept) {
  let md = '| Priority | Total | Covered | Coverage |\n';
  md += '|----------|-------|---------|----------|\n';

  const tiers = ['Critical', 'Important', 'Nice-to-have'];
  for (const tier of tiers) {
    const total = concept.coverageAnalysis?.reqCounts?.[tier] || 0;
    const covered = concept.coverageAnalysis?.coveredCounts?.[tier] || 0;
    const coverage = concept.coverageByTier?.[tier] || 0;
    md += `| ${tier} | ${total} | ${covered} | ${coverage}% |\n`;
  }

  return md;
}

// Find vendor reference designs (TI, ADI, ST only per CONTEXT.md)
function findVendorReferences(concept) {
  const references = [];
  const keyComponents = concept.bom.filter(p =>
    ['MCU', 'Regulator', 'Sensor', 'Wireless', 'Motor Driver', 'Power'].some(
      cat => (p.category || '').includes(cat) || (p.description || '').includes(cat)
    )
  );

  for (const part of keyComponents) {
    const mfr = (part.manufacturer || '').toLowerCase();

    // TI reference designs
    if (mfr.includes('texas') || mfr.includes('ti ') || mfr === 'ti') {
      references.push({
        title: `TI ${part.mpn} Reference Design`,
        url: `https://www.ti.com/product/${part.mpn}#design-development`,
        description: `Reference designs for ${part.description}`
      });
    }

    // ST reference designs
    if (mfr.includes('stm') || mfr.includes('st ') || mfr === 'st') {
      references.push({
        title: `ST ${part.mpn} Application Notes`,
        url: `https://www.st.com/en/product/${part.mpn}#documentation`,
        description: `Application notes for ${part.description}`
      });
    }

    // ADI reference designs
    if (mfr.includes('analog') || mfr.includes('adi') || mfr === 'adi') {
      references.push({
        title: `ADI ${part.mpn} Reference Circuit`,
        url: `https://www.analog.com/en/products/${part.mpn}#design-resources`,
        description: `Reference circuits for ${part.description}`
      });
    }
  }

  // Limit to 5 references per concept
  return references.slice(0, 5);
}
```

### STATUS FILE GENERATION

Generate status.md with summary and next steps (<30 lines).

```javascript
// Generate status file under 30 lines per ROADMAP.md
function generateStatusFile(concepts, outputPath) {
  const date = new Date().toISOString().split('T')[0];
  const sorted = [...concepts].sort((a, b) =>
    b.qualityScore.overall - a.qualityScore.overall
  );
  const recommended = sorted[0];

  let md = `# Status\n\n`;
  md += `**Created:** ${date}\n`;
  md += `**Recommended:** ${recommended.name}\n`;
  md += `**Status:** Awaiting Selection\n\n`;

  md += `## Concepts\n\n`;
  for (const c of sorted) {
    md += `- **${c.name}:** ${c.qualityScore.overall}% quality, $${c.bomCost.toFixed(2)} BOM`;
    if (c.warning) md += ` (${c.warning})`;
    md += `\n`;
  }

  md += `\n## Output Files\n\n`;
  md += `- comparison-matrix.md\n`;
  md += `- status.md\n`;
  for (const c of sorted) {
    md += `- ${c.slug}/README.md\n`;
  }

  md += `\n## Next Steps\n\n`;
  md += `1. Review comparison-matrix.md for trade-off analysis\n`;
  md += `2. Select preferred concept\n`;
  md += `3. Hand off selected concept folder to design engineer\n`;

  return md;
}
```

### MAIN WORKFLOW

Phase 1 orchestration bringing all pieces together.

```javascript
// Phase 1 main workflow
async function executePhase9(conceptNames = null) {
  const outputDir = '.librespin/07-final-output';

  // Step 1: Discover or use provided concept names
  if (!conceptNames || conceptNames.length === 0) {
    conceptNames = discoverConceptsFromPhase6();
    if (conceptNames.length === 0) {
      throw new Error('No concepts found in Phase 2 output. Run Phase 2 first.');
    }
    console.log(`Discovered ${conceptNames.length} concept(s) from Phase 2: ${conceptNames.join(', ')}`);
  }

  // Step 2: Load Phase 2 outputs
  const concepts = loadPhase6Outputs(conceptNames);

  if (concepts.length === 0) {
    throw new Error('No concepts available from Phase 2. Cannot generate output.');
  }

  // Step 2: Select top 3 concepts
  const selectedConcepts = selectTop3Concepts(concepts);

  // Step 3: Generate comparison matrix
  const comparisonMatrix = generateComparisonMatrix(selectedConcepts);

  // Step 4: Generate recommendation (appended to comparison matrix)
  const recommendation = generateRecommendation(selectedConcepts);
  const comparisonWithRec = comparisonMatrix + recommendation;

  // Step 5: Create output directory structure
  await createDirectory(outputDir);
  for (const concept of selectedConcepts) {
    await createDirectory(`${outputDir}/${concept.slug}`);
  }

  // Step 6: Generate concept folders with README.md each
  for (const concept of selectedConcepts) {
    const readme = generateConceptReadme(concept);
    await writeFile(`${outputDir}/${concept.slug}/README.md`, readme);
  }

  // Step 7: Write comparison-matrix.md
  await writeFile(`${outputDir}/comparison-matrix.md`, comparisonWithRec);

  // Step 8: Write status.md
  const statusFile = generateStatusFile(selectedConcepts, outputDir);
  await writeFile(`${outputDir}/status.md`, statusFile);

  // Step 9: Update librespin-concept-state.md
  await updateState({
    phase: 9,
    status: 'complete',
    outputFiles: [
      `${outputDir}/comparison-matrix.md`,
      `${outputDir}/status.md`,
      ...selectedConcepts.map(c => `${outputDir}/${c.slug}/README.md`)
    ],
    recommendedConcept: selectedConcepts[0].name
  });

  return {
    success: true,
    concepts: selectedConcepts.length,
    recommended: selectedConcepts[0].name,
    outputDir: outputDir,
    files: [
      'comparison-matrix.md',
      'status.md',
      ...selectedConcepts.map(c => `${c.slug}/README.md`)
    ]
  };
}
```

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

```javascript
// Phase 1 error scenarios
// - Missing Phase 2 files: STOP with error directing to run Phase 2 first
// - No concepts passed validation: Include best available with warnings
// - Missing BOM/diagram data: Generate partial README with placeholders
// - Vendor reference search fails: Proceed without references section
```

**Update state file** `.librespin/state.md` — set `phase` to `7-final-output`:

```javascript
const existingState = fs.readFileSync('.librespin/state.md', 'utf8');
const updatedState = existingState.replace(/^phase: .+$/m, `phase: '7-final-output'`);
fs.writeFileSync('.librespin/state.md', updatedState);
```

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
