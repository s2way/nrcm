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
        @data.v.osTotalMenInMB = os.totalmem() / 1024 / 1024
        @data.v.osFreeMenInMB = os.freemem() / 1024 / 1024
        @data.v.osUptimeInDays = os.uptime() / 3600 / 24
        @data.v.osLoadAVG = os.loadavg()
        @data.v.osUsedMenInMB = @data.v.osTotalMenInMB - @data.v.osFreeMenInMB
        @data.v.osCpus = os.cpus()
        @data.v.nodeUptimeInDays = process.uptime() / 3600 / 24
        @data.v.nodeMemoryUsageInMB = process.memoryUsage()
        @data.v.nodeMemoryUsageInMB.heapTotal = @data.v.nodeMemoryUsageInMB.heapTotal / 1024 / 1024
        @data.v.nodeMemoryUsageInMB.heapUsed = @data.v.nodeMemoryUsageInMB.heapUsed / 1024 / 1024
        @data.v.nodeMemoryUsageInMB.rss = @data.v.nodeMemoryUsageInMB.rss / 1024 / 1024
        @data.v.nodeMemoryUsageInMB.heapFree = @data.v.nodeMemoryUsageInMB.heapTotal - @data.v.nodeMemoryUsageInMB.heapUsed
        @data

    static: ->
        @data.s.osHostName = os.hostname()
        @data.s.osPlatform = os.platform()
        @data.s.osRelease = os.release()
        @data.s.osType = os.type()
        @data.s.osArch = os.arch()
        @data.s.nodeFeatures = process.features
        @data.s.nodeLibsVer = process.versions
        @data.s.nodeArgs = process.execArgv
        @data.s.nodeConfig = process.config
        @data.s.nodeUid = process.getuid()
        @data.s.nodeGid = process.getgid()
        @data.s.nodeEnv = process.env
        @data.s.nodePid = process.pid
        @data.s.nodeModuleLoadList = process.moduleLoadList
        @data


module.exports = SystemInfo
