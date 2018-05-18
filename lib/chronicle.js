const fs = require("fs")
const path = require("path")
const shell = require("shelljs")
const moment = require("moment")

module.exports = (list, args, isPreview, isForce) => {
  const DEST_DIR = (args && args.destDir) || "./_dest/"
  const DEST_FMT = (args && args.destFormat) || "YYYY/MM/DD"
  const entries = list.map(fp => {
    const bn = path.basename(fp)
    // TODO: prefer exif
    const mtime = moment(fs.statSync(fp).mtime)
    const rp = mtime.format(DEST_FMT)
    const destDir = path.normalize(path.join(DEST_DIR, rp))
    const destFile = path.join(destDir, bn)
    return { src: fp, dest: destFile.split(path.sep).join("/") }
  })
  let hasWarning = false
  entries.forEach(r => {
    if (fs.existsSync(r.dest)) {
      hasWarning = true
      console.log(`[exist] ${r.dest}`)
    }
  })
  if (isPreview) return entries.map(t => t.dest)
  if (hasWarning && !isForce) {
    console.log("Warning occurred. Needs force.")
    return entries.map(t => t.dest)
  }
  entries.forEach(t => {
    const destDir = path.dirname(t.dest)
    shell.mkdir("-p", destDir)
    fs.renameSync(t.src, t.dest)
  })
  return entries.map(t => t.dest)
}
