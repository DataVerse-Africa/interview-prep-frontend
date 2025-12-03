export type SkillPriority = "high" | "medium" | "low";

export interface MatchedSkill {
  skill: string;
  frequency: number;
}

export interface MissingSkill {
  skill: string;
  priority: SkillPriority;
  category?: string;
}

export interface CommunicationGap {
  area: string;
  score: number;
  feedback: string;
  suggestions?: string[];
}

export interface AlignmentAnalysis {
  alignmentScore: number;
  matchedSkills: MatchedSkill[];
  missingSkills: MissingSkill[];
  improvements: string[];
  communicationGaps: CommunicationGap[];
  keywordMatches: {
    total: number;
    matched: number;
    percentage: number;
  };
  experienceAlignment: {
    yearsRequired?: number;
    yearsProvided?: number;
    match: boolean;
  };
  educationAlignment: {
    required: string[];
    provided: string[];
    match: boolean;
  };
}

export interface OnboardingData {
  role: string;
  resume: string | File;
  jobDescription: string;
  preparationTime: number;
  preparationUnit: "days" | "weeks" | "months";
}

export interface ResumeParseResult {
  rawText: string;
  skills: string[];
  experience: {
    company: string;
    role: string;
    duration: string;
    description: string;
  }[];
  education: {
    institution: string;
    degree: string;
    year: string;
  }[];
  totalYearsExperience?: number;
}

export interface JobDescriptionParseResult {
  rawText: string;
  requiredSkills: string[];
  preferredSkills: string[];
  experienceRequired: number;
  educationRequired: string[];
  responsibilities: string[];
  keywords: string[];
}
