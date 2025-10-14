// ------------------------
// JUEGO DE RULETA
// ------------------------

class RuletaGame {
    constructor() {
        this.gameConfig = null;
        this.questions = [];
        this.currentQuestionIndex = 0;
        this.currentPlayerIndex = 0;
        this.isSpinning = false;
        this.gameActive = true;
        this.usedQuestions = new Set(); // Para evitar preguntas repetidas
        this.turnsPerPlayer = 8; // 8 turnos por jugador
        this.playerTurns = [];   // Array para contar turnos de cada jugador

        this.initializeGame();
    }

    async initializeGame() {
        try {
            // Cargar configuración del juego
            this.loadGameConfig();

            // Inicializar interfaz
            this.initializeUI();

            // Cargar preguntas desde Supabase usando el Singleton
            await this.loadQuestionsFromSupabase();

            // Iniciar juego
            this.startGame();
        } catch (error) {
            console.error('Error inicializando el juego:', error);
            this.handleInitializationError(error);
        }
    }

    loadGameConfig() {
        const savedConfig = localStorage.getItem('ruletaGameConfig');
        if (!savedConfig) {
            alert('No se encontró configuración del juego. Redirigiendo al lobby...');
            window.location.href = 'lobby.html';
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
        document.getElementById('category-description').textContent = `Preguntas sobre ${this.gameConfig.categoryName}`;

        // Renderizar jugadores
        this.renderPlayers();

        // Agregar event listeners
        this.addEventListeners();
    }

    async loadQuestionsFromSupabase() {
        try {
            // USAR EL SINGLETON para obtener el cliente Supabase
            const client = window.supabaseClient.getClient();

            if (!client) {
                throw new Error('Cliente Supabase no disponible');
            }

            console.log('Cargando preguntas para la categoría:', this.gameConfig.category);

            // Obtener TODAS las preguntas de la categoría seleccionada
            const { data, error } = await client
                .from('preguntas')
                .select('*')
                .eq('categoria_id', this.gameConfig.category);

            if (error) {
                throw new Error(`Error de Supabase: ${error.message}`);
            }

            if (data && data.length > 0) {
                console.log(`Se encontraron ${data.length} preguntas en la base de datos`);

                // Mezclar preguntas aleatoriamente
                this.allQuestions = this.shuffleArray(data);

                // Seleccionar máximo 25 preguntas (o menos si no hay suficientes)
                this.questions = this.allQuestions.slice(0, Math.min(25, this.allQuestions.length));

                console.log(`Se usarán ${this.questions.length} preguntas para el juego`);

                if (this.questions.length < 10) {
                    console.warn('Pocas preguntas disponibles. Considera agregar más a la base de datos.');
                }
            } else {
                throw new Error('No se encontraron preguntas para esta categoría en la base de datos');
            }

        } catch (error) {
            console.error('Error cargando preguntas desde Supabase:', error);
            this.useFallbackQuestions();
        }
    }

    handleInitializationError(error) {
        const errorMessage = `Error al inicializar el juego: ${error.message}. Se usarán preguntas de respaldo.`;
        console.error(errorMessage);
        alert(errorMessage);

        this.useFallbackQuestions();
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
        // Botón de girar ruleta
        document.getElementById('spin-btn').addEventListener('click', () => this.spinRoulette());

        // Botón de ver respuesta
        document.getElementById('show-answer').addEventListener('click', () => this.showAnswer());

        // Botones de resultado
        document.getElementById('btn-correct').addEventListener('click', () => this.handleAnswer(true));
        document.getElementById('btn-incorrect').addEventListener('click', () => this.handleAnswer(false));

        // Botones de pausa
        document.getElementById('btn-pausa').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-game').addEventListener('click', () => this.resumeGame());
        document.getElementById('exit-game').addEventListener('click', () => this.showExitConfirmation());

        // Botones de confirmación de salida
        document.getElementById('confirm-exit').addEventListener('click', () => this.exitGame());
        document.getElementById('cancel-exit').addEventListener('click', () => this.hideExitConfirmation());

        // Botón de continuar en el modal de ganadores
        document.getElementById('continue-btn').addEventListener('click', () => {
            window.location.href = '/LobbyRoulette/Lobby.html';
        });
    }

    startGame() {
        console.log('Juego iniciado con', this.questions.length, 'preguntas');

        if (this.questions.length === 0) {
            alert('No hay preguntas disponibles para esta categoría. Redirigiendo al lobby...');
            window.location.href = 'lobby.html';
            return;
        }

        this.updateUI();
    }

    spinRoulette() {
        if (this.isSpinning || !this.gameActive) return;

        this.isSpinning = true;
        const spinBtn = document.getElementById('spin-btn');
        spinBtn.disabled = true;

        // Animación de la ruleta
        const roulette = document.querySelector('.roulette-wheel');
        const spins = 5 + Math.random() * 5; // 5-10 vueltas
        const degrees = 360 * spins;

        roulette.style.transition = 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 1)';
        roulette.style.transform = `rotate(${degrees}deg)`;

        // Después de la animación, mostrar pregunta
        setTimeout(() => {
            this.showRandomQuestion();
            this.isSpinning = false;
            spinBtn.disabled = false;
        }, 3000);
    }

    showRandomQuestion() {
        if (this.questions.length === 0) {
            this.endGame();
            return;
        }

        // Seleccionar pregunta aleatoria que no se haya usado
        let availableQuestions = this.questions.filter((_, index) => !this.usedQuestions.has(index));

        if (availableQuestions.length === 0) {
            // Si todas las preguntas se usaron, reiniciar
            this.usedQuestions.clear();
            availableQuestions = this.questions;
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const questionIndex = this.questions.indexOf(availableQuestions[randomIndex]);
        this.usedQuestions.add(questionIndex);

        const question = this.questions[questionIndex];
        this.currentQuestion = question;

        this.displayQuestion(question);
    }

    displayQuestion(question) {
        // Mostrar área de pregunta
        const questionArea = document.getElementById('question-area');
        questionArea.classList.remove('hidden');

        // Actualizar pregunta en UI
        document.getElementById('question-text').textContent = question.pregunta;
        document.getElementById('question-difficulty').textContent = question.dificultad;
        document.getElementById('question-difficulty').className = `difficulty ${question.dificultad}`;
        document.getElementById('question-category').textContent = this.gameConfig.categoryName;

        // Limpiar resultados anteriores
        document.getElementById('correct-answer').textContent = question.respuesta_correcta;
        document.getElementById('answer-result').classList.add('hidden');
    }

    showAnswer() {
        document.getElementById('answer-result').classList.remove('hidden');
    }

    handleAnswer(isCorrect) {
        const currentPlayer = this.gameConfig.players[this.currentPlayerIndex];

        if (isCorrect) {
            // Puntos basados en dificultad - MODIFICADO
            const points = this.getPointsByDifficulty(this.currentQuestion.dificultad);
            currentPlayer.score += points;

            // Marcar jugador como correcto
            document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.add('correct');

            console.log(`✅ ${currentPlayer.name} respondió correctamente: +${points} puntos`);
        } else {
            // Marcar jugador como incorrecto
            document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.add('incorrect');
            console.log(`❌ ${currentPlayer.name} respondió incorrectamente`);
        }

        // Ocultar área de pregunta
        document.getElementById('question-area').classList.add('hidden');

        // Pasar al siguiente jugador después de un delay
        setTimeout(() => {
            this.nextPlayer();
        }, 1500);
    }

    getPointsByDifficulty(difficulty) {
        const points = {
            'fácil': 10,
            'media': 15,  // CAMBIADO de 20 a 15
            'dificil': 20 // CAMBIADO de 30 a 20
        };
        return points[difficulty] || 10;
    }

    nextPlayer() {
        // Remover clases de resultado
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
        window.location.href = '/LobbyRoulette/Lobby.html';
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

    useFallbackQuestions() {
        console.log('Usando preguntas de respaldo...');
        // Preguntas de ejemplo para cuando no hay conexión a Supabase
        this.questions = [
            {
                pregunta: "¿Cuál es la capital de Francia?",
                respuesta_correcta: "París",
                dificultad: "fácil",
                categoria_id: this.gameConfig.category
            },
            {
                pregunta: "¿En qué año llegó el hombre a la luna?",
                respuesta_correcta: "1969",
                dificultad: "media",
                categoria_id: this.gameConfig.category
            },
            {
                pregunta: "¿Quién escribió 'Cien años de soledad'?",
                respuesta_correcta: "Gabriel García Márquez",
                dificultad: "media",
                categoria_id: this.gameConfig.category
            },
            {
                pregunta: "¿Cuál es el elemento químico con símbolo 'O'?",
                respuesta_correcta: "Oxígeno",
                dificultad: "fácil",
                categoria_id: this.gameConfig.category
            },
            {
                pregunta: "¿Cuál es el río más largo del mundo?",
                respuesta_correcta: "Amazonas",
                dificultad: "difícil",
                categoria_id: this.gameConfig.category
            }
        ];
        
        console.log(`Se cargaron ${this.questions.length} preguntas de respaldo`);
    }
}

// 🔹 FUNCIÓN GLOBAL para verificar el estado de Supabase
window.checkSupabaseConnection = function () {
    if (window.supabaseClient && window.supabaseClient.isReady()) {
        console.log('✅ Conexión Supabase activa');
        return true;
    } else {
        console.warn('⚠️ Conexión Supabase no disponible');
        return false;
    }
};

// Inicializar juego cuando se cargue la página
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando juego de ruleta...');

    // Verificar conexión Supabase
    window.checkSupabaseConnection();

    // Iniciar juego
    new RuletaGame();
});