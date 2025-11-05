import { registerUser } from "../services/auth.service.js";
import { showSuccessToast, showErrorToast } from "../utils/notifications.js";

export const handleRegister = async (event) => {
  event.preventDefault();
  const form = event.target;
  const errorMessageElement = document.getElementById("error-message");

  errorMessageElement.classList.remove("visible");

  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  if (password !== confirmPassword) {
    showErrorToast("Las contraseñas no coinciden."); // Reemplazamos el mensaje en el DOM
    return;
  }

  const userData = {
    username: form.username.value,
    email: form.email.value,
    password: password,
    // === INICIO DE LA MODIFICACIÓN ===
    // role: form.role.value, // <-- LÍNEA ELIMINADA
    // === FIN DE LA MODIFICACIÓN ===
    profile: {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
    },
  };

  try {
    const result = await registerUser(userData);
    showSuccessToast(result.msg);
    setTimeout(() => {
      window.location.href = "/login.html";
    }, 1500); // Pequeña demora para que el usuario vea el mensaje
  } catch (error) {
    showErrorToast(error.message);
  }
};
