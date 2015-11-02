/****************************************************
 * Toshl CSV Import - v0.1 - 2015
 *
 * toshlcsvimport@georgemagiafas.com
 ****************************************************/

/****************************************************
 * Application Variables
 *****************************************************/

/*global window,document,jQuery,Papa,$*/
var APP_CLIENT_ID = "YOUR_TOSHL_APP_CLIENT_ID";
var accessToken = "";
var refreshToken = "";
var userName = "";
var userCurr = "";

/****************************************************
 * Toshl API related methods
 *****************************************************/

// Method to encode post parameters
function encodeParam(param) {
	return encodeURIComponent(param);
}

// Method to retrieve URL parameters
function getParameters() {
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	var i = 0;
	var pair = {};
	var arr = {};
	for (i = 0; i < vars.length; i++) {
		pair = vars[i].split("=");
		// If first entry with this name
		if (!query_string[pair[0]] || query_string[pair[0].length === 0]) {
			query_string[pair[0]] = decodeURIComponent(pair[1]);
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
			query_string[pair[0]] = arr;
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(decodeURIComponent(pair[1]));
		}
	}
	return query_string;
}

// Method to append text to log
function log(message) {
	console.log(message);
}

// Method to append errors to log
function logError(message, errorMessage) {
	log("ERROR: " + message + "\n" + "Message: " + errorMessage);
}

// Method to append successful info to log
function logSuccess(message) {
	log("SUCCESS: " + message);
}

// Method to redirect in case of unauthorized request
function redirect() {
	var authUrl = "https://toshl.com/oauth2/authorize?client_id=" + APP_CLIENT_ID + "&response_type=code&state=init";
	window.location.replace(authUrl);
}

// Method to retrieve the Toshl Authentication Code
function getCode() {
	var code = getParameters()
		.code;
	if (!code || code.length === 0) {
		redirect();
	}
	return code;
}

// Method to retrieve user information
function getMe() {
	$.ajax({
		url: "ajax/ajax.php",
		type: "POST",
		data: {
			call: "getUserInfo",
			token: accessToken,
			refresh: refreshToken
		}
	})
		.done(function (data) {
			try {
				var response = jQuery.parseJSON(data);
				if (!response.error || response.error.length === 0) {
					userName = response.first_name;
					userCurr = response.main_currency;
					log("Toshl Username: " + userName);
				} else {
					redirect();
				}
			} catch (e) {
				logError("Toshl API error, please try again later", e);
			}
		});
}

// Method to retrieve authentication token
function getToken() {
	$.ajax({
		url: "ajax/ajax.php",
		type: "POST",
		data: {
			call: "getToken",
			code: getCode()
		}
	})
		.done(function (data) {
			try {
				var response = jQuery.parseJSON(data);
				if (!response.error || response.error.length === 0) {
					accessToken = response.access_token;
					refreshToken = response.refresh_token;
					log("Toshl Access Token: " + accessToken);
					if (userName.length === 0) {
						getMe();
					}
				} else {
					redirect();
				}
			} catch (e) {
				logError("Toshl API error, please try again later", e);
			}
		});
}

// Method to post expense
function postExpense(amount, date, tags, desc) {
	desc = !desc ? " " : desc;
	$.ajax({
		url: "ajax/ajax.php",
		type: "POST",
		data: {
			call: "postExpense",
			token: accessToken,
			refresh: refreshToken,
			amount: amount,
			date: date,
			tags: encodeParam(tags),
			desc: encodeParam(desc)
		}
	})
		.done(function (data) {
			var response = jQuery.parseJSON(data);
			if ((!response.error || response.error.length === 0) && response == "201") {
				logSuccess("Toshl Expense " + "\n" +
					"amount: " + amount + userCurr + "\n" +
					"date: " + date + "\n" +
					"tags: " + tags + "\n" +
					"description: " + (desc.trim().length === 0 ? "N/A" : desc) + "\n" +
					"response code: " + response);
			} else {
				logError("Toshl Expense Error", response + " " + response.error);
			}
		});
}

// Method to parse CSV data
function parseData(csvData) {
	var results = Papa.parse(csvData, {
		header: true
	});

	var data = results.data;
	if (data && data.length > 0) {
		data.forEach(function (row, index) {
			var amount = row.amount;
			var date = row.date;

			var tags = row.tags;
			var desc = row.description;

			var obj = {
				amount: amount,
				date: date,
				tags: tags,
				desc: desc
			};

			postExpense(amount, date, tags, desc);
		});
	}
}

/****************************************************
 * Application lifecycle methods
 *****************************************************/

// Method to initialise application
function appInit() {
	getToken();
}

// Sample expense creation
function appTest() {
	postExpense("9.99", "2015-11-02", "other, toshlcsvimport", "ToshlCSVImport");
}

$(document)
	.ready(function () {
		$("#import").click(function() {
			var txt = $("#txtArea").val();
			if (txt.length) {
				parseData(txt);
			} else {
				alert("Please give me a clue!")
			}
		});
		appInit();
	});
