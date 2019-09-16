/*
 * Set Census API endpoint if changes
 */
const API_ENDPOINT = 'https://api.census.gov/data/2017/acs/acs1?get=NAME';

/*
 * Set your Census endpoint key below
 */

const API_KEY = '';

/******************************************************************************/

/*
 * States definition as goes in Census
 */

const States = {
	'01':'AL', '02':'AK', '04':'AZ', '05':'AR', '06':'CA', '08':'CO', '09':'CT',
	'10':'DE', '12':'FL', '13':'GA', '15':'HI', '16':'ID', '17':'IL', '18':'IN',
	'19':'IA', '20':'KS', '21':'KY', '22':'LA', '23':'ME', '24':'MD', '25':'MA',
	'26':'MI', '27':'MN', '28':'MS', '29':'MO', '30':'MT', '31':'NE', '32':'NV',
	'33':'NH', '34':'NJ', '35':'NM', '36':'NY', '37':'NC', '38':'ND', '39':'OH',
	'40':'OK', '41':'OR', '42':'PA', '44':'RI', '45':'SC', '46':'SD', '47':'TN',
	'48':'TX', '49':'UT', '50':'VT', '51':'VA', '53':'WA', '54':'WV', '55':'WI',
	'56':'WY'
};

const CensusCodes = {
	totalPopulation: 'B01003_001E', blackPopulation: 'B01001B_001E',
	whitePopulation: 'B01001A_001E', asianPopulation: 'B01001D_001E',
	latinPopulation: 'B01001I_001E', publicTransport: 'B08101_025E',
	giniIndex: 'B19083_001E', medianIncome: 'B19119_001E',
	employment: 'B23001_001E', houseRent: 'B25009_010E',
	exUssrBorn: 'B05006_041E,B05006_042E,B05006_030E'

};
/******************************************************************************/

var RAWDATA = [];
var STATESDATA = {};
var SLIDERS = {};

/*
 * Sliders init
 */

initializeSliders = function() {
	$('.stat-slider').slider({
		animate: true,
		min: 0,
		max: 100,
		value: 50,
		slide: function() {
			readSliders();

			calculateStatistics();
		}
	});

	readSliders();
};

readSliders = function() {
	$('.stat-slider').each(
		function (idx, element) {
			SLIDERS[element.id] = $(element).slider('value');
		}
	);
};

$(document).ready(
	function() {
		$('body').addClass('loading');

		var queryCodes = '';

		for (var key in CensusCodes) {
			queryCodes = `${queryCodes},${CensusCodes[key]}`;
		}

		initializeSliders();

		$.get({
			url: `${API_ENDPOINT}${queryCodes}&for=state:*&key=${API_KEY}`,
			dataType: 'json'
		}).done(
			function(data) {
				RAWDATA = data.slice(1);

				$('body').removeClass('loading');

				calculateStatistics();
			}
		).fail(
			function() {
				alert('Ошибка при получении данных, обновите страницу.');
			}
		);

		$('.state').on(
			'click',
			function(event) {
				window.open(
					STATESDATA[event.target.id].wikipedia
				);
			}
		);
	}
);



calculateStatistics = function() {
	RAWDATA = RAWDATA.map(
		function(state) {
			return state.map(
				function (value) {
					if (value == null) {
						return 0;
					}

					return value;
				}
 			)
		}
	);

	var maxIncome = Math.max.apply(
		null,
		RAWDATA.map(
			function(state) {
				return Number(state[8]);
			}
		)
	);

	var maxScore = 0;
	var minScore = 10000000;
	var scores = [];

	STATESDATA = RAWDATA.reduce(
		function(map, state) {
			var stateKey = States[state[state.length - 1]];

			map[stateKey] = {
				name: state[0],
				wikipedia: `http://wikipedia.org/wiki/${state[0]} штат`,
				blackPopulation: (state[2] / state[1]),
				whitePopulation: (state[3] / state[1]),
				asianPopulation: (state[4] / state[1]),
				latinPopulation: (state[5] / state[1]),
				publicTransport: (state[6] / state[1]),
				giniIndex: -3 * Number(state[7]),
				medianIncome: Number(state[8]) / maxIncome,
				employment: 2 * (state[9] / state[1]),
				houseRent: 2 * (state[10] / state[1]),
				exUssrBorn: 10 * ((Number(state[11]) + Number(state[12]) + Number(state[13])) / state[1])
			};

			map[stateKey].score = calculateScore(map[stateKey]);

			scores.push(map[stateKey].score);

			if (map[stateKey].score > maxScore) {
				maxScore = map[stateKey].score;
			}

			if (map[stateKey].score < minScore) {
				minScore = map[stateKey].score;
			}

			return map;
		}, {}
	)

	$('.state').each(
		function(idx, element) {
			if (STATESDATA[element.id]) {
				opacity = (STATESDATA[element.id].score - getMean(scores)) / getSD(scores);

				element.style.fill = `rgba(0, 255, 0, ${opacity})`;
			}
		}
	);
};

calculateScore = function(state) {
	var score = 0;

	for (var key in SLIDERS) {
		score += SLIDERS[key] * state[key];
	}

	return score;
};

getMean = function(array) {
    return array.reduce(function (a, b) {
        return Number(a) + Number(b);
    }) / array.length;
};

getSD = function(array) {
	var mean = getMean(array);
	
    return Math.sqrt(array.reduce(function (sq, n) {
            return sq + Math.pow(n - mean, 2);
        }, 0) / (array.length - 1));
};