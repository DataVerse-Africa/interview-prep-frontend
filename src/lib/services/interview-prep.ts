import type { AlignmentAnalysis } from "@/lib/types/analysis";

export interface InterviewQuestion {
  id: string;
  category: "technical" | "behavioral" | "situational" | "system-design";
  question: string;
  difficulty: "easy" | "medium" | "hard";
  relatedSkills: string[];
  preparationTime: number; // minutes
}

export interface PrepPlan {
  totalDays: number;
  dailyHours: number;
  phases: PrepPhase[];
  milestones: Milestone[];
}

export interface PrepPhase {
  name: string;
  durationDays: number;
  focus: string[];
  activities: string[];
}

export interface Milestone {
  day: number;
  title: string;
  description: string;
  completed: boolean;
}

/**
 * Generate personalized interview questions based on alignment analysis
 */
export function generateInterviewQuestions(
  analysis: AlignmentAnalysis,
  role: string,
  preparationDays: number
): InterviewQuestion[] {
  const questions: InterviewQuestion[] = [];

  // Technical questions based on matched skills
  analysis.matchedSkills.slice(0, 5).forEach((skill, index) => {
    questions.push({
      id: `tech-${index}`,
      category: "technical",
      question: `Explain your experience with ${skill.skill}. Can you describe a challenging project where you used it?`,
      difficulty: "medium",
      relatedSkills: [skill.skill],
      preparationTime: 15,
    });
  });

  // Questions about missing skills (to test knowledge gaps)
  analysis.missingSkills
    .filter((s) => s.priority === "high")
    .slice(0, 3)
    .forEach((skill, index) => {
      questions.push({
        id: `gap-${index}`,
        category: "technical",
        question: `Are you familiar with ${skill.skill}? How would you approach learning it for this role?`,
        difficulty: "medium",
        relatedSkills: [skill.skill],
        preparationTime: 10,
      });
    });

  // Behavioral questions
  const behavioralQuestions = [
    {
      question: "Tell me about a time when you had to learn a new technology quickly. How did you approach it?",
      relatedSkills: ["Learning Agility"],
    },
    {
      question: "Describe a situation where you disagreed with a team member. How did you handle it?",
      relatedSkills: ["Communication", "Teamwork"],
    },
    {
      question: "Give me an example of a project that didn't go as planned. What did you learn?",
      relatedSkills: ["Problem Solving", "Adaptability"],
    },
  ];

  behavioralQuestions.forEach((q, index) => {
    questions.push({
      id: `behavioral-${index}`,
      category: "behavioral",
      question: q.question,
      difficulty: "medium",
      relatedSkills: q.relatedSkills,
      preparationTime: 20,
    });
  });

  // System design questions (for senior roles)
  if (role.toLowerCase().includes("senior") || role.toLowerCase().includes("lead")) {
    questions.push({
      id: "system-design-1",
      category: "system-design",
      question: "Design a scalable system for a real-time messaging application. Consider high availability and low latency.",
      difficulty: "hard",
      relatedSkills: ["System Design", "Scalability"],
      preparationTime: 45,
    });
  }

  return questions;
}

/**
 * Generate a personalized preparation plan
 */
export function generatePrepPlan(
  preparationDays: number,
  analysis: AlignmentAnalysis
): PrepPlan {
  const dailyHours = preparationDays < 7 ? 3 : preparationDays < 14 ? 2 : 1.5;

  const phases: PrepPhase[] = [];

  // Phase 1: Assessment and Gap Identification (20% of time)
  const assessmentDays = Math.max(1, Math.floor(preparationDays * 0.2));
  phases.push({
    name: "Assessment & Planning",
    durationDays: assessmentDays,
    focus: ["Self-Assessment", "Gap Analysis", "Learning Plan"],
    activities: [
      "Review alignment analysis results",
      "Identify top 3 priority skills to improve",
      "Gather learning resources",
      "Create study schedule",
    ],
  });

  // Phase 2: Skill Development (40% of time)
  const skillDevDays = Math.max(2, Math.floor(preparationDays * 0.4));
  phases.push({
    name: "Skill Development",
    durationDays: skillDevDays,
    focus: analysis.missingSkills.filter((s) => s.priority === "high").map((s) => s.skill),
    activities: [
      "Complete online tutorials and courses",
      "Build small projects demonstrating new skills",
      "Practice coding challenges",
      "Document your learning journey",
    ],
  });

  // Phase 3: Mock Interviews (30% of time)
  const mockInterviewDays = Math.max(2, Math.floor(preparationDays * 0.3));
  phases.push({
    name: "Mock Interviews",
    durationDays: mockInterviewDays,
    focus: ["Technical Questions", "Behavioral Questions", "Communication"],
    activities: [
      "Practice answering common interview questions",
      "Conduct mock interviews with peers",
      "Record and review your responses",
      "Refine your STAR method answers",
    ],
  });

  // Phase 4: Final Review (10% of time)
  const reviewDays = Math.max(1, Math.floor(preparationDays * 0.1));
  phases.push({
    name: "Final Review",
    durationDays: reviewDays,
    focus: ["Resume Review", "Company Research", "Confidence Building"],
    activities: [
      "Review your updated resume",
      "Research the company and role",
      "Prepare questions for the interviewer",
      "Practice your elevator pitch",
      "Get a good night's sleep before the interview",
    ],
  });

  // Generate milestones
  const milestones: Milestone[] = [
    {
      day: assessmentDays,
      title: "Complete Self-Assessment",
      description: "Finish reviewing your gaps and create a detailed learning plan",
      completed: false,
    },
    {
      day: assessmentDays + Math.floor(skillDevDays / 2),
      title: "Mid-Point Skill Check",
      description: "Assess progress on priority skills and adjust plan if needed",
      completed: false,
    },
    {
      day: assessmentDays + skillDevDays,
      title: "Skills Development Complete",
      description: "Finish learning new skills and building demonstration projects",
      completed: false,
    },
    {
      day: assessmentDays + skillDevDays + mockInterviewDays,
      title: "Mock Interview Mastery",
      description: "Complete all mock interviews and feel confident in your responses",
      completed: false,
    },
    {
      day: preparationDays,
      title: "Interview Ready!",
      description: "You're fully prepared and ready to ace your interview",
      completed: false,
    },
  ];

  return {
    totalDays: preparationDays,
    dailyHours,
    phases,
    milestones,
  };
}

/**
 * Calculate interview readiness score
 */
export function calculateReadinessScore(
  analysis: AlignmentAnalysis,
  practiceSessionsCompleted: number,
  daysRemaining: number
): number {
  // Base score from alignment
  let score = analysis.alignmentScore * 0.4;

  // Practice sessions contribution (max 30 points)
  const practiceScore = Math.min(30, practiceSessionsCompleted * 5);
  score += practiceScore;

  // Time preparation factor (max 30 points)
  const timeScore = daysRemaining >= 7 ? 30 : (daysRemaining / 7) * 30;
  score += timeScore;

  return Math.round(Math.min(100, score));
}
