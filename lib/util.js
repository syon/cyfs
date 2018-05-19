const fs = require("fs")
const path = require("path")
const moment = require("moment")
const { ExifImage } = require("exif")

function getStat(filepath, statProp) {
  const stat = fs.statSync(filepath)
  switch (statProp) {
    case "exif":
      return stat.mtime
    case "atime":
      return stat.atime
    case "mtime":
      return stat.mtime
    case "ctime":
      return stat.ctime
    case "birthtime":
      return stat.birthtime
    default:
      return ""
  }
}

function getExifDate(fp) {
  return new Promise((rv, rj) => {
    try {
      // eslint-disable-next-line
      new ExifImage({ image: fp }, (err, exifData) => {
        const takenDate = exifData.exif.DateTimeOriginal
        rv(moment(takenDate, "YYYY:MM:DD HH:mm:ss").format())
      })
    } catch (err) {
      rj(err.message)
    }
    return null
  })
}

async function getFileTimestamp(fp, statProp) {
  let exifDate = null
  const isJpeg = !!path.extname(fp).match(/^\.jpe?g$/)
  if (statProp === "exif" && isJpeg) {
    exifDate = await getExifDate(fp)
  }
  return exifDate || getStat(fp, statProp)
}

module.exports = {
  getStat,
  getFileTimestamp,
}
