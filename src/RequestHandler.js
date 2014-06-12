// Dependencies
var querystring = require('querystring');
var util = require('util');
var aclModule = require('./acl');
var exceptions = require('./exceptions');
var stringUtils = require('./stringUtils');
var Router = require('./Router');
var Model = require('./Model/Model');
var DataSource = require('./Model/DataSource');

/**
 * The request handler object
 *
 * @constructor
 * @method RequestHandler
 * @param {json} configs
 * @param {json} applications
 * @param {object} ExceptionsController
 */
function RequestHandler(configs, applications, ExceptionsController) {
	this.applications = applications;
	this.configs = configs;
	this.isAllowed = aclModule.isAllowed;
	this.ExceptionsController = ExceptionsController;
};

/**
 * It processes every request received
 *
 * @method process
 * @param {object} request The nodejs request object
 * @param {object} response The nodejs response object
 */
RequestHandler.prototype.process = function(request, response) {
	this.debug('process()');

	this.request = request;
	this.response = response;
	this.extension = '.json';
	this.rule = null;
	this.payload = '';

	var requestUrl = this.request.url;
	this.info('---------------------------------');
	this.info('Request: ' + requestUrl);
	this.info('---------------------------------');

	try {
		var router = new Router(this.configs.urlFormat);

      	// Verifica se a URL é válida
      	if (!router.isValid(requestUrl)) {
			throw new exceptions.InvalidUrl();
		}

		// Utiliza o Router para decompor a URL
		var decomposedURL = router.decompose(requestUrl);
		var method = this.request.method.toLowerCase();

		this.appName = decomposedURL.application;

		// Verifica se a aplicação existe
		if (this.applications[this.appName] === undefined) {
			throw new exceptions.ApplicationNotFound(this.appName);
		}

		this.acl = this.applications[this.appName].acl;
		this.query = decomposedURL.query;
		this.prefixes = decomposedURL.prefixes;
		var controller = decomposedURL.controller;

		this.info('application=' + this.appName);
		this.info('controller=' + controller);
		this.info('method=' + method);
		this.info('prefixes=' + JSON.stringify(this.prefixes));
		this.info('query=' + JSON.stringify(this.query));

		var rule = this.isAllowed(this.acl, 'admin', controller, method);
		this.rule = rule;

		if (rule === false) {
			throw new exceptions.Forbidden();
		}

		this.invokeController(controller, method);

	} catch (e) {
		this.handleRequestException(e);
	}
};

/**
 * It executes a function within the controller
 *
 * @method invokeController
 * @param {string} controller The controller`s name
 * @param {string} method The controller`s method that should be invoked
 */
RequestHandler.prototype.invokeController = function(controller, method) {
	var that = this;
	that.debug('invokeController()');
	var controllerCamelCase = stringUtils.lowerCaseUnderscoredToCamelCase(controller);
	var application = that.applications[that.appName];

	if (application.controllers[controllerCamelCase] === undefined) {
		that.debug('controller not found');
		throw new exceptions.ControllerNotFound();
	}
	var ControllerConstructor = application.controllers[controllerCamelCase];
	var controllerInstance = new ControllerConstructor();
	controllerInstance.components = {};
	controllerInstance.name = controllerCamelCase;
	controllerInstance.application = that.appName;

	// Injects the components
	for (var componentName in application.components) {
		var ComponentConstructor = application.components[componentName];
		var componentInstance = new ComponentConstructor();
		componentInstance.name = componentName;
		controllerInstance.components[componentName] = componentInstance;
	}

	var dataSources = [];
	// Instantiate all DataSources
	for (var dataSourceName in this.configs.dataSources) {
		var dataSourceConfig = this.configs.dataSources[dataSourceName];
		dataSources[dataSourceName] = new DataSource(dataSourceConfig);
	}


	controllerInstance.models = {};
	// Injects the models
	for (var modelName in application.models) {
		var ModelConstructor = application.models[modelName];
		var modelInstance = new ModelConstructor();

		var modelDataSourceName = modelInstance.dataSource;
		if (modelDataSourceName === undefined) {
			modelDataSourceName = 'default';
		}

		var dataSource = dataSources[modelDataSourceName];

		modelInstance.name = modelName;
		modelInstance.model = new Model(dataSource, {
			'uid' : modelInstance.uid,
			'keys' : modelInstance.keys,
			'locks' : modelInstance.locks,
			'requires' : modelInstance.requires,
			'validate' : modelInstance.validate
		});
		controllerInstance.models[modelName] = modelInstance;
	}

	// Injects the models inside the models
	for (var modelName in controllerInstance.models) {
		var modelInstance = controllerInstance.models[modelName];
		modelInstance.models = controllerInstance.models;
	}

	if (controllerInstance[method] === undefined) {
		that.debug('method not found');
		throw new exceptions.MethodNotFound();
	}
	// Receiving data
	this.request.on('data', function(data) {
		that.debug('on data');
		that.payload += data;
	});
	// All data received
	this.request.on('end', function() {
		that.debug('request.end()');
		controllerInstance.payload = querystring.parse(that.payload);
		controllerInstance.query = that.query;
		controllerInstance.prefixes = that.prefixes;
		controllerInstance.readonly = {
			'request' : that.request,
			'response' : that.response
		};
		controllerInstance.requestHeaders = that.request.headers;
		controllerInstance.responseHeaders = {};

		try {

			var savedOutput = '';

			function afterCallback() {
				try {
					if (controllerInstance.statusCode === undefined) {
						controllerInstance.statusCode = 200;
					}
					// Seta os headers
					if (typeof controllerInstance.responseHeaders === 'object') {
						for (var name in controllerInstance.responseHeaders) {
							var value = controllerInstance.responseHeaders[name];
							that.response.setHeader(name, value);
						}
					}

					that.render(
						savedOutput,
						controllerInstance.statusCode
					);
				} catch (e) {
					handleRequestException(e);
				}
			}

			function controllerMethodCallback(output) {
				savedOutput = output;
				try {
					// If after() is defined, call it
					if (controllerInstance.after !== undefined) {
					that.debug('controllerInstance.after()');
						controllerInstance.after(afterCallback);
					} else {
						afterCallback();
					}
				} catch (e) {
					that.handleRequestException(e);
				}
			}

			function beforeCallback() {
				try {
					// Call the controller method (put, get, delete, post, etc)
					output = controllerInstance[method](controllerMethodCallback);
				} catch (e) {
					that.handleRequestException(e);
				}
			};

			// If before() is defined, call it
			if (controllerInstance.before !== undefined) {
				that.debug('controllerInstance.before()');
				controllerInstance.before(beforeCallback);
			} else {
				beforeCallback();
			}
		} catch (e) {
			that.handleRequestException(e);
		}
	});
};

RequestHandler.prototype.info = function(message) {
	console.log('[RequestHandler] ' + message);
};

RequestHandler.prototype.debug = function(message) {
	console.log('[RequestHandler] ' + message);
};

/**
 * It handles the exceptions
 *
 * @method handleRequestException
 * @param {object} e The error
 * @return {mixed} Returns false if it is an undefined exception or it will render the exception
 */
RequestHandler.prototype.handleRequestException = function(e) {
	this.debug('handleRequestException()');
	// Known exceptions
	if (e.name !== undefined) {
		var output = {};

		var method = 'on' + e.name;
		var instance = new this.ExceptionsController();
		instance.statusCode = 200;

		var that = this;

		function callback() {
			if (instance.statusCode === undefined) {
				instance.statusCode = 200;
			}
			return that.render(output, instance.statusCode);
		}

		if (typeof instance[method] === 'function') {
			output = instance[method](callback);
		} else if (instance.onGeneral !== undefined) {
			output = instance.onGeneral(callback, e);
		} else {
			output = JSON.stringify(e);
			callback();
		}
		this.info('Exception ' + e.name + ' handled');
	}
	// Unknown exceptions: no response
	else {
		this.info('Unknown Exception: ' + e);

		if (e.stack !== undefined) {
			this.info(e.stack);
		}
	}
	return false;
};


/**
 * The callback function that sends the response back to the client
 *
 * @method render
 * @param {json} output The body/payload data
 * @param {number} statusCode The status code for http response
 * @param {string} contentType The text for the Content-Type http header
 */
RequestHandler.prototype.render = function(output, statusCode, contentType) {
	this.debug('render()');
	var extensionsMapToContentType = {
		'.htm' : 'text/html',
		'.html' : 'text/html',
		'.json' : 'application/json',
		'.js' : 'application/json',
		'.xml' : 'text/xml'
	};

	// If the content type has not been specified, use the extension
	if (contentType === undefined) {
		contentType = extensionsMapToContentType[this.extension];
	}
	this.response.writeHead(statusCode, { 'Content-Type' : contentType });

	var stringOutput;

	if (typeof output === 'object') {
		stringOutput = JSON.stringify(output);
	} else {
		stringOutput = output;
	}
	this.response.write(stringOutput);

	this.info('output=' + JSON.stringify(output));
	this.response.end();
	return stringOutput;
};

module.exports = RequestHandler;
