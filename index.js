const fs = require("fs")
const path = require("path")
const glob = require("glob")
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

function filterByStatDate(pipedList, dateAfterBefore, statProp) {
  if (!dateAfterBefore) return pipedList
  let list = pipedList
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

function cyfs(order) {
  if (!order) return []
  let list = glob.sync(order.glob)
  if (order.name) {
    if (order.name.regex) {
      if (order.name.regex.pattern) {
        list = list.filter(f => {
          const filename = path.basename(f)
          const ptn = order.name.regex.pattern
          const flg = order.name.regex.flags || ""
          const regex = new RegExp(ptn, flg)
          return filename.match(regex)
        })
      }
    }
    if (order.name.contain) {
      list = list.filter(fp => {
        const f = path.basename(fp)
        return order.name.contain.some(c => f.indexOf(c) !== -1)
      })
    }
  }
  if (order.size) {
    if (order.size.min) {
      list = list.filter(f => {
        const stat = fs.statSync(f)
        return stat.size >= order.size.min
      })
    }
    if (order.size.max) {
      list = list.filter(f => {
        const stat = fs.statSync(f)
        return stat.size <= order.size.max
      })
    }
  }
  if (order.date) {
    list = filterByStatDate(list, order.date.access, "atime")
    list = filterByStatDate(list, order.date.modify, "mtime")
    list = filterByStatDate(list, order.date.change, "ctime")
    list = filterByStatDate(list, order.date.birth, "birthtime")
  }
  return list
}

module.exports = cyfs
