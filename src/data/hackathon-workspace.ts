export type HackathonTrack = {
  id: string;
  name: string;
  organization: string;
  description: string;
  status: "Open" | "Upcoming" | "Confirmed";
  submissionRequirements: string[];
  judgingCriteria: string[];
  resources: Array<{ label: string; href: string }>;
};

export type HackathonPhase = {
  id: string;
  name: string;
  phaseNumber: number;
  type: "online" | "onsite";
  status: "Upcoming" | "Active" | "Completed";
  startDate: string;
  endDate: string;
  venue: string;
  description: string;
  requirements: string[];
  attendanceRequirements?: string[];
  checkInInstructions?: string;
  onlineLinks?: Array<{ label: string; href: string }>;
};

export type HackathonRule = {
  id: string;
  category: "eligibility" | "team-size" | "submissions" | "code-of-conduct" | "judging";
  title: string;
  content: string;
};

export type HackathonTheme = {
  id: string;
  title: string;
  description: string;
  track: string;
  technologies: string[];
};

export type HackathonProblemStatement = {
  id: string;
  title: string;
  description: string;
  objectives: string[];
  requirements: string[];
  deliverables: string[];
  evaluationCriteria: string[];
};

export type HackathonResult = {
  id: string;
  track: string;
  participantOrTeam: string;
  award: string;
  position: string;
  status: "draft" | "published" | "archived";
  summary: string;
  projectTitle?: string;
};

export type HackathonRegistration = {
  id: string;
  registrationType: "individual" | "team";
  participantName: string;
  email: string;
  phone?: string;
  collegeOrUsn?: string;
  teamName?: string;
  teamSize?: number;
  teamMembers?: Array<{ name: string; email: string }>;
  track: string;
  registeredAt: string;
  status: "confirmed" | "waitlisted" | "in_review";
};

export type HackathonAnnouncement = {
  id: string;
  title: string;
  content: string;
  published: boolean;
  date: string;
};

export type HackathonFaq = {
  id: string;
  question: string;
  answer: string;
  category: "eligibility" | "format" | "submissions" | "mentorship";
};

export const hackathonWorkspaceData = {
  id: "vertex-global-hackathon-2026",
  title: "Vertex Global Hackathon 2026",
  slug: "hackathon-workspace",
  banner: "/sih-2026-logo.png",
  description:
    "A shared innovation sprint bringing together four tracks, online and on-site execution, and a single unified community workspace for participants, mentors, and organizers.",
  registrationStatus: "Open" as "Open" | "Closed",
  registrationDeadline: "To Be Announced",
  startDate: "To Be Announced",
  endDate: "To Be Announced",
  eventDateLabel: "Date To Be Announced",
  eventObjective:
    "Create an inclusive, multidisciplinary hackathon experience that blends AI, product engineering, systems intelligence, and real-world impact across four collaborative tracks.",
  organizations: ["Sarvam AI", "Abscissa", "Open Innovation", "To Be Announced"],
  announcementLead:
    "Workspace updates appear here in real time as mentorship schedules, track briefs, and judging rubrics are confirmed.",
  tracks: [
    {
      id: "sarvam-ai",
      name: "SARVAM AI",
      organization: "Sarvam AI",
      description: "To Be Announced",
      status: "Confirmed",
      submissionRequirements: ["To Be Announced"],
      judgingCriteria: ["To Be Announced"],
      resources: [
        { label: "Sarvam AI Documentation", href: "https://www.sarvam.ai/" },
        { label: "Indic Language Models API", href: "https://www.sarvam.ai/" },
      ],
    },
    {
      id: "abscissa",
      name: "ABSCISSA",
      organization: "Abscissa",
      description: "To Be Announced",
      status: "Confirmed",
      submissionRequirements: ["To Be Announced"],
      judgingCriteria: ["To Be Announced"],
      resources: [
        { label: "Abscissa Developer Portal", href: "https://abscissa.in/" },
        { label: "Data Pipeline Playbook", href: "https://abscissa.in/" },
      ],
    },
    {
      id: "open-innovation",
      name: "OPEN INNOVATION",
      organization: "Open Innovation",
      description: "To Be Announced",
      status: "Open",
      submissionRequirements: ["To Be Announced"],
      judgingCriteria: ["To Be Announced"],
      resources: [
        { label: "Vertex Project Incubator", href: "/projects" },
        { label: "Open Source Toolkit", href: "https://github.com" },
      ],
    },
    {
      id: "to-be-announced",
      name: "TO BE ANNOUNCED",
      organization: "To Be Announced",
      description: "To Be Announced",
      status: "Upcoming",
      submissionRequirements: ["To Be Announced"],
      judgingCriteria: ["To Be Announced"],
      resources: [
        { label: "Public Event Documentation", href: "/events/hackathon-workspace" },
        { label: "Organizer Contact for Sponsors", href: "mailto:vertex@reva.edu.in" },
      ],
    },
  ] as HackathonTrack[],
  phases: [
    {
      id: "online-phase",
      name: "Online",
      phaseNumber: 1,
      type: "online",
      status: "Upcoming",
      startDate: "To Be Announced",
      endDate: "To Be Announced",
      venue: "To Be Announced",
      description: "To Be Announced",
      requirements: ["To Be Announced"],
    },
    {
      id: "onsite-phase",
      name: "On-site",
      phaseNumber: 2,
      type: "onsite",
      status: "Upcoming",
      startDate: "To Be Announced",
      endDate: "To Be Announced",
      venue: "To Be Announced",
      description: "To Be Announced",
      requirements: ["To Be Announced"],
    },
  ] as HackathonPhase[],
  rules: [
    {
      id: "rules-eligibility",
      category: "eligibility",
      title: "Eligibility",
      content:
        "Open to undergraduate and postgraduate students from recognized universities and colleges. Cross-college teams and multidisciplinary teams (engineers, designers, product minds) are welcomed.",
    },
    {
      id: "rules-team-size",
      category: "team-size",
      title: "Team Size & Formation",
      content:
        "Teams may consist of 2 to 4 members. Solo participants can register individually and will be matched during the team-formation mixer in Phase 1.",
    },
    {
      id: "rules-submissions",
      category: "submissions",
      title: "Submission Guidelines",
      content:
        "All code must be authored during the hackathon sprint. Use of open-source libraries and APIs is encouraged; however, pre-built proprietary applications will result in disqualification.",
    },
    {
      id: "rules-code-of-conduct",
      category: "code-of-conduct",
      title: "Code of Conduct",
      content:
        "Vertex upholds an inclusive, harassment-free environment. Respect fellow participants, mentors, and event staff. Any form of discrimination, academic dishonesty, or disruptive behavior will lead to immediate removal.",
    },
    {
      id: "rules-judging",
      category: "judging",
      title: "Judging Criteria & Rubric",
      content:
        "Evaluations are conducted objectively across four dimensions: Impact & Originality (30%), Technical Execution & Architecture (30%), Design & Usability (20%), and Presentation & Q&A (20%).",
    },
  ] as HackathonRule[],
  themes: [
    {
      id: "theme-ai-product",
      title: "To Be Announced",
      description: "To Be Announced",
      track: "SARVAM AI",
      technologies: ["To Be Announced"],
    },
    {
      id: "theme-data-intelligence",
      title: "To Be Announced",
      description: "To Be Announced",
      track: "ABSCISSA",
      technologies: ["To Be Announced"],
    },
    {
      id: "theme-open-innovation",
      title: "To Be Announced",
      description: "To Be Announced",
      track: "OPEN INNOVATION",
      technologies: ["To Be Announced"],
    },
    {
      id: "theme-configurable",
      title: "To Be Announced",
      description: "To Be Announced",
      track: "TO BE ANNOUNCED",
      technologies: ["To Be Announced"],
    },
  ] as HackathonTheme[],
  problemStatements: {
    "sarvam-ai": [
      {
        id: "sarvam-ps-tba",
        title: "To Be Announced",
        description: "To Be Announced",
        objectives: [],
        requirements: [],
        deliverables: [],
        evaluationCriteria: [],
      },
    ],
    abscissa: [
      {
        id: "abscissa-ps-tba",
        title: "To Be Announced",
        description: "To Be Announced",
        objectives: [],
        requirements: [],
        deliverables: [],
        evaluationCriteria: [],
      },
    ],
    "open-innovation": [
      {
        id: "open-innovation-ps-tba",
        title: "To Be Announced",
        description: "To Be Announced",
        objectives: [],
        requirements: [],
        deliverables: [],
        evaluationCriteria: [],
      },
    ],
    "to-be-announced": [
      {
        id: "track4-ps-tba",
        title: "To Be Announced",
        description: "To Be Announced",
        objectives: [],
        requirements: [],
        deliverables: [],
        evaluationCriteria: [],
      },
    ],
  } as Record<string, HackathonProblemStatement[]>,
  results: [] as HackathonResult[],
  announcements: [] as HackathonAnnouncement[],
  faqs: [
    {
      id: "faq-eligibility",
      category: "eligibility",
      question: "Who is eligible to participate in the Vertex Global Hackathon 2026?",
      answer:
        "Undergraduate and postgraduate students enrolled in recognized universities and technical institutes are eligible. Cross-college and multidisciplinary teams (combining software engineering, UI/UX design, data science, and domain expertise) are fully supported.",
    },
    {
      id: "faq-team-size",
      category: "eligibility",
      question: "What are the team size constraints? Can I register individually?",
      answer:
        "Teams can consist of 2 to 4 builders. Solo participants are also welcome to register individually; our team-formation mixer on Discord during Phase 1 will assist in matching solo builders with complementary teams.",
    },
    {
      id: "faq-tracks",
      category: "format",
      question: "What are the four participating tracks, and can our team change tracks?",
      answer:
        "The tracks are SARVAM AI, ABSCISSA, OPEN INNOVATION, and a fourth track to be announced. Problem statements are to be announced.",
    },
    {
      id: "faq-two-phases",
      category: "format",
      question: "How do the online and on-site phases connect?",
      answer: "The phases are Online and On-site. Dates and schedules are to be announced.",
    },
    {
      id: "faq-fees",
      category: "eligibility",
      question: "Is there any registration fee or cost to enter?",
      answer:
        "No. Participation in the Vertex Global Hackathon 2026 is completely free of cost for all student participants.",
    },
    {
      id: "faq-submissions",
      category: "submissions",
      question: "What are the submission deliverables required for evaluation?",
      answer:
        "Teams must provide a public or shared GitHub repository with a detailed setup guide, a 3-minute video walkthrough demonstrating functionality, and a brief architectural design document explaining system components.",
    },
    {
      id: "faq-mentorship",
      category: "mentorship",
      question: "How will mentor reviews and office hours be scheduled?",
      answer:
        "Mentors from Sarvam AI, Abscissa, and Vertex will host scheduled Discord office hours during Phase 1 to review solution designs, and will provide in-person code reviews during Phase 2 sprint checkpoints.",
    },
  ] as HackathonFaq[],
};

export const hackathonPublicEvent = {
  id: hackathonWorkspaceData.id,
  title: hackathonWorkspaceData.title,
  slug: hackathonWorkspaceData.slug,
  description: hackathonWorkspaceData.description,
  registrationDeadline: hackathonWorkspaceData.registrationDeadline,
  registrationStatus: hackathonWorkspaceData.registrationStatus,
  eventDate: hackathonWorkspaceData.eventDateLabel,
  location: "To Be Announced",
  tag: "Hackathon",
  coverUrl: hackathonWorkspaceData.banner,
  tracks: hackathonWorkspaceData.tracks.map((track) => track.name),
  phases: hackathonWorkspaceData.phases.map((phase) => phase.name),
};
