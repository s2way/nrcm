Exceptions = require("./../../Util/Exceptions.coffee")

# @param {object} acl The ACL JSON Object that contains the privileges for groups and controllers
# @constructor
class ACL
    constructor: (acl) ->
        @acl = acl

    # Check if the user`s group has the right to proceed with the controller requested on url
    # @method isAllowed
    # @param {string} group The active user session group
    # @param {string} controller The controller`s name of the requested url
    # @param {string} method The method of the request url, is supported: post, put, delete, get, path, options and head.
    # @return {string|boolean} Returns false if it is not allowed or a string with the rule that allows to proceed
    isAllowed: (group, controller, method) ->
        i = 0
        l = 0
        methodIndex = 0
        validMethods = [
            "post"
            "put"
            "delete"
            "get"
            "patch"
            "options"
            "head"
        ]
        if controller isnt "" and method isnt ""
            methodIndex = validMethods.indexOf(method)
            throw new Exceptions.InvalidMethod()  if methodIndex is -1
            i = 0
            l = @acl.url.length

            while i < l
                # Action match
                if @acl.url[i].controller is controller
                    # Group match
                    # Method match
                    return "ga"  if @acl.url[i].rule[methodIndex] is 1  if @acl.url[i].group is group
                    # Any groups
                    return "*A"  if @acl.url[i].rule[methodIndex] is 1  if @acl.url[i].group is "*"

                # Group match
                # Any controllers
                return "G*"  if @acl.url[i].rule[methodIndex] is 1  if @acl.url[i].controller is "*"  if @acl.url[i].group is group
                # Any groups, any controllers
                return "**"  if @acl.url[i].rule[methodIndex] is 1  if @acl.url[i].group is "*" and @acl.url[i].controller is "*"
                i += 1
        false

module.exports = ACL