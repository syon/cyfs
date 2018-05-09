const fs = require("fs")
const path = require("path")
const glob = require("glob")
const moment = require("moment")
const rimraf = require("rimraf")
const renamer = require("renamer")
const cpx = require("cpx")
const shell = require("shelljs")

module.exports = class Cyfs {
  constructor(order) {
    if (!order || !order.select || !order.select.pattern) {
      throw new Error()
    }
    this.order = order
    this.select()
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
    const o = this.order.select
    this.list = glob.sync(o.pattern, o.options)
    if (o.name) {
      if (o.name.regex) {
        if (o.name.regex.pattern) {
          this.list = this.list.filter(f => {
            const filename = path.basename(f)
            const ptn = o.name.regex.pattern
            const flg = o.name.regex.flags || ""
            const regex = new RegExp(ptn, flg)
            return filename.match(regex)
          })
        }
      }
      if (o.name.contain) {
        this.list = this.list.filter(fp => {
          const f = path.basename(fp)
          return o.name.contain.some(c => f.indexOf(c) !== -1)
        })
      }
    }
    if (o.size) {
      if (o.size.min) {
        this.list = this.list.filter(f => {
          const stat = fs.statSync(f)
          return stat.size >= o.size.min
        })
      }
      if (o.size.max) {
        this.list = this.list.filter(f => {
          const stat = fs.statSync(f)
          return stat.size <= o.size.max
        })
      }
    }
    if (o.date) {
      this.filterByStatDate(o.date.access, "atime")
      this.filterByStatDate(o.date.modify, "mtime")
      this.filterByStatDate(o.date.change, "ctime")
      this.filterByStatDate(o.date.birth, "birthtime")
    }
    return this.list
  }

  delete(options, isPreview) {
    if (isPreview) return this.list
    this.list.forEach(fp => {
      rimraf.sync(fp)
    })
    return this.list
  }

  static injectTimestamp(targetSet, timestamp) {
    const newTargetSet = targetSet
    const { format: tsFmt, only } = timestamp
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
    const opts = this.order.replace.file
    if (!opts) {
      throw new Error("Invalid replace order.")
    }
    const renamerOpts = {
      regex: !!opts.regex,
      insensitive: !!opts.insensitive,
      find: opts.find || "^$",
      replace: opts.replace,
      files: this.list,
    }
    return renamer.replace(renamerOpts)
  }

  rename(options, isPreview) {
    let targetSet = this.renamePrepare()
    const { timestamp } = this.order.replace.file
    if (timestamp) {
      targetSet = Cyfs.injectTimestamp(targetSet, timestamp)
    }
    let result = {}
    if (isPreview) {
      result = renamer.dryRun(targetSet)
    } else {
      result = renamer.rename(targetSet)
    }
    // TODO: Alert if contains error or warning
    return result
  }

  fetch(options, isPreview) {
    const opts = options || this.order.copy
    const BASE_DIR = opts.baseDir || ""
    const DEST_DIR = opts.destDir || "./_dest/"
    const cpxOpts = { preserve: true }
    const entries = this.list.map(fp => {
      const dn = path.dirname(fp)
      const bn = path.basename(fp)
      let rp = dn.replace(BASE_DIR, "")
      if (path.isAbsolute(rp)) {
        rp = rp.replace(path.parse(rp).root, "")
      }
      const destDir = path.normalize(path.join(DEST_DIR, rp))
      return { src: fp, dest: path.join(destDir, bn) }
    })
    if (isPreview) return entries
    entries.forEach(e => {
      const destDir = path.dirname(e.dest)
      cpx.copySync(e.src, destDir, cpxOpts)
    })
    return entries
  }

  copy(options, isPreview) {
    const { find, replace } = options
    const re = new RegExp(find)
    const entries = this.list.map(fp => {
      const dest = fp.replace(re, replace)
      return { src: fp, dest }
    })
    if (isPreview) return entries
    entries.forEach(e => {
      const destDir = path.dirname(e.dest)
      shell.mkdir("-p", destDir)
      fs.copyFileSync(e.src, e.dest)
    })
    return entries
  }

  move(options, isPreview) {
    const { find, replace } = options
    if (!find || !replace) {
      const msg = "Invalid args: 'find' and 'replace' are required."
      throw new Error(msg)
    }
    const re = new RegExp(find)
    const entries = this.list.map(fp => {
      const dest = fp.replace(re, replace)
      return { src: fp, dest }
    })
    if (isPreview) return entries
    entries.forEach(e => {
      const destDir = path.dirname(e.dest)
      shell.mkdir("-p", destDir)
      fs.renameSync(e.src, e.dest)
    })
    return entries
  }
}
