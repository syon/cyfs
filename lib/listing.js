const fs = require("fs")
const path = require("path")
const glob = require("glob")
const junk = require("junk")
const moment = require("moment")

function getStat(filepath, statProp) {
  const stat = fs.statSync(filepath)
  switch (statProp) {
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

function filterByStatDate(srcList, dateAfterBefore, statProp) {
  let list = srcList
  if (!dateAfterBefore) return srcList
  if (dateAfterBefore.after) {
    const { after } = dateAfterBefore
    list = list.filter(f => {
      const time = getStat(f, statProp)
      return moment(time).isSameOrAfter(after, "day")
    })
  }
  if (dateAfterBefore.before) {
    const { before } = dateAfterBefore
    list = list.filter(f => {
      const time = getStat(f, statProp)
      return moment(time).isSameOrBefore(before, "day")
    })
  }
  return list
}

module.exports = query => {
  let list = []
  list = glob.sync(query.pattern, query.options)
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
        list = list.filter(f => fs.statSync(f).size >= qi.size.min)
      }
      if (qi.size.max) {
        list = list.filter(f => fs.statSync(f).size <= qi.size.max)
      }
    }
    if (qi.date) {
      list = filterByStatDate(list, qi.date.access, "atime")
      list = filterByStatDate(list, qi.date.modify, "mtime")
      list = filterByStatDate(list, qi.date.change, "ctime")
      list = filterByStatDate(list, qi.date.birth, "birthtime")
    }
  }
  return list
}
