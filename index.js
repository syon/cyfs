const Cyfs = require("./cyfs")

module.exports = {
  select(order) {
    const cyfs = new Cyfs(order)
    const list = cyfs.select()
    return list
  },
  delete(order) {
    const cyfs = new Cyfs(order)
    const deletedList = cyfs.delete()
    return deletedList
  },
  dryRun(order) {
    const cyfs = new Cyfs(order)
    const result = cyfs.dryRun()
    return result
  },
  rename(order) {
    const cyfs = new Cyfs(order)
    const result = cyfs.rename()
    return result
  },
  copy(order) {
    const cyfs = new Cyfs(order)
    const result = cyfs.copy()
    return result
  },
}
