
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
} from "@/utils/categorization";
import { useToast } from "@/components/ui/use-toast";

/**
 * Hook for managing categorization state and actions
 */
export function useCategorization(): CategorizationHookResult {
  const [questions, setQuestions] = useState<CategoriesData>(categorizationQuestions);
  const [activeTab, setActiveTab] = useState<string>("policy");
  const { toast } = useToast();
  
  // Initialize responses with default values
  const initializeResponses = (): ResponsesData => {
    const initialData: ResponsesData = {};
    
    Object.entries(categorizationQuestions).forEach(([section, sectionQuestions]) => {
      initialData[section] = {};
      sectionQuestions.forEach(question => {
        // If the question has predefined responses, use the first one as default
        const defaultResponse = question.responses && question.responses.length > 0
          ? question.responses[0]
          : { response: getSectionResponseOptions(section)[0] || "", score: 0 };
          
        initialData[section][question.id] = { 
          response: defaultResponse.response, 
          score: defaultResponse.score,
          observations: "" 
        };
      });
    });
    
    return initialData;
  };
  
  const [responses, setResponses] = useState<ResponsesData>(initializeResponses());
  
  // Handle response change for a question
  const handleResponseChange = (questionId: string, value: string) => {
    // Get the question object to check for defined responses
    const question = questions[activeTab]?.find(q => q.id === questionId);
    
    // Try to find the score in the question's responses
    let score = 0;
    if (question?.responses) {
      const responseOption = question.responses.find(r => r.response === value);
      if (responseOption) {
        score = responseOption.score;
      }
    } else {
      // Fall back to calculating score using the utility function
      score = calculateQuestionScore(questionId, value, activeTab);
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
    
    // Update responses to include any new questions and remove deleted ones
    setResponses(prev => {
      const newResponses = { ...prev };
      if (!newResponses[section]) {
        newResponses[section] = {};
      }
      
      // Initialize new questions with default responses
      updatedQuestions.forEach(q => {
        if (!newResponses[section][q.id]) {
          // If the question has predefined responses, use the first one as default
          const defaultResponse = q.responses && q.responses.length > 0
            ? q.responses[0]
            : { response: getSectionResponseOptions(section)[0] || "", score: 0 };
            
          newResponses[section][q.id] = { 
            response: defaultResponse.response, 
            score: defaultResponse.score,
            observations: "" 
          };
        }
      });
      
      // Clean up responses for questions that no longer exist
      const currentQuestionIds = updatedQuestions.map(q => q.id);
      const existingQuestionIds = Object.keys(newResponses[section]);
      
      existingQuestionIds.forEach(id => {
        if (!currentQuestionIds.includes(id)) {
          delete newResponses[section][id];
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
