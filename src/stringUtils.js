/*jslint devel: true, node: true, indent: 4 */
'use strict';
var stringUtils = {
    /**
    * Set to upper the first letter
    *
    * @method firstLetterUp
    * @param {string} str The string that will be converted
    * @return {string} Returns the formated string
    */
    firstLetterUp : function (str) {
        if (str.length > 0) {
            return str.substring(0, 1).toUpperCase() + str.substring(1);
        }
        return str;
    },
    /**
    * Transform a string this_example into thisExample
    *
    * @method lowerCaseUnderscoredToCamelCase
    * @param {string} lowerCaseUnderscored The string that will be converted
    * @return {string} Returns the formated string
    */
    lowerCaseUnderscoredToCamelCase : function (lowerCaseUnderscored) {
        var parts = lowerCaseUnderscored.split('_');
        var camelCase = '';
        var i, part;
        for (i = 0; i < parts.length; i += 1) {
            part = parts[i];
            if (part.length > 0) {
                camelCase += stringUtils.firstLetterUp(part);
            }
        }
        return camelCase;
    },
    /**
    * Transform a string thisExample into this_example
    *
    * @method camelCaseToLowerCaseUnderscored
    * @param {string} camelCase The string that will be converted
    * @return {string} Returns the formated string
    */
    camelCaseToLowerCaseUnderscored : function (camelCase) {
        var lowerCaseUnderscored = '';
        var length = camelCase.length;
        var upperCaseRegex = /[A-Z]/;
        var ch, i;
        for (i = 0; i < length; i += 1) {
            ch = camelCase.charAt(i);
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
