const Cyfs = require("./cyfs")

module.exports = {
  select(order) {
    const cyfs = new Cyfs(order)
    return cyfs.select()
  },
  delete(order) {
    const cyfs = new Cyfs(order)
    return cyfs.delete()
  },
  rename(order) {
    const cyfs = new Cyfs(order)
    return cyfs.rename()
  },
  fetch(order, options = {}) {
    const cyfs = new Cyfs(order)
    return cyfs.fetch(options)
  },
  copy(order, options = {}) {
    const cyfs = new Cyfs(order)
    return cyfs.copy(options)
  },
  move(order, options = {}) {
    const cyfs = new Cyfs(order)
    return cyfs.move(options)
  },
}
