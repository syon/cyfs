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
}
