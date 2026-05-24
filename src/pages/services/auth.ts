// services/auth.ts
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

export const checkBlockedStatus = async (email: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/blocked-status`, { email });
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.response?.data?.message || error.message };
  }
};

export const forgotPassword = async (email: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/forgot-password`, { email });
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.response?.data?.message || error.message };
  }
};

export const verifyOtp = async (email: string, otp: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/verify-otp`, { email, otp });
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.response?.data?.message || error.message };
  }
};

export const resetPassword = async (email: string, otp: string, password: string) => {
  try {
    const response = await axios.post(`${API_URL}/auth/reset-password`, { email, otp, password });
    return { data: response.data, error: null };
  } catch (error: any) {
    return { data: null, error: error.response?.data?.message || error.message };
  }
};