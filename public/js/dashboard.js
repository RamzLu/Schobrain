import { verifyAuth, logoutUser } from "./services/auth.service.js";

const initializeDashboard = async () => {
  // Primero, verifica si el usuario está autenticado
  const authData = await verifyAuth();

  if (authData) {
    // Si la autenticación es exitosa, puedes usar los datos del usuario
    console.log("Usuario autenticado:", authData.data);

    // aqui va la logica para el logout
    const logoutButton = document.getElementById("logout-button");
    if (logoutButton) {
      logoutButton.addEventListener("click", async () => {
        try {
          const result = await logoutUser();
          alert(result.msg);
          window.location.href = "/login.html"; // Redirige al login
        } catch (error) {
          alert(error.message);
        }
      });
    }
  }
};

// Llama a la función de inicialización cuando el script se cargue
initializeDashboard();
