const HIGH_E_STRING = 0;
const B_STRING = 1;
const G_STRING = 2;
const D_STRING = 3;
const A_STRING = 4;
const LOW_E_STRING = 5;

/**
 * What tones can be guessed. Items of this array are string and are used
 * as a keys to some following dictionaries.
 */
const TONES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * Dictionary that maps position on a fretboard to a tone.
 * 
 * The key to dictionary is a number that represents a string. 0 = high E, 1 = B, 2 = G, 3 = D, 4 = A, 5 = low E.
 * The value is a list of tones that are on that string.
 */
const FRET_TO_TONE = {
    0: ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E"],
    1: ["B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
    2: ["G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G"],
    3: ["D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D"],
    4: ["A", "A#", "B", "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A"],
    5: ["E", "F", "F#", "G", "G#", "A", "A#", "B", "C", "C#", "D", "D#", "E"]
};

const TONE_TO_GUESS_ELEMENT_ID = "tone-to-guess";
const FRETBOARD_ELEMENT_ID = "fretboard-table";
const GUESS_COUNTER_ELEMENT_ID = "guess-counter";
const GUESS_TIMER_ELEMENT_ID = "guess-timer";
const START_STOP_BUTTON_ELEMENT_ID = "start-stop-button";

/**
 * Which tone player should guess.
 */
var toneToGuess = null;

/**
 * How many guesses player has made.
 */
var guessCount = 0;

/**
 * How long it took player to make a correct guess. In milliseconds.
 */
var guessTimeMs = 0;
var guessTimer = null;

/**
 * Inner game state
 */
var isGameRunning = false;

function generateTone() {
    toneToGuess = TONES[Math.floor(Math.random() * TONES.length)];
    console.log("Tone to guess: " + toneToGuess);
    document.getElementById(TONE_TO_GUESS_ELEMENT_ID).innerText = toneToGuess;
}

/**
 * Check if player's guess is correct, display result and generate new tone to guess.
 */ 
function guess(string, fret) {
    if (checkGuess(string, fret)) {
        resetGuessTime();
        guessCount++;
        updateGuessCounterDisplay();
        generateTone();
        console.log("Correct guess!");
    } else {
        console.log("Incorrect guess. Tone on string " + string + " and fret " + fret + " is " + toneOnFret);
    }
}

/**
 * Compare player's guess with the correct tone.
 */
function checkGuess(string, fret) {
    var tonesOnString = FRET_TO_TONE[string];
    var toneOnFret = tonesOnString[fret];
    return toneOnFret === toneToGuess;
}

function resetGuessTime() {
    guessTimeMs = 0;
}

function timer() {
    guessTimeMs += 1;
    updateGuessTimerDisplay();
}

function updateGuessCounterDisplay() {
    document.getElementById(GUESS_COUNTER_ELEMENT_ID).innerText = guessCount;
}

function updateGuessTimerDisplay() {
    document.getElementById(GUESS_TIMER_ELEMENT_ID).innerText = guessTimeMs;
}

function switchStartStopButtonDisplay() {
    var startStopButton = document.getElementById(START_STOP_BUTTON_ELEMENT_ID);

    if (isGameRunning) { 
        startStopButton.value = "Stop";
    } else {
        startStopButton.value = "Start";
    }
}

function generateFretboard() { 
    var fretboard = document.getElementById(FRETBOARD_ELEMENT_ID);
    for (var string = 0; string < 6; string++) {
        var stringElement = document.createElement("tr");
        for (var fret = 0; fret < 13; fret++) {
            var fretElement = document.createElement("td");

            fretElement.classList.add("fret");

            if (fret === 0) {
                fretElement.classList.add("fret-0");
            } else {
                fretElement.classList.add("border");
            }

            if (fret == 3 || fret == 5 || fret == 7 || fret == 9 || fret == 12) {
                fretElement.classList.add("fret-marker");
            }

            fretElement.setAttribute("data-string", string);
            fretElement.setAttribute("data-fret", fret);
            fretElement.addEventListener("click", function() {
                var string = this.getAttribute("data-string");
                var fret = this.getAttribute("data-fret");
                guess(string, fret);
            });
            stringElement.appendChild(fretElement);
        }
        fretboard.appendChild(stringElement);
    }

}

function startStopGame() {
    if (isGameRunning) {
        stopGame();
    } else {
        startGame();
    }
}

function stopGame() {
    isGameRunning = false;
    clearInterval(guessTimer);
    switchStartStopButtonDisplay();
}

function startGame() {
    isGameRunning = true;
    generateTone();
    updateGuessCounterDisplay();
    resetGuessTime();
    guessTimer = setInterval(timer, 1);
    switchStartStopButtonDisplay();
}