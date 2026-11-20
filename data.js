/* =========================================================
   Save Every Drop – Demo Data & Actual Data Configuration
   =========================================================
   HOW TO REPLACE DEMO DATA WITH YOUR ACTUAL PROJECT DATA:
   1. Set `PROJECT_CONFIG.useDemoDataByDefault = false` below.
   2. Optionally add verified field reports/surveys into
      `ACTUAL_REPORTS` and `ACTUAL_SURVEYS` (or submit them
      directly through the web forms).
   3. Once you conduct both Before and After awareness surveys,
      replace `ACTUAL_BEFORE_AFTER = null` with your real
      measured percentages (template provided below).
   ========================================================= */

const PROJECT_CONFIG = {
  // Keep `true` for initial testing/demo.
  // Change to `false` when presenting ONLY real collected data.
  useDemoDataByDefault: true
};

// -------------------- DEMO DATA (Sample Only) --------------------
// Every item is explicitly flagged with `isDemo: true` so the UI
// and CSV exports always distinguish sample entries from real data.

const DEMO_REPORTS = [
  {
    id: "DEMO-R01",
    date: "2026-11-10",
    location: "Academic Block A – Ground Floor Washroom",
    issueType: "Leaking tap",
    description: "Washbasin tap #2 drips continuously even when fully closed.",
    photoDataUrl: "",
    status: "Open",
    isDemo: true
  },
  {
    id: "DEMO-R02",
    date: "2026-11-12",
    location: "Library Corridor – Drinking Water Cooler",
    issueType: "Water cooler issue",
    description: "Push lever sticks slightly, causing steady water overflow into the drain.",
    photoDataUrl: "",
    status: "Resolved",
    isDemo: true
  },
  {
    id: "DEMO-R03",
    date: "2026-11-14",
    location: "Science Lab Wing – 2nd Floor Sink",
    issueType: "Tap left running",
    description: "Sink tap found running unattended between class periods.",
    photoDataUrl: "",
    status: "Resolved",
    isDemo: true
  },
  {
    id: "DEMO-R04",
    date: "2026-11-16",
    location: "Hostel Block C – 1st Floor Washroom",
    issueType: "Toilet/washroom wastage",
    description: "Flush valve keeps running slowly after use.",
    photoDataUrl: "",
    status: "Open",
    isDemo: true
  }
];

const DEMO_SURVEYS = [
  {
    id: "DEMO-S01",
    date: "2026-11-11",
    awareness: "Moderately aware",
    noticeWastage: "Frequently",
    reportLeaks: "No, I do not know where to report",
    remindersInfluence: "Yes, definitely",
    suggestion: "Put QR code reporting posters near washrooms and coolers.",
    isDemo: true
  },
  {
    id: "DEMO-S02",
    date: "2026-11-12",
    awareness: "Slightly aware",
    noticeWastage: "Sometimes",
    reportLeaks: "Rarely",
    remindersInfluence: "Yes, definitely",
    suggestion: "Inspect water cooler taps once a week.",
    isDemo: true
  },
  {
    id: "DEMO-S03",
    date: "2026-11-13",
    awareness: "Very aware",
    noticeWastage: "Frequently",
    reportLeaks: "Sometimes",
    remindersInfluence: "Probably yes",
    suggestion: "Install push-tap auto shutoff faucets in busy washrooms.",
    isDemo: true
  },
  {
    id: "DEMO-S04",
    date: "2026-11-15",
    awareness: "Not aware",
    noticeWastage: "Sometimes",
    reportLeaks: "No, I do not know where to report",
    remindersInfluence: "Probably yes",
    suggestion: "Share short conservation reminders during student orientation.",
    isDemo: true
  },
  {
    id: "DEMO-S05",
    date: "2026-11-16",
    awareness: "Moderately aware",
    noticeWastage: "Frequently",
    reportLeaks: "Rarely",
    remindersInfluence: "Yes, definitely",
    suggestion: "Display a simple maintenance contact number near every cooler.",
    isDemo: true
  }
];

const DEMO_ACTIONS = [
  { id: "DEMO-A01", tipId: "tip-1", title: "Turn off taps properly", date: "2026-11-11", isDemo: true },
  { id: "DEMO-A02", tipId: "tip-2", title: "Report leaking taps", date: "2026-11-12", isDemo: true },
  { id: "DEMO-A03", tipId: "tip-4", title: "Use only the required amount of water", date: "2026-11-14", isDemo: true }
];

// Sample Before/After structure (ONLY shown while Demo Data is active
// and no ACTUAL_BEFORE_AFTER data has been entered).
const DEMO_BEFORE_AFTER = {
  labels: ["Aware of Campus Wastage (%)", "Know How to Report Leaks (%)", "Actively Save Water Daily (%)"],
  before: [42, 18, 55],
  after: [78, 68, 82]
};

// -------------------- ACTUAL COLLECTED DATA --------------------
// Keep these empty / null until you collect genuine campus evidence.
// Anything submitted through the website forms is automatically saved
// in localStorage as Actual Data (`isDemo: false`).

const ACTUAL_REPORTS = [
  // Example format if you want to hardcode verified field reports:
  // {
  //   id: "R-101",
  //   date: "2026-11-22",
  //   location: "Engineering Block – 1st Floor Cooler",
  //   issueType: "Water cooler issue",
  //   description: "Steady leak observed at 11:30 AM.",
  //   photoDataUrl: "",
  //   status: "Open",
  //   isDemo: false
  // }
];

const ACTUAL_SURVEYS = [
  // Example format if you want to hardcode verified survey entries:
  // {
  //   id: "S-101",
  //   date: "2026-11-22",
  //   awareness: "Moderately aware",
  //   noticeWastage: "Frequently",
  //   reportLeaks: "No, I do not know where to report",
  //   remindersInfluence: "Yes, definitely",
  //   suggestion: "Place small reminder stickers above washbasins.",
  //   isDemo: false
  // }
];

// Replace `null` with an object once you collect real pre- and post-intervention results:
const ACTUAL_BEFORE_AFTER = null;
/*
const ACTUAL_BEFORE_AFTER = {
  labels: ["Aware of Campus Wastage (%)", "Know How to Report Leaks (%)", "Actively Save Water Daily (%)"],
  before: [40, 15, 50], // Replace with your real baseline survey percentages
  after: [75, 65, 80]   // Replace with your real follow-up survey percentages
};
*/