var CLIENT_ID = "114074408716-tbmjran7j1hk8th4ljg94sb79qlmktid.apps.googleusercontent.com";
var SCOPES = [
	"https://www.googleapis.com/auth/drive"	// cannot otherwise update file permissions if they're not good enough, an important usability feature
];

var loadedPresentations = [];

var handleClientLoad = function () {
	console.log("client load being handled");
	authorize(true);
};

var handleConnectLinkClick = function () {
	console.log("connect link clicked");
	document.getElementById("error").style.display = "none";
	authorize(false);
};

var authorize = function (immediate) {
	gapi.auth.authorize(
		{
			"client_id": CLIENT_ID,
			"scope": SCOPES.join(" "),
			"immediate": immediate
		},
		handleAuthResult
	);
}

var handleAuthResult = function (authResult) {
	console.log(authResult);
	document.getElementById("loaderGif").style.display = "none";
	if (authResult) {
		if (authResult.error && authResult.error !== "") {
			if (authResult.error === "immediate_failed") {
				console.log("Auth was not already set by user. Waiting for the button press.");
			} else if (authResult.error === "access_denied") {
				console.log("The user denied access! The nerve of that dude.");
				var errorDiv = document.getElementById("error");
				errorDiv.innerText = "Could not connect: permissions were not granted.";	// TODO: explain why we need these permissions with a link
				errorDiv.style.display = "block";
			}
		} else {
			console.log("Successful authorization");
			document.getElementById("connectLinkDiv").style.display = "none";

			loadClient(loadFileList);
		}
	}
};

var loadClient = function (callback) {
	gapi.client.load("drive", "v2", callback);
};

var loadFileList = function () {
	var initialRequest = gapi.client.drive.files.list({
		fields: "items(alternateLink,title,permissions,id)",
		trashed: false,
		maxResults: 10,
		q: "mimeType = 'application/vnd.google-apps.presentation'"
	});
	initialRequest.execute(function (response) {
		presentationLoadCallback(response.items);
	});
};

var presentationLoadCallback = function (presentations) {
	var presentationList = document.getElementById("presentationList");
	for (var i = 0; i < presentations.length; i++) {
		var thisPresentation = {
			"id": presentations[i].id,
			"title": presentations[i].title,
			"link": presentations[i].alternateLink,
			"viewable": canAnyoneWithLinkRead(presentations[i])
		};
		loadedPresentations.push(thisPresentation);

		var thisLi = document.createElement("li");
		var thisLink = document.createElement("a");
		thisLink.innerText = thisPresentation.title;
		thisLink.href = "#";
		(function (presentation) {	// god I love closures
			thisLink.onclick = function () {
				presentationClicked(presentation);
			}
		})(thisPresentation);

		if (i === 0) {
			thisLi.className += " first";
		}

		if (!thisPresentation.viewable) {
			thisLi.className += " disabled";
		}

		thisLi.appendChild(thisLink);

		presentationList.appendChild(thisLi);
	}
};

var canAnyoneWithLinkRead = function (presentation) {
	for (var i = 0; i < presentation.permissions.length; i++) {
		if (presentation.permissions[i].id == "anyoneWithLink") {
			return true;	// as long as the permission exists, it's legit. role=reader is the base permission, there's no way to have a permission where we don't get what we need.
		}
	}
	return false;
};

var presentationClicked = function (presentation) {
	if (presentation.viewable) {
		// cool.
		// have to tell rails this and get a URL to display and an auth token.
		// auth token is probably best tracked inside a cookie so we can reconnect later. That's something we check on pageload. If the cookie exists at all, we try to reconnect and then kill the cookie if the websocket is dead.
		connectPresentation(presentation);
	} else {
		var allowedToChange = confirm("To view the presentation, it needs to have its \"Anyone with link can view\" permission set. I can set it for you now. Do you want me to do that?");
		if (allowedToChange) {
			gapi.client.drive.permissions.insert({
				"fileId": presentation.id,
				"resource": {
					"role": "reader",
					"type": "anyone",
					"withLink": true
				}
			}).execute(function () {
				connectPresentation(presentation);
			});
		} else {
			alert("Ok. You can't present that presentation, then.");
		}
	}
};

var connectPresentation = function (presentation) {
	console.log("connecting presentation! except not really.");
	console.log(presentation);
}

window.onload = function () {
	var connectLink = document.getElementById("connectLink");
	connectLink.onclick = handleConnectLinkClick;
};