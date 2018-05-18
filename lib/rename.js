const fs = require("fs")
const path = require("path")
const moment = require("moment")
const renamer = require("renamer")
const debug = require("debug")

const dg = debug("cyfs:error")

function renamePrepare(list, args) {
  const a = args
  if (!a || !(a.find && a.replace)) {
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

function injectTimestamp(targetSet, timestamp) {
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

module.exports = (list, args, isPreview) => {
  try {
    let targetSet = renamePrepare(list, args)
    const { timestamp } = args
    if (timestamp) {
      if (args.find || args.replace) {
        throw new Error("Cannot set 'find' and 'replace' when using timestamp.")
      }
      targetSet = injectTimestamp(targetSet, timestamp)
    }
    let results
    if (isPreview) {
      results = renamer.dryRun(targetSet)
    } else {
      results = renamer.rename(targetSet)
    }
    // TODO: Alert if contains error or warning
    return results.list.filter(r => r.renamed).map(r => r.after)
  } catch (e) {
    debug.enable("cyfs:error")
    dg(e.message)
    return []
  }
}
