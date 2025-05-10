import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

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

export function usePreScreeningResponses(initialQuestions: Question[], companyInfoId: string) {

  const [responses, setResponses] = useState<Record<string, Response>>(() => {
    const initial: Record<string, Response> = {};
    initialQuestions.forEach(q => {
      initial[q.id] = { response: "No", score: 0, remarks: "" };
    });
    return initial;
  });

  const getPrescreeningData = async (companyInfoId) => {
    try {
      const res = await fetch(`http://localhost:3002` + `/investor/pre-screening/${companyInfoId}`, {
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
        if (jsondata['responses'] && jsondata['responses'].length > 0) {
          let parsedResponse={}
          jsondata['responses'].forEach((response)=>{
            parsedResponse[response.id]={
              response: response.selectedResponse,
              score: response.score,
              remarks: response.remarks
            }
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
    getPrescreeningData(companyInfoId)
    // setResponses({
    //   "B.1": {
    //     "response": "No",
    //     "score": 0,
    //     "remarks": "its"
    //   },
    //   "B.2": {
    //     "response": "Yes",
    //     "score": 1,
    //     "remarks": ""
    //   },
    //   "B.3": {
    //     "response": "Yes",
    //     "score": 0.33,
    //     "remarks": ""
    //   },
    //   "B.4": {
    //     "response": "Yes",
    //     "score": 0.33,
    //     "remarks": ""
    //   },
    //   "B.5": {
    //     "response": "Yes",
    //     "score": 0.33,
    //     "remarks": ""
    //   }
    // })
  }, [])

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

// {
//   "B.1": {
//     "response": "No",
//     "score": 0,
//     "remarks": "its"
//   },
//   "B.2": {
//     "response": "Yes",
//     "score": 1,
//     "remarks": ""
//   },
//   "B.3": {
//     "response": "Yes",
//     "score": 0.33,
//     "remarks": ""
//   },
//   "B.4": {
//     "response": "Yes",
//     "score": 0.33,
//     "remarks": ""
//   },
//   "B.5": {
//     "response": "Yes",
//     "score": 0.33,
//     "remarks": ""
//   }
// }
