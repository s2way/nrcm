/*jslint devel: true, node: true, indent: 4, vars: true, maxlen: 256 */
'use strict';
var StringUtils = {
    /**
    * Set to upper the first letter
    *
    * @method firstLetterUp
    * @param {string} str The string that will be converted
    * @return {string} Returns the formatted string
    */
    firstLetterUp : function (str) {
        if (str.length > 0) {
            return str.substring(0, 1).toUpperCase() + str.substring(1);
        }
        return str;
    },
    /**
    *
    * @method lowerCaseUnderscoredToCamelCase
    * @param {string} lowerCaseUnderscored The string that will be converted
    * @return {string} Returns the formatted string
    */
    lowerCaseUnderscoredToCamelCase : function (lowerCaseUnderscored) {
        var parts = lowerCaseUnderscored.replace(/\./g, '._').split('_');
        var camelCase = '';
        var i, part;
        for (i = 0; i < parts.length; i += 1) {
            part = parts[i];
            if (part.length > 0) {
                camelCase += StringUtils.firstLetterUp(part);
            }
        }
        return camelCase;
    },
    /**
    *
    * @method camelCaseToLowerCaseUnderscored
    * @param {string} camelCase The string that will be converted
    * @return {string} Returns the formatted string
    */
    camelCaseToLowerCaseUnderscored : function (camelCase) {
        var lowerCaseUnderscored = '';
        var length = camelCase.length;
        var upperCaseRegex = /[A-Z]/;
        var ch, i, previousCh = '';
        for (i = 0; i < length; i += 1) {
            ch = camelCase.charAt(i);
            if (i > 0 && upperCaseRegex.test(ch) && previousCh !== '.') {
                lowerCaseUnderscored += '_';
            }
            lowerCaseUnderscored += ch.toLowerCase();
            previousCh = ch;
        }
        return lowerCaseUnderscored;
    }
};

module.exports = StringUtils;
