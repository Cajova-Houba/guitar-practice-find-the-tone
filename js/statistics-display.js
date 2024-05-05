const GUESS_STATISTICS_TABLE_ELEMENT_ID = "guess-statistics-table";
const GUESS_HEATMAP_ELEMENT_ID = "heatmap-table";

const DECIMAL_NUMBER_FORMAT = new Intl.NumberFormat('cz-CZ', { style: 'decimal', maximumFractionDigits: 2, minimumFractionDigits: 2 });

var statistics = new Statistics();

function initStatisticsDisplay() {
    statistics.loadFromCookie(STATISTICS_COOKIE_NAME);

    renderGuessStatisticsTable();
    renderGuessHeatmap();
}

function renderGuessStatisticsTable() {
    var table = document.getElementById(GUESS_STATISTICS_TABLE_ELEMENT_ID);
    var guessStats = statistics.getGuessStatistics();

    for (var tone in guessStats) {
        const toneStats = guessStats[tone];

        var row = table.insertRow(-1);
        var toneCell = row.insertCell(0);
        var timeCell = row.insertCell(1);
        var countCell = row.insertCell(2);
        var correctCell = row.insertCell(3);
        toneCell.innerHTML = tone;
        timeCell.innerHTML = DECIMAL_NUMBER_FORMAT.format(toneStats["avg"]);
        countCell.innerHTML = toneStats["count"];
        correctCell.innerHTML = DECIMAL_NUMBER_FORMAT.format(toneStats["correct"]*100)+" %";
    }
}

function isFretMarker(fret) {
    return fret == 3 || fret == 5 || fret == 7 || fret == 9 || fret == 12;
}

function renderGuessHeatmap() {
    var fretboard = document.getElementById(GUESS_HEATMAP_ELEMENT_ID);

    var correctGuessHeatmap = statistics.correctGuessHeatmap;
    var max = Math.max(...correctGuessHeatmap);

    for (var string = 0; string < 6; string++) {
        var stringElement = document.createElement("tr");
        for (var fret = 0; fret < 13; fret++) {
            var fretElement = document.createElement("td");

            var index = statistics.getFretboardIndex(string, fret);
            var value = correctGuessHeatmap[index];
            
            if (value > 0) {
                var interval = findHeatmapInterval(max, value);
                fretElement.innerHTML = value;
                fretElement.classList.add("heatmap-" + interval);
            }
            
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
            stringElement.appendChild(fretElement);
        }
        fretboard.appendChild(stringElement);
    }
}

/**
 * Place the given value into one of the 6 heatmap intervals.
 * 
 * The total interval is from 0 to max. The value is placed into one of the 6 intervals.
 */
function findHeatmapInterval(max, value) {
    var interval = max / 6;
    for (var i = 1; i <= 6; i++) {
        if (value <= interval * i) {
            return i-1;
        }
    }
    return 5;
}