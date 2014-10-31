Exceptions = require './../../Util/Exceptions'
os = require 'os'

###*
@constructor
###
class SystemInfo
    constructor: () ->
        @data =
            s: {}
            v: {}
        @variable()


    ###*
    Refresh the whole information about the server, it always refresh everything because of virtualization that could
    change the cpus/route/memory/etc.

    @method refresh
    @return {json}
    ###
    getAll: ->
        @variable()
        @static()

    variable: ->
        nodeMemUsgMb = process.memoryUsage()
        @data.osMemTotMb = parseFloat((os.totalmem() / 1024 / 1024).toFixed 2)
        @data.osMemFreeMb = parseFloat((os.freemem() / 1024 / 1024).toFixed 2)
        @data.osMemUsedMb = parseFloat((@data.osMemTotMb - @data.osMemFreeMb).toFixed 2)
        @data.osMemFreePerc = parseFloat((@data.osMemFreeMb / @data.osMemTotMb * 100).toFixed 2)
        @data.osDaysUP = parseFloat((os.uptime() / 3600 / 24).toFixed 2)
        @data.osLoadAVG = os.loadavg()
        @data.osCpus = os.cpus()
        @data.nodeDaysUp = parseFloat((process.uptime() / 3600 / 24).toFixed 2)
        @data.nodeHeapTotMb = parseFloat((nodeMemUsgMb.heapTotal / 1024 / 1024).toFixed 2)
        @data.nodeHeapUsedMb = parseFloat((nodeMemUsgMb.heapUsed / 1024 / 1024).toFixed 2)
        @data.nodeMemRssMb = parseFloat((nodeMemUsgMb.rss / 1024 / 1024).toFixed 2)
        @data.nodeHeapFreeMb = parseFloat((@data.nodeHeapTotMb - @data.nodeHeapUsedMb).toFixed 2)
        @data.nodeHeapFreePerc = parseFloat((@data.nodeHeapFreeMb / @data.nodeHeapTotMb * 100).toFixed 2)
        @data

    static: ->
        @data.osHostName = os.hostname()
        @data.osPlatform = os.platform()
        @data.osRelease = os.release()
        @data.osType = os.type()
        @data.osArch = os.arch()
        @data.nodeFeatures = process.features
        @data.nodeLibsVer = process.versions
        @data.nodeArgs = process.execArgv
        @data.nodeConfig = process.config
        @data.nodeUid = process.getuid()
        @data.nodeGid = process.getgid()
        @data.nodeEnv = process.env
        @data.nodePid = process.pid
        @data.nodeModuleLoadList = process.moduleLoadList
        @data


module.exports = SystemInfo
