
import { useEffect, useState } from "react";
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
import { useSearchParams } from "react-router-dom";

/**
 * Hook for managing categorization state and actions
 */
export function useCategorization(companyInfoId: string): CategorizationHookResult {
  const [questions, setQuestions] = useState<CategoriesData>(categorizationQuestions);
  const [activeTab, setActiveTab] = useState<string>("policy");
  const [searchParams, setSearchParams] = useSearchParams();
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

  const saveQuestions = async(questions)=>{
    try {
      let postPayload={
        companyInfoId:searchParams.get('companyInfoId'),
        questions:questions,
        type:'Categorization'
      }
      const res = await fetch(`https://preprod-api.fandoro.com` + `/investor/pre-screening/questions`, {
        method: "POST",
        body: JSON.stringify({...postPayload}),
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('jsondata', jsondata)
        getQuestions()
      }
    } catch (error) {
      
    }
    finally{

    }
  }

  const getQuestions = async()=>{
    try {
      const res = await fetch(`https://preprod-api.fandoro.com` + `/investor/pre-screening/questions/${searchParams.get('companyInfoId')}/Categorization`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        setQuestions(categorizationQuestions)
        return;
      }
      else {
        const jsondata = await res.json();
        setQuestions(jsondata['data'][0])
        
      }
    } catch (error) {
      
    }
    finally{

    }
  }
  
  // Update questions for a section
  const handleQuestionUpdate = (section: string, updatedQuestions: CategoryQuestion[]) => {
    setQuestions(prev => ({
      ...prev,
      [section]: updatedQuestions
    }));
    
    let cloneQuestions={...questions}
    cloneQuestions[section]=updatedQuestions
    saveQuestions(cloneQuestions)
    
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

  const getCategorisationData = async (companyInfoId) => {
    try {
      const res = await fetch(`https://preprod-api.fandoro.com` + `/investor/categorisation/${companyInfoId}`, {
        method: "GET",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
      });
      if (!res.ok) {
        // toast.error("Invalid credentials");
        // setIsLoading(false);
        return;
      }
      else {
        const jsondata = await res.json();
        console.log('getCategorisationData ::jsondata',jsondata)
        console.log('getCategorisationData ::responses',responses)
        if (jsondata['categories'] && jsondata['categories'].length > 0) {
          let parsedResponse={}
          jsondata['categories'].forEach((response)=>{
            let responsesObj={}
            response['responses'].forEach((res:any)=>{
              responsesObj[res['id']]={
                observations: res['observations'],
                response: res['selectedResponse'],
                score: res['score']
              }
            })
            parsedResponse[response['questionName']]=responsesObj
          })
          console.log("parsedResponse",parsedResponse)
          setResponses(parsedResponse)
        }

      }
    } catch (error) {
      console.error("Api call:", error);
      // toast.error("API Call failed. Please try again.");
    } finally {
      // setIsLoading(false);
    }

  };

  useEffect(() => {
    console.log("Inside useEffect companyInfoId", companyInfoId)
    getQuestions()
    getCategorisationData(companyInfoId)
    
  }, [])

  useEffect(() => {
    console.log("Inside useEffect questions", questions)
    
  }, [questions])

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
