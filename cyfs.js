const fs = require("fs")
const path = require("path")
const moment = require("moment")
const rimraf = require("rimraf")
const renamer = require("renamer")
const cpx = require("cpx")
const shell = require("shelljs")

const listing = require("./lib/listing")

module.exports = class Cyfs {
  constructor(query) {
    if (!query || !query.pattern) {
      throw new Error()
    }
    this.list = listing(query)
  }

  select() {
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

  fetch(options = {}, isPreview) {
    const BASE_DIR = options.baseDir || ""
    const DEST_DIR = options.destDir || "./_dest/"
    const cpxOpts = { preserve: true }
    const entries = this.list.map(fp => {
      const dn = path.dirname(fp)
      const bn = path.basename(fp)
      let rp = dn.replace(BASE_DIR, "")
      if (path.isAbsolute(rp)) {
        rp = rp.replace(path.parse(rp).root, "")
      }
      const destDir = path.normalize(path.join(DEST_DIR, rp))
      const destFile = path.join(destDir, bn)
      return { src: fp, dest: destFile.split(path.sep).join("/") }
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
