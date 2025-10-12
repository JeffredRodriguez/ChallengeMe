// ------------------------
// JUEGO DE CARTAS
// ------------------------

class CardGame {
    constructor() {
        this.gameConfig = null;
        this.challenges = [];
        this.currentChallengeIndex = 0;
        this.currentPlayerIndex = 0;
        this.isDrawing = false;
        this.gameActive = true;
        this.usedChallenges = new Set();
        this.turnsPerPlayer = 8;
        this.playerTurns = [];
        this.currentChallenge = null;

        this.initializeGame();
    }

    async initializeGame() {
        try {
            // Cargar configuración del juego
            this.loadGameConfig();

            // Inicializar interfaz
            this.initializeUI();

            // Cargar retos desde Supabase
            await this.loadChallengesFromSupabase();

            // Iniciar juego
            this.startGame();
        } catch (error) {
            console.error('Error inicializando el juego:', error);
            this.handleInitializationError(error);
        }
    }

    loadGameConfig() {
        const savedConfig = localStorage.getItem('cardGameConfig');
        if (!savedConfig) {
            alert('No se encontró configuración del juego. Redirigiendo al lobby...');
            window.location.href = '../LobbyCard/LobbyCard.html';
            return;
        }

        this.gameConfig = JSON.parse(savedConfig);
        console.log('Configuración del juego cargada:', this.gameConfig);

        // Inicializar el contador de turnos por jugador
        this.playerTurns = Array(this.gameConfig.players.length).fill(0);
    }

    initializeUI() {
        // Actualizar información de la categoría
        document.getElementById('category-name').textContent = this.gameConfig.categoryName;
        document.getElementById('category-description').textContent = `Retos sobre ${this.gameConfig.categoryName}`;

        // Renderizar jugadores
        this.renderPlayers();

        // Agregar event listeners
        this.addEventListeners();
    }

    async loadChallengesFromSupabase() {
        try {
            const client = window.supabaseClient.getClient();

            if (!client) {
                throw new Error('Cliente Supabase no disponible');
            }

            console.log('Cargando retos para la categoría:', this.gameConfig.category);

            // Obtener TODOS los retos de la categoría seleccionada
            const { data, error } = await client
                .from('retos')
                .select('*')
                .eq('categoria_id', this.gameConfig.category);

            if (error) {
                throw new Error(`Error de Supabase: ${error.message}`);
            }

            if (data && data.length > 0) {
                console.log(`Se encontraron ${data.length} retos en la base de datos`);

                // Mezclar retos aleatoriamente
                this.allChallenges = this.shuffleArray(data);

                // Seleccionar máximo 25 retos
                this.challenges = this.allChallenges.slice(0, Math.min(25, this.allChallenges.length));

                console.log(`Se usarán ${this.challenges.length} retos para el juego`);

                if (this.challenges.length < 10) {
                    console.warn('Pocos retos disponibles. Considera agregar más a la base de datos.');
                }
            } else {
                throw new Error('No se encontraron retos para esta categoría en la base de datos');
            }

        } catch (error) {
            console.error('Error cargando retos desde Supabase:', error);
            this.useFallbackChallenges();
        }
    }

    useFallbackChallenges() {
        console.log('Usando retos de respaldo...');
        this.challenges = [
            { descripcion: "Baila por 30 segundos", dificultad: "fácil" },
            { descripcion: "Imita a tu celebridad favorita", dificultad: "media" },
            { descripcion: "Canta una canción completa", dificultad: "difícil" },
            { descripcion: "Haz 10 flexiones", dificultad: "fácil" },
            { descripcion: "Cuenta un chiste gracioso", dificultad: "media" }
        ];
    }

    handleInitializationError(error) {
        const errorMessage = `Error al inicializar el juego: ${error.message}. Se usarán retos de respaldo.`;
        console.error(errorMessage);
        alert(errorMessage);

        this.useFallbackChallenges();
        this.startGame();
    }

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    renderPlayers() {
        const container = document.getElementById('players-container');
        container.innerHTML = '';

        this.gameConfig.players.forEach((player, index) => {
            const playerCard = document.createElement('div');
            playerCard.className = `player-card ${index === this.currentPlayerIndex ? 'active' : ''}`;
            playerCard.innerHTML = `
                <div class="player-info">
                    <span class="player-name">${player.name}</span>
                    <span class="player-score">${player.score} pts</span>
                </div>
            `;
            container.appendChild(playerCard);
        });

        // Actualizar jugador actual
        document.getElementById('current-player').textContent =
            this.gameConfig.players[this.currentPlayerIndex].name;
    }

    addEventListeners() {
        // Botón de siguiente carta
        document.getElementById('next-card-btn').addEventListener('click', () => this.drawCard());

        // Botones de resultado principales
        document.getElementById('btn-completed-main').addEventListener('click', () => this.handleChallenge(true));
        document.getElementById('btn-failed-main').addEventListener('click', () => this.handleChallenge(false));

        // Botones de pausa
        document.getElementById('btn-pausa').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-game').addEventListener('click', () => this.resumeGame());
        document.getElementById('exit-game').addEventListener('click', () => this.showExitConfirmation());

        // Botones de confirmación de salida
        document.getElementById('confirm-exit').addEventListener('click', () => this.exitGame());
        document.getElementById('cancel-exit').addEventListener('click', () => this.hideExitConfirmation());

        // Botón de continuar en el modal de ganadores
        document.getElementById('continue-btn').addEventListener('click', () => {
            window.location.href = '../LobbyCard/LobbyCard.html';
        });

        // Click en la carta
        document.getElementById('game-card').addEventListener('click', () => this.drawCard());
    }

    startGame() {
        console.log('Juego iniciado con', this.challenges.length, 'retos');

        if (this.challenges.length === 0) {
            alert('No hay retos disponibles para esta categoría. Redirigiendo al lobby...');
            window.location.href = '../LobbyCard/LobbyCard.html';
            return;
        }

        this.updateUI();
    }

    drawCard() {
        if (this.isDrawing || !this.gameActive) return;

        this.isDrawing = true;
        const cardInner = document.getElementById('card-inner');

        // Voltear la carta
        cardInner.classList.toggle('flipped');

        // Si la carta está volteada (mostrando el reverso), mostrar nuevo reto
        if (cardInner.classList.contains('flipped')) {
            this.showRandomChallenge();
        } else {
            // Si está mostrando el frente, resetear texto y ocultar botones
            document.getElementById('card-text').textContent = "Haz clic para siguiente reto";
            document.getElementById('result-buttons-container').classList.add('hidden');
        }

        this.isDrawing = false;
    }

    showRandomChallenge() {
        if (this.challenges.length === 0) {
            this.endGame();
            return;
        }

        // Seleccionar reto aleatorio que no se haya usado
        let availableChallenges = this.challenges.filter((_, index) => !this.usedChallenges.has(index));

        if (availableChallenges.length === 0) {
            // Si todos los retos se usaron, reiniciar
            this.usedChallenges.clear();
            availableChallenges = this.challenges;
        }

        const randomIndex = Math.floor(Math.random() * availableChallenges.length);
        const challengeIndex = this.challenges.indexOf(availableChallenges[randomIndex]);
        this.usedChallenges.add(challengeIndex);

        const challenge = this.challenges[challengeIndex];
        this.currentChallenge = challenge;

        this.displayChallenge(challenge);
    }

    displayChallenge(challenge) {
        // MOSTRAR EL TEXTO EN LA CARTA
        document.getElementById('card-text').textContent = challenge.descripcion;

        // MOSTRAR BOTONES DE RESULTADO
        document.getElementById('result-buttons-container').classList.remove('hidden');

        // Guardar información del reto actual para los puntos
        this.currentChallenge = challenge;
    }

    handleChallenge(isCompleted) {
        if (!this.currentChallenge) return;

        const currentPlayer = this.gameConfig.players[this.currentPlayerIndex];

        if (isCompleted) {
            // Puntos basados en dificultad
            const points = this.getPointsByDifficulty(this.currentChallenge.dificultad);
            currentPlayer.score += points;

            // Marcar jugador como correcto
            document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.add('correct');

            console.log(`✅ ${currentPlayer.name} completó el reto: +${points} puntos`);
            
            // Mostrar feedback visual
            this.showFeedback('¡Logrado! +' + points + ' puntos', 'green');
        } else {
            // Marcar jugador como incorrecto
            document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.add('incorrect');
            console.log(`❌ ${currentPlayer.name} falló el reto`);
            
            // Mostrar feedback visual
            this.showFeedback('Falló el reto', 'red');
        }

        // Ocultar botones de resultado inmediatamente
        document.getElementById('result-buttons-container').classList.add('hidden');

        // Voltear la carta de vuelta al frente después de un delay
        setTimeout(() => {
            this.flipCardBack();
            
            // Pasar al siguiente jugador
            setTimeout(() => {
                this.nextPlayer();
            }, 1000);
        }, 1500);
    }

    flipCardBack() {
        const cardInner = document.getElementById('card-inner');
        cardInner.classList.remove('flipped');
        document.getElementById('card-text').textContent = "Haz clic para siguiente reto";
    }

    showFeedback(message, type) {
        // Crear elemento de feedback temporal
        const feedback = document.createElement('div');
        feedback.className = `fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-4 rounded-lg font-bold text-white text-xl ${
            type === 'green' ? 'bg-green-500' : 'bg-red-500'
        }`;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        // Remover después de 1.5 segundos
        setTimeout(() => {
            if (feedback.parentNode) {
                document.body.removeChild(feedback);
            }
        }, 1500);
    }

    getPointsByDifficulty(difficulty) {
        const points = {
            'fácil': 10,
            'media': 20,
            'difícil': 30
        };
        return points[difficulty] || 10;
    }

    nextPlayer() {
        // Remover clases de resultado de los jugadores
        document.querySelectorAll('.player-card').forEach(card => {
            card.classList.remove('correct', 'incorrect');
        });

        // Remover clase active del jugador actual
        document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.remove('active');

        // Sumar turno al jugador actual
        this.playerTurns[this.currentPlayerIndex] += 1;

        // Verificar si todos los jugadores han jugado 8 turnos
        const allDone = this.playerTurns.every(turns => turns >= this.turnsPerPlayer);

        if (allDone) {
            setTimeout(() => {
                this.endGame();
            }, 1000);
            return;
        }

        // Pasar al siguiente jugador que no haya terminado sus turnos
        let nextIndex = this.currentPlayerIndex;
        do {
            nextIndex = (nextIndex + 1) % this.gameConfig.players.length;
        } while (this.playerTurns[nextIndex] >= this.turnsPerPlayer);

        this.currentPlayerIndex = nextIndex;

        // Agregar clase active al nuevo jugador
        document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.add('active');
        document.getElementById('current-player').textContent =
            this.gameConfig.players[this.currentPlayerIndex].name;

        this.updateUI();
        
        // Resetear el estado de la carta para el siguiente jugador
        const cardInner = document.getElementById('card-inner');
        if (cardInner.classList.contains('flipped')) {
            cardInner.classList.remove('flipped');
        }
        document.getElementById('card-text').textContent = "Haz clic para comenzar";
        document.getElementById('result-buttons-container').classList.add('hidden');
    }

    updateUI() {
        this.renderPlayers();
    }

    pauseGame() {
        this.gameActive = false;
        document.getElementById('pause-modal').classList.remove('hidden');
    }

    resumeGame() {
        this.gameActive = true;
        document.getElementById('pause-modal').classList.add('hidden');
    }

    showExitConfirmation() {
        document.getElementById('exit-confirm-modal').classList.remove('hidden');
    }

    hideExitConfirmation() {
        document.getElementById('exit-confirm-modal').classList.add('hidden');
    }

    exitGame() {
        window.location.href = '../LobbyCard/LobbyCard.html';
    }

    endGame() {
        // Ordenar jugadores por puntuación (de mayor a menor)
        const sortedPlayers = [...this.gameConfig.players].sort((a, b) => b.score - a.score);

        // Mostrar modal de ganadores
        this.showWinnersModal(sortedPlayers);
    }

    showWinnersModal(sortedPlayers) {
        const modal = document.getElementById('winners-modal');
        const winnersList = document.getElementById('winners-list');
        
        // Limpiar lista anterior
        winnersList.innerHTML = '';

        // Actualizar podio
        if (sortedPlayers.length > 0) {
            document.getElementById('first-place-name').textContent = sortedPlayers[0].name;
        }
        if (sortedPlayers.length > 1) {
            document.getElementById('second-place-name').textContent = sortedPlayers[1].name;
        }
        if (sortedPlayers.length > 2) {
            document.getElementById('third-place-name').textContent = sortedPlayers[2].name;
        }

        // Crear tarjetas para todos los jugadores
        sortedPlayers.forEach((player, index) => {
            const winnerCard = document.createElement('div');
            winnerCard.className = `winner-card ${index === 0 ? 'first-place' : ''}`;
            winnerCard.innerHTML = `
                <div class="winner-position">${index + 1}°</div>
                <div class="winner-name">${player.name}</div>
                <div class="winner-score">${player.score} pts</div>
            `;
            winnersList.appendChild(winnerCard);
        });

        // Mostrar modal con animación
        setTimeout(() => {
            modal.classList.add('active');
            this.createConfetti();
        }, 500);
    }

    createConfetti() {
        const modal = document.getElementById('winners-modal');
        
        // Crear confeti
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            // Colores aleatorios
            const colors = ['#ff4d4d', '#ffb347', '#00ff99', '#00c3ff', '#a78bfa', '#fbbf24'];
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            // Posición y animación aleatoria
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
            
            // Agregar animación de caída
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fall {
                    to {
                        transform: translateY(100vh) rotate(${Math.random() * 360}deg);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
            
            modal.appendChild(confetti);
            
            // Eliminar confeti después de la animación
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
    }
}

// Inicializar juego cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('🃏 Inicializando juego de cartas...');

    // Verificar conexión Supabase
    if (typeof window.checkSupabaseConnection === 'function') {
        window.checkSupabaseConnection();
    }

    // Iniciar juego
    new CardGame();
});