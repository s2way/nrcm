class StringUtils
    ###*
    Set to upper the first letter

    @method firstLetterUp
    @param {string} str The string that will be converted
    @return {string} Returns the formatted string
    ###
    @firstLetterUp: (str) ->
        return str.substring(0, 1).toUpperCase() + str.substring(1)  if str.length > 0
        str

    ###*
    @method lowerCaseUnderscoredToCamelCase
    @param {string} lowerCaseUnderscored The string that will be converted
    @return {string} Returns the formatted string
    ###
    @lowerCaseUnderscoredToCamelCase: (lowerCaseUnderscored) ->
        parts = lowerCaseUnderscored.replace(/\./g, "._").split("_")
        camelCase = ""
        i = undefined
        part = undefined
        i = 0
        while i < parts.length
            part = parts[i]
            camelCase += @firstLetterUp(part)  if part.length > 0
            i += 1
        camelCase

    ###*
    @method camelCaseToLowerCaseUnderscored
    @param {string} camelCase The string that will be converted
    @return {string} Returns the formatted string
    ###
    @camelCaseToLowerCaseUnderscored: (camelCase) ->
        lowerCaseUnderscored = ""
        length = camelCase.length
        upperCaseRegex = /[A-Z]/
        previousCh = ""
        i = 0
        while i < length
            ch = camelCase.charAt(i)
            lowerCaseUnderscored += "_"  if i > 0 and upperCaseRegex.test(ch) and previousCh isnt "."
            lowerCaseUnderscored += ch.toLowerCase()
            previousCh = ch
            i += 1
        lowerCaseUnderscored

module.exports = StringUtils