var url = require('url');
var path = require('path');

// Classe responsável por verificar se uma determinada URL
// bate com o formato especicado. Também quebra a URL em um objeto
// JSON para facilitar a leitura
// 
// Formato de exemplo: /#prefix1/#prefix2/$application/$controller

var prefixRegex = /\#[a-z0-9]*/;
var applicationRegex = /\$application/;
var controllerRegex = /\$controller/;

function Router(urlFormat) {
	this.urlFormat = urlFormat;
	this.urlFormatParts = urlFormat.split('/');
}

Router.prototype.isValid = function(requestUrl) {
	var parsedUrl = url.parse(requestUrl, true)['pathname'];
	// Não pode conter extensão
	if (path.extname(parsedUrl) !== '') {
		return false;
	}
	// Deve começar com /
	if (parsedUrl.charAt(0) !== '/') {
		return false;
	}
	var parts = parsedUrl.split('/');
	// Número de parâmetros deve ser o mesmo
	if (parts.length !== this.urlFormatParts.length) {
		return false;
	}
	return true;
}

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

