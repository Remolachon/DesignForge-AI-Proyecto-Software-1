import axios from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function getAuthHeaders() {
  return {
    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
  };
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface StaffMember {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  is_active: boolean;
  role_active: boolean;
  assigned_at: string | null;
}

// ─── Service Functions ────────────────────────────────────────────────────────

export async function fetchStaff(): Promise<StaffMember[]> {
  const response = await axios.get(`${API_URL}/staff/`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function assignFuncionarioRole(userId: number): Promise<{ message: string; user_id: number }> {
  const response = await axios.post(
    `${API_URL}/staff/${userId}/assign`,
    {},
    { headers: getAuthHeaders() }
  );
  return response.data;
}

export async function revokeFuncionarioRole(userId: number): Promise<{ message: string; user_id: number }> {
  const response = await axios.delete(`${API_URL}/staff/${userId}/revoke`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}

export async function inviteFuncionario(email: string): Promise<{ message: string; user_id: number }> {
  const response = await axios.post(
    `${API_URL}/staff/invite`,
    { email },
    { headers: getAuthHeaders() }
  );
  return response.data;
}

export async function removeFuncionario(userId: number): Promise<{ message: string; user_id: number }> {
  const response = await axios.delete(`${API_URL}/staff/${userId}/remove`, {
    headers: getAuthHeaders(),
  });
  return response.data;
}
