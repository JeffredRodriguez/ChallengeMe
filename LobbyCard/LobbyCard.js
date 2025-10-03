
import { getSupabaseClient } from '../SupabaseConection.js';

document.addEventListener("DOMContentLoaded", function() {
    const supabase = getSupabaseClient();
    if (!supabase) {
        alert('Error de conexión. Algunas funciones pueden no estar disponibles.');
        return;
    }

    // Variables globales
    let categories = [];
    let selectedCategory = null;
    let players = Array(8).fill('');
    let playerCount = 4;

    // DOM
    const categoriaSelect = document.getElementById('categoria-select');
    const categoriaDescripcion = document.getElementById('categoria-descripcion');
    const jugadoresContainer = document.getElementById('jugadores-container');
    const playerCountElement = document.getElementById('player-count');
    const decreaseButton = document.getElementById('decrease-players');
    const increaseButton = document.getElementById('increase-players');
    const jugarButton = document.getElementById('btn-jugar');

    // Poblar el select
    function populateCategorySelect() {
        while (categoriaSelect.options.length > 1) {
            categoriaSelect.remove(1);
        }

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.id;
            option.textContent = category.nombre;
            categoriaSelect.appendChild(option);
        });

        console.log('✅ Categorías cargadas en combobox:', categories.length);
    }

    
        // Cargar categorías desde Supabase
       async function loadCategories() {
        try {
        console.log('Cargando categorías desde Supabase...');
        const isAdult = localStorage.getItem('challengeme_age_verified') === 'adult';

        let query = supabase.from('categorias_retos').select('*').order('nombre');
        if (!isAdult) query = query.eq('solo_adultos', false);

        const { data, error } = await query;

        if (error) {
            console.error('Error cargando categorías:', error);
            return;
        }

        categories = data || [];
        populateCategorySelect();
    } catch (error) {
        console.error('Error inesperado:', error);
        }
    }    

    // Lista de jugadores
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

    // Validar botón Jugar
    function updateJugarButton() {
        const activePlayers = players.slice(0, playerCount);
        const allPlayersNamed = activePlayers.every(name => typeof name === 'string' && name.trim() !== '');
        const isCategorySelected = selectedCategory !== null && categories.some(c => c.id === selectedCategory);

        jugarButton.disabled = !isCategorySelected || !allPlayersNamed;
        jugarButton.title = jugarButton.disabled
            ? (!isCategorySelected ? 'Selecciona una categoría para jugar' : 'Todos los jugadores deben tener un nombre')
            : '';
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
jugarButton.addEventListener('click', () => {
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

    // Guardar configuración y redirigir
    localStorage.setItem('cardGameConfig', JSON.stringify(gameConfig));
    window.location.href = '../Card/Card.html';
});
    // Inicializar
    async function init() {
        console.log('Inicializando lobby...');
        players = players.map((p, i) => p || `Jugador ${i + 1}`);
        await loadCategories();
        updatePlayersList();
        updateJugarButton();
    }

    init();
});
