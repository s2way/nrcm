/**
* Dependencies
*/
var url = require('url');
var util = require('util');


/**
* Handle the request
*
* @method onRequest
* @param {Object} request The request info from http server
* @param {Object} response The response to http server
* @param {Object} controller The controller list
* @param {Object} model The model list
*/
exports.onRequest = function onRequest(request, response, controller, model) {
	var info = url.parse(request.url, true);
	var pathname = info.pathname;
	var query = info.query;
	var method = request.method;
	var href = info.href;
	var host = request.headers.host;
	var ip = request.connection.remoteAddress;

	console.log(controller);

    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("pathname: " + pathname + "\n");
    response.write("   query: " + util.inspect(query) + "\n");
    response.write("  method: " + method + "\n");
    response.write("    href: " + href + "\n");
    response.write("      ip: " + ip + "\n");
    response.write("hostname: " + host + "\n");

    response.end();
}