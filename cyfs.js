const fs = require("fs")
const path = require("path")
const glob = require("glob")
const moment = require("moment")
const rimraf = require("rimraf")
const renamer = require("renamer")

module.exports = class Cyfs {
  constructor(order) {
    this.order = order
    this.list = []
  }

  static getStat(filepath, statProp) {
    const stat = fs.statSync(filepath)
    switch (statProp) {
      case "atime":
        return stat.atime
      case "mtime":
        return stat.mtime
      case "ctime":
        return stat.ctime
      case "birthtime":
        return stat.birthtime
      default:
        return ""
    }
  }

  filterByStatDate(dateAfterBefore, statProp) {
    if (!dateAfterBefore) return
    if (dateAfterBefore.after) {
      const { after } = dateAfterBefore
      this.list = this.list.filter(f => {
        const time = Cyfs.getStat(f, statProp)
        return moment(time).isSameOrAfter(after, "day")
      })
    }
    if (dateAfterBefore.before) {
      const { before } = dateAfterBefore
      this.list = this.list.filter(f => {
        const time = Cyfs.getStat(f, statProp)
        return moment(time).isSameOrBefore(before, "day")
      })
    }
  }

  select() {
    const { order } = this
    if (!order) return []
    if (!order.glob) return []
    this.list = glob.sync(order.glob.pattern, order.glob.options)
    if (order.name) {
      if (order.name.regex) {
        if (order.name.regex.pattern) {
          this.list = this.list.filter(f => {
            const filename = path.basename(f)
            const ptn = order.name.regex.pattern
            const flg = order.name.regex.flags || ""
            const regex = new RegExp(ptn, flg)
            return filename.match(regex)
          })
        }
      }
      if (order.name.contain) {
        this.list = this.list.filter(fp => {
          const f = path.basename(fp)
          return order.name.contain.some(c => f.indexOf(c) !== -1)
        })
      }
    }
    if (order.size) {
      if (order.size.min) {
        this.list = this.list.filter(f => {
          const stat = fs.statSync(f)
          return stat.size >= order.size.min
        })
      }
      if (order.size.max) {
        this.list = this.list.filter(f => {
          const stat = fs.statSync(f)
          return stat.size <= order.size.max
        })
      }
    }
    if (order.date) {
      this.filterByStatDate(order.date.access, "atime")
      this.filterByStatDate(order.date.modify, "mtime")
      this.filterByStatDate(order.date.change, "ctime")
      this.filterByStatDate(order.date.birth, "birthtime")
    }
    return this.list
  }

  delete() {
    const targetList = this.select()
    this.list.forEach(fp => {
      rimraf.sync(fp)
    })
    return targetList
  }

  injectTimestamp(targetSet) {
    if (!this.order.rename.timestamp) return targetSet
    const newTargetSet = targetSet
    const { format, keepfilename } = this.order.rename.timestamp
    newTargetSet.list = targetSet.list.map(entry => {
      const { before, after } = entry
      const dn = path.dirname(after)
      const ex = path.extname(after)
      const bn = path.basename(after, ex)
      const stat = fs.statSync(before)
      let basename = ""
      if (format) {
        const ts = moment(stat.mtime).format(format)
        basename = keepfilename ? `${ts}${bn}${ex}` : `${ts}${ex}`
      }
      return {
        before: entry.before,
        after: `${dn}/${basename}`,
      }
    })
    return newTargetSet
  }

  renamePrepare() {
    const targetList = this.select()
    const renamerOpts = this.order.rename.options
    renamerOpts.files = targetList
    let targetSet = renamer.replace(renamerOpts)
    targetSet = this.injectTimestamp(targetSet)
    return targetSet
  }

  dryRun() {
    const targetSet = this.renamePrepare()
    const result = renamer.dryRun(targetSet)
    return result
  }

  rename() {
    const targetSet = this.renamePrepare()
    const result = renamer.rename(targetSet)
    return result
  }
}
