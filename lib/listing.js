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
  const q = query
  let list = []
  list = glob.sync(q.pattern, q.options)
  if (q.include) {
    if (q.include.preset) {
      switch (q.include.preset) {
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
  }
  if (q.name) {
    if (q.name.regex) {
      if (q.name.regex.pattern) {
        list = list.filter(f => {
          const filename = path.basename(f)
          const ptn = q.name.regex.pattern
          const flg = q.name.regex.flags || ""
          const regex = new RegExp(ptn, flg)
          return filename.match(regex)
        })
      }
    }
    if (q.name.contain) {
      list = list.filter(fp => {
        const f = path.basename(fp)
        return q.name.contain.some(c => f.indexOf(c) !== -1)
      })
    }
  }
  if (q.size) {
    if (q.size.min) {
      list = list.filter(f => {
        const stat = fs.statSync(f)
        return stat.size >= q.size.min
      })
    }
    if (q.size.max) {
      list = list.filter(f => {
        const stat = fs.statSync(f)
        return stat.size <= q.size.max
      })
    }
  }
  if (q.date) {
    list = filterByStatDate(list, q.date.access, "atime")
    list = filterByStatDate(list, q.date.modify, "mtime")
    list = filterByStatDate(list, q.date.change, "ctime")
    list = filterByStatDate(list, q.date.birth, "birthtime")
  }
  return list
}
