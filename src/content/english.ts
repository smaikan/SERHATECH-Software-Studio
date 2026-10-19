import {
  services,
  projects,
  processSteps,
  type Service,
  type Project,
} from "./studio";
import type { Locale } from "@/i18n/routing";

type ServiceCopy = Omit<Service, "slug" | "stack">;
const serviceCopy: ServiceCopy[] = [
  {
    title: "Custom web applications",
    short: "Applications shaped around your business.",
    description:
      "Admin panels, customer portals and business applications your team uses every day, on the web and on mobile when needed.",
    gains: [
      "One workspace instead of scattered spreadsheets",
      "Flows that match how your team works",
      "Comfortable on desktop and on the phone",
    ],
    benefit: "Panels and business apps",
    problem:
      "As a business grows, off-the-shelf tools fall short. The same information lives in several places and becomes hard to follow.",
    solution:
      "The application is designed around how the team actually works. Everyday tasks are brought into one place and the interface stays simple and easy to learn. Where useful, the same system also works with a mobile app.",
    scope: [
      "Needs analysis and screen flow planning",
      "Admin panels and user permissions",
      "Interfaces for desktop, tablet and phone",
      "Connections to existing systems and testing",
    ],
    scenario:
      "Following orders, stock levels and team tasks from a single panel.",
    node: "Application",
  },
  {
    title: "System integrations",
    short: "Let your tools talk to each other.",
    description:
      "Reliable data flow between accounting, e-commerce, customer management and internal tools, and an end to retyping.",
    gains: [
      "Enter information once, keep it current everywhere",
      "Fewer errors from manual transfers",
      "Clear control over who can access what",
    ],
    benefit: "Connected systems",
    problem:
      "When several systems keep the same information separately, people carry data by hand, and errors and delays follow.",
    solution:
      "Secure connections are set up between systems. Where each piece of information comes from, where it is updated and who can access it are clearly defined.",
    scope: [
      "Review of current systems and data flow",
      "Connections between systems",
      "Authorisation and access control",
      "Error monitoring and testing",
    ],
    scenario:
      "A website, a mobile app and an internal panel securely sharing the same product and customer information.",
    node: "Integration",
  },
  {
    title: "E-commerce systems",
    short: "From storefront to everyday operations.",
    description:
      "Shopify and PrestaShop stores, platform moves and solutions that connect the store to your business processes.",
    gains: [
      "Orderly product and variant management",
      "Lossless moves between platforms",
      "Simpler order and stock processes",
    ],
    benefit: "Store and operations",
    problem:
      "Platform changes can break product relationships, and daily operations may still be run by hand across several systems.",
    solution:
      "The store and the operations behind it are handled together. Transfer rules are defined up front, tested and applied in a controlled way.",
    scope: [
      "Store setup and customisation",
      "Product and data transfer between platforms",
      "Connecting stock, order and product processes",
      "Post-transfer checks and verification",
    ],
    scenario:
      "Moving a store to a new platform with its products, variants and related products intact.",
    node: "E-commerce",
  },
  {
    title: "Workflow automation",
    short: "Less time on repetitive work.",
    description:
      "Weekly reporting, data transfers and checks that run on their own, in a controlled way.",
    gains: [
      "Saves the team time every week",
      "Fewer mistakes in manual work",
      "Every step logged and traceable",
    ],
    benefit: "Repetitive work",
    problem:
      "Repeated work across spreadsheets, emails and panels takes time and invites mistakes.",
    solution:
      "The current workflow is mapped step by step first. Steps that suit automation are then introduced in a controlled, traceable way.",
    scope: [
      "Mapping the current workflow",
      "Automating reporting and data transfers",
      "Notification and approval steps",
      "Logging, monitoring and error alerts",
    ],
    scenario:
      "Order information from several sources prepared as a single report every morning.",
    node: "Automation",
  },
  {
    title: "Setup and launch",
    short: "Your application, safely online.",
    description:
      "Server setup, domain and security settings, backups and a smooth update routine.",
    gains: [
      "Secure, fast launch",
      "Regular backups",
      "Lower risk of downtime during updates",
    ],
    benefit: "Hosting and launch",
    problem:
      "Running an application safely and without interruption matters as much as building it. A poorly configured server causes trouble over time.",
    solution:
      "The production environment is planned around the application's needs. Setup, security, backups and update steps are documented and handed over.",
    scope: [
      "Server and domain configuration",
      "Secure connections and access settings",
      "Backup and update routine",
      "Usage and maintenance notes",
    ],
    scenario:
      "Launching a new business application securely under the company's domain.",
    node: "Infrastructure",
  },
  {
    title: "AI integrations",
    short: "Smart features where they actually help.",
    description:
      "Adding AI features such as summarising, classification and writing assistance to existing applications.",
    gains: [
      "Faster handling of time-consuming text work",
      "Fits into your existing system",
      "Results you can review",
    ],
    benefit: "Smart features",
    problem:
      "AI does not fit every task. Used in the wrong place, it adds cost and uncertainty.",
    solution:
      "The places where AI genuinely helps are identified first. The feature is then added as part of the existing application, in a measured and reviewable way.",
    scope: [
      "Identifying suitable use cases",
      "Adding AI features to an existing application",
      "Summarising, classification and writing assistance",
      "Output review and cost control",
    ],
    scenario:
      "Classifying incoming customer requests automatically and routing them to the right person.",
    node: "AI",
  },
];

type ProjectCopy = Pick<
  Project,
  | "name"
  | "category"
  | "kind"
  | "description"
  | "problem"
  | "solution"
  | "approach"
  | "challenge"
  | "result"
>;
const projectCopy: ProjectCopy[] = [
  {
    name: "Eleven Accessory",
    category: "E-commerce application",
    kind: "Product project",
    description:
      "An e-commerce application combining the storefront, product management and order handling.",
    problem:
      "The storefront customers see and the back office that manages products, orders and notifications had to be designed together.",
    solution:
      "The store and the admin side were built as parts of the same system. Payments (in test mode) and email notifications were connected to the order flow.",
    approach:
      "The storefront, business rules and data were kept as separate responsibilities, and the services were packaged to run together consistently.",
    challenge:
      "Keeping product information, admin actions, payments and email flows consistent with each other.",
    result:
      "A working application with a storefront, admin features, test payments and email notifications. No sales or customer figures are shared.",
  },
  {
    name: "Nemora Diary",
    category: "AI-assisted application",
    kind: "Product project",
    description:
      "A journalling application that pairs the writing experience with AI-assisted features.",
    problem:
      "AI features had to feel like a natural part of the app without getting in the way of the user.",
    solution:
      "The core flow and the AI service were kept apart; the AI feature was added as a layer that supports the daily journalling experience.",
    approach:
      "Application logic and external connections were separated so the app keeps working even when the AI service does not respond.",
    challenge:
      "Keeping the core flow independent of external responses and drawing clear connection boundaries.",
    result:
      "A working application combining the interface, application backend and AI connection. No user numbers or impact claims are made.",
  },
  {
    name: "Meta Analysis Panel",
    category: "Data and analysis panel",
    kind: "Product project",
    description:
      "An analysis panel presenting advertising, product and brand data on clear, filterable screens.",
    problem:
      "Advertising, product and brand data from different sources needed to be compared quickly.",
    solution:
      "Analysis screens were built where data can be filtered and compared, each organised around a specific review need.",
    approach:
      "Readability and fast filtering guided the work; every screen answers one review question.",
    challenge:
      "Presenting different data fields in one consistent interface that supports comparison and filtering.",
    result:
      "A working analysis panel with data views and filtering. No official partnership with Meta or performance improvement is claimed.",
  },
];

export function getServices(locale: Locale): Service[] {
  return locale === "tr"
    ? services
    : services.map((service, i) => ({ ...service, ...serviceCopy[i] }));
}
export function getProjects(locale: Locale): Project[] {
  return locale === "tr"
    ? projects
    : projects.map((project, i) => ({ ...project, ...projectCopy[i] }));
}
export function getProcessSteps(locale: Locale) {
  if (locale === "tr") return processSteps;
  return [
    {
      title: "Discovery call",
      detail:
        "How the business works today, the tools in use and the problem to solve are discussed.",
    },
    {
      title: "Needs analysis",
      detail:
        "Users, information flow and constraints are clarified; what is needed now is separated from what can wait.",
    },
    {
      title: "Scope and proposal",
      detail:
        "Deliverables, exclusions and the timeline are put in writing.",
    },
    {
      title: "Planning",
      detail:
        "The system's structure, connections and development steps are planned around the need.",
    },
    {
      title: "Development",
      detail:
        "Work progresses in working pieces; progress is shared at agreed points and feedback is gathered.",
    },
    {
      title: "Testing and review",
      detail:
        "Features, failure cases and device compatibility are tried against real usage scenarios.",
    },
    {
      title: "Launch and handover",
      detail:
        "The production environment is prepared, the application goes live and is handed over with usage notes.",
    },
    {
      title: "Support and next steps",
      detail:
        "Maintenance, support and further development are planned separately, as needed.",
    },
  ];
}
