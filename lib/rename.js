const fs = require("fs")
const path = require("path")
const moment = require("moment")
const renamer = require("renamer")
const debug = require("debug")
const { map } = require("p-iteration")
const util = require("./util")

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

async function injectTimestamp(targetSet, timestamp) {
  const newTargetSet = targetSet
  const { format: tsFmt, only } = timestamp
  newTargetSet.list = await map(targetSet.list, async entry => {
    const { before } = entry
    const dn = path.dirname(before)
    const ex = path.extname(before)
    const bn = path.basename(before, ex)
    const time = await util.getFileTimestamp(before, "exif")
    const tsPrefix = tsFmt ? moment(time).format(tsFmt) : ""
    const basename = only ? `${tsPrefix}${ex}` : `${tsPrefix}${bn}${ex}`
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
    const { timestamp } = args
    if (timestamp) {
      if (args.find || args.replace) {
        throw new Error("Cannot set 'find' and 'replace' when using timestamp.")
      }
      targetSet = await injectTimestamp(targetSet, timestamp)
    }
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
        dgw("[file exists] (skipped)", r.after)
      })
    }
    return results.list.filter(r => r.renamed).map(r => r.after)
  } catch (e) {
    debug.enable("cyfs:error")
    dge(e.message)
    return []
  }
}
