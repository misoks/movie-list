var key = "e483f2dad026f3ab5718087761fc3799";
var movie = new Object();
var database;
var ENTER_KEY = 13;
var TAB_KEY = 9;
clearOnRefresh = true;

$(document).ready(function() {
	$.getJSON("db.json", function(json) {
		database = json;
		var movieCount = database["records"].length;
		$("#selected").append("You've watched " + movieCount + " new movies since " + getOldestDate());
	});
	

	$("#searchQuery").keyup(function(event){
	    if( (event.keyCode == ENTER_KEY)) {
	        search();
	    }
	});
	$('#date-field').val(new Date().toDateInputValue());
	$("#searchQuery").focus();

});

function indexMovies() {
	var index = 0;
	$(".movie").each(function(){
		$(this).attr("tabindex", index);
		index++;
	});
}

function getOldestDate() {
	var date;
	var lowestDate;
	for (var i=0; i < database["records"].length; i++) {
		date = Date.parse(database["records"][i].myDateWatched);
		if (i == 0) {
			lowestDate = date;
		}
		else {
			if (date < lowestDate) {
				lowestDate = date;
			}
		}
	}
	return prettyDate(lowestDate);
}

var search = function() {
	var query = document.getElementById("searchQuery").value;
	var year;
	

	if (!(query.length > 1)) return;

	$( "#searchResults" ).text("");
	$.get( "http://api.themoviedb.org/3/search/movie?api_key=" + key + "&query=" + query, function( data ) {
		var count = 0;
		var firstID;
		$.each(data.results, function(i, item) {
			count = count + 1;
			if (count == 1) {
				firstID = item.id;
			}
			if (item.release_date) year = item.release_date.substring(0,4);
		    $( "#searchResults" ).append( "<li class='movie result selectable' onclick='examine(this);' class='result' id='"+ item.id + "'>" + item.title + " (" + year + ")</li>");
		});
		indexMovies();
		examine(firstID);
	}, "json");
	
	
}


var examine = function(item) {
	if (!item.nodeType) item = document.getElementById(item);
	if (!item) return;
	var id = item.id;

	var movie;
	$(".selectable").removeClass("selected");
	doSelect(item, true);
	$("#selected").text("");
	$("#selected").attr("movieid", id);
	if ($(item).hasClass("movie--stored")) {
		movie = fetchMovie(id);
		$("#selected").append("<img class='poster' src='https://image.tmdb.org/t/p/w185" + movie.poster_path + "'>")
		$("#selected").append("<h3>" + movie.title + "<span class='year'>(" + movie.year + ")</span></h3>");
		$("#selected").append("<div class='date-watched'>Watched " + prettyDate(movie.myDateWatched) + "</div>");
		$("#selected").append("<div class='rating rating--" + movie.myRating +"'><span class='star star--1' /><span class='star star--2' /><span class='star star--3' /><span class='star star--4' /><span class='star star--5' /></div>");
		$("#selected").append("<p>" + movie.overview + "</p>");
		$("#selected").removeClass('new-selected');
		$("#selected").addClass('existing-selected');

		//$("#selected").append("<button onclick='deleteMovie(" + id + ");'>Remove</button>");
	}
	else {
		$.get( "http://api.themoviedb.org/3/movie/" + id + "?api_key=" + key, function( movie ) {
			$("#selected").append("<img class='poster' src='https://image.tmdb.org/t/p/w185" + movie.poster_path + "'>")
			var year = movie.release_date.substring(0,4);
			if (year) year = "(" + year + ")";
			$("#selected").append("<h3>" + movie.title + "<span class='year'>" + year + "</span></h3>");
			$("#selected").append("<p>" + movie.overview + "</p>");
			$("#selected").addClass('new-selected');
			$("#selected").removeClass('existing-selected');
		}, "json");
		
	}
	
	return true;
}

var selectResult = function(itemId) {
	if (!itemId) {
		itemId = parseInt($("#selected").attr("movieid"));
	}
    $.get( "http://api.themoviedb.org/3/movie/" + itemId + "?api_key=" + key, function( data ) {
    	var dateWatched = $("#date-field").val();
    	var rating = $("#rating-field").val();
		var newMovie = new movie(dateWatched, rating, data);
		newMovie.store();
		location.reload();
	}, "json");
}

var deleteMovie = function(itemId) {
	if (!itemId) {
		itemId = parseInt($("#selected").attr("movieid"));
	}
	database["records"] = database["records"].filter(function (el) {
		return el.id !== itemId;
	});
	saveDatabase();
	location.reload();
}

var movie = function(myDateWatched, myRating, obj) {

	//obj.myDateWatched = Date.parse(myDateWatched);
	obj.myDateWatched = myDateWatched;
	obj.myRating = myRating
	obj.year = obj.release_date.substring(0,4);

	console.log(obj.myRating);


	this.store = function() {
		database["records"].push(obj);
		saveDatabase();
	}
}

var fetchMovie = function(movieID) {
	var result = database["records"].filter(function( obj ) {
		return obj.id == movieID;
	});
	return result[0];
}

var saveDatabase = function() {
	$.ajax ({
        type: "POST",
        dataType : 'json',
        async: true,
        url: 'store.php',
        data: { data: JSON.stringify(database)  },
        done: function () { location.reload(); }
    });
}


var prettyDate = function(dateString) {
	var today = new Date();
	var thisYear = today.getUTCFullYear();

	var rawDate = new Date(dateString);
	var date = rawDate.getUTCDate();
	var days = new Array();
	days[0] = "Sunday";
	days[1] = "Monday";
	days[2] = "Tuesday";
	days[3] = "Wednesday";
	days[4] = "Thursday";
	days[5] = "Friday";
	days[6] = "Saturday";

	var months = new Array();
	months[0] = "January";
	months[1] = "February";
	months[2] = "March";
	months[3] = "April";
	months[4] = "May";
	months[5] = "June";
	months[6] = "July";
	months[7] = "August";
	months[8] = "September";
	months[9] = "October";
	months[10] = "November";
	months[11] = "December";
	var month = months[rawDate.getUTCMonth()];
	var year = rawDate.getUTCFullYear();
	var day = days[rawDate.getUTCDay()];

	if (year == thisYear) {
		return day + ", " + month + " " + date;
	}
	else {
		return day + ", " + month + " " + date + ", " + year;
	}
}

Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});


