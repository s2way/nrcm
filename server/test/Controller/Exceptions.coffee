assert = require 'assert'
Exceptions = require './../../src/Controller/Exceptions'
instance = new Exceptions()

describe "Exceptions.js", ->
    describe "onControllerNotFound", ->
        it "should return a JSON object", ->
            instance.onControllerNotFound ->
                return
            return
        return

    describe "onApplicationNotFound", ->
        it "should return a JSON object", ->
            instance.onApplicationNotFound ->
                return
            return
        return

    describe "onMethodNotFound", ->
        it "should return a JSON object", ->
            instance.onMethodNotFound ->
                return
            return
        return

    describe "onForbidden", ->
        it "should return a JSON object", ->
            instance.onForbidden ->
                return
            return
        return

    describe "onGeneral", ->
        it "should return a JSON object", ->
            instance.onGeneral (->
                return
            ), {}
            return
        return

    describe "onTimeout", ->
        it "should return a JSON object", ->
            instance.onTimeout (->
                return
            ), {}
            return
        return
    return