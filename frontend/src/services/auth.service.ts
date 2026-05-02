import axios from "axios";
import { supabaseClient } from "@/lib/supabase/supabaseClient";

const API_URL = "http://localhost:8000/auth";

type GoogleAuthMode = "login" | "register";

export const getDashboardByRole = (role: string | undefined) => {
  const normalizedRole = (role || "").toLowerCase().trim();

  if (normalizedRole === "funcionario") {
    return "/funcionario/dashboard";
  }

  return "/cliente/dashboard";
};

export const startGoogleAuth = async (mode: GoogleAuthMode) => {
  const redirectTo = `${window.location.origin}/auth/callback?mode=${mode}`;

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw error;
  }

  if (data.url) {
    window.location.href = data.url;
  }
};

export const completeGoogleAuth = async (code: string) => {
  // Intercambiar el código por sesión en Supabase
  const { data: sessionData, error: sessionError } = await supabaseClient.auth.exchangeCodeForSession(code);

  if (sessionError) {
    console.error("completeGoogleAuth: exchangeCodeForSession error:", sessionError);
    throw sessionError;
  }

  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    console.error("completeGoogleAuth: no access_token in sessionData", sessionData);
    throw new Error("SESSION_EXPIRED");
  }

  try {
    console.log("completeGoogleAuth: posting access_token to backend", { api: `${API_URL}/google-oauth` });
    const response = await axios.post(
      `${API_URL}/google-oauth`,
      {
        access_token: accessToken,
      },
      {
        timeout: 7000,
      }
    );

    console.log("completeGoogleAuth: backend response", response.data);

    const { access_token, first_name, last_name, role } = response.data;

    localStorage.setItem("token", access_token);
    localStorage.setItem("user_name", `${first_name} ${last_name}`);
    localStorage.setItem("role", role);

    return response.data;
  } catch (err) {
    console.error("completeGoogleAuth: error posting to backend", err);
    throw err;
  }
};

export const login = async (email: string, password: string) => {
  const response = await axios.post(
    `${API_URL}/login`,
    {
      email,
      password,
    },
    {
      timeout: 5000,
    }
  );

  const { access_token, first_name, last_name, role } = response.data;

  localStorage.setItem("token", access_token);
  localStorage.setItem("user_name", `${first_name} ${last_name}`);
  localStorage.setItem("role", role);

  return response.data;
};

export const register = async (
  first_name: string,
  last_name: string,
  phone: string,
  email: string,
  password: string,
  confirm_password: string
) => {
  const res = await axios.post(`${API_URL}/register`, {
    first_name,
    last_name,
    phone,
    email,
    password,
    confirm_password,
  });

  return res.data;
};

export const logout = async () => {
  try {
    await axios.post(
      `${API_URL}/logout`,
      {},
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );
  } catch (error) {
    console.log("Logout backend error:", error);
  }

  localStorage.removeItem("token");
  localStorage.removeItem("user_name");
  localStorage.removeItem("role");
};