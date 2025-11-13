import { getSupabaseClient } from '../SupabaseConection.js';

const TURN_DURATION_SECONDS = 60;
const WARNING_THRESHOLD = 20;
const DANGER_THRESHOLD = 10;

class FlashcardGame {
  constructor() {
    this.supabase = null;
    this.config = null;
    this.players = [];
    this.categoryId = null;
    this.categoryName = '';

    this.questionPool = [];
    this.questionQueue = [];
    this.currentQuestion = null;
    this.currentTurnQuestionCount = 0;

    this.currentPlayerIndex = 0;
    this.timerId = null;
    this.timeRemaining = TURN_DURATION_SECONDS;
    this.turnActive = false;
    this.isPaused = false;
    this.wasTurnActiveBeforePause = false;

    this.dom = this.mapDom();
    this.updateTimerDisplay();
    this.initialize();
  }

  mapDom() {
    return {
      playersContainer: document.getElementById('players-container'),
      timerWrapper: document.getElementById('timer-wrapper'),
      timerValue: document.getElementById('timer-display'),
      categoryName: document.getElementById('category-name'),
      currentPlayerName: document.getElementById('current-player-name'),
      currentPlayerScore: document.getElementById('current-player-score'),
      currentPlayerAnswered: document.getElementById('current-player-answered'),
      currentPlayerFooter: document.getElementById('current-player'),
      turnMessage: document.getElementById('turn-message'),
      questionText: document.getElementById('question-text'),
      questionHint: document.getElementById('question-hint'),
      questionCounter: document.getElementById('question-counter'),
      startTurnBtn: document.getElementById('start-turn'),
      correctBtn: document.getElementById('btn-correct'),
      incorrectBtn: document.getElementById('btn-incorrect'),
      skipBtn: document.getElementById('btn-skip'),
      pauseBtn: document.getElementById('btn-pausa'),
      pauseModal: document.getElementById('pause-modal'),
      resumeBtn: document.getElementById('resume-game'),
      exitBtn: document.getElementById('exit-game'),
      exitConfirmModal: document.getElementById('exit-confirm-modal'),
      confirmExitBtn: document.getElementById('confirm-exit'),
      cancelExitBtn: document.getElementById('cancel-exit'),
      winnersModal: document.getElementById('winners-modal'),
      winnersList: document.getElementById('winners-list'),
      continueBtn: document.getElementById('continue-btn'),
      podiumFirst: document.getElementById('first-place-name'),
      podiumSecond: document.getElementById('second-place-name'),
      podiumThird: document.getElementById('third-place-name')
    };
  }

  async initialize() {
    try {
      this.supabase = getSupabaseClient();
      this.loadConfig();
      this.renderPlayers();
      this.bindEvents();
      this.updateActivePlayer();
      await this.loadQuestions();
      this.updateTurnMessage('Presiona "Comenzar turno" para iniciar.');
    } catch (error) {
      console.error('Error inicializando el modo flashcards:', error);
      this.handleFatalError(error);
    }
  }

  loadConfig() {
    const rawConfig = localStorage.getItem('flashcardGameConfig');
    if (!rawConfig) {
      alert('No se encontró configuración del juego. Redirigiendo al lobby.');
      window.location.href = '../LobbyFlashcard/Lobby.html';
      throw new Error('No hay configuración de flashcards.');
    }

    this.config = JSON.parse(rawConfig);
    this.categoryId = this.config.category ?? this.config.categoryId ?? null;
    this.categoryName = this.config.categoryName ?? 'Flashcards';
    this.players = this.config.players.map((player) => ({
      ...player,
      score: player.score ?? 0,
      answered: player.answered ?? 0,
      turnsPlayed: 0,
    }));

    this.dom.categoryName.textContent = this.categoryName;
  }

  renderPlayers() {
    if (!this.dom.playersContainer) return;
    this.dom.playersContainer.innerHTML = '';

    this.players.forEach((player, index) => {
      const card = document.createElement('div');
      card.className = `player-card${index === 0 ? ' active' : ''}`;
      card.dataset.index = index.toString();
      card.innerHTML = `
        <div class="player-info">
          <span class="player-name">${player.name}</span>
          <span class="text-xs text-slate-300">Respondidas: <span class="player-answered">${player.answered}</span></span>
        </div>
        <div class="player-score">
          <i class="fas fa-star"></i>
          <span class="player-correct">${player.score}</span>
        </div>
      `;
      this.dom.playersContainer.appendChild(card);
    });
  }

  bindEvents() {
    this.dom.startTurnBtn?.addEventListener('click', () => this.startTurn());
    this.dom.correctBtn?.addEventListener('click', () => this.handleAnswer(true));
    this.dom.incorrectBtn?.addEventListener('click', () => this.handleAnswer(false));
    this.dom.skipBtn?.addEventListener('click', () => this.handleSkip());

    this.dom.pauseBtn?.addEventListener('click', () => this.pauseGame());
    this.dom.resumeBtn?.addEventListener('click', () => this.resumeGame());
    this.dom.exitBtn?.addEventListener('click', () => this.showExitConfirmation());
    this.dom.confirmExitBtn?.addEventListener('click', () => this.exitGame());
    this.dom.cancelExitBtn?.addEventListener('click', () => this.hideExitConfirmation());

    this.dom.continueBtn?.addEventListener('click', () => {
      window.location.href = '../LobbyFlashcard/Lobby.html';
    });
  }

  async loadQuestions() {
    if (!this.supabase) {
      console.warn('Supabase no disponible, usando tarjetas de respaldo.');
      this.useFallbackQuestions();
      return;
    }

    const candidateTables = ['flashcards', 'preguntas'];
    for (const table of candidateTables) {
      try {
        let query = this.supabase.from(table).select('*');
        if (this.categoryId !== null) {
          query = query.eq('categoria_id', this.categoryId);
        }

        const { data, error } = await query;
        if (error) {
          console.warn(`Error consultando ${table}:`, error.message ?? error);
          continue;
        }

        if (Array.isArray(data) && data.length) {
          this.questionPool = data.map((row) => this.normalizeQuestion(row));
          this.shuffleQuestions();
          this.updateTurnMessage('Tarjetas listas. Presiona "Comenzar turno".');
          return;
        }
      } catch (error) {
        console.error(`Fallo inesperado leyendo ${table}:`, error);
      }
    }

    console.warn('No se encontraron tarjetas. Usando ejemplos locales.');
    this.useFallbackQuestions();
  }

  normalizeQuestion(row) {
    return {
      id: row.id ?? crypto.randomUUID(),
      text: row.pregunta ?? row.question ?? row.descripcion ?? 'Tarjeta sin contenido',
      hint: row.pista ?? row.hint ?? '',
    };
  }

  useFallbackQuestions() {
    const samples = [
      { id: 'sample-1', text: 'Comparte un dato curioso relacionado con la categoría elegida.', hint: '' },
      { id: 'sample-2', text: 'Explica un concepto clave en menos de 10 segundos.', hint: '' },
      { id: 'sample-3', text: 'Cuenta una anécdota o ejemplo práctico sobre el tema.', hint: '' },
      { id: 'sample-4', text: 'Menciona una ventaja o desventaja de esta categoría.', hint: '' },
      { id: 'sample-5', text: 'Arma una mini trivia y respóndela en voz alta.', hint: '' },
    ];

    this.questionPool = samples;
    this.shuffleQuestions();
    this.updateTurnMessage('Se usan tarjetas de ejemplo. Carga tus flashcards en Supabase para personalizar.');
  }

  shuffleQuestions() {
    const pool = [...this.questionPool];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    this.questionQueue = pool;
    this.currentTurnQuestionCount = 0;
    this.dom.questionCounter.textContent = this.formatCounter(0);
  }

  startTurn() {
    if (this.turnActive) return;
    if (!this.players.length) {
      alert('No hay jugadores configurados.');
      return;
    }

    const player = this.players[this.currentPlayerIndex];
    if (!player) return;

    this.turnActive = true;
    this.timeRemaining = TURN_DURATION_SECONDS;
    this.currentTurnQuestionCount = 0;
    this.updateTimerDisplay();
    this.enableAnswerButtons(true);
    this.dom.startTurnBtn.disabled = true;
    this.updateTurnMessage('¡Tiempo corriendo! Marca las respuestas del jugador.');

    if (!this.questionQueue.length) {
      this.shuffleQuestions();
    }

    this.nextQuestion();
    this.timerId = setInterval(() => this.tick(), 1000);
  }

  tick() {
    if (!this.turnActive) return;
    this.timeRemaining -= 1;
    this.updateTimerDisplay();

    if (this.timeRemaining <= 0) {
      this.endTurn('Tiempo agotado');
    }
  }

  updateTimerDisplay() {
    if (!this.dom.timerValue || !this.dom.timerWrapper) return;
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    this.dom.timerValue.textContent = `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;

    let state = 'running';
    if (!this.turnActive) {
      state = 'idle';
    } else if (this.timeRemaining <= DANGER_THRESHOLD) {
      state = 'danger';
    } else if (this.timeRemaining <= WARNING_THRESHOLD) {
      state = 'warning';
    }

    this.dom.timerWrapper.dataset.state = state;
  }

  enableAnswerButtons(enabled) {
    this.dom.correctBtn.disabled = !enabled;
    this.dom.incorrectBtn.disabled = !enabled;
    this.dom.skipBtn.disabled = !enabled;
  }

  nextQuestion() {
    if (!this.questionQueue.length) {
      this.shuffleQuestions();
    }

    this.currentQuestion = this.questionQueue.shift() ?? null;
    if (!this.currentQuestion) {
      this.dom.questionText.textContent = 'No hay tarjetas disponibles en este momento.';
      this.dom.questionHint.classList.add('hidden');
      return;
    }

    this.currentTurnQuestionCount += 1;
    this.dom.questionCounter.textContent = this.formatCounter(this.currentTurnQuestionCount);
    this.dom.questionText.textContent = this.currentQuestion.text;

    if (this.currentQuestion.hint) {
      this.dom.questionHint.textContent = this.currentQuestion.hint;
      this.dom.questionHint.classList.remove('hidden');
    } else {
      this.dom.questionHint.classList.add('hidden');
    }
  }

  handleAnswer(isCorrect) {
    if (!this.turnActive) return;
    const player = this.players[this.currentPlayerIndex];
    if (!player) return;

    player.answered += 1;
    if (isCorrect) {
      player.score += 1;
    }

    this.updatePlayerCard(this.currentPlayerIndex);
    this.updateTurnSummary(player);
    this.nextQuestion();
  }

  handleSkip() {
    if (!this.turnActive) return;
    const player = this.players[this.currentPlayerIndex];
    if (!player) return;

    player.answered += 1;
    this.updatePlayerCard(this.currentPlayerIndex);
    this.updateTurnSummary(player);
    this.nextQuestion();
  }

  updatePlayerCard(index) {
    const card = this.dom.playersContainer?.querySelector(`[data-index="${index}"]`);
    const player = this.players[index];
    if (!card || !player) return;

    card.querySelector('.player-answered').textContent = player.answered.toString();
    card.querySelector('.player-correct').textContent = player.score.toString();
    card.classList.add('pulse');
    setTimeout(() => card.classList.remove('pulse'), 400);
  }

  updateTurnSummary(player) {
    if (!player) return;
    this.dom.currentPlayerScore.textContent = player.score.toString();
    this.dom.currentPlayerAnswered.textContent = player.answered.toString();
    this.dom.currentPlayerFooter.textContent = player.name;
  }

  endTurn(reason = '') {
    if (!this.turnActive) return;

    clearInterval(this.timerId);
    this.timerId = null;
    this.turnActive = false;
    this.enableAnswerButtons(false);
    this.dom.startTurnBtn.disabled = false;

    const player = this.players[this.currentPlayerIndex];
    if (player) {
      player.turnsPlayed += 1;
    }

    this.timeRemaining = TURN_DURATION_SECONDS;
    this.updateTimerDisplay();

    if (reason) {
      this.updateTurnMessage(`${reason}. ${player?.name ?? 'Jugador'} logró ${player?.score ?? 0} aciertos.`);
    } else {
      this.updateTurnMessage('Turno finalizado.');
    }

    this.advanceToNextPlayer();
  }

  advanceToNextPlayer() {
    const nextIndex = this.players.findIndex((player) => (player.turnsPlayed ?? 0) === 0);
    if (nextIndex === -1) {
      this.finishGame();
      return;
    }

    this.currentPlayerIndex = nextIndex;
    this.updateActivePlayer();
    this.updateTurnMessage(`Es el turno de ${this.players[nextIndex].name}. Cuando estén listos, presiona "Comenzar turno".`);
  }

  updateActivePlayer() {
    if (!this.players.length) return;

    const cards = this.dom.playersContainer?.querySelectorAll('.player-card') ?? [];
    cards.forEach((card) => card.classList.remove('active'));

    const activeCard = this.dom.playersContainer?.querySelector(`[data-index="${this.currentPlayerIndex}"]`);
    activeCard?.classList.add('active');

    const player = this.players[this.currentPlayerIndex];
    if (player) {
      this.dom.currentPlayerName.textContent = player.name;
      this.dom.currentPlayerScore.textContent = player.score.toString();
      this.dom.currentPlayerAnswered.textContent = player.answered.toString();
      this.dom.currentPlayerFooter.textContent = player.name;
    }
  }

  finishGame() {
    this.turnActive = false;
    this.enableAnswerButtons(false);
    this.dom.startTurnBtn.disabled = true;
    this.timeRemaining = TURN_DURATION_SECONDS;
    this.updateTimerDisplay();
    this.updateTurnMessage('Todos los jugadores completaron su turno.');

    setTimeout(() => this.showWinnersModal(), 600);
  }

  showWinnersModal() {
    const sortedPlayers = [...this.players].sort((a, b) => {
      if (b.score === a.score) {
        return b.answered - a.answered;
      }
      return b.score - a.score;
    });

    this.identifyTies(sortedPlayers);
    this.updatePodium(sortedPlayers);
    this.renderWinnersList(sortedPlayers);
    this.triggerConfetti();

    this.dom.winnersModal?.classList.add('active');
  }

  identifyTies(sortedPlayers) {
    const grouped = new Map();
    sortedPlayers.forEach((player) => {
      const group = grouped.get(player.score) ?? [];
      group.push(player);
      grouped.set(player.score, group);
    });

    grouped.forEach((group) => {
      if (group.length > 1) {
        group.forEach((player) => {
          player.isTied = true;
          player.tieCount = group.length;
        });
      }
    });
  }

  updatePodium(sortedPlayers) {
    const first = sortedPlayers[0];
    const second = sortedPlayers[1];
    const third = sortedPlayers[2];

    this.dom.podiumFirst.textContent = first ? first.name : '-';
    this.dom.podiumSecond.textContent = second ? second.name : '-';
    this.dom.podiumThird.textContent = third ? third.name : '-';
  }

  renderWinnersList(sortedPlayers) {
    if (!this.dom.winnersList) return;
    this.dom.winnersList.innerHTML = '';

    sortedPlayers.forEach((player, index) => {
      const card = document.createElement('div');
      card.className = `winner-card ${this.getWinnerClass(index)}`;
      card.innerHTML = `
        <div class="winner-position">${index + 1}°</div>
        <div class="winner-name">${player.name}</div>
        <div class="winner-score">${player.score} pts</div>
      `;

      if (player.isTied) {
        const tie = document.createElement('div');
        tie.className = 'tie-indicator';
        tie.textContent = 'Empate';
        card.appendChild(tie);
      }

      this.dom.winnersList.appendChild(card);
    });
  }

  getWinnerClass(index) {
    if (index === 0) return 'first-place';
    if (index === 1) return 'second-place';
    if (index === 2) return 'third-place';
    return '';
  }

  triggerConfetti() {
    const modal = this.dom.winnersModal;
    if (!modal) return;

    for (let i = 0; i < 40; i++) {
      const confetti = document.createElement('div');
      confetti.className = 'confetti';
      const colors = ['#ff4d4d', '#ffb347', '#00ff99', '#00c3ff', '#a855f7'];
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.left = `${Math.random() * 100}%`;
      confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
      modal.appendChild(confetti);
      setTimeout(() => confetti.remove(), 6000);
    }
  }

  pauseGame() {
    if (this.isPaused) return;
    this.wasTurnActiveBeforePause = this.turnActive;

    if (this.turnActive) {
      clearInterval(this.timerId);
      this.timerId = null;
      this.enableAnswerButtons(false);
    }

    this.isPaused = true;
    this.dom.pauseModal?.classList.remove('hidden');
  }

  resumeGame() {
    this.dom.pauseModal?.classList.add('hidden');

    if (this.wasTurnActiveBeforePause) {
      this.enableAnswerButtons(true);
      this.timerId = setInterval(() => this.tick(), 1000);
    }

    this.isPaused = false;
    this.wasTurnActiveBeforePause = false;
  }

  showExitConfirmation() {
    this.dom.exitConfirmModal?.classList.remove('hidden');
  }

  hideExitConfirmation() {
    this.dom.exitConfirmModal?.classList.add('hidden');
  }

  exitGame() {
    window.location.href = '../LobbyFlashcard/Lobby.html';
  }

  updateTurnMessage(message) {
    if (this.dom.turnMessage) {
      this.dom.turnMessage.textContent = message;
    }
  }

  handleFatalError(error) {
    this.updateTurnMessage(`No se pudo iniciar la partida: ${error.message}`);
    if (this.dom.startTurnBtn) this.dom.startTurnBtn.disabled = true;
    this.enableAnswerButtons(false);
  }

  formatCounter(value) {
    return value.toString().padStart(2, '0');
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new FlashcardGame();
});
