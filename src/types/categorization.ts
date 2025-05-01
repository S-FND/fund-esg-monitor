
export type ResponseOption = {
  response: string;
  score: number;
};

export type CategoryQuestion = {
  id: string;
  question: string;
  scoringCriteria: string;
  guidance: string;
  responses?: ResponseOption[];
};

export type CategoriesData = Record<string, CategoryQuestion[]>;

export type Response = {
  response: string;
  score: number;
  observations: string;
};

export type ResponsesData = Record<string, Record<string, Response>>;

export type SectionScores = Record<string, number>;

export type CategorySection = 'policy' | 'esg' | 'social' | 'environmental' | 'impact';

export interface CategorizationState {
  questions: CategoriesData;
  responses: ResponsesData;
  activeTab: string;
  sectionScores: SectionScores;
  totalScore: number;
}

export interface CategorizationActions {
  setActiveTab: (section: string) => void;
  handleResponseChange: (questionId: string, value: string) => void;
  handleObservationsChange: (questionId: string, value: string) => void;
  handleQuestionUpdate: (section: string, updatedQuestions: CategoryQuestion[]) => void;
}

export type CategorizationHookResult = CategorizationState & CategorizationActions;
