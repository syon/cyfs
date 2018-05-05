const fs = require("fs")
const path = require("path")
const glob = require("glob")
const moment = require("moment")

module.exports = class Cyfs {
  constructor(order) {
    this.order = order
    this.list = []
  }

  static getStat(filepath, statProp) {
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

  filterByStatDate(dateAfterBefore, statProp) {
    if (!dateAfterBefore) return
    if (dateAfterBefore.after) {
      const { after } = dateAfterBefore
      this.list = this.list.filter(f => {
        const time = Cyfs.getStat(f, statProp)
        return moment(time).isSameOrAfter(after, "day")
      })
    }
    if (dateAfterBefore.before) {
      const { before } = dateAfterBefore
      this.list = this.list.filter(f => {
        const time = Cyfs.getStat(f, statProp)
        return moment(time).isSameOrBefore(before, "day")
      })
    }
  }

  select() {
    const { order } = this
    if (!order) return []
    if (!order.glob) return []
    let list = glob.sync(order.glob.pattern, order.glob.options)
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
      this.filterByStatDate(order.date.access, "atime")
      this.filterByStatDate(order.date.modify, "mtime")
      this.filterByStatDate(order.date.change, "ctime")
      this.filterByStatDate(order.date.birth, "birthtime")
    }
    return list
  }
}
