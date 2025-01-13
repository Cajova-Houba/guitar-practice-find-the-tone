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

// allowed difference in frequency, %, in fraction form
// e.g. 0.1 means +-10% difference
const MAX_TONE_DIFF = 0.03;