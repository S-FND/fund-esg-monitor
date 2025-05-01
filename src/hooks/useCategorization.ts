
import { useState } from "react";
import { categorizationQuestions } from "@/data/categorizationQuestions";
import { 
  CategoryQuestion, 
  CategoriesData, 
  ResponsesData, 
  CategorizationHookResult 
} from "@/types/categorization";
import {
  calculateQuestionScore,
  calculateAllSectionScores,
  calculateTotalScore,
  getSectionResponseOptions
} from "@/utils/categorizationUtils";

/**
 * Hook for managing categorization state and actions
 */
export function useCategorization(): CategorizationHookResult {
  const [questions, setQuestions] = useState<CategoriesData>(categorizationQuestions);
  const [activeTab, setActiveTab] = useState<string>("policy");
  
  // Initialize responses with default values
  const initializeResponses = (): ResponsesData => {
    const initialData: ResponsesData = {};
    
    Object.entries(categorizationQuestions).forEach(([section, sectionQuestions]) => {
      initialData[section] = {};
      sectionQuestions.forEach(question => {
        const options = getSectionResponseOptions(section);
        initialData[section][question.id] = { 
          response: options[0], 
          score: 0,
          observations: "" 
        };
      });
    });
    
    return initialData;
  };
  
  const [responses, setResponses] = useState<ResponsesData>(initializeResponses());
  
  // Handle response change for a question
  const handleResponseChange = (questionId: string, value: string) => {
    const score = calculateQuestionScore(questionId, value, activeTab);
    
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
  
  // Handle observations change for a question
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
  
  // Update questions for a section
  const handleQuestionUpdate = (section: string, updatedQuestions: CategoryQuestion[]) => {
    setQuestions(prev => ({
      ...prev,
      [section]: updatedQuestions
    }));
    
    // Update responses to include any new questions
    setResponses(prev => {
      const newResponses = { ...prev };
      if (!newResponses[section]) {
        newResponses[section] = {};
      }
      
      updatedQuestions.forEach(q => {
        if (!newResponses[section][q.id]) {
          const options = getSectionResponseOptions(section);
          newResponses[section][q.id] = { 
            response: options[0], 
            score: 0,
            observations: "" 
          };
        }
      });
      
      return newResponses;
    });
  };

  // Calculate scores for all sections
  const sectionScores = calculateAllSectionScores(questions, responses);
  
  // Calculate total score across all sections
  const totalScore = calculateTotalScore(sectionScores);

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
