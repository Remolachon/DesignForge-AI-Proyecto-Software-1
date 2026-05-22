import axios from "axios";
import { supabaseClient } from "@/lib/supabase/supabaseClient";

const ENV_API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
const DEFAULT_PROD_API_BASE_URL = "https://designforge-ai-proyecto-software-1.onrender.com";
const API_BASE_URL =
  ENV_API_BASE_URL ||
  (typeof window !== "undefined" && window.location.hostname === "localhost"
    ? "http://localhost:8000"
    : DEFAULT_PROD_API_BASE_URL);
const REQUEST_TIMEOUT_MS = 15000;

const getAuthApiUrl = () => {
  if (!API_BASE_URL) {
    throw new Error("API_URL_NOT_CONFIGURED");
  }

  return `${API_BASE_URL}/auth`;
};

type GoogleAuthMode = "login" | "register";

export const getDashboardByRole = (role: string | undefined) => {
  const normalizedRole = (role || "").toLowerCase().trim();

  if (normalizedRole === "administrador") {
    return "/administrador/dashboard";
  }

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

export const completeGoogleAuth = async (code?: string) => {
  const apiUrl = getAuthApiUrl();
  let accessToken: string | undefined;
  const fragment = window.location.hash.substring(1);

  console.log("completeGoogleAuth: starting", { code: !!code, fragmentLength: fragment.length });

  if (code) {
    console.log("completeGoogleAuth: using authorization code flow");
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("completeGoogleAuth: exchangeCodeForSession error:", sessionError);
      throw sessionError;
    }

    accessToken = sessionData.session?.access_token;
    console.log("completeGoogleAuth: got token from exchangeCodeForSession", { hasToken: !!accessToken });
  } else if (fragment) {
    // Supabase is using implicit flow - let it process the fragment automatically
    console.log("completeGoogleAuth: fragment detected, letting Supabase process it");
    
    // Wait a moment for Supabase to process the fragment and set the session
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError) {
      console.error("completeGoogleAuth: getSession error after fragment:", sessionError);
      throw sessionError;
    }

    accessToken = sessionData.session?.access_token;
    console.log("completeGoogleAuth: got token from session after processing fragment", {
      hasToken: !!accessToken,
      email: sessionData.session?.user?.email,
    });
  } else {
    // No code, no fragment - try getSession() directly
    console.log("completeGoogleAuth: no code or fragment, trying getSession()");
    const { data: sessionData, error: sessionError } = await supabaseClient.auth.getSession();

    if (sessionError) {
      console.error("completeGoogleAuth: getSession error:", sessionError);
      throw sessionError;
    }

    accessToken = sessionData.session?.access_token;
    console.log("completeGoogleAuth: got token from direct getSession()", { hasToken: !!accessToken });
  }

  if (!accessToken) {
    console.error("completeGoogleAuth: FAILED - no access_token available after Google redirect", {
      urlFragment: fragment.substring(0, 50),
      hasCode: !!code,
      hasFragment: !!fragment,
    });
    throw new Error("SESSION_EXPIRED");
  }

  console.log("completeGoogleAuth: SUCCESS - token acquired, posting to backend");

  try {
    console.log("completeGoogleAuth: posting access_token to backend", { api: `${apiUrl}/google-oauth` });
    const response = await axios.post(
      `${apiUrl}/google-oauth`,
      {
        access_token: accessToken,
      },
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
  const apiUrl = getAuthApiUrl();
  const response = await axios.post(
    `${apiUrl}/login`,
    {
      email,
      password,
    },
    {
      timeout: REQUEST_TIMEOUT_MS,
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
  const apiUrl = getAuthApiUrl();

  const res = await axios.post(`${apiUrl}/register`, {
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
  const apiUrl = getAuthApiUrl();

  try {
    await axios.post(
      `${apiUrl}/logout`,
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