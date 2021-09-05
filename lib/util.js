const fs = require("fs")
const path = require("path")
const mmnt = require("./mmnt.js")
const Exif = require("exif")

const { ExifImage } = Exif

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
  const isJpeg = !!path.extname(fp).match(/^\.jpe?g$/i)
  return new Promise((rv) => {
    if (!isJpeg) rv(null)
    try {
      // eslint-disable-next-line
      new ExifImage({ image: fp }, (err, exifData) => {
        if (err) {
          rv(null)
          return
        }
        const takenDate = exifData.exif.DateTimeOriginal
        const mo = mmnt(takenDate, "YYYY:MM:DD HH:mm:ss")
        if (!mo.isValid()) rv(null)
        rv(mo.format())
      })
    } catch (err) {
      rv(null)
    }
  }).catch(() => {})
}

async function hasExifDate(fp) {
  const ed = await getExifDate(fp)
  return !!ed
}

async function getFileMoment(fp, mode, isPreferExif) {
  let ts = null
  if (isPreferExif) {
    const a = await hasExifDate(fp)
    ts = a ? await getExifDate(fp) : getStat(fp, mode)
  } else {
    switch (mode) {
      case "access":
        ts = getStat(fp, mode)
        break
      case "modify":
        ts = getStat(fp, mode)
        break
      case "change":
        ts = getStat(fp, mode)
        break
      case "birth":
        ts = getStat(fp, mode)
        break
      case "exif":
        ts = await getExifDate(fp)
        break
      default:
        ts = null
    }
  }
  const m = mmnt(ts)
  if (m.isValid()) {
    return m
  }
  throw new Error("Cannot get mmnt:", fp)
}

module.exports = {
  getStat,
  hasExifDate,
  getExifDate,
  getFileMoment,
}
