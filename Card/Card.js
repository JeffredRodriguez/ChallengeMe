import { getSupabaseClient } from "../SupabaseConection.js";

document.addEventListener("DOMContentLoaded", async () => {
  const categoriaSelect = document.getElementById("categoriaSelect");
  const btnRepartir = document.getElementById("btnRepartir");
  const card = document.querySelector(".flip-card");
  const retoTexto = document.getElementById("retoTexto");

  // Esperar a que Supabase se inicialice
  await new Promise(resolve => setTimeout(resolve, 200));

  const supabase = getSupabaseClient();
  
  if (!supabase) {
    console.error("Supabase no está disponible");
    retoTexto.textContent = "Error de conexión. Recarga la página.";
    return;
  }

  // 🔹 1. Obtener la categoría seleccionada del localStorage (como en la ruleta)
  function obtenerCategoriaSeleccionada() {
    try {
      const savedConfig = localStorage.getItem('ruletaGameConfig');
      if (!savedConfig) {
        console.warn('No se encontró configuración en localStorage');
        return null;
      }

      const gameConfig = JSON.parse(savedConfig);
      console.log('Categoría seleccionada:', gameConfig.category);
      return gameConfig.category; // Esto debería ser el ID de la categoría
      
    } catch (error) {
      console.error('Error obteniendo categoría:', error);
      return null;
    }
  }

  // 🔹 2. Obtener reto random según la categoría del localStorage
  async function obtenerRetoRandom(categoriaId) {
    try {
      console.log('Buscando retos para categoría:', categoriaId);
      
      const { data, error } = await supabase
        .from("retos")
        .select("descripcion")
        .eq("categoria_id", categoriaId);

      if (error) {
        console.error('Error Supabase:', error);
        throw error;
      }

      console.log('Retos encontrados:', data);

      if (!data || data.length === 0) {
        return "No hay retos en esta categoría.";
      }

      const randomIndex = Math.floor(Math.random() * data.length);
      return data[randomIndex].descripcion;
      
    } catch (err) {
      console.error("Error obteniendo retos:", err);
      return "Error al cargar reto.";
    }
  }

  // 🔹 3. Manejar botón Repartir
  btnRepartir.addEventListener("click", async () => {
    // Obtener la categoría del localStorage en cada click (por si cambió)
    const categoriaId = obtenerCategoriaSeleccionada();

    if (!categoriaId) {
      retoTexto.textContent = "Selecciona una categoría primero en el lobby.";
      return;
    }

    // Mostrar "Cargando..." mientras se busca el reto
    retoTexto.textContent = "Cargando reto...";

    const reto = await obtenerRetoRandom(categoriaId);
    retoTexto.textContent = reto;

    // Flip card
    card.classList.add("flipped");

    // Reset flip después de 5 segundos
    setTimeout(() => {
      card.classList.remove("flipped");
    }, 5000);
  });

  // 🔹 4. Mostrar la categoría actual en la interfaz
  function mostrarCategoriaActual() {
    const categoriaId = obtenerCategoriaSeleccionada();
    
    if (categoriaId) {
      // Podemos obtener el nombre de la categoría si es necesario
      categoriaSelect.innerHTML = `<option value="${categoriaId}">Categoría Seleccionada</option>`;
      categoriaSelect.disabled = true; // No permitir cambiar categoría
    } else {
      categoriaSelect.innerHTML = '<option value="">No hay categoría seleccionada</option>';
      btnRepartir.disabled = true;
    }
  }

  // Inicializar interfaz
  mostrarCategoriaActual();
});