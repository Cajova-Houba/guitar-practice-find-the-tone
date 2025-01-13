const TONE_TO_GUESS_ELEMENT_ID = "tone-to-guess";
const YOUR_TONE_ELEMENT_ID = "your-tone";
const FRETBOARD_ELEMENT_ID = "fretboard-table";
const GUESS_COUNTER_ELEMENT_ID = "guess-counter";
const GUESS_TIMER_ELEMENT_ID = "guess-timer";
const START_STOP_BUTTON_ELEMENT_ID = "start-stop-button";
const STATISTICS_DISPLAY_ELEMENT_ID = "statistics-display";

/**
 * 0 - 255
 */
const DEFAULT_AUDIO_INPUT_THRESHOLD = 150;

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

    isRunning() {
        return this.state === this.PRACTICE_RUNNING;
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
 * For audio input, see initAudio();
 */
var audioCtx;
var audioAnalyser;
var audioBufferLength;
var audioDataArray;
var audioGuessSamples = null;
var audioHandlerState = "idle";

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

function displayRightTone(tone, octave) {
    document.getElementById(YOUR_TONE_ELEMENT_ID).innerText = `${tone}${octave}`;
    document.getElementById(YOUR_TONE_ELEMENT_ID).classList.add("right-tone");
    document.getElementById(YOUR_TONE_ELEMENT_ID).classList.remove("wrong-tone");
}

function displayWrongTone(tone, octave) {
    document.getElementById(YOUR_TONE_ELEMENT_ID).innerText = `${tone}${octave}`;
    document.getElementById(YOUR_TONE_ELEMENT_ID).classList.remove("right-tone");
    document.getElementById(YOUR_TONE_ELEMENT_ID).classList.add("wrong-tone");
}

/**
 * Check if player's guess is correct, display result and generate new tone to guess.
 */ 
function guess(string, fret) {
    var tonesOnString = FRET_TO_TONE[string];
    var toneOnFret = tonesOnString[fret];

    evaluateGuess(toneOnFret, null, () => {animateFret(string, fret, "correct-guess")}, () => {animateFret(string, fret, "incorrect-guess")});
}

/**
 * Actual logic for evaluating player's guess.
 * 
 * @param {string} tone Tone player has guessed.
 * @param {number} octave (Optional) Octave of the tone player has guessed.
 * @param {function} onCorrectCallback (Optional) Callback to execute when player's guess is correct.
 * @param {function} onWrongCallback (Optional) Callback to execute when player's guess is wrong.
 */
function evaluateGuess(tone, octave, onCorrectCallback, onWrongCallback) {
    if (tone === toneToGuess) {
        onCorrectCallback && onCorrectCallback();
        displayRightTone(tone, octave);
        statistics.addGuessTime(toneToGuess, guessTime.getElapsedTime(), 0, 0);
        guessTime.reset();
        guessCount++;
        updateGuessCounterDisplay();
        generateTone();
        console.log("Correct guess!");
    } else {
        onWrongCallback && onWrongCallback();
        displayWrongTone(tone, octave);
        statistics.addIncorrectGuess(toneToGuess);
        console.log("Incorrect guess. Guessed: " + tone + ", correct: " + toneToGuess);
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
    guessCount = 0;

    updateGuessTimerDisplay();
    updateGuessCounterDisplay();
    switchStartStopButtonDisplay();

    // redirect to stats page
    window.location.href = "statistics.html";
}

function getAudioInputThreshold() {
    // todo: add input range element and return its value instead
    return DEFAULT_AUDIO_INPUT_THRESHOLD;
}

function initAudio() {
    audioCtx = new AudioContext();
    console.log("AudioContext: ", audioCtx);
    console.log("Sample Rate: ", audioCtx.sampleRate);
    
    audioAnalyser = audioCtx.createAnalyser();
    audioAnalyser.fftSize = 2048;
    console.log("Analyser: ", audioAnalyser);

    audioBufferLength = audioAnalyser.frequencyBinCount;
    audioDataArray = new Uint8Array(audioBufferLength);

    const constraints = { audio: true };
    navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(audioAnalyser);

        audioInputHandler();
    })
    .catch(function (err) {
        console.error("The following gUM error occured: " + err);
    });
}

function filterFreqData(rawFrequencyData, rawFrequencyDataLen, threshold) {
    const filteredData = new Uint8Array(rawFrequencyDataLen);
    for (let i = 0; i < rawFrequencyDataLen; i++) {
        if (rawFrequencyData[i] > threshold) {
            filteredData[i] = rawFrequencyData[i];
        } else {
            filteredData[i] = 0;
        }
    }
    return filteredData;
}

/**
 * Use the TONE_FREQ_CHART to determine the tone by frequency.
 * 
 * @param {float} freq 
 */
function findToneByFreq(freq) {
    
    for (const toneKey in TONE_FREQ_CHART) {
        for (let octave = 0; octave < 9; octave++) {
            const toneFreqs = TONE_FREQ_CHART[toneKey];
            // upper bound
            const b1 = toneFreqs[octave] + toneFreqs[octave] * MAX_TONE_DIFF;
            // lower bound
            const b0 = toneFreqs[octave] - toneFreqs[octave] * MAX_TONE_DIFF;
            if (freq >= b0 && freq <= b1) {
                return [toneKey, octave];
            }
        }
    }

    return [];
}

function audioInputHandler() {
    requestAnimationFrame(audioInputHandler);

    let threshold, filteredData, anyAudio;
    // simple state machine to handle audio input and guesses
    switch (audioHandlerState) {
        case "idle":
            if (gameState.isRunning()) {
                audioHandlerState = "listenAudio";
            }
            break;

        case "listenAudio":
            if (!gameState.isRunning()) {
                audioHandlerState = "idle";
            } else {
                threshold = getAudioInputThreshold();
                audioAnalyser.getByteFrequencyData(audioDataArray);
                filteredData = filterFreqData(audioDataArray, audioBufferLength, threshold);
                anyAudio = filteredData.some((value) => value > 0);
                
                if (!anyAudio) {
                    audioHandlerState = "listenAudio";
                } else {
                    audioHandlerState = "startGuess";
                }
            }
            break;
        
        case "startGuess":
            audioGuessSamples = [];
            audioHandlerState = "collectGuessSamples";
            break;
        
        case "collectGuessSamples":
            threshold = getAudioInputThreshold();
            audioAnalyser.getByteFrequencyData(audioDataArray);
            filteredData = filterFreqData(audioDataArray, audioBufferLength, threshold);
            anyAudio = filteredData.some((value) => value > 0);

            if (!anyAudio) {
                audioHandlerState = "endGuess";
            } else {
                // select the largest frequency
                let largestFreqId = -1;
                for (let i = 0; i < audioBufferLength; i++) {
                    const frequencyAmount = filteredData[i];

                    if (frequencyAmount > filteredData[largestFreqId] || largestFreqId == -1) {
                        largestFreqId = i;
                    }
                }

                if (largestFreqId != -1) {
                    audioGuessSamples.push(largestFreqId * audioCtx.sampleRate / audioAnalyser.fftSize);
                }
            }
            break;
        
        case "endGuess":
            // average the samples
            const sum = audioGuessSamples.reduce((a, b) => a + b, 0);
            const avgFreq = sum / audioGuessSamples.length;
            const [tone, octave] = findToneByFreq(avgFreq);
            audioGuessSamples = [];

            // if the game is not running, go back to idle state and do not evaluate the guess
            if (!gameState.isRunning()) {
                audioHandlerState = "idle";
            } else {
                // evaluate the guess
                evaluateGuess(tone, octave);
                audioHandlerState = "listenAudio";
            }

            break;
    }

}