var KEY = "e483f2dad026f3ab5718087761fc3799";
var movie = new Object();
var database;
var ENTER_KEY = 13;
var TAB_KEY = 9;
var POSTER_LOCATION = "https://image.tmdb.org/t/p/w185";
var screenIsMobile = true;
var screenIsMiddling = false;
var screenIsLarge = false;
var cast = Array();


$(document).ready(function() {
	var actorID;
	getScreenSize();
	$.getJSON("db.json", function(json) {
		database = json;
		var movieCount = database["records"].length;
		$("#selected").append("You've watched " + movieCount + " new movies since " + getOldestDate());
		/*for (var i=0; i < database["records"].length; i++) {
			movCredits = [];
			id = database["records"][i].id;
			$.getJSON( apiGetCast(id), function( movCredits ) {
				for (var c=0; c<movCredits.cast.length; c++) {
					actorID = parseInt(movCredits.cast[c].id);
					if (cast[actorID]) cast[actorID] = cast[actorID] + 1;
					else cast[actorID] = 1;
				}
			});
		}

		var actorName;
		var count = 0;
		setTimeout(function(){ 
			
			cast.sort();
			console.log(cast);
			for (var a=0; count < 10; a++) {
				if (cast[a] > 0) {
					count++;
					$.getJSON( apiGetActor(a), function( actor ) {
						console.log(cast[a] + " " + actor.name);
					});
				}
			}
		}, 3000);*/
		
	});

	$("#searchQuery").keyup(function(event){
	    if( (event.keyCode == ENTER_KEY)) {
	        search();
	    }
	});
	$('#date-field').val(new Date().toDateInputValue());
	$("#searchQuery").focus();

	//Wait a second to make sure everything is loaded before displaying it
	setTimeout(function(){
		cascadeLoad("#storedMovies .movie__content", "#storedMovies", 250);
	},1000);

});

$( window ).resize(function() {
	getScreenSize();
});

function getScreenSize() {
	var body = document.getElementById("view-box");
	if (body.offsetWidth > 999) {
		screenIsMobile = false;
		screenIsLarge = true;
	}
	else {
		screenIsMobile = true;
		screenIsLarge = false;
	}
}
function cascadeLoad(selector, parent, speed) {
	var itemLoad = 50;
	$(selector).each(function(index){
		if (index == 20) itemLoad = 0;
		$(this).delay(index * itemLoad).fadeIn(speed);
	});
	setTimeout(function(){
		$(parent).addClass('loaded');
	},1000);
	
}

function apiSearch(query) {
	return "http://api.themoviedb.org/3/search/movie?api_key=" + KEY + "&query=" + query;
}
function apiLookup(movieID) {
	return "http://api.themoviedb.org/3/movie/" + movieID + "?api_key=" + KEY;
}
function apiGetCast(movieID) {
	return "http://api.themoviedb.org/3/movie/" + movieID + "/credits?api_key=" + KEY;
}
function apiGetActor(creditID) {
	return "http://api.themoviedb.org/3/person/" + creditID + "?api_key=" + KEY;
}


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
	$.get( apiSearch(query), function( data ) {
		var count = 0;
		var firstID;
		var poster;
		$.each(data.results, function(i, item) {
			count = count + 1;
			if (count == 1) {
				firstID = item.id;
			}
			if (item.release_date) year = item.release_date.substring(0,4);
		    $( "#searchResults" ).append( "<li container='view-box' destination='state-detail' transition='slide-left' style='display: none' class='movie result selectable state-switch' onclick='examine(this);' class='result' id='"+ item.id + "'>" + getPoster(item) + item.title + " (" + year + ")</li>");
		});
		if (count === 0) {
			$( "#searchResults" ).append("<p class='message'>No results found :(</p>");
		}
		indexMovies();
		cascadeLoad("#searchResults .movie", "#searchResults", 500);
		if (!screenIsMobile) {
			examine(firstID);
		} else {
			$("#" + firstID).focus();
		}
	}, "json");
}

var getPoster = function(movie) {
	if (movie.poster_path) {
		poster = "<img class='movie__poster' src='" + POSTER_LOCATION + movie.poster_path + "' />";
	} else {
		poster = "<img class='movie__poster' src='poster-placeholder.png' />";
	}
	return poster;
} 
var examine = function(item) {
	if (!item) return;
	if (!item.nodeType) item = document.getElementById(item);
	if (!item) return;

	getScreenSize();
	if (screenIsMobile) transition(item);

	var id = item.id;

	var movie;
	$(".selectable").removeClass("selected");
	doSelect(item, true);
	$("#selected").text("");
	$("#selected").attr("movieid", id);
	if ($(item).hasClass("movie--stored")) {
		movie = fetchMovie(id);

		$("#selected").append(getPoster(movie));
		$("#selected").append("<h3>" + movie.title + "<span class='year'>(" + movie.year + ")</span></h3>");
		$("#selected").append("<div class='date-watched'>Watched " + prettyDate(movie.myDateWatched) + "</div>");
		$("#selected").append("<div class='rating rating--" + movie.myRating +"'><span class='star star--1' /><span class='star star--2' /><span class='star star--3' /><span class='star star--4' /><span class='star star--5' /></div>");
		$("#selected").append("<p>" + movie.overview + "</p>");
		$("#selected").removeClass('new-selected');
		$("#selected").addClass('existing-selected');

		//$("#selected").append("<button onclick='deleteMovie(" + id + ");'>Remove</button>");
	}
	else {
		$.get( apiLookup(id), function( movie ) {
			$("#selected").append(getPoster(movie));
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
    $.get( apiLookup(itemId), function( data ) {
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
	var success = saveDatabase();
	if (success) {
		location.reload();
	} else {
		console.log("Failed to delete movie.");
	}
}

var movie = function(myDateWatched, myRating, obj) {
	obj.myDateWatched = myDateWatched;
	obj.myRating = myRating
	obj.year = obj.release_date.substring(0,4);

	this.store = function() {
		database["records"].push(obj);
		var success = saveDatabase();
		if (success) {
			location.reload();
		} else {
			console.log("Failed to add movie.");
		}
		
	}
}

var fetchMovie = function(movieID) {
	var result = database["records"].filter(function( obj ) {
		return obj.id == movieID;
	});
	return result[0];
}

var saveDatabase = function() {
	var jsonstring = JSON.stringify(database);
	if (isValidJson(jsonstring)) {
		$.ajax ({
	        type: "POST",
	        dataType : 'json',
	        async: true,
	        url: 'store.php',
	        data: { data: jsonstring  },
	        done: function () { location.reload(); }
	    });
	    return true;
	} 
	else {
		console.log("Invalid JSON string.")
		return false;
	}
}

// Outputs a date string in human-readable language. 
//		If the date is in the current year: Monday, November 2
//		If the date is not the current year: Monday, November 2, 2015
var prettyDate = function(dateString) {
	var today = new Date();
	var thisYear = today.getUTCFullYear();

	var rawDate = new Date(dateString);
	var date = rawDate.getUTCDate();
	var days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
	var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
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

function isValidJson(text){
	if (/^[\],:{}\s]*$/.test(text.replace(/\\["\\\/bfnrtu]/g, '@').
	replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g, ']').
	replace(/(?:^|:|,)(?:\s*\[)+/g, ''))) {
	  return true;
	} 
	else {
	  return false;
	}
}
//Puts the current date into a date input element
Date.prototype.toDateInputValue = (function() {
    var local = new Date(this);
    local.setMinutes(this.getMinutes() - this.getTimezoneOffset());
    return local.toJSON().slice(0,10);
});




