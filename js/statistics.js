/**
 * Default name of the cookie that holds statistics.
 */
const STATISTICS_COOKIE_NAME = "find-the-tone-statistics";

/**
 * Class that holds statistics about player's performance.
 * 
 * Stats are held in a dictionary where key is a tone and value is a list of times in milliseconds
 * that player needed to guess that tone.
 */
class Statistics {

    constructor() {
        this.reset();
    }

    addIncorrectGuess(tone) {
        if (this.incorrectGuesses[tone] === undefined) {
            this.incorrectGuesses[tone] = 0;
        }
        this.incorrectGuesses[tone]++;
    }

    addGuessTime(tone, guessTime, string, fret) {
        if (this.correctGuessTimes[tone] === undefined) {
            this.correctGuessTimes[tone] = [];
        }

        if (this.correctGuesses[tone] === undefined) {
            this.correctGuesses[tone] = 0;
        }
        this.correctGuesses[tone]++;

        const fretboardIndex = this.getFretboardIndex(string, fret);
        console.log("Adding correct guess for tone " + tone + " at index " + fretboardIndex);
        this.correctGuessHeatmap[fretboardIndex]++;
        this.correctGuessTimes[tone].push(guessTime);
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

    /**
     * Number of both correct and incorrect guesses for each tone.
     * 
     * @returns dictionary with keys being tones and values being total 
     *  number of guesses for that tone
     */
    getGuessCounts() {

        // put together correct and incorrect guesses
        // keep in mind that a tone might be incorrectly guess but not correctly
        // and vice versa
        var guessCounts = [this.correctGuesses, this.incorrectGuesses]
                            .reduce(function (r, o) {
                                Object.keys(o).forEach(function (tone) {
                                    r[tone] = (r[tone] || 0) + o[tone];
                                });
                                return r;
                            });
        return guessCounts;
    }

    /**
     * Get statistics about player's guesses. A tone is included in statistics only if
     * average, guess count or incorrect guess count exist for that tone.
     * 
     * @returns dictionary with keys being tones and values being average guess time,
     *  total number of guesses and percentage of correct guesses for that tone. Keys are
     *  "avg", "count" and "correct" respectively.
     */
    getGuessStatistics() {
        var guessStatistics = {};
        const averages = this.getAverages();
        const counts = this.getGuessCounts();
        const incorrect = this.incorrectGuesses;

        for (var toneIndex in TONES) {
            var tone = TONES[toneIndex];
            var avg = null;
            var count = null;
            var correct = null;

            if (tone in averages) {
                avg = averages[tone];
            }

            if (counts[tone] !== undefined) {
                count = counts[tone];
                correct = 1;
            }

            if (tone in incorrect) {
                correct = 1 - incorrect[tone] / counts[tone];
            }
            
            if (avg === null && count === null && correct === null) {
                continue;
            }

            guessStatistics[tone] = {"avg": avg, "count": count, "correct": correct};
        }

        return guessStatistics;
    }

    getFretboardIndex(string, fret) {
        return string * (LAST_FRET_INDEX+1) + fret;
    }

    print() {
        console.log(this.correctGuessTimes);
    }

    reset() {
        this.correctGuessTimes = {};
        this.incorrectGuesses = {};
        this.correctGuesses= {};

        // heatmap of correct guesses, [0] = string 0 fret 0, [1] = string 0 fret 1, ... [77] = string 5 fret 12
        this.correctGuessHeatmap = new Array((LOW_E_STRING + 1) * (LAST_FRET_INDEX + 1)).fill(0);
    }

    storeToCookie(cookieName) {
        // stringify json
        var json = JSON.stringify({
            correctGuessTimes: this.correctGuessTimes, 
            incorrectGuesses: this.incorrectGuesses, 
            correctGuessHeatmap: this.correctGuessHeatmap,
            correctGuesses: this.correctGuesses
        });
        
        // base64 encode json
        var base64 = btoa(json);
        document.cookie = cookieName + "=" + base64 + ";";
    }

    loadFromCookie(cookieName) {
        // get cookies
        var cookie = document.cookie;

        // check if cookie with given name exists
        if (cookie.indexOf(cookieName) == -1) {
            console.log("Cookie with name " + cookieName + " not found.");
            return;
        }

        // get base64 content
        var base64 = cookie.split(cookieName + "=")[1];

        // base64 decode
        var json = atob(base64);

        // init
        var stats = JSON.parse(json);
        this.correctGuessTimes = stats.correctGuessTimes;
        this.incorrectGuesses = stats.incorrectGuesses;
        this.correctGuessHeatmap = stats.correctGuessHeatmap;
        this.correctGuesses = stats.correctGuesses;
    }

}