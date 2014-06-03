function ExceptionsController() {
}

ExceptionsController.prototype.onApplicationNotFound = function() {
	this.statusCode = 404;
	return {
		'code' : 404,
		'error' : 'ApplicationNotFound'
	};
};

ExceptionsController.prototype.onControllerNotFound = function() {
	this.statusCode = 404;
	return {
		'code' : 404,
		'error' : 'ControllerNotFound'
	};
};

ExceptionsController.prototype.onMethodNotFound = function() {
	this.statusCode = 404;
	return {
		'code' : 404,
		'error' : 'MethodNotFound'
	};
};

ExceptionsController.prototype.onForbidden = function() {
	this.statusCode = 403;
	return {
		'code' : 403,
		'error' : 'Forbidden'
	};
};

ExceptionsController.prototype.onGeneral = function(exception) {
	this.statusCode = 500;
	if (exception.stack !== undefined) {
		console.log(exception.stack);
	}
	return {
		'name' : 'General',
		'cause' : exception,
	};
};

module.exports = ExceptionsController;
