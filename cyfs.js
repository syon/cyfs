const fs = require("fs")
const path = require("path")
const glob = require("glob")
const moment = require("moment")
const rimraf = require("rimraf")
const renamer = require("renamer")
const cpx = require("cpx")
const shell = require("shelljs")

module.exports = class Cyfs {
  constructor(query) {
    if (!query || !query.pattern) {
      throw new Error()
    }
    this.select(query)
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

  select(query) {
    const q = query
    this.list = glob.sync(q.pattern, q.options)
    if (q.name) {
      if (q.name.regex) {
        if (q.name.regex.pattern) {
          this.list = this.list.filter(f => {
            const filename = path.basename(f)
            const ptn = q.name.regex.pattern
            const flg = q.name.regex.flags || ""
            const regex = new RegExp(ptn, flg)
            return filename.match(regex)
          })
        }
      }
      if (q.name.contain) {
        this.list = this.list.filter(fp => {
          const f = path.basename(fp)
          return q.name.contain.some(c => f.indexOf(c) !== -1)
        })
      }
    }
    if (q.size) {
      if (q.size.min) {
        this.list = this.list.filter(f => {
          const stat = fs.statSync(f)
          return stat.size >= q.size.min
        })
      }
      if (q.size.max) {
        this.list = this.list.filter(f => {
          const stat = fs.statSync(f)
          return stat.size <= q.size.max
        })
      }
    }
    if (q.date) {
      this.filterByStatDate(q.date.access, "atime")
      this.filterByStatDate(q.date.modify, "mtime")
      this.filterByStatDate(q.date.change, "ctime")
      this.filterByStatDate(q.date.birth, "birthtime")
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

  renamePrepare(options) {
    const o = options
    if (!o) {
      throw new Error("Invalid replace order.")
    }
    const renamerOpts = {
      regex: !!o.regex,
      insensitive: !!o.insensitive,
      find: o.find || "^$",
      replace: o.replace,
      files: this.list,
    }
    return renamer.replace(renamerOpts)
  }

  rename(options, isPreview) {
    let targetSet = this.renamePrepare(options)
    const { timestamp } = options
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
    const { find, replace, flags } = options
    const re = new RegExp(find, flags)
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
