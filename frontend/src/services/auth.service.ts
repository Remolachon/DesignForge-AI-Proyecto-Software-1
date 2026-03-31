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