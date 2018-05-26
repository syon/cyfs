const fs = require("fs")
const path = require("path")
const shell = require("shelljs")
const debug = require("debug")
const { map, filter } = require("p-iteration")

const util = require("./util")

const dg = debug("cyfs:warn")

module.exports = async (list, args, isPreview, isForce) => {
  const DEST_DIR = (args && args.destDir) || "./_dest/"
  const DEST_FMT = (args && args.destFormat) || "YYYY/MM/DD"
  const MODE = (args && args.mode) || "modify"
  let operatables = list
  if (MODE === "exif") {
    operatables = await filter(operatables, async fp => util.hasExifDate(fp))
  }
  const entries = await map(operatables, async fp => {
    const bn = path.basename(fp)
    const mo = await util.getFileMoment(fp, MODE)
    const rp = mo.format(DEST_FMT)
    const destDir = path.normalize(path.join(DEST_DIR, rp))
    const destFile = path.join(destDir, bn)
    return { src: fp, dest: destFile.split(path.sep).join("/") }
  })
  let hasWarning = false
  entries.forEach(r => {
    if (fs.existsSync(r.dest)) {
      hasWarning = true
      debug.enable("cyfs:warn")
      dg(`[exist] ${r.dest}`)
    }
    const sameDest = entries.filter(_ => _.dest === r.dest)
    if (sameDest.length > 1) {
      hasWarning = true
      debug.enable("cyfs:warn")
      dg("[exist]", sameDest)
    }
  })
  if (isPreview) return entries.map(t => t.dest)
  if (hasWarning && !isForce) {
    dg("Warning occurred. Needs force option.")
    return entries.map(t => t.dest)
  }
  entries.forEach(t => {
    const destDir = path.dirname(t.dest)
    shell.mkdir("-p", destDir)
    fs.renameSync(t.src, t.dest)
  })
  return entries.map(t => t.dest)
}
