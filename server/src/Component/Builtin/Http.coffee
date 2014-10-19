XML = require("./XML")
url = require("url")

class Http
    # Http client constructor
    # @param {object} options Client options, including port, hostname and request contentType
    # @constructor
    constructor: (options) ->
        options = options or {}
        @_host = options.host or "localhost"
        @_hostname = options.hostname
        @_port = options.port or 80
        @_contentType = options.contentType or "application/json"
        @_maxRedirects = options.maxRedirects or 100
        @_secureProtocol = options.secureProtocol or ""
        @_agent = options.agent or ""
        @_ssl = options.ssl or false
        @_protocol = (if @_ssl is true then require("https") else require("http"))

    # Set the headers that will be sent in all subsequent requests
    # @param {object} headers
    setHeaders: (headers) -> @_headers = headers

    # Perform a GET request
    # @param {string} resource URL resource (must start with /)
    # @param {object} options
    # @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
    get: (resource, options, callback) ->
        options.method = "get"
        options.resource = resource
        @request options, callback

    # Perform a PUT request
    # @param {string} resource URL resource (must start with /)
    # @param {object} options Object that may contain a payload property (will be sent urlencoded if the contentType is application/x-www-form-urlencoded) and the query property (query string that will be appended to the resource)
    # @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
    put: (resource, options, callback) ->
        options.method = "put"
        options.resource = resource
        @request options, callback

    # Perform a POST request
    # @param {string} resource URL resource (must start with /)
    # @param {object} options
    # @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.
    post: (resource, options, callback) ->
        options.method = "post"
        options.resource = resource
        @request options, callback


    # Perform a DELETE request
    # @param {string} resource URL resource (must start with /)
    # @param {object} options
    # @param {function} callback Function that will be called after completion. Two parameters are passed, error and response.

    delete: (resource, options, callback) ->
        options.method = "delete"
        options.resource = resource
        @request options, callback

    _toUrlEncoded: (object) ->
        newUrl = ""
        for key of object
            if object.hasOwnProperty(key)
                newUrl += "&"  if newUrl isnt ""
                newUrl += encodeURIComponent(key) + "=" + encodeURIComponent(object[key])
        newUrl

    _parseUrlEncoded: (urlToParse) ->
        object = {}
        parts = urlToParse.split("&")
        parts.forEach (part) ->
            nameValue = part.split("=")
            name = decodeURIComponent(nameValue[0])
            value = decodeURIComponent(nameValue[1])
            object[name] = value

        object

    _parsePayload: (options) ->
        payload = false
        if options.payload
            isUrlEncoded = @_contentType.indexOf("application/x-www-form-urlencoded") isnt -1
            isXML = @_contentType.indexOf("text/xml") isnt -1
            if isUrlEncoded
                payload = @_toUrlEncoded(options.payload)
            else if isXML
                payload = new XML().fromJSON(options.payload)
            else
                payload = options.payload
        payload


    # Perform a HTTP redirection overriding the options.host and incrementing the redirect counter
    # @param {string} location Location header (host to direct)
    # @param {object} options Http.request() options original parameter
    # @param {function} callback Http.request() callback original parameter
    # @param {number} redirectCounter Http.request() redirectCounter original parameter
    # @private
    _redirect: (location, options, callback, redirectCounter) ->
        urlParts = url.parse(location)
        options.host = urlParts.host
        delete options.hostname
        delete options.port
        @request options, callback, redirectCounter + 1

    # Perform a HTTP request
    # @param {object} options May include method, headers and resource
    # @param {function} callback
    # @param {number=} redirectCounter
    request: (options, callback, redirectCounter = 0) ->
        payload = @_parsePayload(options)
        resource = options.resource
        headers = options.headers or @_headers or {}
        resource += "?" + @_toUrlEncoded(options.query)  if options.query
        $this = this
        request = @_protocol.request(
            hostname: @_hostname
            host: @_host
            port: @_port
            headers: headers
            method: options.method
            path: resource
            secureProtocol: @_secureProtocol
            agent: @_agent
        , (response) ->
            responseObject = undefined
            responseBody = ""
            response.on "data", (chunk) ->
                responseBody += chunk
                return

            response.on "end", ->
                responseContentType = undefined
                isJSON = undefined
                isUrlEncoded = undefined
                isXML = undefined
                isRedirect = undefined
                locationHeader = undefined
                responseContentType = response.headers["content-type"] or $this._contentType
                isJSON = responseContentType.indexOf("application/json") isnt -1
                isUrlEncoded = responseContentType.indexOf("application/x-www-form-urlencoded") isnt -1
                isXML = responseContentType.indexOf("text/xml") isnt -1
                if isJSON
                    responseObject = (if responseBody is "" then null else JSON.parse(responseBody))
                else if isUrlEncoded
                    responseObject = $this._parseUrlEncoded(responseBody)
                else if isXML
                    responseObject = new XML().toJSON(responseBody)
                else
                    responseObject = responseBody
                isRedirect = response.statusCode >= 300 and response.statusCode < 400
                locationHeader = (if response.headers.location isnt `undefined` then response.headers.location else false)
                if isRedirect and locationHeader
                    if redirectCounter > $this._maxRedirects
                        callback name: "TooManyRedirects"
                    else
                        $this._redirect locationHeader, options, callback, redirectCounter
                else
                    callback null,
                        statusCode: response.statusCode
                        body: responseObject
                        headers: response.headers
        )
        request.setHeader "content-type", $this._contentType
        request.on "error", (error) ->
            callback error

        if payload
            if typeof payload is "object"
                request.write JSON.stringify(payload)
            else
                request.write payload
        request.end()

module.exports = Http