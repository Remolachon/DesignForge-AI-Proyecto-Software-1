import axios from "axios";

const API_URL = "http://localhost:8000/auth";

export const login = async (email: string, password: string) => {
  const response = await axios.post(
    `${API_URL}/login`,
    {
      email,
      password,
    },
    {
      timeout: 5000, // ✅ IMPORTANTE
    }
  );

  const token = response.data.access_token;

  localStorage.setItem("token", token);

  return response.data;
};

export const register = async (
  first_name: string,
  last_name: string,
  email: string,
  password: string
) => {
  const res = await axios.post("http://localhost:8000/auth/register", {
    first_name,
    last_name,
    email,
    password,
  });

  return res.data;
};

export const logout = () => {
  localStorage.removeItem("token");
};