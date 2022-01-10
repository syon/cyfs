const fs = require("fs")
const path = require("path")
const PIteration = require("p-iteration")
const stringify = require("csv-stringify/lib/sync.js") // eslint-disable-line

const mmnt = require("./mmnt.js")
const util = require("./util.js")

const { map } = PIteration

module.exports = async (list, args, isPreview) => {
  const fmt = args.timestampFormat || "YYYY-MM-DDTHH:mm:ss.SSSZ"
  const entries = await map(list, async (fp) => {
    const st = fs.statSync(fp)
    const ed = await util.getExifDate(fp)
    return {
      dir: path.dirname(fp),
      name: path.basename(fp),
      type: st.isDirectory() ? "D" : "F",
      byte: st.size,
      access_time: mmnt(st.atime).format(fmt),
      modify_time: mmnt(st.mtime).format(fmt),
      change_time: mmnt(st.ctime).format(fmt),
      birth_time: mmnt(st.birthtime).format(fmt),
      exif_date: ed ? mmnt(ed).format(fmt) : null,
    }
  })
  if (isPreview) return entries
  const outFile = args.out || "report.tsv"
  const tsvBuf = stringify(entries, { delimiter: "\t", header: true })
  fs.writeFileSync(outFile, tsvBuf, (err) => {
    throw new Error(err)
  })
  return entries
}
