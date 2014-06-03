var stringUtils = {

	firstLetterUp : function(str) {
		if (str.length > 0) {
			return str.substring(0, 1).toUpperCase() + str.substring(1);
		}
		return str;
	},

	lowerCaseUnderscoredToCamelCase : function (lowerCaseUnderscored) {
		var parts = lowerCaseUnderscored.split('_');
		var camelCase = '';
		for (var i in parts) {
			var part = parts[i];
			if (part.length > 0) {
				camelCase += stringUtils.firstLetterUp(part);
			}
		}
		return camelCase;
	},

	camelCaseToLowerCaseUnderscored : function (camelCase) {
		var lowerCaseUnderscored = '';
		var length = camelCase.length;
		var upperCaseRegex = /[A-Z]/;
		for (var i = 0; i < length; i += 1) {
			var ch = camelCase.charAt(i);
			// is upper case
			if (i > 0 && upperCaseRegex.test(ch)) {
				lowerCaseUnderscored += '_';
			} 
			lowerCaseUnderscored += ch.toLowerCase();
		}
		return lowerCaseUnderscored;
	}

};

module.exports = stringUtils;