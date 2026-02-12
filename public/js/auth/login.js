import { loginUser } from "../services/auth.service.js";

export const handleLogin = async (event) => {
  event.preventDefault();
  const form = event.target;
  const errorMessageElement = document.getElementById("error-message");

  // Ocultar mensaje de error anterior
  errorMessageElement.classList.remove("visible");
  const credentials = {
    username: form.username.value,
    password: form.password.value,
  };

  try {
    const result = await loginUser(credentials);
    // Ya no mostramos alert de éxito, simplemente redirigimos
    window.location.href = "/";
  } catch (error) {
    // Mostrar el nuevo mensaje de error
    errorMessageElement.textContent = error.message;
    errorMessageElement.classList.add("visible");
  }
};
