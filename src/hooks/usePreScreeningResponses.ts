import { useState } from "react";

type Response = {
  response: string;
  score: number;
  remarks: string;
};

type Question = {
  id: string;
  question: string;
  scoringCriteria: string;
  weightage: number;
};

export function usePreScreeningResponses(initialQuestions: Question[]) {
  const [responses, setResponses] = useState<Record<string, Response>>(() => {
    const initial: Record<string, Response> = {};
    initialQuestions.forEach(q => {
      initial[q.id] = { response: "No", score: 0, remarks: "" };
    });
    return initial;
  });

  const handleResponseChange = (questionId: string, value: string, questions: Question[]) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;
    
    // Calculate score based on response and weightage
    let newScore = 0;
    if (value === "Yes" || value === "Maybe") {
      newScore = question.weightage;
    }
    
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        response: value,
        score: newScore
      }
    }));
  };
  
  const handleRemarksChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        remarks: value
      }
    }));
  };

  const updateResponsesForQuestions = (questions: Question[]) => {
    // This function ensures that all questions have a response entry
    // And keeps existing responses for questions that are still present
    setResponses(prev => {
      const newResponses = { ...prev };
      const currentQuestionIds = questions.map(q => q.id);
      
      // Add entries for new questions
      questions.forEach(q => {
        if (!newResponses[q.id]) {
          newResponses[q.id] = { response: "No", score: 0, remarks: "" };
        }
      });
      
      // Remove entries for questions that no longer exist
      Object.keys(newResponses).forEach(id => {
        if (!currentQuestionIds.includes(id)) {
          delete newResponses[id];
        }
      });
      
      return newResponses;
    });
  };

  const getTotalScore = () => {
    return Object.values(responses).reduce((sum, item) => sum + item.score, 0);
  };

  return {
    responses,
    handleResponseChange,
    handleRemarksChange,
    updateResponsesForQuestions,
    getTotalScore
  };
}
