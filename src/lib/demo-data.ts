export type DemoPatient = {
  id: string;
  name: string;
  dateOfBirth: string;
  age: number;
  state: string;
  phone: string;
  email: string;
  status: "Eligible" | "Review";
  lastVisit: string;
  nextVisit: string;
  carePlan: string;
};

export const demoPatients: DemoPatient[] = [
  {
    id: "pat_ada_zieme",
    name: "Ada Zieme",
    dateOfBirth: "Mar 20, 2002",
    age: 24,
    state: "CA",
    phone: "(415) 555-0142",
    email: "ada.zieme@example.com",
    status: "Eligible",
    lastVisit: "Jul 22, 2026",
    nextVisit: "Aug 19, 2026",
    carePlan: "Metabolic health follow-up",
  },
  {
    id: "pat_amelia_aufderhar",
    name: "Amelia Aufderhar",
    dateOfBirth: "Aug 9, 1989",
    age: 36,
    state: "MI",
    phone: "(313) 555-0184",
    email: "amelia.aufderhar@example.com",
    status: "Eligible",
    lastVisit: "Jul 18, 2026",
    nextVisit: "Aug 15, 2026",
    carePlan: "Weight management",
  },
  {
    id: "pat_bennie_wintheiser",
    name: "Bennie Wintheiser",
    dateOfBirth: "Sep 12, 1988",
    age: 37,
    state: "OH",
    phone: "(614) 555-0168",
    email: "bennie.wintheiser@example.com",
    status: "Eligible",
    lastVisit: "Jul 10, 2026",
    nextVisit: "Aug 7, 2026",
    carePlan: "Hormone optimization",
  },
  {
    id: "pat_denise_kuhn",
    name: "Denise Kuhn",
    dateOfBirth: "May 22, 1991",
    age: 35,
    state: "OH",
    phone: "(216) 555-0127",
    email: "denise.kuhn@example.com",
    status: "Review",
    lastVisit: "Jul 8, 2026",
    nextVisit: "Jul 31, 2026",
    carePlan: "Lab review required",
  },
  {
    id: "pat_hector_lebsack",
    name: "Hector Lebsack",
    dateOfBirth: "Dec 4, 1990",
    age: 35,
    state: "TX",
    phone: "(512) 555-0191",
    email: "hector.lebsack@example.com",
    status: "Eligible",
    lastVisit: "Jul 3, 2026",
    nextVisit: "Aug 5, 2026",
    carePlan: "Longevity program",
  },
  {
    id: "pat_matthew_kihn",
    name: "Matthew Kihn",
    dateOfBirth: "Nov 26, 1982",
    age: 43,
    state: "MI",
    phone: "(248) 555-0109",
    email: "matthew.kihn@example.com",
    status: "Review",
    lastVisit: "Jun 29, 2026",
    nextVisit: "Jul 30, 2026",
    carePlan: "Medication reconciliation",
  },
];

export type DemoAppointment = {
  id: string;
  time: string;
  duration: string;
  patient: string;
  type: string;
  mode: "Telehealth" | "Office";
  status: "Confirmed" | "Checked in" | "Needs intake";
};

export const demoSchedule: Record<string, DemoAppointment[]> = {
  "Jul 29": [
    {
      id: "apt_1",
      time: "9:00 AM",
      duration: "30 min",
      patient: "Ada Zieme",
      type: "Metabolic follow-up",
      mode: "Telehealth",
      status: "Confirmed",
    },
    {
      id: "apt_2",
      time: "10:15 AM",
      duration: "45 min",
      patient: "Denise Kuhn",
      type: "Lab review",
      mode: "Office",
      status: "Checked in",
    },
    {
      id: "apt_3",
      time: "1:30 PM",
      duration: "30 min",
      patient: "Hector Lebsack",
      type: "Longevity consult",
      mode: "Telehealth",
      status: "Needs intake",
    },
    {
      id: "apt_4",
      time: "3:00 PM",
      duration: "30 min",
      patient: "Amelia Aufderhar",
      type: "Weight management",
      mode: "Telehealth",
      status: "Confirmed",
    },
  ],
  "Jul 30": [
    {
      id: "apt_5",
      time: "9:30 AM",
      duration: "30 min",
      patient: "Matthew Kihn",
      type: "Medication reconciliation",
      mode: "Telehealth",
      status: "Confirmed",
    },
    {
      id: "apt_6",
      time: "11:00 AM",
      duration: "45 min",
      patient: "Bennie Wintheiser",
      type: "Hormone follow-up",
      mode: "Office",
      status: "Confirmed",
    },
    {
      id: "apt_7",
      time: "2:15 PM",
      duration: "30 min",
      patient: "Ada Zieme",
      type: "Care-plan check-in",
      mode: "Telehealth",
      status: "Needs intake",
    },
  ],
  "Jul 31": [
    {
      id: "apt_8",
      time: "8:45 AM",
      duration: "45 min",
      patient: "Denise Kuhn",
      type: "Treatment planning",
      mode: "Office",
      status: "Confirmed",
    },
    {
      id: "apt_9",
      time: "12:30 PM",
      duration: "30 min",
      patient: "Hector Lebsack",
      type: "Results review",
      mode: "Telehealth",
      status: "Confirmed",
    },
  ],
};

export const demoOrders = [
  {
    id: "rx_01K48PF9",
    patient: "Ada Zieme",
    medication: "Semaglutide + B12",
    pharmacy: "Affinity Test Pharmacy A",
    status: "Draft",
    updated: "8 min ago",
  },
  {
    id: "rx_01K48NQ2",
    patient: "Amelia Aufderhar",
    medication: "Tirzepatide + B12",
    pharmacy: "Affinity Test Pharmacy A",
    status: "Submitted",
    updated: "1 hr ago",
  },
  {
    id: "rx_01K47ZZ8",
    patient: "Bennie Wintheiser",
    medication: "Enclomiphene",
    pharmacy: "Affinity Test Pharmacy B",
    status: "Accepted",
    updated: "Yesterday",
  },
] as const;

export const demoDocuments = [
  {
    id: "doc_1",
    name: "Metabolic intake questionnaire",
    patient: "Ada Zieme",
    category: "Intake",
    updated: "Jul 29, 2026",
    status: "Signed",
    summary: "Medical history, current medications, goals, and consent acknowledgements.",
  },
  {
    id: "doc_2",
    name: "Telehealth consent",
    patient: "Amelia Aufderhar",
    category: "Consent",
    updated: "Jul 28, 2026",
    status: "Signed",
    summary: "Consent for remote care delivery and electronic communications.",
  },
  {
    id: "doc_3",
    name: "Lab results — comprehensive panel",
    patient: "Denise Kuhn",
    category: "Labs",
    updated: "Jul 28, 2026",
    status: "Needs review",
    summary: "CBC, CMP, thyroid, lipid, and hormone panel received from the lab.",
  },
  {
    id: "doc_4",
    name: "Medication acknowledgement",
    patient: "Hector Lebsack",
    category: "Consent",
    updated: "Jul 26, 2026",
    status: "Signed",
    summary: "Patient acknowledgement for medication use and fulfillment.",
  },
] as const;

export type DemoMessage = {
  id: string;
  author: "patient" | "provider";
  body: string;
  time: string;
};

export type DemoThread = {
  id: string;
  patient: string;
  subject: string;
  preview: string;
  time: string;
  unread: boolean;
  messages: DemoMessage[];
};

export const demoThreads: DemoThread[] = [
  {
    id: "thread_1",
    patient: "Ada Zieme",
    subject: "Injection timing",
    preview: "Should I keep the same day when I travel?",
    time: "10:42 AM",
    unread: true,
    messages: [
      {
        id: "msg_1",
        author: "patient",
        body: "I travel next week. Should I keep the same injection day while I am away?",
        time: "10:31 AM",
      },
      {
        id: "msg_2",
        author: "provider",
        body: "Yes. Keep the same weekly schedule and store the medication as directed.",
        time: "10:38 AM",
      },
      {
        id: "msg_3",
        author: "patient",
        body: "Perfect, thank you. I will keep it on Tuesday.",
        time: "10:42 AM",
      },
    ],
  },
  {
    id: "thread_2",
    patient: "Denise Kuhn",
    subject: "Lab results",
    preview: "The lab portal says my results are ready.",
    time: "9:16 AM",
    unread: true,
    messages: [
      {
        id: "msg_4",
        author: "patient",
        body: "The lab portal says my results are ready. Do I need to upload anything?",
        time: "9:16 AM",
      },
    ],
  },
  {
    id: "thread_3",
    patient: "Hector Lebsack",
    subject: "Next appointment",
    preview: "Wednesday at 12:30 works for me.",
    time: "Yesterday",
    unread: false,
    messages: [
      {
        id: "msg_5",
        author: "provider",
        body: "Would Wednesday at 12:30 PM work for your results review?",
        time: "Yesterday, 3:05 PM",
      },
      {
        id: "msg_6",
        author: "patient",
        body: "Wednesday at 12:30 works for me.",
        time: "Yesterday, 3:18 PM",
      },
    ],
  },
];
