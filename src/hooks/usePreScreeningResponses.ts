
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
    
    const newScore = value === "No" ? 0 : question.weightage;
    
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
    setResponses(prev => {
      const newResponses = { ...prev };
      questions.forEach(q => {
        if (!newResponses[q.id]) {
          newResponses[q.id] = { response: "No", score: 0, remarks: "" };
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
