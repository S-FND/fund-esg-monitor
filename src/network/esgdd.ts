import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;
console.log('API_URL', API_URL);

// Create an axios instance with the base URL
const api = axios.create({
  baseURL: `${API_URL}`, // Add the /esg-dd/ path here
});

const getAuthToken = () => {
  return localStorage.getItem("auth_token");
};
console.log('getAuthToken',getAuthToken);
// Add request interceptor to include auth headers
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers["Content-Type"] = "application/json";
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Additional helper function to get entityId from localStorage
const getUserEntityId = () => {
  try {
    const user = localStorage.getItem("fandoro-user");
    if (user) {
      const parsedUser = JSON.parse(user);
      return parsedUser?.entityId || null;
    }
    return null;
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};

// ESG DD Report APIs
export const getEsgDDReport = async (params: any) => {
  try {
    const response = await api.get(`company/entity/esdd-report/${params.entityId}`);
    return [response.data, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "An unexpected error occurred"];
  }
};

export const getReportlists = async (params: any) => {
  try {
    const response = await api.get(`company/entity/reportlists/${params.entityId}`, {
      params: {
        typeofReport: params.typeofReport
      }
    });
    return [response.data, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "An unexpected error occurred"];
  }
};

export const getEsgDDReports = async (params: any) => {
  try {
    const response = await api.get(`investor/esdd-reports/${params.email}`);
    return [response.data, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "An unexpected error occurred"];
  }
};

export const getEsgCapPlan = async (params: any) => {
  try {
    const response = await api.get(`/investor/esgdd/escap/plan/${params.entityId}`);
    return [response.data, null];
  } catch (error: any) {
    if (error?.response?.data?.message) {
      return [null, error.response.data.message];
    }
    console.log("error message: ", error.message);
    return [null, error.message || "An unexpected error occurred"];
  }
};

export const saveEscap = async (postData: any) => {
  try {
    const response = await api.post(`investor/esgdd/escap/create`, postData);
    return [response, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "ERROR : An unexpected error occurred"];
  }
};

export const updatePlan = async (postData: any) => {
  try {
    const response = await api.post(`esgdd/escap/update-plan-details`, postData);
    return [response, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "ERROR : An unexpected error occurred"];
  }
};

export const getCompanyList = async () => {
  try {
    const response = await api.get(`investor/companyInfo`);
    return [response.data, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "An unexpected error occurred"];
  }
};

export const getEsgCap = async (params: any) => {
  try {
    const response = await api.get(`esgdd/escap/${params.entityId}`);
    return [response.data, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "An unexpected error occurred"];
  }
};

export const getEsgCaps = async (params: any) => {
  try {
    const response = await api.get(`investor/esgdd/escap/${params.email}`);
    return [response.data, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "An unexpected error occurred"];
  }
};

export const esgddAcceptPlan = async (postData: any) => {
  try {
    const response = await api.post(`esgdd/escap/accept-plan`, postData);
    return [response, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "ERROR : An unexpected error occurred"];
  }
};

export const esgddChangePlan = async (postData: any) => {
  try {
    const response = await api.post(`esgdd/escap/change-request`, postData);
    return [response, null];
  } catch (error: any) {
    console.log("error message: ", error.message);
    return [null, error.message || "ERROR : An unexpected error occurred"];
  }
};

// Export entityId if needed elsewhere
export const entityId = getUserEntityId();

// Group all functions into EsgddAPIs object for backward compatibility
export const EsgddAPIs = {
  getEsgDDReport,
  getReportlists,
  getEsgDDReports,
  getEsgCapPlan,
  saveEscap,
  updatePlan,
  getCompanyList,
  getEsgCap,
  getEsgCaps,
  esgddAcceptPlan,
  esgddChangePlan,
  entityId: getUserEntityId()
};