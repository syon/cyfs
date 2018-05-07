const fs = require("fs")
const path = require("path")
const glob = require("glob")
const moment = require("moment")
const rimraf = require("rimraf")
const renamer = require("renamer")
const cpx = require("cpx")

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
    const { format: tsFmt, only } = this.order.rename.timestamp
    newTargetSet.list = targetSet.list.map(entry => {
      const { before, after } = entry
      if (!after) return entry
      const dn = path.dirname(before)
      const ex = path.extname(before)
      const bn = path.basename(before, ex)
      const stat = fs.statSync(before)
      const tsPrefix = tsFmt ? moment(stat.mtime).format(tsFmt) : ""
      const basename = only ? `${tsPrefix}${ex}` : `${tsPrefix}${bn}${ex}`
      return {
        before: entry.before,
        after: path.join(dn, basename),
      }
    })
    return newTargetSet
  }

  renamePrepare() {
    const opts = this.order.rename
    if (!opts) {
      throw new Error("Invalid rename order.")
    }
    const targetList = this.select()
    const renamerOpts = {
      regex: !!opts.regex,
      insensitive: !!opts.insensitive,
      find: opts.find || "^$",
      replace: opts.replace,
      files: targetList,
    }
    let targetSet = renamer.replace(renamerOpts)
    targetSet = this.injectTimestamp(targetSet)
    return targetSet
  }

  dryRun() {
    const targetSet = this.renamePrepare()
    const result = renamer.dryRun(targetSet)
    // TODO: Alert if contains error or warning
    return result
  }

  rename() {
    const targetSet = this.renamePrepare()
    const result = renamer.rename(targetSet)
    return result
  }

  copy() {
    const opts = this.order.copy
    const BASE_DIR = opts.baseDir || ""
    const DEST_DIR = opts.destDir || "./_dest/"
    const cpxOpts = { preserve: true }
    this.select()
    this.list.forEach(fp => {
      const dn = path.dirname(fp)
      let rp = dn.replace(BASE_DIR, "")
      if (path.isAbsolute(rp)) {
        rp = rp.replace(path.parse(rp).root, "")
      }
      const destDir = path.normalize(path.join(DEST_DIR, rp))
      cpx.copySync(fp, destDir, cpxOpts)
      console.log(fp, destDir)
    })
    return this.list
  }
}
