var url = require('url');
var path = require('path');

/**
 * This class verifies if an url was passed in the format configured,
 * it also creates an json object to make the reading easier
 *
 * Format example: /#prefix1/#prefix2/$application/$controller
 */
var prefixRegex = /\#[a-z0-9]*/;
var applicationRegex = /\$application/;
var controllerRegex = /\$controller/;

/**
 * The router object
 *
 * @constructor
 * @method Router
 * @param {string} urlFormat The string that represents how you will send the urls to the server,
 * check the example above
 */
function Router(urlFormat) {
	this.urlFormat = urlFormat;
	this.urlFormatParts = urlFormat.split('/');
}

/**
 * It checks if the url received by the server was formated according to the configuration
 *
 * @method isValid
 * @param {string} requestUrl The requested url received by the server
 * @return {boolean} Returns true if succeed or false if failed
 */
Router.prototype.isValid = function(requestUrl) {
	var parsedUrl = url.parse(requestUrl, true)['pathname'];
	// This version does not allow extension
	if (path.extname(parsedUrl) !== '') {
		return false;
	}
	// Must start with /
	if (parsedUrl.charAt(0) !== '/') {
		return false;
	}
	var parts = parsedUrl.split('/');
	// The number of parameters must be the same of the format
	if (parts.length !== this.urlFormatParts.length) {
		return false;
	}
	return true;
}

/**
 * It decomposes the url
 *
 * @method decompose
 * @param {string} requestUrl The requested url received by the server
 * @return {object} Returns a splited json object of the url
 */
Router.prototype.decompose = function(requestUrl) {
	var parsedUrl = url.parse(requestUrl, true);
	var path = parsedUrl['pathname'];
	var parts = path.split('/');

	var i = 0;
	var prefixes = {};
	var controller = '';
	var application = 'app';
	var that = this;
	parts.forEach(function(part){
		if (i > 0) {
			var urlFormatPart = that.urlFormatParts[i];
			var formatPartFirstChar = urlFormatPart.charAt(0);
			if (formatPartFirstChar === '#') {
				prefixes[urlFormatPart.substring(1)] = part;
			} else if (urlFormatPart === '$controller') {
				controller = part;
			}  else if (urlFormatPart === '$application') {
				application = part;
			}
		}
		i++;
	});
	return {
		'controller' : controller,
		'application' : application,
		'prefixes' : prefixes,
		'query' : parsedUrl['query']
	};
};

module.exports = Router;
