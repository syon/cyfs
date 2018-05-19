const fs = require("fs")
const path = require("path")
const glob = require("glob")
const junk = require("junk")
const moment = require("moment")
const numeral = require("numeral")
const { filter } = require("p-iteration")
const util = require("./util")

async function filterByStatDate(srcList, dateAfterBefore, statProp) {
  let list = srcList
  if (!dateAfterBefore) return srcList
  if (dateAfterBefore.after) {
    const { after } = dateAfterBefore
    list = await filter(list, async fp => {
      const time = await util.getFileTimestamp(fp, statProp)
      return moment(time).isSameOrAfter(after, "day")
    })
  }
  if (dateAfterBefore.before) {
    const { before } = dateAfterBefore
    list = await filter(list, async fp => {
      const time = await util.getFileTimestamp(fp, statProp)
      return moment(time).isSameOrBefore(before, "day")
    })
  }
  return list
}

function filterByStatDatetime(srcList, dateAfterBefore, statProp) {
  let list = srcList
  if (!dateAfterBefore) return srcList
  if (dateAfterBefore.after) {
    const { after } = dateAfterBefore
    list = list.filter(f => {
      const time = util.getStat(f, statProp)
      return moment(time) >= moment(after)
    })
  }
  if (dateAfterBefore.before) {
    const { before } = dateAfterBefore
    list = list.filter(f => {
      const time = util.getStat(f, statProp)
      return moment(time) <= moment(before)
    })
  }
  return list
}

module.exports = async query => {
  let list = []
  // TODO: pattern may contain BackSlash unexpectedly on windows
  const globDefaultOpts = { dot: true, nocase: true }
  const globOpts = Object.assign(globDefaultOpts, query.options)
  list = glob.sync(query.pattern, globOpts)
  if (query.include) {
    const qi = query.include
    if (qi.preset) {
      switch (qi.preset) {
        case "junk":
          list = list.filter(fp => junk.is(path.basename(fp)))
          break
        case "emptydir":
          list = list.filter(fp => {
            if (fs.statSync(fp).isDirectory()) {
              return fs.readdirSync(fp).length === 0
            }
            return false
          })
          break
        default:
          throw new Error()
      }
    }
    if (qi.name) {
      if (qi.name.regex) {
        if (qi.name.regex.pattern) {
          list = list.filter(f => {
            const filename = path.basename(f)
            const ptn = qi.name.regex.pattern
            const flg = qi.name.regex.flags || ""
            const regex = new RegExp(ptn, flg)
            return filename.match(regex)
          })
        }
      }
      if (qi.name.contain) {
        list = list.filter(fp => {
          const f = path.basename(fp)
          return qi.name.contain.some(c => f.indexOf(c) !== -1)
        })
      }
    }
    if (qi.size) {
      if (qi.size.min) {
        const v = numeral(qi.size.min).value()
        list = list.filter(f => fs.statSync(f).size >= v)
      }
      if (qi.size.max) {
        const v = numeral(qi.size.max).value()
        list = list.filter(f => fs.statSync(f).size <= v)
      }
    }
    if (qi.date) {
      list = await filterByStatDate(list, qi.date.exif, "exif")
      list = await filterByStatDate(list, qi.date.access, "atime")
      list = await filterByStatDate(list, qi.date.modify, "mtime")
      list = await filterByStatDate(list, qi.date.change, "ctime")
      list = await filterByStatDate(list, qi.date.birth, "birthtime")
    }
    if (qi.datetime) {
      list = filterByStatDatetime(list, qi.datetime.access, "atime")
      list = filterByStatDatetime(list, qi.datetime.modify, "mtime")
      list = filterByStatDatetime(list, qi.datetime.change, "ctime")
      list = filterByStatDatetime(list, qi.datetime.birth, "birthtime")
    }
  }
  return list
}
