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
*/
exports.onRequest = function onRequest(request, response) {
	var info = url.parse(request.url, true);
	var pathname = info.pathname;
	var query = info.query;
	var method = request.method;
	var href = info.href;
	var host = request.headers.host;
	var ip = request.connection.remoteAddress;

    response.writeHead(200, {"Content-Type": "text/plain"});
    response.write("pathname: " + pathname + "\n");
    response.write("   query: " + util.inspect(query) + "\n");
    response.write("  method: " + method + "\n");
    response.write("    href: " + href + "\n");
    response.write("      ip: " + ip + "\n");
    response.write("hostname: " + host + "\n");

    response.end();
}

/**
 * Return the value of param `name` when present or `defaultValue`.
 *
 *  - Checks route placeholders, ex: _/user/:id_
 *  - Checks body params, ex: id=12, {"id":12}
 *  - Checks query string params, ex: ?id=12
 *
 * To utilize request bodies, `req.body`
 * should be an object.
 *
 * @param {Object} request 
 * @param {String} name
 * @param {Mixed} [defaultValue]
 * @return {String}
 */

function getParam(request, name, defaultValue){
	var params = request.params || {};
	var body = request.body || {};
	var query = request.query || {};
	if (null != params[name] && params.hasOwnProperty(name)) return params[name];
	if (null != body[name]) return body[name];
	if (null != query[name]) return query[name];
	return defaultValue;
};