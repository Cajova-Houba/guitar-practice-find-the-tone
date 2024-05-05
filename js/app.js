const TONE_TO_GUESS_ELEMENT_ID = "tone-to-guess";
const FRETBOARD_ELEMENT_ID = "fretboard-table";
const GUESS_COUNTER_ELEMENT_ID = "guess-counter";
const GUESS_TIMER_ELEMENT_ID = "guess-timer";
const START_STOP_BUTTON_ELEMENT_ID = "start-stop-button";
const STATISTICS_DISPLAY_ELEMENT_ID = "statistics-display";



/**
 * Class used to track game state.
 * Stopped, running paused.
 */
class GameState {
    /**
     * Game states
     */
    PRACTICE_STOPPED = 0;
    PRACTICE_PAUSED = 1;
    PRACTICE_RUNNING = 2;

    constructor() {
        this.state = this.PRACTICE_STOPPED;
    }

    start() {
        this.state = this.PRACTICE_RUNNING;
    }

    pause() {
        this.state = this.PRACTICE_PAUSED;
    }

    stop() {
        this.state = this.PRACTICE_STOPPED;
    }

    isStopped() {
        return this.state === this.PRACTICE_STOPPED;
    }

    isPaused() {
        return this.state === this.PRACTICE_PAUSED;
    }
}

/**
 * Class that holds information about player's guess time.
 */
class GuessTime {
    constructor() {
        /**
         * Timestamp of when a new tone was generated. Used when evaluating 
         * how long it took player to guess the tone.
         */
        this.startTime = new Date().getTime();
    }

    reset() {
        this.startTime = new Date().getTime();
    }

    pause() {
        this.pauseTime = new Date().getTime();
    }

    resume() {
        if (this.pauseTime) {
            this.startTime += new Date().getTime() - this.pauseTime;
            this.pauseTime = null;
        } else {
            this.reset();
        }
    }

    getElapsedTime() {
        return new Date().getTime() - this.startTime;
    }
}

/**
 * Which tone player should guess.
 */
var toneToGuess = null;

/**
 * How many guesses player has made.
 */
var guessCount = 0;

/**
 * This object holds information about player's guess time.
 */
var guessTime = new GuessTime();
var guessTimer = null;

/**
 * Inner game state
 */
var gameState = new GameState();

/**
 * Statistics about player's performance.
 */
var statistics = new Statistics();

function getFretElementId(string, fret) {
    return "fret-" + string + "-" + fret;
}

function isFretMarker(fret) {
    return fret == 3 || fret == 5 || fret == 7 || fret == 9 || fret == 12;
}

function generateTone() {
    toneToGuess = TONES[Math.floor(Math.random() * TONES.length)];
    console.log("Tone to guess: " + toneToGuess);
    document.getElementById(TONE_TO_GUESS_ELEMENT_ID).innerText = toneToGuess;
}

function animateFret(string, fret, animationName) {
    var fretElement = document.getElementById(getFretElementId(string, fret));  

    // use animation with correct background color if fret is a marker
    if (isFretMarker(fret)) {
        fretElement.style.animation=animationName + "-marker 0.2s";
    } else {
        fretElement.style.animation=animationName + " 1s";
    }
    fretElement.style.animationTimingFunction="ease-in";

    // remove animation after 1 second
    setTimeout(function() {
        fretElement.style.animation="";
        fretElement.style.animationTimingFunction="";
    }, 1000);
}

/**
 * Check if player's guess is correct, display result and generate new tone to guess.
 */ 
function guess(string, fret) {
    if (checkGuess(string, fret)) {
        animateFret(string, fret, "correct-guess");
        statistics.addGuessTime(toneToGuess, guessTime.getElapsedTime(), string, fret);
        guessTime.reset();
        guessCount++;
        updateGuessCounterDisplay();
        generateTone();
        console.log("Correct guess!");
    } else {
        statistics.addIncorrectGuess(toneToGuess);
        animateFret(string, fret, "incorrect-guess");
        console.log("Incorrect guess. Tone on string " + string + " and fret " + fret + " is " + toneToGuess);
    }

    statistics.storeToCookie(STATISTICS_COOKIE_NAME);
}

/**
 * Compare player's guess with the correct tone.
 */
function checkGuess(string, fret) {
    var tonesOnString = FRET_TO_TONE[string];
    var toneOnFret = tonesOnString[fret];
    return toneOnFret === toneToGuess;
}

function timer() {
    updateGuessTimerDisplay();
}

function updateGuessCounterDisplay() {
    document.getElementById(GUESS_COUNTER_ELEMENT_ID).innerText = guessCount;
}

function updateGuessTimerDisplay() {
    document.getElementById(GUESS_TIMER_ELEMENT_ID).innerText = guessTime.getElapsedTime();
}

function updateStatisticsDisplay() {
    var averages = statistics.getAverages();
    var displayElement = document.getElementById(STATISTICS_DISPLAY_ELEMENT_ID);
    displayElement.innerHTML = "";
    var tableElement = document.createElement("table");
    for (var toneIndex in TONES) {
        var tone = TONES[toneIndex];
        if (tone in averages) {
            var average = averages[tone];
            var rowElement = document.createElement("tr");
            var toneElement = document.createElement("td");
            var averageElement = document.createElement("td");
            toneElement.innerText = tone;
            averageElement.innerText = average.toFixed(2) + "ms";
            rowElement.appendChild(toneElement);
            rowElement.appendChild(averageElement);
            tableElement.appendChild(rowElement);
        }
    }

    displayElement.appendChild(tableElement);

}

function switchStartStopButtonDisplay() {
    var startStopButton = document.getElementById(START_STOP_BUTTON_ELEMENT_ID);

    if (gameState.isStopped()) {
        startStopButton.value = "Start";
    } else if (gameState.isPaused()) {
        startStopButton.value = "Resume";
    } else {
        startStopButton.value = "Pause";
    }
}

function generateFretboard() { 
    var fretboard = document.getElementById(FRETBOARD_ELEMENT_ID);
    for (var string = 0; string < 6; string++) {
        var stringElement = document.createElement("tr");
        for (var fret = 0; fret < 13; fret++) {
            var fretElement = document.createElement("td");
            
            fretElement.id = getFretElementId(string, fret);
            fretElement.classList.add("fret");

            if (fret === 0) {
                fretElement.classList.add("fret-0");
            } else {
                fretElement.classList.add("border");
            }

            if (isFretMarker(fret)) {
                fretElement.classList.add("fret-marker");
            }

            fretElement.setAttribute("data-string", string);
            fretElement.setAttribute("data-fret", fret);
            fretElement.addEventListener("click", function() {
                var string = this.getAttribute("data-string");
                var fret = this.getAttribute("data-fret");
                guess(parseInt(string), parseInt(fret));
            });
            stringElement.appendChild(fretElement);
        }
        fretboard.appendChild(stringElement);
    }

}

function startPauseGame() {
    if (gameState.isStopped() || gameState.isPaused()){
        startGame();
    } else {
        pauseGame();
    }
}

function pauseGame() {
    gameState.pause();
    guessTime.pause();
    clearInterval(guessTimer);
    switchStartStopButtonDisplay();
}

function startGame() {

    // if the game was stopped, reset statistics, 
    // reset timer and generate new tone
    // otherwise just resume the game
    if (gameState.isStopped()) {
        statistics.reset();
        generateTone();
        guessTime.reset();
    } else {
        guessTime.resume();
    }
    
    gameState.start(); 
    guessTimer = setInterval(timer, 1);
    
    updateGuessCounterDisplay();
    switchStartStopButtonDisplay();
}

function stopGame() {
    gameState.stop();
    clearInterval(guessTimer);
    guessTime.reset();

    updateGuessTimerDisplay();
    updateGuessCounterDisplay();
    switchStartStopButtonDisplay();

    // redirect to stats page
    window.location.href = "statistics.html";
}