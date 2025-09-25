import { registerUser } from "../services/auth.service.js";

export const handleRegister = async (event) => {
  event.preventDefault();
  const form = event.target;

  const userData = {
    username: form.username.value,
    email: form.email.value,
    password: form.password.value,
    profile: {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      biography: form.biography.value,
      avatarUrl: form.avatarUrl.value,
      birthDate: form.birthDate.value,
    },
  };

  try {
    const result = await registerUser(userData);
    alert(result.msg);
    window.location.href = "/login.html"; // Redirige al login
  } catch (error) {
    alert(error.message);
  }
};
