import { readme } from "./readme";
import { projectData } from "./projects/projectData";
import { timeline } from "./experience/timeline";
import { tools } from "./tools";
import { contact } from "./contact";

const fileContents: Record<string, string> = {
  "portfolio/README.md": readme,
  "portfolio/tools.css": tools,
  "portfolio/contact.css": contact,
  "portfolio/projects/crime-prediction.md": projectData["crime-prediction"],
  "portfolio/projects/football-analytics.md": projectData["football-analytics"],
  "portfolio/projects/yelp-analysis.md": projectData["yelp-analysis"],
  "portfolio/experience/timeline.md": timeline,
};

export function getFileContent(path: string): string {
  return fileContents[path] || `// File not found: ${path}`;
}
