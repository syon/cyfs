const fs = require("fs")
const path = require("path")
const moment = require("moment")
const rimraf = require("rimraf")
const renamer = require("renamer")
const cpx = require("cpx")
const shell = require("shelljs")

const listing = require("./listing")

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

  delete(args, isPreview) {
    if (isPreview) return this.list
    this.list.forEach(fp => {
      // TODO: Check the directory is blank
      rimraf.sync(fp)
    })
    return this.list
  }

  static injectTimestamp(targetSet, timestamp) {
    const newTargetSet = targetSet
    const { format: tsFmt, only } = timestamp
    newTargetSet.list = targetSet.list.map(entry => {
      const { before } = entry
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

  renamePrepare(args) {
    const a = args
    if (!a) {
      throw new Error("Invalid args: 'find' and 'replace' are required.")
    }
    const renamerOpts = {
      regex: !!a.regex,
      insensitive: !!a.insensitive,
      find: a.find || "^$",
      replace: a.replace,
      files: this.list,
    }
    return renamer.replace(renamerOpts)
  }

  rename(args, isPreview) {
    let targetSet = this.renamePrepare(args)
    const { timestamp } = args
    if (timestamp) {
      if (args.find || args.replace) {
        throw new Error("Cannot set 'find' and 'replace' when using timestamp.")
      }
      targetSet = Cyfs.injectTimestamp(targetSet, timestamp)
    }
    let result = {}
    if (isPreview) {
      result = renamer.dryRun(targetSet)
    } else {
      result = renamer.rename(targetSet)
    }
    // TODO: Alert if contains error or warning
    return result.list.filter(r => r.renamed).map(r => r.after)
  }

  fetch(args = {}, isPreview) {
    const BASE_DIR = (args && args.baseDir) || ""
    const DEST_DIR = (args && args.destDir) || "./_dest/"
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
    const results = entries.map(e => e.dest)
    if (isPreview) return results
    entries.forEach(e => {
      const destDir = path.dirname(e.dest)
      cpx.copySync(e.src, destDir, { preserve: true })
    })
    return results
  }

  chronicle(args, isPreview) {
    const DEST_DIR = (args && args.destDir) || "./_dest/"
    const DEST_FMT = (args && args.destFormat) || "YYYY/MM/DD"
    const entries = this.list.map(fp => {
      const bn = path.basename(fp)
      // TODO: prefer exif
      const mtime = moment(fs.statSync(fp).mtime)
      const rp = mtime.format(DEST_FMT)
      const destDir = path.normalize(path.join(DEST_DIR, rp))
      const destFile = path.join(destDir, bn)
      return { src: fp, dest: destFile.split(path.sep).join("/") }
    })
    const predicts = entries.map(r => {
      const tobe = fs.existsSync(r.dest) ? "skipped" : "moved"
      return { src: r.src, dest: r.dest, tobe }
    })
    if (isPreview) return predicts
    const tasks = predicts.filter(r => r.tobe === "moved")
    tasks.forEach(e => {
      const destDir = path.dirname(e.dest)
      shell.mkdir("-p", destDir)
      fs.renameSync(e.src, e.dest)
    })
    // TODO: same for others
    return predicts
  }

  copy(args, isPreview) {
    const { find, replace, flags } = args
    const re = new RegExp(find, flags)
    const entries = this.list.map(fp => {
      const dest = fp.replace(re, replace)
      return { src: fp, dest }
    })
    const results = entries.map(e => e.dest)
    if (isPreview) return results
    entries.forEach(e => {
      const destDir = path.dirname(e.dest)
      shell.mkdir("-p", destDir)
      fs.copyFileSync(e.src, e.dest)
    })
    return results
  }

  move(args, isPreview) {
    const { find, replace } = args
    if (!find || !replace) {
      const msg = "Invalid order: 'find' and 'replace' are required."
      throw new Error(msg)
    }
    const re = new RegExp(find)
    const entries = this.list.map(fp => {
      const dest = fp.replace(re, replace)
      return { src: fp, dest }
    })
    const results = entries.map(e => e.dest)
    if (isPreview) return results
    entries.forEach(e => {
      const destDir = path.dirname(e.dest)
      shell.mkdir("-p", destDir)
      fs.renameSync(e.src, e.dest)
    })
    return results
  }
}
