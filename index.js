const Cyfs = require("./cyfs")

module.exports = {
  select(order) {
    const cyfs = new Cyfs(order)
    return cyfs.select()
  },
  delete(order, isPreview = false) {
    const act = order.action || {}
    if (act.do !== "delete") throw new Error()
    const opts = act.options
    const cyfs = new Cyfs(order)
    return cyfs.delete(opts, isPreview)
  },
  rename(order, isPreview = false) {
    const act = order.action || {}
    if (act.do !== "rename") throw new Error()
    const opts = act.options
    const cyfs = new Cyfs(order)
    return cyfs.rename(opts, isPreview)
  },
  fetch(order, isPreview = false) {
    const act = order.action || {}
    if (act.do !== "fetch") throw new Error()
    const opts = act.options
    const cyfs = new Cyfs(order)
    return cyfs.fetch(opts, isPreview)
  },
  copy(order, isPreview = false) {
    const act = order.action || {}
    if (act.do !== "copy") throw new Error()
    const opts = act.options
    const cyfs = new Cyfs(order)
    return cyfs.copy(opts, isPreview)
  },
  move(order, isPreview = false) {
    const act = order.action || {}
    if (act.do !== "move") throw new Error()
    const opts = act.options
    const cyfs = new Cyfs(order)
    return cyfs.move(opts, isPreview)
  },
}
