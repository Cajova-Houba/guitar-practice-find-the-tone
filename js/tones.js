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