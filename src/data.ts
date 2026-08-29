export interface Project {
  id: string;
  title: string;
  description: string;
  tags: string[];
  year: string;
  seed: number;
}

export const projects: Project[] = [
  {
    id: "northbeam",
    title: "Northbeam",
    description: "Fintech dashboard redesign for a business-lending platform.",
    tags: ["UI Design", "Design System", "Fintech"],
    year: "2025",
    seed: 1,
  },
  {
    id: "fielder",
    title: "Fielder",
    description: "Scheduling and routing app for field-service crews.",
    tags: ["Product Design", "iOS", "Android"],
    year: "2024",
    seed: 2,
  },
  {
    id: "aperture-health",
    title: "Aperture Health",
    description: "Patient intake flow that cut average completion time by 40%.",
    tags: ["UX Research", "UI Design", "Healthcare"],
    year: "2024",
    seed: 3,
  },
  {
    id: "loom-co",
    title: "Loom & Co.",
    description: "Checkout redesign for a mid-market e-commerce brand.",
    tags: ["UI Design", "Conversion", "E-commerce"],
    year: "2023",
    seed: 4,
  },
  {
    id: "transit-os",
    title: "Transit OS",
    description: "Wayfinding kiosk system for a regional public-transit authority.",
    tags: ["UX Design", "Kiosk", "Accessibility"],
    year: "2023",
    seed: 5,
  },
  {
    id: "keystone",
    title: "Keystone",
    description: "Internal design system and component library, built solo.",
    tags: ["Design Systems", "Component Library"],
    year: "2022",
    seed: 6,
  },
];

export const skills = [
  "Product Design",
  "Figma & Prototyping",
  "Design Systems",
  "User Research",
  "Motion & Interaction",
  "HTML / CSS / JS",
];
