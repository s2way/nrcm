/**
* Dependencies
*/
var url = require("url");
var path = require("path");
var querystring = require("querystring");
var util = require("util");

/**
* Handle the request
*
* @method onRequest
* @param {Object} request The request info from http server
* @param {Object} response The response to http server
* @param {Object} controller The controller list
* @param {JSONObject} acl The acl rules
*/
exports.onRequest = function onRequest(request, response, controller, acl) {
	var info = url.parse(request.url, true);
	var headerContentType = {"Content-Type": "application/json"}; 
	var attempt = {action : path.basename(info["pathname"]), version : path.basename(path.dirname(info["pathname"])), service : path.basename(path.normalize(path.dirname(info.pathname) + '/..')), method : request["method"].toLowerCase(), query : info["query"], acl : {"group" : "admin", "isAllowed" : false, "rule" : ""}, "expect" : ".json"};
	var resultContentType = path.extname(attempt["action"]);
	if (path.extname(attempt["action"]) !== "") {
		attempt["action"] = path.basename(attempt["action"], resultContentType);
		if (resultContentType === ".htm" || resultContentType === ".html") {
			headerContentType = {"Content-Type": "text/html"};
			attempt["expect"] = resultContentType;
		}
	} 
	isAllowedSync(attempt, acl);
	var body = {"error" : 0, "contentType" : headerContentType, "attempt" : attempt, "request" : request, "response" : response};
	if (attempt["version"] === "" || attempt["service"] === "" || attempt["action"] === "") {
		body["error"] = 400;
      	setResponseSync(body);
	 	throw {
        	name: "NrcmUrlError",
        	message: "Url for NRCM is invalid, missing parameters"
      	};
	}	
	if (!attempt["acl"]["isAllowed"]) {
		body["error"] = 403;
		setResponseSync(body);
	} else {
		try {
			invoke(controller, body);
		} catch(e) {
			body["error"] = 400;
			setResponseSync(body);
			throw e;
		}
	}    
}

/**
* Invoke action for reply 
*
* @method invoke
* @param {Object} controller List of controllers
* @param {Object} body The body for http ersponse
*/
function invoke(controller, body) {
	if (controller[body["attempt"]["action"]] === undefined || controller[body["attempt"]["action"]][body["attempt"]["method"]] === undefined) {
		body["error"] = 400;
		setResponseSync(body);
	} else {
		controller[body["attempt"]["action"]][body["attempt"]["method"]](body, setResponseSync);
	}
}

/** 
*  Fill the response with the data
*
* @method setResponseSync
* @param {Object} body The data to be replied as content
*/
function setResponseSync(body) {
	var errorCode = body["error"];
	if (errorCode > 0) {
		var err = getError(errorCode);	
		body["response"].writeHead(err["statusCode"], body["contentType"]);
		body["response"].write(JSON.stringify(err["error"]));
	} else {
		body["response"].writeHead(200, body["contentType"]);
		body["response"].write(JSON.stringify(body["data"]));
	}
	body["response"].end();
}

/**
*  Process the error table
* 
* @method getError
* @param {Number} code Error code to return
* @return {Object} Object with the return data to reply
*/
function getError(code) {
	var result = {"error" : {"code" : code, "message" : "Unknown"}, "statusCode" : 500};
	switch(code) {
	case 400:
		result["error"]["message"] = "Bad request";
		result["statusCode"] = code;
		break;
	case 403:
		result["error"]["message"] = "Forbidden";
		result["statusCode"] = code;
		break;
	}
	return result;
}

/** 
* Test if an attempt for an url is allowed 
* It repects the record orders and the wildcard *
*
* POST - create a new resource
* GET - retrieve a resource
* PUT - update an existing resource
* DELETE - delete a resource
* @method isAllowedSync
* @param {Object} attempt The action (controller`s name or query string)
* @param {JSONObject} acl The acl rules
* @param {String} group The group name of user (active session)
*/
function isAllowedSync(attempt, acl) {
	var i = 0,
		l = 0,
		method = 0;
	if (attempt["action"] !== "" && attempt["method"] !== "") {
		method = ["post", "put", "delete", "get", "path"].indexOf(attempt["method"]);
		if (method === -1) {
		 	throw {
            	name: "NrcmMethodError",
            	message: "Method for NRCM is invalid"
          	};
		}
		for (i = 0, l = acl.url.length; i < l; i += 1) {
			if (acl.url[i].action === attempt["action"]) {
				if (acl.url[i].group === attempt["acl"]["group"]) {
					if (acl.url[i].rule[method] === 1) {
						attempt["acl"]["rule"] = "gA";
						attempt["acl"]["isAllowed"] = true;
					}
					break;
				}
				if (acl.url[i].group === "*") {
					if (acl.url[i].rule[method] === 1) {
						attempt["acl"]["rule"] = "*A";
						attempt["acl"]["isAllowed"] = true;
					}
					break;
				}
			}
			if (acl.url[i].group === attempt["acl"]["group"]) {
				if (acl.url[i].action === attempt["action"]) {
					if (acl.url[i].rule[method] === 1) {
						attempt["acl"]["rule"] = "Ga";
						attempt["acl"]["isAllowed"] = true;
					}
					break;
				}
				if (acl.url[i].action === "*") {
					if (acl.url[i].rule[method] === 1) {
						attempt["acl"]["rule"] = "G*";
						attempt["acl"]["isAllowed"] = true;						
					}
					break;
				}
			}
			if (acl.url[i].group === "*" && acl.url[i].action === "*") {
				if (acl.url[i].rule[method] === 1) {
					attempt["acl"]["rule"] = "**";
					attempt["acl"]["isAllowed"] = true;
				}
				break;
			}
		}
	}	
}