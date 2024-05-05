const GUESS_STATISTICS_TABLE_ELEMENT_ID = "guess-statistics-table";

const DECIMAL_NUMBER_FORMAT = new Intl.NumberFormat('cz-CZ', { style: 'decimal', maximumFractionDigits: 2, minimumFractionDigits: 2 });

var statistics = new Statistics();

function initStatisticsDisplay() {
    statistics.loadFromCookie(STATISTICS_COOKIE_NAME);

    renderGuessStatisticsTable();
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