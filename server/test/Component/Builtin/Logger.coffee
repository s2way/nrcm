Logger = require("./../../../src/Component/Builtin/Logger")
expect = require("expect.js")
fs = require("fs")

describe "Logger.js", ->

    instance = null

    beforeEach ->
        instance = new Logger()
        instance.constants = logsPath: "."
        instance.init()

    describe "Logger()", ->
        it "should use the default.log file name if none is specified", ->
            expect(instance._fileName).to.be "default.log"

    describe "enable", ->
        it "should enable logging if disable() was called before and info() should call print()", (done) ->
            instance.disable()
            instance.enable()
            instance._print = ->
                done()

            instance.info "!"

    describe "disable", ->
        it "should disable logging and info() should not call print()", ->
            instance.disable()
            instance._print = ->
                expect().fail()

            instance.info "!"

    describe "info", ->
        it "should call the logger info method", (done) ->
            instance._print = ->
                done()

            instance.info "!"
