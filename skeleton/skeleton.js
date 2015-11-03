var currentSelected = "Nothing";
var DOWN_KEY = 40;
var UP_KEY = 38;
var ENTER_KEY = 13;
var TAB_KEY = 9;
var count = 100;
var clearOnRefresh = false;
var enableDebug = true;
var debugZone;
var data = {};
var extraScrollOffset;
var mouse = {
    x: 0,
    y: 0,
    startX: 0,
    startY: 0
};

$(document).ready(function() {

	// Create debug area if enabled
	if (enableDebug) {
		debugZone = document.createElement("div");
		var body = document.getElementsByTagName("body")[0];
		body.appendChild(debugZone);
		debugZone.className = "debug-zone";
		debugZone.style.display = "none";
		debugZone.innerHTML = "<h3>Debugger</h3> <a class='close-debugger' onclick='closeDebug();'>X</a><p id='debug-zone__message'></p>";
	}

	// Set up saved form information
	createEditableFields();
    indexInputs();
	populateFields();
	loadVectors();


	// Expands and collapses cards
	$(".card--expandable .card__header").click(function() {
		var card = this.parentNode;
		if ( ($(card).hasClass("expanded")) ) {
			collapseCard(card);
		} else {
			expandCard(card);
		}
	});
	$(".section--expandable .section__header").click(function() {
		var card = this.parentNode;
		if ( ($(card).hasClass("expanded")) ) {
			collapseCard(card);
		} else {
			expandCard(card);
		}
	});

	// Selects a selectable element
	/*$(".selectable").click(function() {
		doSelect(this, 1);
	});*/

	// Switches an editable element into edit mode
	$(".js-editable").click(function() {
		if ($(this).parents(".navigator__section").length > 0) {
			return;
		}
		editMode(this);
	});

	$(".navigator__section").click(function(){
		navigatorEnterEdit(this); //Opens the current section
	});

	$(".tab").click(function() {
		selectTab(this);
	});

	// Stores the value of input elements in browser session storage
	$("input").focusout(function() {
		if ($(this).parents(".navigator__section").length > 0) return;
		storeThis(this);
	});

	var timeoutID;
	$("input[type=checkbox]").click(function() {
		timeoutID = window.setTimeout(storeThis(this), 200);
	});

	var timeout2;
	$("input[type=radio]").click(function() {
		timeout2 = window.setTimeout(storeThis(this), 200);
	});

	// Handles state transitions
	/*$(".state-switch").click(function() {
		//console.log(this.id);
		transition(this);
	});*/

	$(".tree li").click(function(){
		$(".tree li").removeClass("current");
		$(this).addClass("visited");
		$(this).addClass("current");
	});

	/*
	$(".button--toggle").click(function() {
		toggleButton($(this).attr("id"));
    });*/

	/*$(".button--multi__state").click(function() {
		toggleMulti($(this).attr("id"));
	});*/

	$(".modal__close-button").click(function(){
		var modal = $(this).parents(".modal")[0];
		closeModal(modal.id);
	});

	$(".splitter").mousedown(function(){
		splitterResize(this);
	});

	var lvIndex = 0;
	var colClass = "";
	var td;
	$(".list-view th").each(function(){
		colClass = "column-" + lvIndex;
		$(this).addClass(colClass);
		$(".list-view tbody tr").each(function(){
			td = $(this).children("td")[lvIndex];
			$(td).addClass(colClass);
		});
		lvIndex++;
	});

	var navigators = document.getElementsByClassName("navigator");
	if (navigators.length > 0) {
		$(navigators).each(function(index) {
			generateNavigator(navigators[index]);
		});
	}

	setListViewSizes();

});

// Handles keyboard navigation
$(document).keydown(function(e) {
	if (! $(document.activeElement).hasClass('selectable')) return;
    if (e.which == UP_KEY) {
        keyUp(e);
    } else if (e.which == DOWN_KEY) {
        keyDown(e);
    }
});

function setListViewSizes() {
	var list;
	var pane;
	var viewHeight;
	var listHeight;
	var viewWidth;
	var listWidth;
	$(".list-view").each(function(){
		list = $(this).children(".list-view__list")[0];
		pane = $(this).children(".list-view__pane")[0];
		view = this;

		if ($(view).hasClass("list-view--vert")) {
			viewWidth = view.offsetWidth;
			listWidth = list.offsetWidth;
			pane.style.width = (viewWidth - listWidth - 30) + "px";
		}
		else {
			viewHeight = view.offsetHeight;
			listHeight = list.offsetHeight;
			pane.style.height = (viewHeight - listHeight) + "px";
		}
	});
}

function navigatorNavClick(link) {
	var sectionID = link.id.replace("to_","");
	var section = document.getElementById(sectionID);
	scrollTo(section, true, extraScrollOffset);
	navigatorEnterEdit(section);
}

function navigatorEnterEdit(section) {
	navigatorExitEdit();
	$(section).addClass("navigator__section--edit-mode");
	$(section).find(".js-editable").each(function(){
		editMode(this);
	});
}
function navigatorExitEdit() {
	var section = $(".navigator__section--edit-mode")[0];
	$(section).find(".js-editable").each(function(){
		var input = $("#" + this.id + "-input")[0];
		saveEditableValue(input);
	});
	$(".navigator__section--edit-mode").removeClass("navigator__section--edit-mode");
	return false;
}
function generateNavigator(container) {
	var nav = $(container).children(".navigator__nav")[0];
	if (!nav) return;
	var content = $(container).children(".navigator__content")[0];
	if (!content) return;

	var sectionName;
	var sectionID;
	var link;
	var text;
	$(content).children().each(function() {
		if ($(this).hasClass("navigator__section")) {
			sectionName = $(this).attr("name");
			sectionID = this.id;
			link = "<a class='navigator__nav__link' id='to_" + sectionID + "' onclick='navigatorNavClick(this);'>" + sectionName + "</a>";
			$(nav).append(link);
		}
		else {
			sectionName = $(this).attr("name");
			text = "<h4 class='navigator__nav__heading'>" + sectionName + "</h4>";
			$(nav).append(text);
		}
	});
}

function selectTab(tab) {
	$(tab).siblings().removeClass("current");
	$(tab).addClass("current");
	if (tab) {
		sessionStorage.setItem(tab.parentNode.id, tab.id);
	}
}
function loadVectors() {
	var filename;
	var rawFile;
	var vectors = document.getElementsByClassName("vector");
	var classes;
	for (var i = 0; i < vectors.length; i++) {
		classes = vectors[i].className;
		filename = $(vectors[i]).attr("filename");
		var img = document.createElement("span");
		getSVG(filename, img);
		img.className = classes;
		vectors[i].parentNode.insertBefore(img, vectors[i].nextSibling);
		vectors[i].parentNode.removeChild(vectors[i]);
	}
}

function toggleMulti(optionId) {
	if ($("#" + optionId).hasClass("pressed")) return;
	$("#" + optionId).siblings().removeClass("pressed");
	$("#" + optionId).addClass("pressed");
	sessionStorage.setItem($("#" + optionId).parent().attr("id"), optionId);
}
function toggleButton(buttonId) {
	 if ($("#" + buttonId).hasClass("pressed")) {
        $("#" + buttonId).removeClass("pressed");
        sessionStorage.setItem(buttonId, 0);
    }
    else {
        $("#" + buttonId).addClass("pressed");
        sessionStorage.setItem(buttonId, 1);
    }
}

function openModal(modalID) {
	var modal = document.getElementById(modalID);
	var modalOverlay = modal.parentNode;

	$(modalOverlay).show();
	$(modal).show();
	absoluteCenter(modal);
}
function closeModal(modalID) {
	var modal = document.getElementById(modalID);
	var modalOverlay = modal.parentNode;

	$(modalOverlay).hide();
	$(modal).hide();
}

// ====================================================================== //
// 							State Transitions
// ====================================================================== //
function transition(navElement) {
	var mode = $(navElement).attr("transition");
	var destination = document.getElementById($(navElement).attr("destination"));
	var container = document.getElementById($(navElement).attr("container"));
	if (sessionStorage.getItem(container.id) === destination.id) return;
	var origin = document.getElementById(sessionStorage.getItem(container.id));
	if (!origin) {
		origin = container.childNodes[1];
	}
	var width = container.offsetWidth;
	var height = container.offsetHeight;
	$(destination).show();
	$(origin).css("z-index", 0);
	$(destination).css("z-index", 2);


	if (mode == "slide-left") {
		destination.style.top = "0";
		destination.style.left = width + "px";
		$(destination).animate({left: "0px"}, 200);
		$(origin).animate({left: "-" + (width + 20) + "px"}, 300, "", function() {cleanUpAnimation});
	}
	else if (mode == "slide-right") {
		destination.style.top = "0";
		destination.style.left = "-" + width + "px";
		$(destination).animate({left: "0px"}, 200);
		$(origin).animate({left: (width + 20) + "px"}, 300, "", function() {cleanUpAnimation});
	}
	else if (mode == "slide-up") {
		destination.style.top = height + "px";
		destination.style.left = "0";
		$(destination).animate({top: "0px"}, 200);
		$(origin).animate({top: "-" + (height + 20) + "px"}, 300, "", function() {cleanUpAnimation});
	}
	else if (mode == "slide-down") {
		destination.style.top = "-" + height + "px";
		destination.style.left = "0";
		$(destination).animate({top: "0px"}, 200);
		$(origin).animate({top: (height + 20) + "px"}, 300, "", function() {cleanUpAnimation});
	}
	else if (mode == "crossfade") {
		destination.style.top = "0";
		destination.style.left = "0";
		$(origin).css("z-index", 3);
		$(origin).fadeOut('slow', function() {cleanUpAnimation});
	}
	else {
		cleanUpAnimation();
	}
	function cleanUpAnimation() {
		$(destination).addClass("state--current");
		$(origin).removeClass("state--current");
		$(origin).hide();

	}
	saveState(container, destination);
}






// ====================================================================== //
// 							Data Storage & Handling
// ====================================================================== //
//
function saveState(element, currentState) {
	sessionStorage.setItem(element.id, currentState.id);
}
function validate(element) {
	if (!element.value) return;
	if ((element.value.length > 0) || element.checked) {
		$(element).addClass("populated");
		return true;
	}
	else {
		$(element).removeClass("populated");
		return false;
	}
}
function storeThis(element) {
	var val;
	if (validate(element)) {
		if (element.checked) {
			val = 1;
		}
		else {
			val = element.value;
		}
		sessionStorage.setItem(element.id, val);
	}
}
function indexInputs() {
	var inputs = document.getElementsByTagName("input");
	for (var i = 0; i < inputs.length; i++) {
		if (inputs[i].id === "") {
			count = count + 1;
			inputs[i].id = "input-" + count;
		}
	}

	count = 0;
	var dynamicStateAreas = document.getElementsByClassName("dynamic-area--state-change");
	for (var i = 0; i < dynamicStateAreas.length; i++) {
		if (dynamicStateAreas[i].id === "") {
			count = count + 1;
			dynamicStateAreas[i].id = "dynamic-area--state-change-" + count;
		}
	}

	/*
	count = 0;
	var toggleButtons = document.getElementsByClassName("button--toggle");
	for (var i = 0; i < toggleButtons.length; i++) {
		if (toggleButtons[i].id === "") {
			count = count + 1;
			toggleButtons[i].id = "toggle-button-" + count;
		}
	}*/

	/*count = 0;
	var multiButtons = document.getElementsByClassName("button--multi");
	var multiOptions;
	var idName;
	var count2 = 0;
	for (var i = 0; i < multiButtons.length; i++) {
		if (multiButtons[i].id === "") {
			count = count + 1;
			idName = "multi-button-" + count;
			multiButtons[i].id = idName;
			multiOptions = multiButtons[i].childNodes;
			count2 = 0;
			for (var c = 0; c < multiOptions.length; c++) {
				if (multiOptions[c].id === "") {
					count2++;
					multiOptions[c].id = idName + "__option-" + count2;
				}
			}
		}
	}*/

	count = 0;
	count2 = 0;
	var tabGroups = document.getElementsByClassName("tabs");
	var tabs;
	var groupID;
	for (var i = 0; i < tabGroups.length; i++) {
		if (tabGroups[i].id === "") {
			count = count + 1;
			tabGroups[i].id = "tab-group-" + count;
		}
		groupID = tabGroups[i].id;
		tabs = tabGroups[i].childNodes;
		for (var n = 0; n < tabs.length; n++) {
			if (tabs[n].id === "") {
				count2++;
				tabs[n].id = groupID + "__tab-" + count2;
			}
		}
	}

	count = 0;
	$(".list-view__list tbody tr").each(function() {
		if (this.id === "") {
			count = count + 1;
			this.id = "list-view-row-" + count;
		}
	});
}
function updateStorage() {
	if(typeof(Storage) !== "undefined") {
    	var inputs = document.getElementsByTagName("input");
    	for (var i = 0; i < inputs.length; i++) {
    		if (input.type == "button") return;
    		sessionStorage.setItem(inputs[i].id, inputs[i].value);
    	}
	}
}
function populateFields() {
	if (clearOnRefresh) return;
	if(typeof(Storage) == "undefined") return;

	/*var value;
	var inputs = document.getElementsByTagName("input");
	for (var i = 0; i < inputs.length; i++) {
		var index = inputs[i].id;
		value = sessionStorage.getItem(index);
		if (value == 1) {
			inputs[i].checked = true;
		}
		else {
			inputs[i].value = value;
		}
		if ( $(inputs[i]).hasClass("js-editable-input") ) {
			var display = inputs[i].previousSibling;
			if (value) display.innerHTML = value;
		}
		validate(inputs[i]);
	}*/

	/*var dynamicStateAreas = document.getElementsByClassName("dynamic-area--state-change");
	for (var i = 0; i < dynamicStateAreas.length; i++) {
		index = dynamicStateAreas[i].id;
		value = sessionStorage.getItem(index);
		console.log(index);
		if (value) {
			$("#" + index + " .state").removeClass("state--current");
			$("#" + value).addClass("state--current");
		}
		else {
			var first = $("#" + index + " .state")[0];
			$(first).addClass("state--current");
		}
	}*/
	
	$(".dynamic-area--state-change").each(function() {
		index = this.id;
		value = sessionStorage.getItem(index);
		if (value) {
			$("#" + index + " .state").removeClass("state--current");
			$("#" + value).addClass("state--current");
		}
		else {
			var first = $("#" + index + " .state")[0];
			$(first).addClass("state--current");
		}
	});

	/*
	var toggleButtons = document.getElementsByClassName("button--toggle");
	for (var i = 0; i < toggleButtons.length; i++) {
		index = toggleButtons[i].id;
		value = sessionStorage.getItem(index);
		if (value == '1') {
			if (toggleButtons[i].onclick){
				toggleButtons[i].onclick.apply(toggleButtons[i]);
			}
			toggleButton(index);
		}
	}*/

	/*var multiButtons = document.getElementsByClassName("button--multi");
	var multiOption;
	for (var i = 0; i < multiButtons.length; i++) {
		index = multiButtons[i].id;
		value = sessionStorage.getItem(index);
		if (value) {
			multiOption = document.getElementById(value);
			if (multiOption && multiOption.onclick) {
				multiOption.onclick.apply(multiOption);
			}
			toggleMulti(value);
		}
	}*/

	count = 0;
	var tab;
	var tabGroups = document.getElementsByClassName("tabs");
	for (var i = 0; i < tabGroups.length; i++) {
		index = tabGroups[i].id;
		value = sessionStorage.getItem(index);
		tab = document.getElementById(value);
		if (tab) {
			selectTab(tab);
		}
	}
}

function createEditableFields() {
	var count = 0;
	var element;
	var editables = document.getElementsByClassName("js-editable");
	for (var i = 0; i < editables.length; i++) {
		element = editables[i];
		if (element.id == "") {
			count++;
			element.id = "editable-" + count;
		}
		var field = document.createElement("input");
		element.parentNode.insertBefore(field, element.nextSibling);
		field.id = element.id + "-input";
		field.style.display = "none";
		field.className = "js-editable-input";
	}
}
function editMode(element) {
	if ( $(element).hasClass("editable--editing") ) return;

	var text = element.innerHTML;
	var field = document.getElementById(element.id + "-input");

	if (!field) return;
	field.value = text;
	$(field).show();
	if (!$(element).parents(".navigator__section").length > 0) {
		$(field).focus();
		$(field).focusout(function() {
			$(this).focus();
		});
		$(field).keydown(function(e){
			if (e.which == ENTER_KEY || e.which == TAB_KEY) {
				saveEditableValue(this);
			}
		});
	}
	$(element).hide();
	$(element).addClass("editable--editing");
}

function saveEditableValue(input) {
	var text = input.value;
	var span = input.previousSibling;

	storeThis(input);

	$(span).show();
	$(span).removeClass("editable--editing");

	span.innerHTML = text;
	$(input).hide();

	span.addEventListener("click", editMode(input.parentNode));
}
// Toggles the .selected class off and on for an element. If the element is being selected and is not in
// the viewport, the screen will scroll that element into view.
function doSelect(element, clicked, animate) {
	if ($(element).hasClass("selected")) {
		$(element).siblings(".selectable").removeClass("selected");
		currentSelected = "";
		element.focus();
		return;
	} else {
		$(element).siblings(".selectable").removeClass("selected");
		$(element).addClass("selected");
		currentSelected = element.id;
		if ( (element.onclick) && (!clicked)) {
			element.onclick.apply(element);
		}
		if ( (!clicked) && (!elementInViewport(element)) ) {
			scrollTo(element, animate);
		}
		element.focus();
	}
}
function collapseCard(card) {
	$(card).children(".card__content").hide(200);
	$(card).children(".card__summary").show();
	$(card).removeClass("expanded");
	$(card).addClass("collapsed");
}

function expandCard(card) {
	$(card).children(".card__content").show(200);
	$(card).children(".card__summary").hide();
	$(card).removeClass("collapsed");
	$(card).addClass("expanded");
}

function keyUp(e) {
    var current = $(".selected")[0];
    if ($(current).hasClass("first-target")) return;

    e.preventDefault();
    var above = findPrev(current, "selectable");
    if (above) doSelect(above,0,0);
}

function keyDown(e) {
    var current = $(".selected")[0];
    if ($(current).hasClass("last-target")) return;

    e.preventDefault();
    var below = findNext(current, "selectable");
    if (below) doSelect(below,0,1);
}



// ====================================================================== //
// 								Utilities
// ====================================================================== //
function debug(message) {
	var messageBox = document.getElementById("debug-zone__message");
	debugZone.style.display = "block";
	messageBox.innerHTML = dump(message);
}
function closeDebug() {
	debugZone.style.display = "none";
}
function dump(arr,level) {
    var dumped_text = "";
    var type;
    var ELEMENT = 1;
    var ATTRIBUTE = 2;
    var TEXT = 3;
    var COMMENT = 4;
    if(!level) level = 0;

    if (arr == null) return "null";

    //The padding given at the beginning of the line.
    var level_padding = "";
    for(var j=0;j<level+1;j++) level_padding += "    ";

    if(typeof(arr) == 'object') { //Array/Hashes/Objects
    	if (!arr.hasOwnProperty(length)) {
    		if (arr.tagName) {
    			if (arr.nodeType == ELEMENT) {
    				type = "HTML Element";
    			}
    			else if (arr.nodeType == ATTRIBUTE) {
    				type = "HTML Element Attribute";
    			}
    			else if (arr.nodeType == TEXT) {
    				type = "HTML Text Node";
    			}
    			else if (arr.nodeType == COMMENT) {
    				type = "HTML Comment Node";
    			}
    			dumped_text = "===>" + arr.nodeName + "<===(" + type + ")"
    		} else {
    			dumped_text = arr[0];
    		}
    	} else {
    		for(var item in arr) {
	            var value = arr[item];

	            if(typeof(value) == 'object') { //If it is an array,
	                dumped_text += level_padding + "'" + item + "' ...\n";
	                dumped_text += dump(value,level+1);
	            } else {
	                dumped_text += level_padding + "'" + item + "' => \"" + value + "\"\n";
	            }
	        }
    	}
    } else { //Stings/Chars/Numbers etc.
    	dumped_text = "===>"+arr+"<===("+typeof(arr)+")";
    }
    return dumped_text;
}

function displayCode(displayID, elemID) {
	var displayElem = document.getElementById(displayID);
	var sourceElem = document.getElementById(elemID);
	var code = sourceElem.innerHTML;

	$(displayElem).text(code);
}

function findPrev(element, className) {
    var selectorArr = document.getElementsByClassName(className);
    var elemIndex = getElemIndex(element, selectorArr);
    var prev = selectorArr[elemIndex - 1];
    return prev;
}

function findNext(element, className) {
    var selectorArr = document.getElementsByClassName(className);
    var elemIndex = getElemIndex(element, selectorArr);
    var next = selectorArr[elemIndex + 1];
    return next;
}

function getElemIndex(element, array) {
    return Array.prototype.indexOf.call(array, element);
}

function elementInViewport(el) {
	var top = el.offsetTop;
	var left = el.offsetLeft;
	var width = el.offsetWidth;
	var height = el.offsetHeight;

	while(el.offsetParent) {
		el = el.offsetParent;
		top += el.offsetTop;
		left += el.offsetLeft;
	}

	return (
		top >= window.pageYOffset &&
		left >= window.pageXOffset &&
		(top + height) <= (window.pageYOffset + window.innerHeight) &&
		(left + width) <= (window.pageXOffset + window.innerWidth)
	);
}

function replaceAll(find, replace, str) {
 	return str.replace(new RegExp(find, 'g'), replace);
}
function loadData() {
	// Load data -- This requires your site be running off a local server and has a JSON MIME type set up.
	// See: http://stackoverflow.com/questions/8158193/how-to-allow-download-of-json-file-with-asp-net
	$.getJSON("data.json", function(raw) {
		data = raw;
		alert(data.length);
	});
}
function getSVG(name, element) {
	var vector = $.get('icons/' + name + '.svg', function(svg) {
	    element.innerHTML = svg;
	}, 'text');
}

function scrollTo(element, animate, extraScrollOffset) {
	if (!element.nodeType) element = document.getElementById(element);
	if (!extraScrollOffset) extraScrollOffset = 0;
	scrollContainerSelector ='html, body';
	if (animate) var time = 200;
	else var time = 0;
	$(scrollContainerSelector).animate({
	    scrollTop: ($(element).offset().top + extraScrollOffset + "px")
	},time);
}

function absoluteCenter(element) {
	var elemHeight = element.offsetHeight;
	var screenHeight = $(window).height();

	var top = ((screenHeight/2) - (elemHeight/2)) + "px";
	$(element).css("top", top);
}

function splitterResize(splitter) {
    var body = document.getElementById("js-resizable-main");
	var sidebar = document.getElementById("js-resizable-secondary");
	var doc = $(body).parents(".list-view")[0];
	var isVert = false;
	if ($(doc).hasClass("list-view--vert")) {
		isVert = true;
	}

    setInitialMousePosition();
    $(splitter).addClass("active");
	var isResizing = true;

	doc.onmousemove = function(e) {
		if ($(splitter).hasClass("no-resize")) return false;
		if (!isResizing) return false;
		setMousePosition();
		if (!isVert) { // Low-res
			if (mouse.y > (document.body.clientHeight - 250)) {
				mouse.y = document.body.clientHeight - 250;
			}
			if (mouse.y < 175) {
				mouse.y = 175;
			}
			var offset = mouse.y - mouse.startY;
			if (offset !== 0) {
				var bodyHeight = body.offsetHeight;
				var sidebarHeight = sidebar.offsetHeight;
				if (bodyHeight + offset < 0) {
					offset = -bodyHeight + 1;
				}
				else if (sidebarHeight - offset < 0) {
					offset = sidebarHeight - 1;
				}
				if ((offset < 0) && (body.offsetHeight < 175)) {
					return false;
				}
				sidebar.style.height = sidebarHeight - offset + "px";
				body.style.height = bodyHeight + offset + "px";
				mouse.startY = mouse.startY + offset;
			}
			detailHeight = sidebar.offsetHeight;
		}
		else { //Hi-res
			if (mouse.x > (document.body.clientWidth - 50)) {
				mouse.x = document.body.clientWidth - 50;
			}
			var offset = mouse.x - mouse.startX;
			if(offset !=0) {
				var bodyWidth = body.offsetWidth;
				var sidebarWidth = sidebar.offsetWidth;

				if (bodyWidth + offset < 0) {
					offset = -bodyWidth + 1;
				}
				else if (sidebarWidth - offset < 0) {
					offset = sidebarWidth - 1;
				}
				if ((offset < 0) && (body.offsetWidth < 400)) {
					return false;
				}
				if ((offset > 0) && (sidebarWidth < 500)) {
					return false;
				}
				sidebar.style.width = sidebarWidth - offset + "px";
				body.style.width = bodyWidth + offset + "px";
				mouse.startX += offset;
	            detailWidth = sidebar.offsetWidth;
			}
		}
	}
	doc.onmouseup = function(e) {
		endResize();
	}
	splitter.onfocusout = function(e) {
		endResize();
	}

	function endResize() {
		if ($(splitter).hasClass("no-resize")) return false;
		$(splitter).removeClass("active");

		if (isResizing) {
			isResizing = false;
			doc.onmousemove = null;
			doc.onmouseup = null;
			splitter.onfocusout = null;
		}
	}
}

function getMouseY(event) {
    var e = event || window.event;
    return e.clientY + (document.documentElement.scrollTop || document.body.scrollTop);
}
function getMouseX(event) {
	var e = event || window.event;
	return e.clientX +  (document.documentElement.scrollLeft || document.body.scrollLeft);
}
function setMousePosition() {
    mouse.x = getMouseX();
    mouse.y = getMouseY();
}
function setInitialMousePosition() {
    mouse.startX = getMouseX();
    mouse.startY = getMouseY();
}