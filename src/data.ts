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
    id: "ward-round",
    title: "Ward Round",
    description: "Digital handoff system that eliminates paper-based nurse shift transitions.",
    tags: ["UX Research", "UI Design", "Healthcare"],
    year: "2024",
    seed: 3,
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
