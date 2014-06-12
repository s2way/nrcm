var utils = {

	/**
	* Merge 2 json into 1
	*
	* @method merge
	* @param {json} from The json object from
	* @param {json} to The another json to combine
	* @return {json} Returns a combined json object of both jsons
	*/
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
