import { registerUser } from "../services/auth.service.js";

export const handleRegister = async (event) => {
  event.preventDefault();
  const form = event.target;
  const errorMessageElement = document.getElementById("error-message");

  // Ocultar mensaje de error anterior
  errorMessageElement.classList.remove("visible");

  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  if (password !== confirmPassword) {
    // Mostrar error de contraseñas que no coinciden
    errorMessageElement.textContent = "Las contraseñas no coinciden.";
    errorMessageElement.classList.add("visible");
    return;
  }

  const userData = {
    username: form.username.value,
    email: form.email.value,
    password: password,
    profile: {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
    },
  };

  try {
    const result = await registerUser(userData);
    alert(result.msg); // Mantenemos el alert de éxito para el registro
    window.location.href = "/login.html";
  } catch (error) {
    // Mostrar error que viene del backend (ej: usuario ya existe)
    errorMessageElement.textContent = error.message;
    errorMessageElement.classList.add("visible");
  }
};
