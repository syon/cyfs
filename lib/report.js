const fs = require("fs")
const path = require("path")
const { map } = require("p-iteration")
const stringify = require("csv-stringify/lib/sync") // eslint-disable-line
const moment = require("moment")

const util = require("./util")

module.exports = async (list, args, isPreview) => {
  const fmt = args.timestampFormat || moment.HTML5_FMT.DATETIME_LOCAL
  const entries = await map(list, async fp => {
    const st = fs.statSync(fp)
    const ed = await util.getExifDate(fp)
    return {
      dir: path.dirname(fp),
      name: path.basename(fp),
      type: st.isDirectory() ? "D" : "F",
      byte: st.size,
      access_time: moment(st.atime).format(fmt),
      modiry_time: moment(st.mtime).format(fmt),
      change_time: moment(st.ctime).format(fmt),
      birth_time: moment(st.birthtime).format(fmt),
      exif_date: ed ? moment(ed).format(fmt) : null,
    }
  })
  if (isPreview) return entries
  const outFile = args.out || "report.tsv"
  const tsvBuf = stringify(entries, { delimiter: "\t", header: true })
  fs.writeFileSync(outFile, tsvBuf, err => {
    throw new Error(err)
  })
  return entries
}
