/**
 * The validator object
 *
 * @constructor
 * @method Validator
 * @param {object} validate The object that contains the rules
 * @param {number} timeout The timeout for the validation exception
 */
function Validator(validate, timeout) {
	this.timeout = timeout || 10000;
	this.validate = validate;
}

Validator.prototype._succeeded = function(validatedFields) {
	for (var key in validatedFields) {
		if (typeof validatedFields[key] !== 'object') {
			if (validatedFields[key] === false) {
				return false;
			}
		} else if (!this._succeeded(validatedFields[key])) {
			return false;
		}
	}
	return true;
}

Validator.prototype._hasValidatedAllFields = function(validatedFields, validate) {
	for (var key in validate) {
		if (typeof validate[key] !== 'object' || validate[key] instanceof Array) {
			if (validatedFields[key] === undefined) {
				return false;
			}
		} else {
			if (validatedFields[key] === undefined) {
				validatedFields[key] = {};
			}
			if (!this._hasValidatedAllFields(validatedFields[key], validate[key])) {
				return false;
			}
		}
	}
	return true;
}

Validator.prototype._isValid = function(data, validatedFields, validate, originalData) {
	for (var n in data) {
		if (typeof data[n] !== 'object' || Array.isArray(data[n])) {
			if (typeof validate[n] === 'function') {
				validate[n](data[n], originalData, function(valid){
					validatedFields[n] = valid;
				});
			}
		} else {
			if (validatedFields[n] === undefined) {
				validatedFields[n] = {};
			}
			if (validate[n] !== undefined) {
				this._isValid(data[n], validatedFields[n], validate[n], originalData);
			}
		}
	}
}

/**
 * Validate all properties of a json
 *
 * @method isValid
 * @param {json} data The json object to be validated
 * @param {function} callback
 */
Validator.prototype.isValid = function(data, callback) {
	var validate = this.validate;
	var validatedFields = {};
	var that = this;
	this._isValid(data, validatedFields, validate, data);

	var expired = false;

	var timer = setTimeout(function(){
		expired = true;
	}, this.timeout);

	var timeoutFunc = function(){
		if (expired) {
			callback(true, false, validatedFields);
		} else if (that._hasValidatedAllFields(validatedFields, validate)) {
			clearTimeout(timer);
			callback(false, that._succeeded(validatedFields), validatedFields);
		} else {
			setTimeout(timeoutFunc, that.timeout/500);
		}
	};
	timeoutFunc();
}


module.exports = Validator;
