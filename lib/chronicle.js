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
  const predicts = entries.map(r => {
    let tobe
    if (fs.existsSync(r.dest)) {
      hasWarning = true
      tobe = "skipped"
    } else {
      tobe = "moved"
    }
    return { src: r.src, dest: r.dest, tobe }
  })
  // TODO: 処理の途中で衝突する可能性がある。事前にチェックする。
  //       事前チェックでwarningがあるときは何もしない。--forceを要求。
  const tasks = predicts.filter(r => r.tobe === "moved")
  if (isPreview) return tasks.map(t => t.dest)
  if (hasWarning && !isForce) {
    console.log("Warning exists. Needs force.")
    return tasks.map(t => t.dest)
  }
  tasks.forEach(t => {
    const destDir = path.dirname(t.dest)
    shell.mkdir("-p", destDir)
    fs.renameSync(t.src, t.dest)
  })
  return tasks.map(t => t.dest)
}
