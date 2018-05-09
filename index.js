const Cyfs = require("./cyfs")

module.exports = {
  select(order, options = {}) {
    const cyfs = new Cyfs(order)
    return cyfs.select(options)
  },
  delete(order, options = {}, isPreview = false) {
    const cyfs = new Cyfs(order)
    return cyfs.delete(options, isPreview)
  },
  rename(order, options = {}, isPreview = false) {
    const cyfs = new Cyfs(order)
    return cyfs.rename(options, isPreview)
  },
  fetch(order, options = {}, isPreview = false) {
    const cyfs = new Cyfs(order)
    return cyfs.fetch(options, isPreview)
  },
  copy(order, options = {}, isPreview = false) {
    const cyfs = new Cyfs(order)
    return cyfs.copy(options, isPreview)
  },
  move(order, options = {}, isPreview = false) {
    const cyfs = new Cyfs(order)
    return cyfs.move(options, isPreview)
  },
}
