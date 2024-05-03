const GUESS_TIMES_TABLE_ELEMENT_ID = "guess-times-table";
const INCORRECT_GUESSES_TABLE_ELEMENT_ID = "incorrect-guesses-table";

const TIME_FORMAT = new Intl.NumberFormat('cz-CZ', { style: 'decimal', maximumFractionDigits: 2, minimumFractionDigits: 2 });

var statistics = new Statistics();

function initStatisticsDisplay() {
    statistics.loadFromCookie(STATISTICS_COOKIE_NAME);

    renderGuessTimesTable();
    renderIncorrectGuessesTable();
}

function renderGuessTimesTable() {
    var table = document.getElementById(GUESS_TIMES_TABLE_ELEMENT_ID);
    var averages = statistics.getAverages();
    for (var tone in averages) {
        var row = table.insertRow(-1);
        var toneCell = row.insertCell(0);
        var timeCell = row.insertCell(1);
        toneCell.innerHTML = tone;
        timeCell.innerHTML = TIME_FORMAT.format(averages[tone]);
    }
}

function renderIncorrectGuessesTable() {
    var table = document.getElementById(INCORRECT_GUESSES_TABLE_ELEMENT_ID);
    var incorrectGuesses = statistics.incorrectGuesses;
    for (var tone in incorrectGuesses) {
        var row = table.insertRow(-1);
        var toneCell = row.insertCell(0);
        var countCell = row.insertCell(1);
        toneCell.innerHTML = tone;
        countCell.innerHTML = incorrectGuesses[tone];
    }
}