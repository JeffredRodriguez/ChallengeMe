// ------------------------
// CONFIGURACIÓN SUPABASE
// ------------------------
const supabaseUrl = "https://yymhkhpxeeaqvstdjjlr.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bWhraHB4ZWVhcXZzdGRqamxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MjY1NjgsImV4cCI6MjA3MTQwMjU2OH0.IR8sISA9HXYRB_FsxuyKwYp0n_YCEojLN3lcdhdXSMQ";

// Crear cliente Supabase
let supabase;
try {
  supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
  console.log('Supabase inicializado correctamente');
} catch (error) {
  console.error('Error inicializando Supabase:', error);
}

document.addEventListener("DOMContentLoaded", function() {
  // Elementos del DOM
  const categoriaSelect = document.getElementById('categoria-select');
  const categoriaDescripcion = document.getElementById('categoria-descripcion');
  const jugadoresContainer = document.getElementById('jugadores-container');
  const playerCountElement = document.getElementById('player-count');
  const decreaseButton = document.getElementById('decrease-players');
  const increaseButton = document.getElementById('increase-players');
  const jugarButton = document.getElementById('btn-jugar');
  
  // Estado de la aplicación
  let playerCount = 4;
  let selectedCategory = null;
  let categories = [];
  let players = Array(4).fill().map((_, i) => `Jugador ${i + 1}`);
  
  // Cargar categorías desde Supabase
  async function loadCategories() {
    try {
      // Verificar que Supabase esté inicializado
      if (!supabase) {
        throw new Error('Supabase no está inicializado');
      }
      
      console.log('Cargando categorías desde Supabase...');
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');
      
      if (error) {
        console.error('Error cargando categorías:', error);
        // Cargar categorías por defecto en caso de error
        loadDefaultCategories();
        return;
      }
      
      if (data && data.length > 0) {
        console.log('Categorías cargadas:', data);
        categories = data;
        populateCategorySelect();
      } else {
        console.log('No se encontraron categorías en la base de datos');
        loadDefaultCategories();
      }
    } catch (error) {
      console.error('Error inesperado:', error);
      loadDefaultCategories();
    }
  }
  

  
  // Llenar el select con las categorías
  function populateCategorySelect() {
    // Limpiar opciones existentes (excepto la primera)
    while (categoriaSelect.options.length > 1) {
      categoriaSelect.remove(1);
    }
    
    // Agregar categorías
    categories.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.nombre;
      categoriaSelect.appendChild(option);
    });
    
    console.log('Combobox de categorías poblado con', categories.length, 'categorías');
  }
  
  // Actualizar la lista de jugadores
  function updatePlayersList() {
    jugadoresContainer.innerHTML = '';
    
    for (let i = 0; i < playerCount; i++) {
      const playerDiv = document.createElement('div');
      playerDiv.className = 'bg-gray-700 p-4 rounded-lg';
      playerDiv.innerHTML = `
        <label class="block text-sm font-medium mb-2 text-gray-300">Jugador ${i + 1}</label>
        <input 
          type="text" 
          class="input-jugador w-full" 
          placeholder="Nombre del jugador"
          value="${players[i] || ''}"
          data-index="${i}"
        >
      `;
      
      const input = playerDiv.querySelector('input');
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.getAttribute('data-index'));
        players[index] = e.target.value;
        updateJugarButton();
      });
      
      jugadoresContainer.appendChild(playerDiv);
    }
  }
  
  // Actualizar estado del botón de jugar
  function updateJugarButton() {
    const allPlayersNamed = players.slice(0, playerCount).every(name => name.trim() !== '');
    const isCategorySelected = selectedCategory !== null;
    
    jugarButton.disabled = !isCategorySelected || !allPlayersNamed;
    
    if (jugarButton.disabled) {
      jugarButton.title = !isCategorySelected ? 
        'Selecciona una categoría para jugar' : 
        'Todos los jugadores deben tener un nombre';
    } else {
      jugarButton.title = '';
    }
  }
  
  // Event listeners para los botones de incremento/decremento
  decreaseButton.addEventListener('click', () => {
    if (playerCount > 2) {
      playerCount--;
      playerCountElement.textContent = playerCount;
      updatePlayersList();
      updateJugarButton();
    }
  });
  
  increaseButton.addEventListener('click', () => {
    if (playerCount < 8) {
      playerCount++;
      playerCountElement.textContent = playerCount;
      
      // Asegurarse de que el array de jugadores tenga suficientes elementos
      if (players.length < playerCount) {
        players = [...players, ...Array(playerCount - players.length).fill('')];
      }
      
      updatePlayersList();
      updateJugarButton();
    }
  });
  
  // Event listener para el cambio de categoría
  categoriaSelect.addEventListener('change', (e) => {
    selectedCategory = e.target.value ? parseInt(e.target.value) : null;
    
    // Mostrar descripción de la categoría seleccionada
    if (selectedCategory) {
      const categoria = categories.find(c => c.id === selectedCategory);
      if (categoria && categoria.descripcion) {
        categoriaDescripcion.textContent = categoria.descripcion;
        categoriaDescripcion.classList.remove('hidden');
      } else {
        categoriaDescripcion.classList.add('hidden');
      }
    } else {
      categoriaDescripcion.classList.add('hidden');
    }
    
    updateJugarButton();
  });
  
  // Event listener para el botón de jugar
  jugarButton.addEventListener('click', async () => {
    if (!selectedCategory || !players.slice(0, playerCount).every(name => name.trim() !== '')) {
      return;
    }
    
    // Obtener el nombre de la categoría seleccionada
    const categoriaSeleccionada = categories.find(c => c.id === selectedCategory);
    const nombreCategoria = categoriaSeleccionada ? categoriaSeleccionada.nombre : 'Categoría Desconocida';
    
    // Guardar la configuración de la partida en el almacenamiento local
    const gameConfig = {
      category: selectedCategory,
      categoryName: nombreCategoria,
      players: players.slice(0, playerCount).map((name, index) => ({
        id: index + 1,
        name: name.trim() || `Jugador ${index + 1}`,
        score: 0
      })),
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('ruletaGameConfig', JSON.stringify(gameConfig));
    
    // Redirigir a la página del juego de la ruleta
    window.location.href = 'ruleta-juego.html';
  });
  
  // Cargar datos iniciales
  async function init() {
    console.log('Inicializando lobby de ruleta...');
    await loadCategories();
    updatePlayersList();
    updateJugarButton();
    
    // Cargar configuración previa si existe
    const savedConfig = localStorage.getItem('ruletaGameConfig');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        selectedCategory = config.category;
        
        // Seleccionar la categoría guardada
        if (selectedCategory && categoriaSelect) {
          categoriaSelect.value = selectedCategory;
          
          // Disparar el evento change para actualizar la descripción
          const event = new Event('change');
          categoriaSelect.dispatchEvent(event);
        }
        
        // Cargar jugadores
        if (config.players && config.players.length > 0) {
          playerCount = config.players.length;
          playerCountElement.textContent = playerCount;
          players = config.players.map(p => p.name);
          updatePlayersList();
        }
      } catch (e) {
        console.error('Error loading saved game config:', e);
      }
    }
    
    console.log('Lobby de ruleta inicializado correctamente');
  }
  
  // Inicializar la aplicación
  init();
});