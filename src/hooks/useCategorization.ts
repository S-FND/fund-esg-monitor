
import { useState } from "react";
import { CategoriesData, categorizationQuestions, responseOptions } from "@/data/categorizationQuestions";

type Response = {
  response: string;
  score: number;
  observations: string;
};

type ResponsesData = Record<string, Record<string, Response>>;

export function useCategorization() {
  const [questions, setQuestions] = useState<CategoriesData>(categorizationQuestions);
  
  const initialResponses: ResponsesData = {};
  
  Object.entries(categorizationQuestions).forEach(([section, questions]) => {
    initialResponses[section] = {};
    questions.forEach(question => {
      initialResponses[section][question.id] = { 
        response: responseOptions[section as keyof typeof responseOptions][0], 
        score: 0,
        observations: "" 
      };
    });
  });
  
  const [responses, setResponses] = useState<ResponsesData>(initialResponses);
  const [activeTab, setActiveTab] = useState<string>("policy");
  
  const handleResponseChange = (questionId: string, value: string) => {
    const options = responseOptions[activeTab as keyof typeof responseOptions];
    const index = options.indexOf(value);
    const scoreMap = [0, 1, 3]; // Default scoring pattern
    
    let score = scoreMap[index];
    
    if (questionId === "1.9") {
      if (value === "Yes") score = 0;
      else if (value === "No, but willing to have") score = 1;
      else score = 3;
    }
    
    setResponses(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [questionId]: {
          ...prev[activeTab][questionId],
          response: value,
          score: score
        }
      }
    }));
  };
  
  const handleObservationsChange = (questionId: string, value: string) => {
    setResponses(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [questionId]: {
          ...prev[activeTab][questionId],
          observations: value
        }
      }
    }));
  };
  
  const handleQuestionUpdate = (section: string, updatedQuestions: any[]) => {
    setQuestions(prev => ({
      ...prev,
      [section]: updatedQuestions
    }));
    
    setResponses(prev => {
      const newResponses = { ...prev };
      if (!newResponses[section]) {
        newResponses[section] = {};
      }
      
      updatedQuestions.forEach(q => {
        if (!newResponses[section][q.id]) {
          newResponses[section][q.id] = { 
            response: responseOptions[section as keyof typeof responseOptions][0], 
            score: 0,
            observations: "" 
          };
        }
      });
      
      return newResponses;
    });
  };

  const sectionScores = Object.keys(questions).reduce<Record<string, number>>((acc, section) => {
    const sectionQuestions = questions[section as keyof typeof questions];
    const total = sectionQuestions.reduce((sum, question) => {
      return sum + (responses[section][question.id]?.score || 0);
    }, 0);
    acc[section] = total;
    return acc;
  }, {});
  
  const totalScore = Object.values(sectionScores).reduce((sum, score) => sum + score, 0);

  return {
    questions,
    responses,
    activeTab,
    sectionScores,
    totalScore,
    setActiveTab,
    handleResponseChange,
    handleObservationsChange,
    handleQuestionUpdate
  };
}
