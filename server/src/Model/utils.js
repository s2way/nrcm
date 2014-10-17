/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
var utils = {
    /**
    * Merge 2 json into 1
    *
    * @method merge
    * @param {json} from The json object from
    * @param {json} to The another json to combine
    * @return {json} Returns a combined json object of both jsons
    */
    merge : function (from, to) {
        var result = JSON.parse(JSON.stringify(to));
        var i;
        for (i in from) {
            if (from.hasOwnProperty(i)) {
                if (typeof from[i] === 'object') {
                    if (result[i] === undefined) {
                        result[i] = {};
                    }
                    result[i] = utils.merge(from[i], result[i]);
                } else {
                    result[i] = from[i];
                }
            }
        }
        return result;
    }
};

module.exports = utils;
