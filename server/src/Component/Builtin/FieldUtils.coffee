'use strict'
_ = require 'underscore'
moment = require 'moment'

class FieldUtils

    isUseful: (value) ->

        if _.isUndefined(value) || _.isNull(value) || _.isNaN(value)
            return false

        if _.isBoolean(value)
            return value

        if _.isObject(value) && _.isEmpty(value)
            return false

        if (_.isString(value) || _.isArray(value)) && (value.length == 0)
            return false

        return true

    dateFormat: (value) ->

        moment.createFromInputFallback = (config) ->
            config._d = new Date config._i

        if moment(value).isValid()
            return moment(value).utc().format()
        else
            return value

    dateFormatSQL: (value) ->

        moment.createFromInputFallback = (config) ->
            config._d = new Date config._i

        if moment(value).isValid()
            return moment(value).format('YYYY-MM-DD HH:mm:ss')
        else
            return value

    isNullTimestamp: (value) ->
        return true if value is '0000-00-00 00:00:00'
        return true if value is null

    plate: (value) ->
        return value.replace /[^a-zA-Z\d]/g, '' if value isnt null
        return null

module.exports = FieldUtils