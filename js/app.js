const HIGH_E_STRING = 0;
const B_STRING = 1;
const G_STRING = 2;
const D_STRING = 3;
const A_STRING = 4;
const LOW_E_STRING = 5;

const LAST_FRET_INDEX = 12;

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
const STATISTICS_DISPLAY_ELEMENT_ID = "statistics-display";

/**
 * Class that holds statistics about player's performance.
 * 
 * Stats are held in a dictionary where key is a tone and value is a list of times in milliseconds
 * that player needed to guess that tone.
 */
class Statistics {

    constructor() {
        this.correctGuessTimes = {};
        this.incorrectGuesses = {};

        // heatmap of correct guesses, [0] = string 0 fret 0, [1] = string 0 fret 1, ... [77] = string 5 fret 12
        this.correctGuessHeatmap = new Array((LOW_E_STRING + 1) * (LAST_FRET_INDEX + 1)).fill(0);
    }

    addIncorrectGuess(tone) {
        if (this.incorrectGuesses[tone] === undefined) {
            this.incorrectGuesses[tone] = 0;
        }
        this.incorrectGuesses[tone]++;
    }

    addGuessTime(tone, guessStartTimeMs, string, fret) {
        if (this.correctGuessTimes[tone] === undefined) {
            this.correctGuessTimes[tone] = [];
        }

        const guessTimeMs = new Date().getTime() - guessStartTimeMs;
        const fretboardIndex = this.getFretboardIndex(string, fret);
        console.log("Adding correct guess for tone " + tone + " at index " + fretboardIndex);
        this.correctGuessHeatmap[fretboardIndex]++;
        this.correctGuessTimes[tone].push(guessTimeMs);
    }

    getAverages() {
        var averages = {};
        for (var tone in this.correctGuessTimes) {
            var times = this.correctGuessTimes[tone];
            var sum = times.reduce((a, b) => a + b, 0);
            var avg = sum / times.length;
            averages[tone] = avg;
        }
        return averages;
    }

    getFretboardIndex(string, fret) {
        return string * (LAST_FRET_INDEX+1) + fret;
    }

    print() {
        console.log(this.correctGuessTimes);
    }

    reset() {
        this.correctGuessTimes = {};
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
 * Timestamp of when a new tone was generated. Used when evaluating 
 * how long it took player to guess the tone.
 */
var guessStartTime = 0;
var guessTimer = null;

/**
 * Inner game state
 */
var isGameRunning = false;

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
        fretElement.style.animation=animationName + "-marker 1s";
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
        statistics.addGuessTime(toneToGuess, guessStartTime, string, fret);
        resetGuessTime();
        guessCount++;
        updateGuessCounterDisplay();
        updateStatisticsDisplay()
        generateTone();
        console.log("Correct guess!");
    } else {
        animateFret(string, fret, "incorrect-guess");
        console.log("Incorrect guess. Tone on string " + string + " and fret " + fret + " is " + toneToGuess);
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
    guessStartTime = new Date().getTime();
}

function timer() {
    updateGuessTimerDisplay();
}

function updateGuessCounterDisplay() {
    document.getElementById(GUESS_COUNTER_ELEMENT_ID).innerText = guessCount;
}

function updateGuessTimerDisplay() {
    const guessTimeMs = new Date().getTime() - guessStartTime;
    document.getElementById(GUESS_TIMER_ELEMENT_ID).innerText = guessTimeMs;
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
    statistics.print();
}

function startGame() {
    isGameRunning = true;
    statistics.reset();
    generateTone();
    updateGuessCounterDisplay();
    resetGuessTime();
    guessTimer = setInterval(timer, 1);
    switchStartStopButtonDisplay();
}