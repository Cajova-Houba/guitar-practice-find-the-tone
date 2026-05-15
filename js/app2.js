const MIN_OCTAVE = 0;
const MAX_OCTAVE = 8;

const TONE_NAME_LOOKUP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

// frequencies for each from from C to B over 9 octaves
// https://mixbutton.com/mixing-articles/music-note-to-frequency-chart/
const TONE_FREQ_CHART = {
    "C": [16.35, 32.70, 65.41, 130.81, 261.63, 523.25, 1046.50, 2093.00, 4186.01],
    "C#": [17.32, 34.65, 69.30, 138.59, 277.18, 554.37, 1108.73, 2217.46, 4434.92],
    "D": [18.35, 36.71, 73.42, 146.83, 293.66, 587.33, 1174.66, 2349.32, 4698.63],
    "D#": [19.45, 38.89, 77.78, 155.56, 311.13, 622.25, 1244.51, 2489.02, 4978.03],
    "E": [20.60, 41.20, 82.41, 164.81, 329.63, 659.26, 1318.51, 2637.02, 5274.04],
    "F": [21.83, 43.65, 87.31, 174.61, 349.23, 698.46, 1396.91, 2793.83, 5587.65],
    "F#": [23.12, 46.25, 92.50, 185.00, 369.99, 739.99, 1479.98, 2959.96, 5919.91],
    "G": [24.50, 49.00, 98.00, 196.00, 392.00, 783.99, 1567.98, 3135.96, 6271.93],
    "G#": [25.96, 51.91, 103.83, 207.65, 415.30, 830.61, 1661.22, 3322.44, 6644.88],
    "A": [27.50, 55.00, 110.00, 220.00, 440.00, 880.00, 1760.00, 3520.00, 7040.00],
    "A#": [29.14, 58.27, 116.54, 233.08, 466.16, 932.33, 1864.66, 3729.31, 7458.62],
    "B": [30.87, 61.74, 123.47, 246.94, 493.88, 987.77, 1975.53, 3951.07, 7902.13],
}

const SCALE_PATTERNS = {
    "major": [0, 2, 4, 5, 7, 9, 11],
    "minor": [0, 2, 3, 5, 7, 8, 10],
}

const D_TONE_FREQ = [
    18.35, // Octave 0
    36.71, // Octave 1
    73.42, // Octave 2
    146.83, // Octave 3
    293.66, // Octave 4
    587.33, // Octave 5
    1174.66, // Octave 6
    2349.32, // Octave 7
    4698.63, // Octave 8
]

// allowed difference in frequency
const TONE_D = 0.03;

const audioCtx = new AudioContext();
console.log("AudioContext: ", audioCtx);
console.log("Sample Rate: ", audioCtx.sampleRate);

const analyser = audioCtx.createAnalyser();
console.log("Analyser: ", analyser);

const canvas = document.querySelector(".visualizer");
const canvasCtx = canvas.getContext("2d");
console.log("Canvas: ", canvas);
console.log("Canvas Context: ", canvasCtx);


const constraints = { audio: true };
navigator.mediaDevices
    .getUserMedia(constraints)
    .then((stream) => {
        source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);

        visualize();
    })
    .catch(function (err) {
        console.error("The following gUM error occured: " + err);
    });


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

function onScaleSettingsChange(event) {
    // get value selected from baseTone dropdown
    const baseTone = document.getElementById("baseTone").value;

    // get value selected from the scale dropdown
    const scaleName = document.getElementById("scale").value;

    // ensure both baseTone and scaleName are ok
    if (baseTone == "" || scaleName == "") {
        console.log("Empty inputs");
        return;
    }

    if (TONE_NAME_LOOKUP.indexOf(baseTone) == -1) {
        console.log(`Unknown base tone: ${baseTone}`);
        return;
    }

    if (Object.keys(SCALE_PATTERNS).indexOf(scaleName) == -1) {
        console.log(`Unknown scale: ${scaleName}`);
        return;
    }

    console.log(`Generating scale "${scaleName}" for base tone "${baseTone}"`);
    const scalePattern = SCALE_PATTERNS[scaleName];
    const scaleFreqs = generateScaleFrequencyChart(scalePattern, baseTone);
    console.log("Scale frequencies: ", scaleFreqs);
}

/**
 * Generate a table of frequencies for the given scale pattern across all octaves
 * in TONE_FREQ_CHART.
 * 
 * @param {array} scalePattern 
 * @param {string} toneKey 
 */
function generateScaleFrequencyChart(scalePattern, toneKey) {
    // start by finding the tones we're looking for, without considering the octaves
    let toneLookupIndex = TONE_NAME_LOOKUP.indexOf(toneKey);
    const scaleTones = [];

    for (let i = 0; i < scalePattern.length; i++) {
        const p = scalePattern[i];
        scaleTones.push(TONE_NAME_LOOKUP[(toneLookupIndex + p) % TONE_NAME_LOOKUP.length]);
    }

    // now we have the tones, we can generate the frequencies for each octave
    const scaleFreqs = [];
    for (let octave = MIN_OCTAVE; octave < MAX_OCTAVE; octave++) {
        for (let i = 0; i < scaleTones.length; i++) {
            const toneFreq = TONE_FREQ_CHART[scaleTones[i]][octave];
            scaleFreqs.push(toneFreq);
        }
    }

    // finally, ensure the order the scaleFreqs from lowest to highest
    scaleFreqs.sort((a, b) => a[0] - b[0]);

    return scaleFreqs;
}

/**
 * Match the frequency against the TONE_FREQ_CHART and select the closest one.
 * @param {} frequency Frequency to match.
 */
function matchPitchClosest(frequency) {
    let minDiffSq = -1;
    let minToneKey = -1;
    let minOctave = -1;

    for (const toneKey in TONE_FREQ_CHART) {
        for (let octave = 0; octave < 9; octave++) {
            // tone frequency we're matching against
            const toneFreq = TONE_FREQ_CHART[toneKey][octave];

            // difference
            const diff = toneFreq - frequency;
            const diffSq = diff * diff;

            // new minimum found
            if (minDiffSq == -1 || diffSq < minDiffSq) {
                minDiffSq = diffSq;
                minToneKey = toneKey;
                minOctave = octave;
            }
        }
    }

    return { toneKey: minToneKey, octave: minOctave };
}

/**
 * Tries to match the frequency against the TONE_FREQ_CHART.
 * The frequency matches the given tone if it's within the
 * +-tone*delta boundaries.
 * 
 * @param {double} frequency 
 * @param {double} delta, expected to be <<1
 */
function matchPitchBoundaries(frequency, delta) {
    let minToneKey = -1;
    let minOctave = -1;

    for (const toneKey in TONE_FREQ_CHART) {
        for (let octave = 0; octave < 9; octave++) {
            const toneFreqs = TONE_FREQ_CHART[toneKey];
            // upper bound
            const b1 = toneFreqs[octave] + toneFreqs[octave] * delta;
            // lower bound
            const b0 = toneFreqs[octave] - toneFreqs[octave] * delta;
            if (frequency >= b0 && frequency <= b1) {
                minToneKey = toneKey;
                minOctave = octave;
            }
        }
    }

    return { toneKey: minToneKey, octave: minOctave };
}

function visualize() {
    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;

    const visualSetting = "frequencybars";
    console.log(visualSetting);

    if (visualSetting === "sinewave") {
        analyser.fftSize = 2048;
        const bufferLength = analyser.fftSize;
        console.log(bufferLength);

        // We can use Float32Array instead of Uint8Array if we want higher precision
        // const dataArray = new Float32Array(bufferLength);
        const dataArray = new Uint8Array(bufferLength);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        const draw = () => {
            drawVisual = requestAnimationFrame(draw);

            analyser.getByteTimeDomainData(dataArray);

            canvasCtx.fillStyle = "rgb(200, 200, 200)";
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            canvasCtx.lineWidth = 2;
            canvasCtx.strokeStyle = "rgb(0, 0, 0)";

            canvasCtx.beginPath();

            const sliceWidth = (WIDTH * 1.0) / bufferLength;
            let x = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = dataArray[i] / 128.0;
                const y = (v * HEIGHT) / 2;

                if (i === 0) {
                    canvasCtx.moveTo(x, y);
                } else {
                    canvasCtx.lineTo(x, y);
                }

                x += sliceWidth;
            }

            canvasCtx.lineTo(WIDTH, HEIGHT / 2);
            canvasCtx.stroke();
        };

        draw();
    } else if (visualSetting == "frequencybars") {
        analyser.fftSize = 2048;
        console.log("Number of audio samples: ", analyser.fftSize);
        const bufferLengthAlt = analyser.frequencyBinCount;
        console.log("Buffer len: ", bufferLengthAlt);
        console.log("Frequency Bin Count: ", analyser.frequencyBinCount);

        // See comment above for Float32Array()
        const dataArrayAlt = new Uint8Array(bufferLengthAlt);

        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);

        const drawAlt = () => {
            drawVisual = requestAnimationFrame(drawAlt);

            const inputThreshold = document.getElementById("inputThreshold").value;
            console.log("Threshold: ", inputThreshold);

            analyser.getByteFrequencyData(dataArrayAlt);

            canvasCtx.fillStyle = "rgb(0, 0, 0)";
            canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);

            const barWidth = (WIDTH / bufferLengthAlt) * 2.5;
            let x = 0;
            let largestFreqId = -1;

            const filteredData = filterFreqData(dataArrayAlt, bufferLengthAlt, inputThreshold);
            for (let i = 0; i < bufferLengthAlt; i++) {
                const frequencyAmount = filteredData[i];

                if (frequencyAmount > filteredData[largestFreqId] || largestFreqId == -1) {
                    largestFreqId = i;
                }

                canvasCtx.fillStyle = "rgb(" + (frequencyAmount + 100) + ",50,50)";
                canvasCtx.fillRect(
                    x,
                    HEIGHT - frequencyAmount / 2,
                    barWidth,
                    frequencyAmount / 2
                );

                x += barWidth + 1;
            }

            if (largestFreqId != -1) {
                const toneFreq = largestFreqId * audioCtx.sampleRate / analyser.fftSize;
                // const toneMatch = matchPitchClosest(toneFreq);
                const toneMatch = matchPitchBoundaries(toneFreq, TONE_D);
                let tone = "";
                if (toneMatch["octave"] != -1) {
                    tone = toneMatch["toneKey"] + toneMatch["octave"];
                }
                

                document.getElementById("tone").innerHTML = largestFreqId * audioCtx.sampleRate / analyser.fftSize + " Hz   "+ tone;
            } else {
                document.getElementById("tone").innerHTML = "0 Hz";
            }

        };

        drawAlt();
    
    } else if (visualSetting == "off") {
        canvasCtx.clearRect(0, 0, WIDTH, HEIGHT);
        canvasCtx.fillStyle = "red";
        canvasCtx.fillRect(0, 0, WIDTH, HEIGHT);
    }
}