TextChocolate = require 'textchocolate'

class Message

    constructor: (lang) ->
        @tc = new TextChocolate @configs?.strings, lang if @configs?.strings

    get: (message, type, lang) ->
        @tc.lang lang if lang?
        return @tc.translate message, type if @tc
        message

module.exports = Message
