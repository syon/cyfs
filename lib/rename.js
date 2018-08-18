const fs = require("fs")
const path = require("path")
const moment = require("moment")
const renamer = require("renamer")
const debug = require("debug")
const { map } = require("p-iteration")
const util = require("./util")

const vw = debug("cyfs:view")
const dgw = debug("cyfs:warn")
const dge = debug("cyfs:error")

function renamePrepare(list, args) {
  const a = args
  if (!((a.find && a.replace) || a.timestamp)) {
    throw new Error("Invalid args: 'find' and 'replace' are required.")
  }
  const renamerOpts = {
    regex: !!a.regex,
    insensitive: !!a.insensitive,
    find: a.find || "^$",
    replace: a.replace,
    files: list,
  }
  return renamer.replace(renamerOpts)
}

async function customizeFilename(targetSet, timestamp, filesize) {
  const newTargetSet = targetSet
  const { preferExif, format: tsFmt, only } = timestamp
  const useFilesize = !!filesize
  newTargetSet.list = await map(targetSet.list, async entry => {
    const { before } = entry
    const dn = path.dirname(before)
    const ex = path.extname(before)
    const bn = path.basename(before, ex)
    let time = await util.getFileMoment(before, "modify")
    if (preferExif) {
      const hasExif = await util.hasExifDate(before)
      if (hasExif) {
        time = await util.getFileMoment(before, "exif")
      }
    }
    const tsPrefix = tsFmt ? moment(time).format(tsFmt) : ""
    const stat = fs.statSync(before)
    const suffix = useFilesize ? `(${stat.size}B)` : ""
    const basename = only ? `${tsPrefix}${suffix}${ex}` : `${tsPrefix}${bn}${suffix}${ex}`
    return {
      before: entry.before,
      after: path.join(dn, basename),
    }
  })
  return newTargetSet
}

module.exports = async (list, args, isPreview) => {
  try {
    const fileList = list.filter(fp => fs.statSync(fp).isFile())
    let targetSet = renamePrepare(fileList, args)
    const { timestamp, filesize } = args
    if (timestamp) {
      if (args.find || args.replace) {
        throw new Error("Cannot set 'find' and 'replace' when using timestamp.")
      }
      targetSet = await customizeFilename(targetSet, timestamp, filesize)
    }
    // remove non-changed items
    targetSet.list = targetSet.list.filter(x => x.before !== x.after)
    let results
    if (isPreview) {
      results = renamer.dryRun(targetSet)
    } else {
      results = renamer.rename(targetSet)
    }
    const skips = results.list.filter(r => r.error === "file exists")
    if (skips) {
      debug.enable("cyfs:warn")
      skips.forEach(r => {
        dgw("[file exists] (skipped)", "\n", r.before, "\n", r.after)
      })
    }
    return results.list.filter(r => r.renamed).map(r => r.after)
  } catch (e) {
    debug.enable("cyfs:error")
    dge(e.message)
    return []
  }
}
