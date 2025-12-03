import type {
  AlignmentAnalysis,
  ResumeParseResult,
  JobDescriptionParseResult,
  MatchedSkill,
  MissingSkill,
  CommunicationGap,
} from "@/lib/types/analysis";

/**
 * Parse resume file content
 * In production, this would use a proper document parser (pdf-parse, mammoth, etc.)
 */
export async function parseResume(file: File): Promise<ResumeParseResult> {
  const text = await file.text();
  
  // Basic text extraction - in production, use proper parsers for PDF/DOCX
  const skills = extractSkills(text);
  const experience = extractExperience(text);
  const education = extractEducation(text);
  const totalYearsExperience = calculateTotalExperience(text);

  return {
    rawText: text,
    skills,
    experience,
    education,
    totalYearsExperience,
  };
}

/**
 * Parse job description text
 */
export function parseJobDescription(text: string): JobDescriptionParseResult {
  const requiredSkills = extractSkills(text);
  const keywords = extractKeywords(text);
  const experienceRequired = extractExperienceRequirement(text);
  const educationRequired = extractEducationRequirements(text);

  return {
    rawText: text,
    requiredSkills,
    preferredSkills: [],
    experienceRequired,
    educationRequired,
    responsibilities: [],
    keywords,
  };
}

/**
 * Analyze alignment between resume and job description
 */
export function analyzeAlignment(
  resume: ResumeParseResult,
  jobDescription: JobDescriptionParseResult
): AlignmentAnalysis {
  // Calculate matched skills
  const matchedSkills: MatchedSkill[] = [];
  const missingSkills: MissingSkill[] = [];

  jobDescription.requiredSkills.forEach((requiredSkill) => {
    const isMatched = resume.skills.some((resumeSkill) =>
      resumeSkill.toLowerCase().includes(requiredSkill.toLowerCase()) ||
      requiredSkill.toLowerCase().includes(resumeSkill.toLowerCase())
    );

    if (isMatched) {
      matchedSkills.push({
        skill: requiredSkill,
        frequency: 1,
      });
    } else {
      // Determine priority based on keyword frequency in JD
      const priority = determineSkillPriority(requiredSkill, jobDescription.rawText);
      missingSkills.push({
        skill: requiredSkill,
        priority,
      });
    }
  });

  // Calculate alignment score
  const skillMatchRate = matchedSkills.length / (matchedSkills.length + missingSkills.length);
  const experienceMatch = compareExperience(resume, jobDescription);
  const educationMatch = compareEducation(resume, jobDescription);
  
  const alignmentScore = Math.round(
    skillMatchRate * 0.6 + // 60% weight on skills
    (experienceMatch ? 0.25 : 0) + // 25% weight on experience
    (educationMatch ? 0.15 : 0) // 15% weight on education
  ) * 100;

  // Generate improvements
  const improvements = generateImprovements(matchedSkills, missingSkills, resume, jobDescription);

  // Analyze communication gaps
  const communicationGaps = analyzeCommunicationGaps(resume, jobDescription);

  // Calculate keyword matches
  const keywordMatches = {
    total: jobDescription.keywords.length,
    matched: jobDescription.keywords.filter((keyword) =>
      resume.rawText.toLowerCase().includes(keyword.toLowerCase())
    ).length,
    percentage: 0,
  };
  keywordMatches.percentage = Math.round(
    (keywordMatches.matched / keywordMatches.total) * 100
  );

  return {
    alignmentScore,
    matchedSkills,
    missingSkills,
    improvements,
    communicationGaps,
    keywordMatches,
    experienceAlignment: {
      yearsRequired: jobDescription.experienceRequired,
      yearsProvided: resume.totalYearsExperience,
      match: experienceMatch,
    },
    educationAlignment: {
      required: jobDescription.educationRequired,
      provided: resume.education.map((e) => e.degree),
      match: educationMatch,
    },
  };
}

/**
 * Extract skills from text using common technical keywords
 */
function extractSkills(text: string): string[] {
  const commonSkills = [
    // Programming Languages
    "JavaScript", "TypeScript", "Python", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin",
    // Frontend
    "React", "Vue", "Angular", "Next.js", "Svelte", "HTML", "CSS", "Tailwind", "SASS", "Redux",
    // Backend
    "Node.js", "Express", "Django", "Flask", "Spring", "ASP.NET", "Laravel", "Rails",
    // Databases
    "MySQL", "PostgreSQL", "MongoDB", "Redis", "Cassandra", "DynamoDB", "SQL", "NoSQL",
    // DevOps & Cloud
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "CI/CD", "Jenkins", "GitHub Actions", "Terraform",
    // Other
    "GraphQL", "REST API", "Git", "Agile", "Scrum", "Microservices", "Testing", "TDD",
    "Machine Learning", "AI", "Data Science", "Analytics"
  ];

  const foundSkills: string[] = [];
  const lowerText = text.toLowerCase();

  commonSkills.forEach((skill) => {
    if (lowerText.includes(skill.toLowerCase())) {
      foundSkills.push(skill);
    }
  });

  return [...new Set(foundSkills)]; // Remove duplicates
}

/**
 * Extract keywords from job description
 */
function extractKeywords(text: string): string[] {
  // Simple keyword extraction - in production, use NLP libraries
  const words = text.toLowerCase().match(/\b\w+\b/g) || [];
  const stopWords = new Set(["the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for", "of", "with", "by"]);
  
  const keywords = words.filter(
    (word) => word.length > 3 && !stopWords.has(word)
  );

  // Get top frequent keywords
  const frequency: { [key: string]: number } = {};
  keywords.forEach((word) => {
    frequency[word] = (frequency[word] || 0) + 1;
  });

  return Object.entries(frequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 20)
    .map(([word]) => word);
}

/**
 * Extract experience information (simplified)
 */
function extractExperience(text: string): ResumeParseResult["experience"] {
  // In production, use proper parsing logic
  return [];
}

/**
 * Extract education information (simplified)
 */
function extractEducation(text: string): ResumeParseResult["education"] {
  const degrees = ["Bachelor", "Master", "PhD", "Associate", "B.S.", "M.S.", "MBA"];
  const education: ResumeParseResult["education"] = [];

  degrees.forEach((degree) => {
    if (text.includes(degree)) {
      education.push({
        institution: "University",
        degree: degree,
        year: "2020",
      });
    }
  });

  return education;
}

/**
 * Calculate total years of experience from resume
 */
function calculateTotalExperience(text: string): number {
  // Look for experience mentions like "5 years", "5+ years"
  const matches = text.match(/(\d+)\+?\s*years?\s*(?:of\s+)?experience/gi);
  if (matches && matches.length > 0) {
    const years = matches.map((match) => {
      const num = match.match(/\d+/);
      return num ? parseInt(num[0]) : 0;
    });
    return Math.max(...years);
  }
  return 0;
}

/**
 * Extract experience requirement from job description
 */
function extractExperienceRequirement(text: string): number {
  const matches = text.match(/(\d+)\+?\s*years?\s*(?:of\s+)?experience/gi);
  if (matches && matches.length > 0) {
    const num = matches[0].match(/\d+/);
    return num ? parseInt(num[0]) : 0;
  }
  return 0;
}

/**
 * Extract education requirements
 */
function extractEducationRequirements(text: string): string[] {
  const requirements: string[] = [];
  const degrees = ["Bachelor's", "Master's", "PhD", "Associate", "B.S.", "M.S.", "MBA"];

  degrees.forEach((degree) => {
    if (text.includes(degree)) {
      requirements.push(degree);
    }
  });

  return requirements;
}

/**
 * Determine skill priority based on frequency in job description
 */
function determineSkillPriority(skill: string, jdText: string): "high" | "medium" | "low" {
  const lowerText = jdText.toLowerCase();
  const lowerSkill = skill.toLowerCase();
  
  // Count occurrences
  const count = (lowerText.match(new RegExp(lowerSkill, "g")) || []).length;
  
  // Check if in "required" section
  const requiredSection = lowerText.includes("required") || lowerText.includes("must have");
  const isInRequiredContext = requiredSection && lowerText.indexOf(lowerSkill) < lowerText.indexOf("preferred");

  if (count >= 3 || isInRequiredContext) return "high";
  if (count >= 2) return "medium";
  return "low";
}

/**
 * Compare experience levels
 */
function compareExperience(
  resume: ResumeParseResult,
  jobDescription: JobDescriptionParseResult
): boolean {
  if (!resume.totalYearsExperience || !jobDescription.experienceRequired) {
    return true; // Can't determine, assume match
  }
  return resume.totalYearsExperience >= jobDescription.experienceRequired;
}

/**
 * Compare education requirements
 */
function compareEducation(
  resume: ResumeParseResult,
  jobDescription: JobDescriptionParseResult
): boolean {
  if (jobDescription.educationRequired.length === 0) return true;
  
  return jobDescription.educationRequired.some((required) =>
    resume.education.some((edu) =>
      edu.degree.toLowerCase().includes(required.toLowerCase())
    )
  );
}

/**
 * Generate improvement suggestions
 */
function generateImprovements(
  matchedSkills: MatchedSkill[],
  missingSkills: MissingSkill[],
  resume: ResumeParseResult,
  jobDescription: JobDescriptionParseResult
): string[] {
  const improvements: string[] = [];

  // Suggest adding missing high-priority skills
  const highPriorityMissing = missingSkills.filter((s) => s.priority === "high");
  if (highPriorityMissing.length > 0) {
    highPriorityMissing.forEach((skill) => {
      improvements.push(
        `Add specific project examples demonstrating ${skill.skill} experience`
      );
    });
  }

  // Suggest quantifying achievements
  if (!resume.rawText.match(/\d+%|\$\d+|improved|increased|reduced/gi)) {
    improvements.push(
      "Quantify your achievements with metrics (e.g., 'improved performance by 40%')"
    );
  }

  // Suggest leadership examples
  if (jobDescription.rawText.toLowerCase().includes("lead") && 
      !resume.rawText.toLowerCase().includes("lead")) {
    improvements.push(
      "Emphasize leadership and team collaboration examples"
    );
  }

  // Suggest more keywords
  if (matchedSkills.length < jobDescription.requiredSkills.length * 0.7) {
    improvements.push(
      "Include more keywords from the job description throughout your resume"
    );
  }

  return improvements.slice(0, 5); // Limit to top 5
}

/**
 * Analyze communication gaps
 */
function analyzeCommunicationGaps(
  resume: ResumeParseResult,
  jobDescription: JobDescriptionParseResult
): CommunicationGap[] {
  const gaps: CommunicationGap[] = [];

  // Technical Communication
  const hasCommunicationKeywords = resume.rawText.toLowerCase().match(
    /present|communicate|explain|document|collaborate/gi
  );
  gaps.push({
    area: "Technical Communication",
    score: hasCommunicationKeywords ? 75 : 50,
    feedback: hasCommunicationKeywords
      ? "Good communication examples, consider adding more specific instances."
      : "Your resume could better highlight how you've explained complex technical concepts.",
  });

  // Leadership
  const hasLeadershipKeywords = resume.rawText.toLowerCase().match(
    /lead|manage|mentor|coordinate|supervise/gi
  );
  const needsLeadership = jobDescription.rawText.toLowerCase().includes("lead");
  
  if (needsLeadership) {
    gaps.push({
      area: "Leadership Experience",
      score: hasLeadershipKeywords ? 70 : 40,
      feedback: hasLeadershipKeywords
        ? "Leadership mentioned, but add specific examples of team size and outcomes."
        : "The job requires leadership experience. Consider adding examples of mentoring or project leadership.",
    });
  }

  // Problem-Solving
  const hasProblemSolving = resume.rawText.toLowerCase().match(
    /solve|optimize|improve|design|architect|debug/gi
  );
  gaps.push({
    area: "Problem-Solving Approach",
    score: hasProblemSolving ? 80 : 60,
    feedback: hasProblemSolving
      ? "Good examples of problem-solving, but add more context about your decision-making process."
      : "Highlight specific problems you've solved and your approach to finding solutions.",
  });

  return gaps;
}

/**
 * Generate learning resources based on missing skills
 */
export function generateLearningResources(missingSkills: MissingSkill[]): {
  skill: string;
  resources: { title: string; url: string; type: string }[];
}[] {
  const resourceMap: { [key: string]: { title: string; url: string; type: string }[] } = {
    GraphQL: [
      { title: "GraphQL Official Documentation", url: "https://graphql.org/learn/", type: "docs" },
      { title: "How to GraphQL", url: "https://www.howtographql.com/", type: "tutorial" },
    ],
    Docker: [
      { title: "Docker Official Tutorial", url: "https://www.docker.com/101-tutorial/", type: "tutorial" },
      { title: "Docker Documentation", url: "https://docs.docker.com/", type: "docs" },
    ],
    Kubernetes: [
      { title: "Kubernetes Basics", url: "https://kubernetes.io/docs/tutorials/kubernetes-basics/", type: "tutorial" },
    ],
    AWS: [
      { title: "AWS Getting Started", url: "https://aws.amazon.com/getting-started/", type: "tutorial" },
      { title: "AWS Free Tier", url: "https://aws.amazon.com/free/", type: "hands-on" },
    ],
  };

  return missingSkills
    .filter((s) => s.priority === "high" || s.priority === "medium")
    .map((skill) => ({
      skill: skill.skill,
      resources: resourceMap[skill.skill] || [
        {
          title: `Learn ${skill.skill}`,
          url: `https://www.google.com/search?q=learn+${encodeURIComponent(skill.skill)}`,
          type: "search",
        },
      ],
    }));
}
