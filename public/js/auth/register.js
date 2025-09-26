import { registerUser } from "../services/auth.service.js";

export const handleRegister = async (event) => {
  event.preventDefault();
  const form = event.target;

  const password = form.password.value;
  const confirmPassword = form.confirmPassword.value;

  // --- Verificación de contraseñas ---
  if (password !== confirmPassword) {
    alert("Las contraseñas no coinciden. Por favor, inténtalo de nuevo.");
    return; // Detiene el envío del formulario
  }

  const userData = {
    username: form.username.value,
    email: form.email.value,
    password: password, // Usamos la contraseña ya validada
    profile: {
      firstName: form.firstName.value,
      lastName: form.lastName.value,
      // Los campos opcionales como biografía se pueden omitir si no están en el nuevo diseño
    },
  };

  try {
    const result = await registerUser(userData);
    alert(result.msg);
    window.location.href = "/login.html"; // Redirige al login después del registro
  } catch (error) {
    alert(error.message);
  }
};
