// Variables globales
let gameState = {
    isPlaying: false,
    currentDifficulty: 'easy',
    moves: 0,
    matches: 0,
    totalPairs: 8,
    timer: 0,
    timerInterval: null,
    flippedCards: [],
    canFlip: true,
    gameStarted: false
};

// Configuración de dificultades
const difficulties = {
    easy: { rows: 4, cols: 4, pairs: 8 },
    medium: { rows: 4, cols: 5, pairs: 10 },
    hard: { rows: 6, cols: 6, pairs: 18 }
};

// Emojis para las cartas
const cardEmojis = [
    '🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼',
    '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔',
    '🦄', '🐴', '🦋', '🐛', '🐝', '🐞', '🦗', '🕷️',
    '🌸', '🌺', '🌻', '🌷', '🌹', '🌼', '🌙', '⭐',
    '🍎', '🍊', '🍋', '🍌', '🍇', '🍓', '🍑', '🍒'
];

// Referencias a elementos DOM
const gameBoard = document.getElementById('game-board');
const timerElement = document.getElementById('timer');
const movesElement = document.getElementById('moves');
const pairsElement = document.getElementById('pairs');
const startBtn = document.getElementById('start-btn');
const resetBtn = document.getElementById('reset-btn');
const difficultyBtns = document.querySelectorAll('.difficulty-btn');
const modal = document.getElementById('victory-modal');
const playAgainBtn = document.getElementById('play-again');
const closeModalBtn = document.getElementById('close-modal');

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    loadBestScores();
    setupEventListeners();
    updateGameBoard();
    console.log('🧠 Memory Game cargado correctamente!');
});

// Event Listeners
function setupEventListeners() {
    startBtn.addEventListener('click', startGame);
    resetBtn.addEventListener('click', resetGame);
    playAgainBtn.addEventListener('click', () => {
        hideModal();
        startGame();
    });
    closeModalBtn.addEventListener('click', hideModal);
    
    difficultyBtns.forEach(btn => {
        btn.addEventListener('click', () => changeDifficulty(btn.dataset.level));
    });
    
    // Cerrar modal con ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') hideModal();
    });
}

// Cambiar dificultad
function changeDifficulty(level) {
    if (gameState.isPlaying) return;
    
    gameState.currentDifficulty = level;
    gameState.totalPairs = difficulties[level].pairs;
    
    // Actualizar botones activos
    difficultyBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.level === level);
    });
    
    updateGameBoard();
    updateStats();
}

// Crear tablero de juego
function updateGameBoard() {
    const { rows, cols, pairs } = difficulties[gameState.currentDifficulty];
    
    gameBoard.className = `game-board ${gameState.currentDifficulty}`;
    gameBoard.innerHTML = '';
    
    // Crear array de cartas (cada emoji aparece 2 veces)
    const cards = [];
    for (let i = 0; i < pairs; i++) {
        cards.push(cardEmojis[i], cardEmojis[i]);
    }
    
    // Mezclar cartas
    shuffleArray(cards);
    
    // Crear elementos de cartas
    cards.forEach((emoji, index) => {
        const card = createCard(emoji, index);
        gameBoard.appendChild(card);
    });
}

// Crear una carta individual
function createCard(emoji, index) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.emoji = emoji;
    card.dataset.index = index;
    
    card.innerHTML = `
        <div class="card-face card-front"></div>
        <div class="card-face card-back">${emoji}</div>
    `;
    
    card.addEventListener('click', () => flipCard(card));
    
    return card;
}

// Mezclar array (algoritmo Fisher-Yates)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Iniciar juego
function startGame() {
    gameState.isPlaying = true;
    gameState.gameStarted = true;
    gameState.moves = 0;
    gameState.matches = 0;
    gameState.timer = 0;
    gameState.flippedCards = [];
    gameState.canFlip = true;
    
    updateGameBoard();
    updateStats();
    startTimer();
    
    startBtn.textContent = '🎮 Jugando...';
    startBtn.disabled = true;
    
    playSound(440, 200);
}

// Reiniciar juego
function resetGame() {
    stopTimer();
    
    gameState.isPlaying = false;
    gameState.gameStarted = false;
    gameState.moves = 0;
    gameState.matches = 0;
    gameState.timer = 0;
    gameState.flippedCards = [];
    gameState.canFlip = true;
    
    updateGameBoard();
    updateStats();
    
    startBtn.textContent = '🎮 Comenzar Juego';
    startBtn.disabled = false;
    
    hideModal();
    playSound(330, 150);
}

// Voltear carta
function flipCard(card) {
    if (!gameState.isPlaying || !gameState.canFlip || 
        card.classList.contains('flipped') || 
        card.classList.contains('matched')) {
        return;
    }
    
    card.classList.add('flipped');
    gameState.flippedCards.push(card);
    playSound(523, 100);
    
    if (gameState.flippedCards.length === 2) {
        gameState.moves++;
        updateStats();
        checkMatch();
    }
}

// Verificar coincidencia
function checkMatch() {
    gameState.canFlip = false;
    
    const [card1, card2] = gameState.flippedCards;
    const emoji1 = card1.dataset.emoji;
    const emoji2 = card2.dataset.emoji;
    
    setTimeout(() => {
        if (emoji1 === emoji2) {
            // ¡Coincidencia!
            card1.classList.add('matched', 'match-animation');
            card2.classList.add('matched', 'match-animation');
            gameState.matches++;
            playSound(659, 300);
            
            // Remover animación después de un tiempo
            setTimeout(() => {
                card1.classList.remove('match-animation');
                card2.classList.remove('match-animation');
            }, 600);
            
            // Verificar si el juego terminó
            if (gameState.matches === gameState.totalPairs) {
                setTimeout(() => finishGame(), 500);
            }
        } else {
            // No coinciden
            card1.classList.add('wrong');
            card2.classList.add('wrong');
            playSound(220, 200);
            
            setTimeout(() => {
                card1.classList.remove('flipped', 'wrong');
                card2.classList.remove('flipped', 'wrong');
            }, 1000);
        }
        
        gameState.flippedCards = [];
        gameState.canFlip = true;
        updateStats();
    }, 600);
}

// Finalizar juego
function finishGame() {
    gameState.isPlaying = false;
    stopTimer();
    
    const finalTime = formatTime(gameState.timer);
    const finalMoves = gameState.moves;
    
    // Verificar si es un nuevo récord
    const isNewRecord = checkNewRecord(gameState.currentDifficulty, gameState.timer);
    if (isNewRecord) {
        saveBestScore(gameState.currentDifficulty, gameState.timer);
        loadBestScores();
    }
    
    showVictoryModal(finalTime, finalMoves, isNewRecord);
    playVictorySound();
    
    startBtn.textContent = '🎮 Comenzar Juego';
    startBtn.disabled = false;
}

// Mostrar modal de victoria
function showVictoryModal(time, moves, isNewRecord) {
    document.getElementById('final-time').textContent = time;
    document.getElementById('final-moves').textContent = moves;
    
    const newRecordElement = document.getElementById('new-record');
    if (isNewRecord) {
        newRecordElement.classList.remove('hidden');
    } else {
        newRecordElement.classList.add('hidden');
    }
    
    modal.classList.add('show');
}

// Ocultar modal
function hideModal() {
    modal.classList.remove('show');
}

// Timer
function startTimer() {
    gameState.timerInterval = setInterval(() => {
        gameState.timer++;
        updateStats();
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Actualizar estadísticas
function updateStats() {
    timerElement.textContent = formatTime(gameState.timer);
    movesElement.textContent = gameState.moves;
    pairsElement.textContent = `${gameState.matches}/${gameState.totalPairs}`;
}

// Sistema de mejores puntuaciones
function saveBestScore(difficulty, time) {
    localStorage.setItem(`memory-best-${difficulty}`, time.toString());
}

function loadBestScores() {
    const difficulties = ['easy', 'medium', 'hard'];
    
    difficulties.forEach(difficulty => {
        const bestTime = localStorage.getItem(`memory-best-${difficulty}`);
        const element = document.getElementById(`best-${difficulty}`);
        
        if (bestTime) {
            element.textContent = formatTime(parseInt(bestTime));
        } else {
            element.textContent = '--:--';
        }
    });
}

function checkNewRecord(difficulty, time) {
    const currentBest = localStorage.getItem(`memory-best-${difficulty}`);
    return !currentBest || time < parseInt(currentBest);
}

// Efectos de sonido
function playSound(frequency, duration = 200) {
    if (typeof AudioContext !== 'undefined' || typeof webkitAudioContext !== 'undefined') {
        try {
            const audioContext = new (AudioContext || webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = frequency;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration / 1000);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + duration / 1000);
        } catch (error) {
            // Silencioso si no se pueden reproducir sonidos
        }
    }
}

function playVictorySound() {
    const notes = [523, 659, 784, 1047]; // Do, Mi, Sol, Do
    notes.forEach((note, index) => {
        setTimeout(() => playSound(note, 300), index * 150);
    });
}