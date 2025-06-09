export interface Quiz {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface CodeExample {
  id: string;
  title: string;
  description: string;
  code: string;
  language: string;
}

export interface Video {
  id: string;
  title: string;
  url: string;
  duration: string;
}

export interface GlossaryTerm {
  term: string;
  definition: string;
  category?: string;
  seeAlso?: string[];
}

export interface CaseStudy {
  id: string;
  title: string;
  description: string;
  content: string;
  imageUrl?: string;
}

export interface LearningObjective {
  id: string;
  objective: string;
  orderIndex: number;
}

export interface ExternalResource {
  id: string;
  title: string;
  url: string;
  description: string;
  resourceType: string;
}

export interface Module {
  id: string;
  title: string;
  duration: string;
  topics: string[];
  content?: string;
  quizzes?: Quiz[];
  codeExamples?: CodeExample[];
  videos?: Video[];
  caseStudies?: CaseStudy[];
  externalResources?: ExternalResource[];
}

export interface Course {
  id: string;
  title: string;
  description: string;
  level: string;
  duration: string;
  modules: Module[];
  progress: number;
  completed: boolean;
  image: string;
  category: 'fundamentals' | 'technical' | 'development' | 'economics' | 'security';
  prerequisites?: string[];
  learningObjectives?: LearningObjective[];
  glossaryTerms?: GlossaryTerm[];
}