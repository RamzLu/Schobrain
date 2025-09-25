import { loginUser } from "../services/auth.service.js";

export const handleLogin = async (event) => {
  event.preventDefault();
  const form = event.target;

  const credentials = {
    username: form.username.value,
    password: form.password.value,
  };

  try {
    const result = await loginUser(credentials);
    alert(result.msg);
    // Aquí se redirige al html
    window.location.href = "/";
  } catch (error) {
    alert(error.message);
  }
};
