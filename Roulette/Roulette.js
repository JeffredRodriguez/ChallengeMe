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
        this.usedQuestions = new Set();
        this.turnsPerPlayer = 8;
        this.playerTurns = [];

        this.initializeGame();
    }

    async initializeGame() {
        try {
            this.loadGameConfig();
            this.initializeUI();
            await this.loadQuestionsFromSupabase();
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
        this.playerTurns = Array(this.gameConfig.players.length).fill(0);
    }

    initializeUI() {
        document.getElementById('category-name').textContent = this.gameConfig.categoryName;
        document.getElementById('category-description').textContent = `Preguntas sobre ${this.gameConfig.categoryName}`;
        this.renderPlayers();
        this.addEventListeners();
    }

    async loadQuestionsFromSupabase() {
        try {
            const client = window.supabaseClient.getClient();
            if (!client) {
                throw new Error('Cliente Supabase no disponible');
            }

            console.log('Cargando preguntas para la categoría:', this.gameConfig.category);
            const { data, error } = await client
                .from('preguntas')
                .select('*')
                .eq('categoria_id', this.gameConfig.category);

            if (error) {
                throw new Error(`Error de Supabase: ${error.message}`);
            }

            if (data && data.length > 0) {
                console.log(`Se encontraron ${data.length} preguntas`);
                this.allQuestions = this.shuffleArray(data);
                this.questions = this.allQuestions.slice(0, Math.min(25, this.allQuestions.length));
                console.log(`Se usarán ${this.questions.length} preguntas`);
            } else {
                throw new Error('No se encontraron preguntas para esta categoría');
            }
        } catch (error) {
            console.error('Error cargando preguntas:', error);
            this.useFallbackQuestions();
        }
    }

    handleInitializationError(error) {
        console.error('Error al inicializar el juego:', error);
        alert(`Error al inicializar el juego: ${error.message}. Se usarán preguntas de respaldo.`);
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

        document.getElementById('current-player').textContent = this.gameConfig.players[this.currentPlayerIndex].name;
    }

    addEventListeners() {
        document.getElementById('spin-btn').addEventListener('click', () => this.spinRoulette());
        document.getElementById('show-answer').addEventListener('click', () => this.showAnswer());
        document.getElementById('btn-correct').addEventListener('click', () => this.handleAnswer(true));
        document.getElementById('btn-incorrect').addEventListener('click', () => this.handleAnswer(false));
        document.getElementById('btn-pausa').addEventListener('click', () => this.pauseGame());
        document.getElementById('resume-game').addEventListener('click', () => this.resumeGame());
        document.getElementById('exit-game').addEventListener('click', () => this.showExitConfirmation());
        document.getElementById('confirm-exit').addEventListener('click', () => this.exitGame());
        document.getElementById('cancel-exit').addEventListener('click', () => this.hideExitConfirmation());
        document.getElementById('continue-btn').addEventListener('click', () => {
            window.location.href = '/LobbyRoulette/Lobby.html';
        });
    }

    startGame() {
        console.log('Juego iniciado con', this.questions.length, 'preguntas');
        if (this.questions.length === 0) {
            alert('No hay preguntas disponibles. Redirigiendo al lobby...');
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

        const roulette = document.querySelector('.roulette-wheel');
        const spins = 5 + Math.random() * 5;
        const degrees = 360 * spins;

        roulette.style.transition = 'transform 3s cubic-bezier(0.2, 0.8, 0.3, 1)';
        roulette.style.transform = `rotate(${degrees}deg)`;

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

        let availableQuestions = this.questions.filter((_, index) => !this.usedQuestions.has(index));
        if (availableQuestions.length === 0) {
            this.usedQuestions.clear();
            availableQuestions = this.questions;
        }

        const randomIndex = Math.floor(Math.random() * availableQuestions.length);
        const questionIndex = this.questions.indexOf(availableQuestions[randomIndex]);
        this.usedQuestions.add(questionIndex);
        this.currentQuestion = this.questions[questionIndex];

        this.displayQuestion(this.currentQuestion);
    }

    displayQuestion(question) {
        const questionArea = document.getElementById('question-area');
        questionArea.classList.remove('hidden');

        document.getElementById('question-text').textContent = question.pregunta;
        document.getElementById('question-difficulty').textContent = question.dificultad;
        document.getElementById('question-difficulty').className = `difficulty ${question.dificultad}`;
        document.getElementById('question-category').textContent = this.gameConfig.categoryName;
        document.getElementById('correct-answer').textContent = question.respuesta_correcta;
        document.getElementById('answer-result').classList.add('hidden');
    }

    showAnswer() {
        document.getElementById('answer-result').classList.remove('hidden');
    }

    handleAnswer(isCorrect) {
        const currentPlayer = this.gameConfig.players[this.currentPlayerIndex];

        if (isCorrect) {
            const points = this.getPointsByDifficulty(this.currentQuestion.dificultad);
            currentPlayer.score += points;
            document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.add('correct');
            console.log(`✅ ${currentPlayer.name} respondió correctamente: +${points} puntos`);
        } else {
            document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.add('incorrect');
            console.log(`❌ ${currentPlayer.name} respondió incorrectamente`);
        }

        document.getElementById('question-area').classList.add('hidden');
        setTimeout(() => {
            this.nextPlayer();
        }, 1500);
    }

    getPointsByDifficulty(difficulty) {
        const points = {
            'fácil': 10,
            'media': 15,
            'dificil': 20
        };
        return points[difficulty] || 10;
    }

    nextPlayer() {
        document.querySelectorAll('.player-card').forEach(card => {
            card.classList.remove('correct', 'incorrect');
        });

        document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.remove('active');
        this.playerTurns[this.currentPlayerIndex] += 1;

        const allDone = this.playerTurns.every(turns => turns >= this.turnsPerPlayer);
        if (allDone) {
            setTimeout(() => {
                this.endGame();
            }, 1000);
            return;
        }

        let nextIndex = this.currentPlayerIndex;
        do {
            nextIndex = (nextIndex + 1) % this.gameConfig.players.length;
        } while (this.playerTurns[nextIndex] >= this.turnsPerPlayer);

        this.currentPlayerIndex = nextIndex;
        document.querySelectorAll('.player-card')[this.currentPlayerIndex].classList.add('active');
        document.getElementById('current-player').textContent = this.gameConfig.players[this.currentPlayerIndex].name;
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
        const sortedPlayers = [...this.gameConfig.players].sort((a, b) => b.score - a.score);
        this.identifyTies(sortedPlayers);
        this.showWinnersModal(sortedPlayers);
    }

    identifyTies(sortedPlayers) {
        const scoreGroups = {};
        sortedPlayers.forEach(player => {
            if (!scoreGroups[player.score]) {
                scoreGroups[player.score] = [];
            }
            scoreGroups[player.score].push(player);
        });

        Object.values(scoreGroups).forEach(group => {
            if (group.length > 1) {
                group.forEach(player => {
                    player.isTied = true;
                    player.tieCount = group.length;
                });
            }
        });
    }

    showWinnersModal(sortedPlayers) {
        const modal = document.getElementById('winners-modal');
        const winnersList = document.getElementById('winners-list');
        
        winnersList.innerHTML = '';
        const uniquePositions = this.getUniquePositions(sortedPlayers);
        this.updatePodiumWithTies(uniquePositions);

        sortedPlayers.forEach((player, index) => {
            const winnerCard = document.createElement('div');
            winnerCard.className = `winner-card ${this.getWinnerCardClass(player, index)}`;
            
            if (player.isTied) {
                winnerCard.classList.add('tied');
            }
            
            winnerCard.innerHTML = `
                <div class="winner-position">
                    ${this.getPositionDisplay(player, index, sortedPlayers)}
                </div>
                <div class="winner-name">${player.name}</div>
                <div class="winner-score">${player.score} pts</div>
                ${player.isTied ? '<div class="tie-indicator">🏆 EMPATE</div>' : ''}
            `;
            winnersList.appendChild(winnerCard);
        });

        setTimeout(() => {
            modal.classList.add('active');
            this.createConfetti();
        }, 500);
    }

    getUniquePositions(sortedPlayers) {
        const positions = [];
        let currentPosition = 1;
        
        for (let i = 0; i < sortedPlayers.length; i++) {
            if (i === 0 || sortedPlayers[i].score !== sortedPlayers[i-1].score) {
                positions.push({
                    position: currentPosition,
                    players: [sortedPlayers[i]],
                    score: sortedPlayers[i].score
                });
                currentPosition++;
            } else {
                positions[positions.length - 1].players.push(sortedPlayers[i]);
            }
        }
        
        return positions.slice(0, 3);
    }

    updatePodiumWithTies(uniquePositions) {
        document.getElementById('first-place-name').textContent = '-';
        document.getElementById('second-place-name').textContent = '-';
        document.getElementById('third-place-name').textContent = '-';

        document.querySelectorAll('.podium-step').forEach(step => {
            step.classList.remove('tied-position');
        });

        uniquePositions.forEach((positionGroup, index) => {
            const positionNames = positionGroup.players.map(p => p.name).join(' & ');
            
            switch(index) {
                case 0:
                    document.getElementById('first-place-name').textContent = positionNames;
                    if (positionGroup.players.length > 1) {
                        document.querySelector('.podium-step.first').classList.add('tied-position');
                    }
                    break;
                case 1:
                    document.getElementById('second-place-name').textContent = positionNames;
                    if (positionGroup.players.length > 1) {
                        document.querySelector('.podium-step.second').classList.add('tied-position');
                    }
                    break;
                case 2:
                    document.getElementById('third-place-name').textContent = positionNames;
                    if (positionGroup.players.length > 1) {
                        document.querySelector('.podium-step.third').classList.add('tied-position');
                    }
                    break;
            }
        });
    }

    getPositionDisplay(player, index, sortedPlayers) {
        if (index === 0) return '1°';
        if (player.score === sortedPlayers[index - 1].score) {
            return this.getPositionDisplay(sortedPlayers[index - 1], index - 1, sortedPlayers);
        }
        return `${index + 1}°`;
    }

    getWinnerCardClass(player, index) {
        if (index === 0) return 'first-place';
        if (index === 1) return 'second-place';
        if (index === 2) return 'third-place';
        return '';
    }

    createConfetti() {
        const modal = document.getElementById('winners-modal');
        
        for (let i = 0; i < 50; i++) {
            const confetti = document.createElement('div');
            confetti.className = 'confetti';
            
            const colors = ['#ff4d4d', '#ffb347', '#00ff99', '#00c3ff', '#a78bfa', '#fbbf24'];
            confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            
            confetti.style.left = Math.random() * 100 + '%';
            confetti.style.top = '-10px';
            confetti.style.animation = `fall ${Math.random() * 3 + 2}s linear forwards`;
            
            modal.appendChild(confetti);
            
            setTimeout(() => {
                if (confetti.parentNode) {
                    confetti.parentNode.removeChild(confetti);
                }
            }, 5000);
        }
    }

    useFallbackQuestions() {
        console.log('Usando preguntas de respaldo...');
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
            }
        ];
        
        console.log(`Se cargaron ${this.questions.length} preguntas de respaldo`);
    }
}

// Función global para verificar Supabase
window.checkSupabaseConnection = function () {
    if (window.supabaseClient && window.supabaseClient.isReady()) {
        console.log('✅ Conexión Supabase activa');
        return true;
    } else {
        console.warn('⚠️ Conexión Supabase no disponible');
        return false;
    }
};

// Inicializar juego
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Inicializando juego de ruleta...');
    window.checkSupabaseConnection();
    new RuletaGame();
});