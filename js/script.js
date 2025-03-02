let currentWord = '';
let guessesLeft = 6;
let score = 0;
let correctGuesses = new Set();
let wrongGuesses = new Set();
let startTime = null;
let timerInterval = null;
let usedWords = new Set(); // Track used words
let teamName = '';
let highScores = JSON.parse(localStorage.getItem('tocHighScores')) || [];

// DOM Elements
const wordDisplay = document.querySelector('.word-display');
const hintText = document.querySelector('.hint-text');
const chancesLeftSpan = document.querySelector('.chances-left');
const scoreSpan = document.querySelector('.score');
const scoreProgress = document.querySelector('.score-progress');
const timerDisplay = document.getElementById('timer');
const keyboard = document.querySelector('.keyboard');
const startScreen = document.getElementById('startScreen');
const gameContainer = document.getElementById('gameContainer');
const teamNameInput = document.getElementById('teamName');
const startGameBtn = document.getElementById('startGame');
const teamDisplay = document.getElementById('teamDisplay');
const resetGameBtn = document.getElementById('resetGame');
const newGameBtn = document.getElementById('newGame');

function startTimer() {
    if (startTime === null) {
        startTime = Date.now();
        timerInterval = setInterval(updateTimer, 1000);
    }
}

function updateTimer() {
    const currentTime = Date.now();
    const elapsedSeconds = Math.floor((currentTime - startTime) / 1000);
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
    clearInterval(timerInterval);
    return timerDisplay.textContent;
}

function getRandomUnusedWord() {
    // Filter out used words
    const availableWords = words.filter(word => !usedWords.has(word.word));
    
    // If all words have been used, handle game completion
    if (availableWords.length === 0) {
        if (score < 100) {
            alert("You've seen all words! Starting fresh.");
            usedWords.clear(); // Reset used words
            return words[Math.floor(Math.random() * words.length)];
        }
        return null;
    }
    
    // Get random word from remaining words
    const randomIndex = Math.floor(Math.random() * availableWords.length);
    return availableWords[randomIndex];
}

function initGame() {
    const wordObj = getRandomUnusedWord();
    
    // If no more words available and score >= 100, end game
    if (!wordObj) {
        const finalTime = stopTimer();
        alert(`Congratulations! You've completed the game in ${finalTime}!`);
        resetGame();
        return;
    }
    
    currentWord = wordObj.word.toLowerCase();
    usedWords.add(wordObj.word); // Mark word as used
    
    guessesLeft = 6;
    correctGuesses.clear();
    wrongGuesses.clear();
    
    updateWordDisplay();
    hintText.textContent = wordObj.hint;
    chancesLeftSpan.textContent = guessesLeft;
    
    // Reset keyboard
    document.querySelectorAll('.key').forEach(key => {
        key.className = 'key';
    });

    startTimer();
}

function updateWordDisplay() {
    wordDisplay.innerHTML = '';
    [...currentWord].forEach(letter => {
        const letterBox = document.createElement('div');
        letterBox.className = 'letter-box';
        letterBox.textContent = correctGuesses.has(letter) ? letter : '';
        wordDisplay.appendChild(letterBox);
    });
}

function updateScore(points) {
    score += points;
    scoreSpan.textContent = score;
    scoreProgress.style.width = `${(score/100) * 100}%`;
    
    if (score >= 100) {
        const finalTime = stopTimer();
        saveScore();
        setTimeout(() => {
            alert(`Congratulations ${teamName}! You've reached 100 points in ${finalTime}!`);
            showHighScores();
            newGame();
        }, 500);
    }
}

function handleGuess(letter) {
    if (!letter || correctGuesses.has(letter) || wrongGuesses.has(letter)) return;
    
    const key = document.querySelector(`.key[data-key="${letter.toUpperCase()}"]`);
    
    if (currentWord.includes(letter)) {
        correctGuesses.add(letter);
        key.classList.add('correct');
        updateWordDisplay();
        
        if ([...currentWord].every(l => correctGuesses.has(l))) {
            updateScore(10);
            setTimeout(() => {
                if (score < 100) initGame();
            }, 1000);
        }
    } else {
        wrongGuesses.add(letter);
        key.classList.add('wrong');
        guessesLeft--;
        chancesLeftSpan.textContent = guessesLeft;
        
        if (guessesLeft === 0) {
            setTimeout(() => {
                alert(`Game Over! The word was: ${currentWord.toUpperCase()}`);
                initGame();
            }, 500);
        }
    }
}

function resetGame() {
    if (score > 0) {
        saveScore();
    }
    score = 0;
    startTime = null;
    usedWords.clear();
    scoreSpan.textContent = '0';
    scoreProgress.style.width = '0%';
    timerDisplay.textContent = '00:00';
    initGame();
}

function newGame() {
    startScreen.style.display = 'flex';
    gameContainer.style.display = 'none';
    teamNameInput.value = '';
    resetGame();
}

function saveScore() {
    const scoreData = {
        team: teamName,
        score: score,
        time: timerDisplay.textContent,
        date: new Date().toLocaleDateString()
    };
    
    highScores.push(scoreData);
    highScores.sort((a, b) => b.score - a.score);
    highScores = highScores.slice(0, 10); // Keep only top 10 scores
    
    localStorage.setItem('tocHighScores', JSON.stringify(highScores));
}

function showHighScores() {
    const modal = document.getElementById('highScoresModal');
    const scoresList = document.getElementById('highScoresList');
    
    scoresList.innerHTML = highScores.map((score, index) => `
        <div class="score-entry">
            <span>${index + 1}. ${score.team}</span>
            <span>${score.score} points</span>
            <span>${score.time}</span>
            <span>${score.date}</span>
        </div>
    `).join('');
    
    modal.style.display = 'flex';
}

// Event Listeners
keyboard.addEventListener('click', (e) => {
    if (e.target.classList.contains('key')) {
        const letter = e.target.dataset.key.toLowerCase();
        handleGuess(letter);
    }
});

document.addEventListener('keydown', (e) => {
    if (e.key.match(/^[a-zA-Z]$/)) {
        handleGuess(e.key.toLowerCase());
    }
    if (e.key === 'Escape') {
        document.getElementById('highScoresModal').style.display = 'none';
    }
});

startGameBtn.addEventListener('click', () => {
    teamName = teamNameInput.value.trim();
    if (teamName === '') {
        alert('Please enter a team name!');
        return;
    }
    
    startScreen.style.display = 'none';
    gameContainer.style.display = 'block';
    teamDisplay.textContent = teamName;
    resetGame();
});

resetGameBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to reset the current game?')) {
        resetGame();
    }
});

newGameBtn.addEventListener('click', () => {
    if (confirm('Are you sure you want to start a new game? Current progress will be lost.')) {
        newGame();
    }
});

document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('highScoresModal').style.display = 'none';
});

// Start game
resetGame();