Exceptions = require './../../Util/Exceptions'
os = require 'os'

###*
@constructor
###
class SystemInfo
    constructor: ->
        @data =
            os: {}
            node: {}
        @refresh()

    ###*
    Refresh the whole information about the server, it always refresh everything because of virtualization that could
    change the cpus/route/memory/etc.

    @method refresh
    @return {json}
    ###
    refresh: ->
        @data.os.totalMenInMB = os.totalmem() / 1024 / 1024
        @data.os.freeMenInMB = os.freemem() / 1024 / 1024
        @data.os.uptimeInDays = os.uptime() / 3600 / 24
        @data.os.hostName = os.hostname()
        @data.os.platform = os.platform()
        @data.os.loadAVG = os.loadavg()
        @data.os.release = os.release()
        @data.os.type = os.type()
        @data.os.arch = os.arch()
        @data.os.cpus = os.cpus()
        @data.os.usedMenInMB = @data.os.totalMenInMB - @data.os.freeMenInMB
        @data.node.uptimeInDays = process.uptime() / 3600 / 24
        @data.node.moduleLoadList = process.moduleLoadList
        @data.node.memoryUsageInMB = process.memoryUsage()
        @data.node.features = process.features
        @data.node.libsVer = process.versions
        @data.node.args = process.execArgv
        @data.node.config = process.config
        @data.node.uid = process.getuid()
        @data.node.gid = process.getgid()
        @data.node.env = process.env
        @data.node.pid = process.pid
        @data.node.memoryUsageInMB.heapTotal = @data.node.memoryUsageInMB.heapTotal / 1024 / 1024
        @data.node.memoryUsageInMB.heapUsed = @data.node.memoryUsageInMB.heapUsed / 1024 / 1024
        @data.node.memoryUsageInMB.rss = @data.node.memoryUsageInMB.rss / 1024 / 1024
        @data.node.memoryUsageInMB.heapFree = @data.node.memoryUsageInMB.heapTotal - @data.node.memoryUsageInMB.heapUsed
        @data

module.exports = SystemInfo