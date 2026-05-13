import axios from "axios";

const API_URL = "http://localhost:8000/companies";

export interface CompanyCreateRequest {
  nit: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  start_date?: string;
}

export interface CompanyResponse {
  id: number;
  nit: string;
  name: string;
  description: string | null;
  address: string | null;
  phone: string | null;
  email: string;
  start_date: string | null;
  status: string;
  created_by_user_id: number;
}

export const createCompany = async (payload: CompanyCreateRequest) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(API_URL, payload, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data as CompanyResponse;
};