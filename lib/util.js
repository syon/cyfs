const fs = require("fs")
const path = require("path")
const moment = require("moment")
const { ExifImage } = require("exif")

function getStat(filepath, mode) {
  const stat = fs.statSync(filepath)
  switch (mode) {
    case "access":
      return stat.atime
    case "modify":
      return stat.mtime
    case "change":
      return stat.ctime
    case "birth":
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
  }).catch(() => null)
}

async function getFileMoment(fp, mode) {
  let ts = null
  const isJpeg = !!path.extname(fp).match(/^\.jpe?g$/)
  if (mode === "exif") {
    if (!isJpeg) return null
    ts = await getExifDate(fp)
  } else {
    ts = getStat(fp, mode)
  }
  try {
    const m = moment(ts)
    return m.isValid() ? m : null
  } catch (err) {
    return null
  }
}

async function hasExifDate(fp) {
  const isJpeg = !!path.extname(fp).match(/^\.jpe?g$/)
  if (isJpeg) {
    const ed = await getExifDate(fp)
    return !!ed
  }
  return false
}

module.exports = {
  getStat,
  hasExifDate,
  getFileMoment,
}
