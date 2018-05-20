const fs = require("fs")
const path = require("path")
const rimraf = require("rimraf")
const cpx = require("cpx")
const shell = require("shelljs")
const debug = require("debug")

const listing = require("./listing")
const rename = require("./rename")
const chronicle = require("./chronicle")

const dgw = debug("cyfs:warn")
debug.enable("cyfs:*")

module.exports = class Cyfs {
  async init(query) {
    if (!query || !query.pattern) {
      throw new Error()
    }
    this.list = await listing(query)
  }

  select() {
    return this.list
  }

  report() {
    // TODO: white CSV/TSV file
    return this.list
  }

  delete(args, isPreview) {
    if (isPreview) return this.list
    const direcs = this.list.filter(fp => fs.statSync(fp).isDirectory())
    const others = this.list.filter(fp => !fs.statSync(fp).isDirectory())
    others.forEach(fp => rimraf.sync(fp))
    direcs.reverse().forEach(dp => {
      if (fs.readdirSync(dp).length === 0) {
        fs.rmdirSync(dp)
      } else {
        dgw("[Not Empty]", dp, fs.readdirSync(dp))
      }
    })
    return this.list
  }

  async rename(args, isPreview) {
    return rename(this.list, args, isPreview)
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

  async chronicle(args, isPreview, isForce) {
    return chronicle(this.list, args, isPreview, isForce)
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
