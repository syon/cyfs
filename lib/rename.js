import fs from "node:fs/promises"
import path from "path"
import moment from "moment"
import Renamer from "renamer"
import debug from "debug"
import PIteration from "p-iteration"

import util from "./util.js"

const vw = debug("cyfs:view")
const dgw = debug("cyfs:warn")
const dge = debug("cyfs:error")

const { map } = PIteration

async function renamePrepare(list, args) {
  const a = args
  if (!((a.find && a.replace) || a.timestamp)) {
    throw new Error("Invalid args: 'find' and 'replace' are required.")
  }
  const renamer = new Renamer()
  const renamerOpts = {
    dryRun: true,
    find: !!a.regex ? new RegExp(a.find) : a.find,
    replace: a.replace,
    files: list,
  }
  /* { from, to, renamed } */
  const resultSet = await renamer.rename(renamerOpts)
  return resultSet
    .filter((x) => x.renamed)
    .map((x) => ({ from: x.from, to: x.to }))
}

async function customizeFilename(targetList, timestamp, filesize) {
  const { preferExif, format: tsFmt, only } = timestamp
  const useFilesize = !!filesize
  return await map(targetList, async (from) => {
    const dn = path.dirname(from)
    const ex = path.extname(from)
    const bn = path.basename(from, ex)
    let time = await util.getFileMoment(from, "modify")
    if (preferExif) {
      const hasExif = await util.hasExifDate(from)
      if (hasExif) {
        time = await util.getFileMoment(from, "exif")
      }
    }
    const tsPrefix = tsFmt ? moment(time).format(tsFmt) : ""
    const stat = await fs.stat(from)
    const suffix = useFilesize ? `(${stat.size}B)` : ""
    const basename = only
      ? `${tsPrefix}${suffix}${ex}`
      : `${tsPrefix}${bn}${suffix}${ex}`
    const to = path.join(dn, basename)
    return { from, to }
  })
}

async function doRename(targetSetList, isPreview) {
  for (const { from, to } of targetSetList) {
    vw("Renaming...", `'${from}' -> '${to}'`)
    if (!isPreview) {
      await fs.rename(from, to)
    }
  }
}

export default async (list, args, isPreview) => {
  try {
    const fileList = list.filter(async (fp) => (await fs.stat(fp)).isFile())
    const { timestamp, filesize } = args
    let targetSetList
    if (timestamp) {
      if (args.find || args.replace) {
        throw new Error("Cannot set 'find' and 'replace' when using timestamp.")
      }
      targetSetList = await customizeFilename(fileList, timestamp, filesize)
    } else {
      targetSetList = await renamePrepare(fileList, args)
    }

    await doRename(targetSetList, isPreview)
    // const skips = results.filter((r) => r.error === "file exists")
    // if (skips) {
    //   debug.enable("cyfs:warn")
    //   skips.forEach((r) => {
    //     dgw("[file exists] (skipped)", "\n", r.from, "\n", r.to)
    //   })
    // }
    return targetSetList
  } catch (e) {
    debug.enable("cyfs:error")
    dge(e.message)
    return []
  }
}
