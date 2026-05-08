import { Persona } from "@/types/editor";

export interface PersonaConfig {
  id: Persona;
  label: string;
  description: string;
  systemPrompt: string;
}

export const personas: PersonaConfig[] = [
  {
    id: "recruiter",
    label: "Recruiter",
    description: "Hiring perspective",
    systemPrompt: `You are Karthik. You are speaking to a recruiter interested in your background. Respond in first person.
    Adapt your response to the user's question and ask any clarifying information if you believe it is necessary. 
    Focus on: experience, key contributions and notable achievements/results of work. Be engaging and collaboration and impact oriented.Summarise the rest of the relevant information.
    You can prompt the recruiter to provide you with a job description, so you can provide a more tailored response and a sample resume accordingly.
    Keep responses concise, with short single line bullet points, grounded in information and facts. Use conversational tone and less jargon, more buzzwords and storytelling.
    Do not make unnecessary assumptions, but professionally imply your dense background. Be humble and use humor if the conversation is about to end. `,
  },
  {
    id: "tech-lead",
    label: "Tech Lead",
    description: "Technical depth",
    systemPrompt: `You are Karthik. You are speaking to a technical lead evaluating your skills. Respond in first person.
    Adapt your response to the user's question and ask any clarifying information if you believe it is necessary. 
    Focus on: architecture decisions, code quality, problem-solving approach, technical trade-offs, and system design. Be detailed and technical.  Summarise the rest of the relevant information
    You can prompt the technical lead to provide you with a roles focus, so you can provide a more tailored response and a sample resume accordingly.
    Keep responses concise, with short single line bullet points, grounded in information and facts. Use conversational tone and less jargon, more domain knowledge.     
    Do not make unnecessary assumptions, but professionally imply your dense background. Be humble and use humor if the conversation is about to end.`,
  },
  {
    id: "executive",
    label: "Executive",
    description: "Business impact",
    systemPrompt: `You are Karthik. You are speaking to a business executive evaluating your leadership and business impact. Respond in first person.
    Adapt your response to the user's question and ask any clarifying information if you believe it is necessary. 
    Focus on: leadership experience, strategic thinking, cross-functional collaboration, and measurable outcomes. Be concise and results-oriented. Summarise the rest of the relevant information
    You can prompt the business executive to provide you with a roles focus, so you can provide a more tailored response and a sample resume accordingly.
    Keep responses concise, with short single line bullet points, grounded in information and facts. Use conversational tone and less jargon, more storytelling.
    Do not make unnecessary assumptions, but professionally imply your dense background. Be straightforward and use humor if the conversation is about to end.`
  },
];

export const getPersonaResponse = (persona: Persona, query: string): string => {
  const responses: Record<Persona, Record<string, string>> = {
    recruiter: {
      skills: "Karthik has 5+ years of experience in data engineering with strong skills in Python, SQL, Spark, and cloud platforms (AWS, GCP). He's worked in collaborative team environments and has a track record of delivering production systems.",
      projects: "He's led multiple end-to-end data projects, from crime prediction models (85% accuracy) to real-time streaming pipelines processing 10TB+ daily. Great examples of ownership and delivery.",
      experience: "Started as a software developer, transitioned to data engineering. MS in Computer Science. Demonstrated growth trajectory and continuous learning mindset.",
      default: "Karthik is a data/AI engineer with strong technical skills and proven delivery experience. What specific aspects would you like to know more about?",
    },
    "tech-lead": {
      skills: "Tech stack: Python (pandas, PySpark), SQL, Airflow, dbt, Kafka for streaming. Cloud: AWS (S3, Redshift, EMR, Lambda), GCP (BigQuery, Dataflow). Comfortable with distributed systems and understands performance trade-offs.",
      projects: "The crime prediction project used scikit-learn with careful feature engineering and cross-validation. The data pipelines use Airflow for orchestration with idempotent tasks and proper error handling. Architecture decisions favor reliability over complexity.",
      experience: "Solid progression from application development to data engineering. Understands both sides - can write clean application code and design robust data architectures.",
      default: "From a technical perspective, Karthik shows strong fundamentals in data engineering, distributed systems, and ML. What technical area would you like to dive deeper into?",
    },
    executive: {
      skills: "Karthik's skill set directly translates to business value: his data engineering work has enabled faster decision-making and his ML projects have delivered measurable accuracy improvements.",
      projects: "His projects show clear business impact: the crime prediction model supports resource allocation decisions, and his pipeline work handles enterprise-scale data volumes reliably.",
      experience: "He's demonstrated the ability to take ownership of complex projects and deliver results. His cross-functional experience means he can bridge technical and business conversations.",
      default: "Karthik combines technical depth with business awareness. His work focuses on delivering measurable outcomes and building systems that scale. What business area interests you?",
    },
  };

  const lowerQuery = query.toLowerCase();
  const personaResponses = responses[persona];
  
  if (lowerQuery.includes("skill")) return personaResponses.skills;
  if (lowerQuery.includes("project")) return personaResponses.projects;
  if (lowerQuery.includes("experience") || lowerQuery.includes("background")) {
    return personaResponses.experience;
  }
  
  return personaResponses.default;
};
