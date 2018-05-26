const fs = require("fs")
const path = require("path")
const glob = require("glob")
const junk = require("junk")
const moment = require("moment")
const numeral = require("numeral")
const { filter } = require("p-iteration")
const debug = require("debug")

const util = require("./util")

const dgw = debug("cyfs:warn")

async function filterByStatDate(srcList, dateOpts) {
  let list = srcList
  const { mode, after, before } = dateOpts
  if (after) {
    list = await filter(list, async fp => {
      const time = await util.getFileMoment(fp, mode)
      if (!time) return false
      return moment(time).isSameOrAfter(after, "day")
    })
  }
  if (before) {
    list = await filter(list, async fp => {
      const time = await util.getFileMoment(fp, mode)
      if (!time) return false
      return moment(time).isSameOrBefore(before, "day")
    })
  }
  return list
}

async function filterByStatDatetime(srcList, dateOpts) {
  let list = srcList
  const { mode, after, before } = dateOpts
  if (after) {
    list = await filter(list, async fp => {
      const time = await util.getFileMoment(fp, mode)
      if (!time) return false
      return moment(time) >= moment(after)
    })
  }
  if (before) {
    list = await filter(list, async fp => {
      const time = await util.getFileMoment(fp, mode)
      if (!time) return false
      return moment(time) <= moment(before)
    })
  }
  return list
}

function tweakOrder(userOrder) {
  const order = userOrder
  // TODO: pattern may contain BackSlash unexpectedly on windows
  const globDefaultOpts = { nodir: true, dot: true, nocase: true }
  const globOpts = Object.assign(globDefaultOpts, order.select.options)
  if (order.select.include) {
    if (order.select.include.preset) {
      if (order.select.include.preset === "emptydir") {
        if (globOpts.nodir) {
          dgw(
            "Automatically changed the option `nodir: false` to detect empty directory."
          )
          globOpts.nodir = false
        }
      }
    }
  }
  order.select.options = globOpts
  return order
}

module.exports = async order => {
  let list = []
  const { select: query } = tweakOrder(order)
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
        const v = numeral(qi.size.min).value()
        list = list.filter(f => fs.statSync(f).size >= v)
      }
      if (qi.size.max) {
        const v = numeral(qi.size.max).value()
        list = list.filter(f => fs.statSync(f).size <= v)
      }
    }
    if (qi.date) {
      list = await filterByStatDate(list, qi.date)
    }
    if (qi.datetime) {
      list = await filterByStatDatetime(list, qi.datetime)
    }
  }
  return list
}
