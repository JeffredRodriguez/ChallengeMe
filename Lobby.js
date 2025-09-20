// ------------------------
// CONFIGURACIÓN SUPABASE
// ------------------------
const SUPABASE_URL = "https://yymhkhpxeeaqvstdjjlr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhbmFzZSIsInJlZiI6Inl5bWhraHB4ZWVhcXZzdGRqamxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MjY1NjgsImV4cCI6MjA3MTQwMjU2OH0.IR8sISA9HXYRB_FsxuyKwYp0n_YCEojLN3lcdhdXSMQ";

// Variable global para Supabase
let supabase;

// Inicializar Supabase
function initSupabase() {
    try {
        // Verificar que la biblioteca de Supabase esté cargada
        if (typeof window.supabase === 'undefined') {
            console.error('Error: La biblioteca de Supabase no está cargada');
            return false;
        }
        
        supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        console.log('Supabase inicializado correctamente');
        return true;
    } catch (error) {
        console.error('Error inicializando Supabase:', error);
        return false;
    }
}

document.addEventListener("DOMContentLoaded", function() {
    // Inicializar Supabase
    const supabaseInitialized = initSupabase();
    
    if (!supabaseInitialized) {
        // Mostrar mensaje de error si Supabase no se pudo inicializar
        alert('Error de conexión. Algunas funciones pueden no estar disponibles.');
    }

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
    let players = Array(8).fill(''); // Inicializar con 8 posiciones vacías
    
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
    
    // Cargar categorías por defecto (fallback)
    function loadDefaultCategories() {
        console.log('Cargando categorías por defecto');
        categories = [
            { id: 1, nombre: 'Capitales', descripcion: 'Preguntas sobre capitales del mundo' },
            { id: 2, nombre: 'Ciencia', descripcion: 'Preguntas sobre ciencias naturales y tecnología' },
            { id: 3, nombre: 'Matemáticas', descripcion: 'Preguntas sobre matemáticas y cálculo' }
        ];
        populateCategorySelect();
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
    
    // Actualizar estado del botón de jugar - CORRECCIÓN PRINCIPAL
    function updateJugarButton() {
        // Verificar que todos los jugadores activos tengan nombre
        const activePlayers = players.slice(0, playerCount);
        const allPlayersNamed = activePlayers.every(name => name && name.trim() !== '');
        const isCategorySelected = selectedCategory !== null;
        
        jugarButton.disabled = !isCategorySelected || !allPlayersNamed;
        
        if (jugarButton.disabled) {
            jugarButton.title = !isCategorySelected ? 
                'Selecciona una categoría para jugar' : 
                'Todos los jugadores deben tener un nombre';
        } else {
            jugarButton.title = '';
        }
        
        console.log('Validación - Jugadores activos:', activePlayers);
        console.log('Todos con nombre:', allPlayersNamed, 'Categoría seleccionada:', isCategorySelected);
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
            
            // Si el jugador nuevo no tiene nombre, asignar uno por defecto
            if (!players[playerCount - 1]) {
                players[playerCount - 1] = `Jugador ${playerCount}`;
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
        // Obtener solo los jugadores activos
        const activePlayers = players.slice(0, playerCount);
        const allPlayersNamed = activePlayers.every(name => name && name.trim() !== '');
        
        if (!selectedCategory || !allPlayersNamed) {
            console.error('No se puede jugar: categoría o jugadores inválidos');
            return;
        }
        
        // Obtener el nombre de la categoría seleccionada
        const categoriaSeleccionada = categories.find(c => c.id === selectedCategory);
        const nombreCategoria = categoriaSeleccionada ? categoriaSeleccionada.nombre : 'Categoría Desconocida';
        
        // Guardar la configuración de la partida en el almacenamiento local
        const gameConfig = {
            category: selectedCategory,
            categoryName: nombreCategoria,
            players: activePlayers.map((name, index) => ({
                id: index + 1,
                name: name.trim() || `Jugador ${index + 1}`,
                score: 0
            })),
            createdAt: new Date().toISOString()
        };
        
        localStorage.setItem('ruletaGameConfig', JSON.stringify(gameConfig));
        console.log('Configuración guardada:', gameConfig);
        
        // Redirigir a la página del juego de la ruleta
        window.location.href = 'ruleta-juego.html';
    });
    
    // Cargar datos iniciales
    async function init() {
        console.log('Inicializando lobby de ruleta...');
        
        // Inicializar nombres de jugadores por defecto para los primeros 4
        for (let i = 0; i < 4; i++) {
            if (!players[i]) {
                players[i] = `Jugador ${i + 1}`;
            }
        }
        
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
                    
                    // Actualizar el array de jugadores
                    config.players.forEach((player, index) => {
                        if (index < players.length) {
                            players[index] = player.name;
                        }
                    });
                    
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