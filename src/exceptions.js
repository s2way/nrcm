module.exports = {

	// Exceptions that must close the application
	Fatal : function(message, cause) {
		this.cause = cause;
		this.name = 'Fatal';
		this.message = message;
		this.stack = new Error().stack;
	},

	// Exceptions that should be handled
	ApplicationNotFound : function(message, cause) {
		this.cause = cause;
		this.name = 'ApplicationNotFound';
		this.message = message;
	},

	ControllerNotFound : function(message, cause) {
		this.cause = cause;
		this.name = 'ControllerNotFound';
		this.message = message;
	},

	InvalidUrl : function(message, cause) {
		this.cause = cause;
		this.name = 'InvalidUrl';
		this.message = message;
	},

	Forbidden : function(message, cause) {
		this.cause = cause;
		this.name = 'Forbidden';
		this.message = message;
	},

	InvalidMethod : function(message, cause) {
		this.cause = cause;
		this.name = 'InvalidMethod';
		this.message = message;
	},

	MethodNotFound : function(message, cause) {
		this.cause = cause;
		this.name = 'MethodNotFound';
		this.message = message;
	},

	IllegalArgument : function(message) {
		this.message = message;
		this.name = 'IllegalArgument';
		this.stack = new Error(message).stack;
	},

	// Model exceptions

	ValidationFailed : function(message) {
		this.message = message;
		this.name = 'ValidationFailed';
	},

	ValidationExpired : function(message) {
		this.message = message;
		this.name = 'ValidationExpired';
	},

	FieldLocked : function(message) {
		this.message = message;
		this.name = 'FieldLocked';
	},

	FieldRequired : function(message) {
		this.message = message;
		this.name = 'FieldRequired';
	},

	InvalidKeyFormat : function(message) {
		this.message = message;
		this.name = 'InvalidKeyFormat';
	},

	OperationInterrupted : function(message) {
		this.message = message;
		this.name = 'OperationInterrupted';
	},
};
