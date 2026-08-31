// Rich per-feature case-study content for the "feature showcase" layout
// (portfolio-layout-prompt.md). Ward Round is real content; any other
// project id added later without an entry here falls back to the simpler
// case-study layout in work.ts.

export interface Quote {
  text: string;
  person: string;
}

export interface Persona {
  name: string;
  role: string;
  goal: string;
  painPoint: string;
}

export interface JourneyStage {
  stage: string;
  feeling: "frustrated" | "neutral" | "confident";
  note: string;
}

export interface ProcessStep {
  stage: string;
  note: string;
}

export interface Metric {
  value: string;
  label: string;
}

export interface EmpathyMap {
  says: string;
  thinks: string;
  feels: string;
  does: string;
}

export interface FeatureDetails {
  problemAnalysis: string[];
  userResearch: Quote[];
  researchStats?: string[]; // survey/behavioural findings alongside the quotes
  personas: Persona[];
  journey: JourneyStage[];
  empathyMap?: EmpathyMap; // shown alongside the journey when provided
  process: ProcessStep[];
  metrics: Metric[];
}

export interface CaseStudyFeature {
  id: string;
  title: string;
  designStatement: string;
  explanation: string[];
  experienceSteps: string[]; // labels for the simulated "Experience" animation
  details: FeatureDetails;
}

export interface CaseStudyHero {
  problem: string;
  solution: string;
  outcome: string;
}

export interface CaseStudy {
  hero: CaseStudyHero;
  features: CaseStudyFeature[];
  // When set, "Experience" opens this real interactive prototype full-size
  // (in an overlay) instead of the simulated step-through screens — one
  // prototype for the whole app, not per-feature.
  prototypeUrl?: string;
}

export const caseStudies: Record<string, CaseStudy> = {
  "ward-round": {
    prototypeUrl: "/prototypes/ward-round.html",
    hero: {
      problem:
        "Nurses spend 30–45 minutes per shift handover manually transferring patient information from paper notes to verbal communication. Critical details are missed, misunderstood, or lost entirely. In healthcare, these gaps can have life-threatening consequences.",
      solution:
        "Ward Round streamlines the handoff process by centralizing all patient information in a structured, digital format. Every critical detail is documented, verified, and transferred with zero information loss. Shift transitions that once took 45 minutes now take 15.",
      outcome: "67% faster handovers, 100% information retention, 94% fewer verbal miscommunications.",
    },
    features: [
      {
        id: "dashboard",
        title: "One View, All Information",
        designStatement:
          "The dashboard aggregates all patient data into a single, scannable view. Nurses see patient status, active medications, recent notes, and tasks at a glance — eliminating the need to hunt for information.",
        explanation: [
          "Every patient's information is organized by priority. Critical data (allergies, recent changes) appears at the top. Secondary information (history, notes) is accessible below. This hierarchy ensures nurses focus on what matters most during handovers.",
          "The interface updates in real-time, so when one nurse documents an update, all others see it instantly.",
        ],
        experienceSteps: [
          "Patient cards show status at a glance",
          "All patient data organized by priority",
          "Live updates ensure no missed information",
        ],
        details: {
          problemAnalysis: [
            "Nurses averaged 15+ minutes searching for patient info per shift.",
            "23% of handover time was spent retrieving scattered data.",
            "34% of communication errors came from incomplete information.",
            "Research showed nurses felt frustrated and inefficient hunting for basics before a handover could even begin.",
          ],
          userResearch: [
            {
              text: "I spend half my handover just gathering information from different places. By the time I have everything, I've lost track of what I needed to tell the next nurse.",
              person: "Senior Nurse, ICU",
            },
          ],
          researchStats: [
            "89% of nurses wanted centralized patient information.",
            "76% said missing information caused delays.",
            "82% would adopt a digital system if it saved time.",
          ],
          personas: [
            {
              name: "Sarah",
              role: "Senior Nurse — 8 years experience, 6–8 patients per shift",
              goal: "Complete handovers in under 20 minutes.",
              painPoint: "Spends 40+ minutes per handover, most of it gathering information first.",
            },
            {
              name: "Mark",
              role: "Junior Nurse — 2 years experience",
              goal: "Catch every critical detail during verbal handoffs.",
              painPoint: "Misses information during verbal handoffs and has no easy way to confirm he has it all.",
            },
          ],
          journey: [
            { stage: "Start of shift", feeling: "frustrated", note: "Anxiety: will I miss something important?" },
            { stage: "Gather notes", feeling: "frustrated", note: "Frustration: information scattered across sources." },
            { stage: "Listen to verbal handover", feeling: "frustrated", note: "Overwhelm: too much to absorb and retain at once." },
            { stage: "Document in system", feeling: "confident", note: "Relief: nothing lost, everything captured." },
          ],
          empathyMap: {
            says: "\"I want one place for everything.\"",
            thinks: "\"There must be a better way.\"",
            feels: "Stressed about missed information.",
            does: "Writes everything down by hand, asks for repeats.",
          },
          process: [
            { stage: "Simple list view", note: "Rejected — no sense of priority." },
            { stage: "Card-based dashboard", note: "Selected — clearest hierarchy, familiar card pattern, scales to many patients." },
            { stage: "Kanban board", note: "Rejected — too complex for a quick scan." },
            { stage: "Timeline view", note: "Rejected — sequence read as confusing rather than clarifying." },
          ],
          metrics: [
            { value: "45 → 15 min", label: "average handover time" },
            { value: "94% → 100%", label: "information completeness" },
            { value: "+67%", label: "nurse satisfaction" },
            { value: "−73%", label: "patient safety incidents related to handoff" },
          ],
        },
      },
      {
        id: "handover",
        title: "Handovers Made Simple",
        designStatement:
          "The handover interface guides both the outgoing and incoming nurse through a structured checklist. Nothing is missed. Both parties confirm understanding. Everything is documented for legal compliance.",
        explanation: [
          "The handover process follows a clinical protocol. The system prompts the outgoing nurse to cover each section — patient status, medications, recent changes, tasks, alerts. The incoming nurse reviews each section and confirms understanding.",
          "Once both confirm, the handover is complete and logged. This structure eliminates the \"did we talk about that?\" confusion that happens in verbal handovers.",
        ],
        experienceSteps: [
          "Structured format ensures nothing is missed",
          "Both nurses confirm each section",
          "Documented and logged for compliance",
        ],
        details: {
          problemAnalysis: [
            "The average verbal handover missed 3–5 critical details.",
            "There was no documentation of what was actually communicated.",
            "No proof of information transfer created real legal liability.",
            "Handover quality varied widely from nurse to nurse.",
          ],
          userResearch: [
            {
              text: "We keep forgetting to mention medication changes because there's no reminder. Then the new nurse finds out two hours later.",
              person: "Night Shift Nurse",
            },
          ],
          researchStats: ["91% of nurses wanted a checklist to ensure completeness."],
          personas: [
            {
              name: "Sarah",
              role: "Senior Nurse",
              goal: "Complete handovers faster and with less second-guessing.",
              painPoint: "No structure to confirm every section was actually covered.",
            },
          ],
          journey: [
            { stage: "Outgoing nurse reviews patient data", feeling: "neutral", note: "Opens the handover with everything already assembled." },
            { stage: "Systematic review", feeling: "neutral", note: "Covers each section in order, nothing skipped." },
            { stage: "Incoming nurse confirms understanding", feeling: "confident", note: "Listens and actively confirms each section." },
            { stage: "Both sign off", feeling: "confident", note: "Handover logged and complete." },
          ],
          process: [
            { stage: "Free-form notes", note: "Rejected — still missed information." },
            { stage: "Structured checklist", note: "Selected — ensures completeness, tested with 8 nurses, 100% preferred it." },
            { stage: "Q&A format", note: "Rejected — too rigid for real conversation." },
          ],
          metrics: [
            { value: "76% → 100%", label: "handover completeness" },
            { value: "+82%", label: "communication confidence" },
            { value: "45 → 15 min", label: "time to complete a handover" },
            { value: "0% → 100%", label: "compliance documentation" },
          ],
        },
      },
      {
        id: "tasks",
        title: "Nothing Falls Through the Cracks",
        designStatement:
          "Every task is documented in the system. Both nurses confirm the handover of each task. Notifications remind nurses about upcoming deadlines. Nothing is forgotten.",
        explanation: [
          "Tasks are assigned, tracked, and transferred during handover. The system shows which tasks are completed, in progress, or pending. When a task is transferred to the next shift, the incoming nurse confirms receipt.",
          "If a task reaches its deadline without completion, the system alerts all relevant nurses — eliminating the \"I thought you were handling that\" miscommunication.",
        ],
        experienceSteps: [
          "Visual status makes task flow clear",
          "Incoming nurse confirms each task",
          "System alerts prevent missed tasks",
        ],
        details: {
          problemAnalysis: [
            "41% of overdue medications were caused by forgotten handover tasks.",
            "The verbal task handover success rate was only 68%.",
            "There was no tracking of who had accepted which task.",
            "Task delays created real gaps in patient care.",
          ],
          userResearch: [
            {
              text: "I always write down tasks, but half the time the list gets lost or someone else already did it.",
              person: "General Ward Nurse",
            },
          ],
          personas: [
            {
              name: "Sarah",
              role: "Senior Nurse",
              goal: "Trust that nothing she handed off was forgotten.",
              painPoint: "Carries a mental load of tracking tasks that a paper list can't reliably hold.",
            },
          ],
          journey: [
            { stage: "Task created", feeling: "neutral", note: "An alert is raised as soon as it's assigned." },
            { stage: "Assigned to nurse", feeling: "neutral", note: "A notification confirms who owns it." },
            { stage: "Confirmed during handover", feeling: "confident", note: "Explicitly documented, not just mentioned." },
            { stage: "Completed or transferred", feeling: "confident", note: "Logged when done, or passed cleanly to the next shift." },
          ],
          process: [
            { stage: "Simple checklist", note: "Rejected — no status tracking." },
            { stage: "Kanban board", note: "Rejected — confusing to scan mid-handover." },
            { stage: "Task list with status", note: "Selected — clearest flow, status visible at a glance." },
          ],
          metrics: [
            { value: "78% → 96%", label: "task completion rate" },
            { value: "−89%", label: "forgotten tasks" },
            { value: "−67%", label: "task-related incidents" },
            { value: "0% → 100%", label: "handover task acknowledgment" },
          ],
        },
      },
      {
        id: "medications",
        title: "Accuracy in Every Dose",
        designStatement:
          "The drug chart is digital, color-coded, and shows medication status at a glance. Each medication lists dosage, frequency, route, and important interactions. Nothing is transcribed — information flows directly from the system.",
        explanation: [
          "Medications are the most critical information in a handover. The drug chart module displays all current medications in a standardized format: name, dose, frequency, route, and any alerts — allergies, interactions, recent changes.",
          "Nurses don't transcribe — they simply review and confirm, eliminating the transcription errors responsible for 23% of handover-related medication incidents.",
        ],
        experienceSteps: [
          "Visual status shows medication state",
          "All critical info in one place",
          "Critical alerts visible at a glance",
        ],
        details: {
          problemAnalysis: [
            "23% of medication errors traced back to handover transcription.",
            "Missed drug interactions occurred roughly 12 times a month.",
            "Dosage misreads caused 8 near-miss incidents a year.",
            "Verbal medication handover success sat at just 64%.",
          ],
          userResearch: [
            {
              text: "I always double-check medications because I don't trust my notes from the verbal handover. It takes forever.",
              person: "Ward Pharmacist",
            },
          ],
          personas: [
            {
              name: "Sarah",
              role: "Senior Nurse",
              goal: "Review medications quickly without re-checking everything by hand.",
              painPoint: "Doesn't fully trust handwritten notes taken during a rushed verbal handover.",
            },
            {
              name: "Ward Pharmacist",
              role: "Medication safety oversight",
              goal: "Catch interactions and allergy conflicts before they reach the patient.",
              painPoint: "Has no direct visibility into what was actually communicated at handover.",
            },
          ],
          journey: [
            { stage: "New shift begins", feeling: "neutral", note: "Nurse opens the drug chart directly." },
            { stage: "Reviews recent changes", feeling: "neutral", note: "Checks for new or modified medications." },
            { stage: "Confirms allergies & interactions", feeling: "confident", note: "System already flags anomalies." },
            { stage: "Signs off", feeling: "confident", note: "Medications confirmed, nothing transcribed by hand." },
          ],
          process: [
            { stage: "Medical standards compliance", note: "Format built to match clinical documentation standards." },
            { stage: "Color-coding", note: "Green/amber/red status for instant recognition." },
            { stage: "Interaction checking", note: "Automatic flagging of drug interactions." },
            { stage: "Allergy verification", note: "Cross-checked against patient record on every view." },
          ],
          metrics: [
            { value: "−73%", label: "medication errors" },
            { value: "12 → 2 min", label: "time to review the drug chart" },
            { value: "−89%", label: "missed interactions" },
            { value: "64% → 99%", label: "handover accuracy on medications" },
          ],
        },
      },
      {
        id: "admission",
        title: "From Admission to Handover",
        designStatement:
          "The admission form is structured and comprehensive. Every new patient has complete information from day one. Handovers for admitted patients are smooth because all baseline data is documented.",
        explanation: [
          "When a patient is admitted, nurses complete a structured form capturing demographics, medical history, allergies, current medications, and reason for admission. This becomes the foundation for every future handover.",
          "Instead of repeating basic information in every handover, nurses build on this established baseline — cutting handover time for new admissions in half.",
        ],
        experienceSteps: [
          "Structured form ensures completeness",
          "System suggests common conditions",
          "Critical information captured first",
        ],
        details: {
          problemAnalysis: [
            "New patient admissions averaged a 68-minute handover.",
            "45% of that time was spent gathering basic information.",
            "Incomplete admission data caused follow-up calls later.",
            "Repeated questions frustrated both nurses and patients.",
          ],
          userResearch: [
            {
              text: "Every time we admit someone new, the handover takes forever because we're answering the same questions.",
              person: "A&E Nurse",
            },
          ],
          personas: [
            {
              name: "Sarah",
              role: "Senior Nurse — receiving a new patient",
              goal: "Get a complete baseline without repeating questions already asked at admission.",
              painPoint: "Handovers for new admissions run long because basic information isn't yet established anywhere.",
            },
          ],
          journey: [
            { stage: "Patient arrives", feeling: "neutral", note: "Admission form started immediately." },
            { stage: "Basic info captured", feeling: "neutral", note: "System stores it as the baseline record." },
            { stage: "Handover to ward", feeling: "confident", note: "All info already documented and available." },
            { stage: "Incoming nurse reviews baseline", feeling: "confident", note: "Handover focuses on current status, not repetition." },
          ],
          process: [
            { stage: "Progressive disclosure", note: "Required information surfaces first, detail follows." },
            { stage: "Auto-population", note: "Pre-fills from the patient database where available." },
            { stage: "Mobile-optimized entry", note: "Built for fast entry during a busy admission." },
            { stage: "Validation", note: "Catches missing critical fields before submission." },
          ],
          metrics: [
            { value: "68 → 22 min", label: "new patient handover time" },
            { value: "54% → 100%", label: "information completeness at admission" },
            { value: "−88%", label: "follow-up calls for missing info" },
            { value: "91%", label: "admission forms completed on first attempt" },
          ],
        },
      },
      {
        id: "compliance",
        title: "Every Handover Documented",
        designStatement:
          "Every handover is documented and time-stamped. Both nurses sign off, creating a legal record of information transfer. Compliance logs provide audit trails for clinical governance.",
        explanation: [
          "The system maintains a complete log of every handover: what information was transferred, when, and which nurses participated. If an incident occurs, you can review exactly what information was available to each nurse at each point in time.",
          "This documentation satisfies clinical governance requirements, supports incident investigation, and protects nurses by proving they had complete information.",
        ],
        experienceSteps: [
          "Handover legally documented",
          "Full audit trail available",
          "Clinical governance requirements met",
        ],
        details: {
          problemAnalysis: [
            "There was no record of handover completeness.",
            "Clinical incidents couldn't establish what nurses actually knew.",
            "Compliance audits meant manually reviewing paper notes.",
            "No documented evidence of information transfer created real liability.",
          ],
          userResearch: [
            {
              text: "We have no proof of what we told the next nurse. If something goes wrong, we can't defend ourselves.",
              person: "Charge Nurse",
            },
          ],
          researchStats: ["100% of nurses wanted documented proof that a handover took place."],
          personas: [
            {
              name: "Ward Manager",
              role: "Clinical governance oversight",
              goal: "Produce a clean audit trail on demand, not after a scramble.",
              painPoint: "Compliance reviews meant manually piecing together paper notes after the fact.",
            },
          ],
          journey: [
            { stage: "Handover completed", feeling: "neutral", note: "Automatically logged, no extra step." },
            { stage: "Both nurses sign", feeling: "confident", note: "Digital signature captured." },
            { stage: "Audit review", feeling: "confident", note: "Complete record pulled instantly, weeks later." },
            { stage: "Incident investigation", feeling: "confident", note: "Timeline shows exactly what information was available and when." },
          ],
          process: [
            { stage: "GDPR-compliant logging", note: "Built to clinical governance data standards." },
            { stage: "Audit trail immutability", note: "Records can't be altered after signing." },
            { stage: "Digital signatures", note: "Both nurses confirm on record." },
            { stage: "Report generation", note: "One-click export for governance review." },
          ],
          metrics: [
            { value: "0% → 100%", label: "handovers documented" },
            { value: "−65%", label: "compliance audit time" },
            { value: "−89%", label: "legal liability incidents related to handover" },
            { value: "Instant", label: "audit trail accessibility" },
          ],
        },
      },
    ],
  },
};
