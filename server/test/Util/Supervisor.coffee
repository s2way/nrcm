Supervisor = require './../../src/Util/Supervisor'
path = require 'path'
expect = require 'expect.js'

describe 'Supervisor.js', ->

    configMissingNodeName =
        dataSource: {}
        intervalInSeconds: 50
    configMissingDataSourceName =
        nodeName: "geo"
        intervalInSeconds: 40
    configMissingIntervalInSeconds =
        nodeName: "geo"
        dataSource: {}
    configOk =
        nodeName: "geo"
        dataSource: {}
        intervalInSeconds: 0.0001
    monitoring =
        requests: 0
        responseAvg: 0
        timeouts: 0

    describe 'run', ->
        it 'should not start the timmer if is missing the config', (done) ->
            supervisor = new Supervisor(undefined, undefined, monitoring)
            supervisor.run()
            expect(supervisor._isRunning).to.be(false)
            done()

        it 'should not start the timmer if is missing the nodeName in config', (done) ->
            supervisor = new Supervisor(null, configMissingNodeName, monitoring)
            supervisor.run()
            expect(supervisor._isRunning).to.be(false)
            done()

        it 'should not start the timmer if is missing the dataSourceName in config', (done) ->
            supervisor = new Supervisor(null, configMissingDataSourceName, monitoring)
            supervisor.run()
            expect(supervisor._isRunning).to.be(false)
            done()

        it 'should start the timmer even if is missing the intervalInSeconds in config with default interval (5s)', (done) ->
            supervisor = new Supervisor(null, configMissingIntervalInSeconds, monitoring)
            supervisor.es = {}
            supervisor.run()
            expect(supervisor._isRunning).to.not.be(false)
            done()

        it 'should start the timmer if everything is fine', (done) ->
            supervisor = new Supervisor(null, configOk, monitoring)
            supervisor.es = {}
            supervisor.run(->
                expect(supervisor._isRunning).to.not.be(false)
                supervisor.stop()
                done()
            )

        it 'should stop the timmer if everything is fine', (done) ->
            supervisor = new Supervisor(null, configOk, monitoring)
            supervisor.es = {}
            supervisor.run()
            supervisor.stop()
            expect(supervisor._isRunning).to.be(false)
            supervisor._runner 'geo', supervisor
            done()
