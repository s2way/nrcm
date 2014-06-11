var utils = {
	
	merge : function(from, to) {
		var result = JSON.parse(JSON.stringify(to));
		for (var i in from) {
			if (typeof from[i] === 'object') {
				if (result[i] === undefined) {
					result[i] = {};
				}
				result[i] = utils.merge(from[i], result[i]);
			} else {
				result[i] = from[i];
			}
		}
		return result;
	}
};

module.exports = utils;