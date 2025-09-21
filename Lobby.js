// ------------------------
// CONFIGURACIÓN SUPABASE
// ------------------------
const SUPABASE_URL = "https://yymhkhpxeeaqvstdjjlr.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5bWhraHB4ZWVhcXZzdGRqamxyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU4MjY1NjgsImV4cCI6MjA3MTQwMjU2OH0.IR8sISA9HXYRB_FsxuyKwYp0n_YCEojLN3lcdhdXSMQ";

// Variable global para Supabase
let supabase;
let categories = []; // 🔹 Declaración global

// Inicializar Supabase
function initSupabase() {
    try {
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

// Llenar el select con las categorías
function populateCategorySelect() {
    const categoriaSelect = document.getElementById('categoria-select');
    while (categoriaSelect.options.length > 1) {
        categoriaSelect.remove(1);
    }

    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.nombre;
        categoriaSelect.appendChild(option);
    });

    console.log('Combobox de categorías poblado con', categories.length, 'categorías');
}



document.addEventListener("DOMContentLoaded", function() {
    const supabaseInitialized = initSupabase();
    
    if (!supabaseInitialized) {
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
    let players = Array(8).fill('');

    // Cargar categorías desde Supabase
    async function loadCategories() {
        try {
            if (!supabase) throw new Error('Supabase no está inicializado');

            console.log('Cargando categorías desde Supabase...');
            const { data, error } = await supabase
                .from('categorias')
                .select('*')
                .order('nombre');

            if (error) {
                console.error('Error cargando categorías:', error);
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



    // 🔹 Función para cargar categorías según edad
async function loadCategories() {
    try {
        if (!supabase) throw new Error('Supabase no está inicializado');

        console.log('Cargando categorías desde Supabase...');

        // Verificar edad guardada en localStorage
        const isAdult = localStorage.getItem('challengeme_age_verified') === 'adult';

        // Consulta a la tabla
        let query = supabase.from('categorias').select('*').order('nombre');

        if (!isAdult) {
            // Solo mostrar categorías que no son exclusivas de adultos
            query = query.eq('solo_adultos', false);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error cargando categorías:', error);
            loadDefaultCategories();
            return;
        }

        if (data && data.length > 0) {
            console.log('Categorías cargadas:', data);
            categories = data;
            populateCategorySelect();
        } else {
            console.log('No se encontraron categorías disponibles');
            loadDefaultCategories();
        }
    } catch (error) {
        console.error('Error inesperado:', error);
        loadDefaultCategories();
    }
}

    // Actualizar lista de jugadores
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

    // 🔹 CORRECCIÓN: Validación botón Jugar
    function updateJugarButton() {
    const activePlayers = players.slice(0, playerCount);
    const allPlayersNamed = activePlayers.every(name => typeof name === 'string' && name.trim() !== '');
    const isCategorySelected = selectedCategory !== null && categories.some(c => c.id === selectedCategory);

    jugarButton.disabled = !isCategorySelected || !allPlayersNamed;

    if (jugarButton.disabled) {
        jugarButton.title = !isCategorySelected
            ? 'Selecciona una categoría para jugar'
            : 'Todos los jugadores deben tener un nombre';
    } else {
        jugarButton.title = '';
    }
}


    // Eventos de jugadores
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
            if (!players[playerCount - 1]) {
                players[playerCount - 1] = `Jugador ${playerCount}`;
            }
            updatePlayersList();
            updateJugarButton();
        }
    });

    // Evento de categoría
  categoriaSelect.addEventListener('change', (e) => {
    const value = e.target.value;
    const parsedValue = parseInt(value);
    selectedCategory = Number.isInteger(parsedValue) ? parsedValue : null;

    if (selectedCategory !== null) {
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

    // Evento de jugar
    jugarButton.addEventListener('click', async () => {
        const activePlayers = players.slice(0, playerCount);
        const allPlayersNamed = activePlayers.every(name => typeof name === 'string' && name.trim() !== '');
        if (selectedCategory === null || !allPlayersNamed) return;

        const categoriaSeleccionada = categories.find(c => c.id === selectedCategory);
        const nombreCategoria = categoriaSeleccionada ? categoriaSeleccionada.nombre : 'Categoría Desconocida';

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
        window.location.href = 'ruleta-juego.html';
    });

    // Inicializar
    async function init() {
    console.log('Inicializando lobby de ruleta...');
    players = players.map((p, i) => p || `Jugador ${i + 1}`);
    await loadCategories();
    updatePlayersList();
    updateJugarButton();
}


    init();
});
