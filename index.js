const Cyfs = require("./lib/cyfs")

module.exports = (order, options) => {
  const { select: query, action } = order
  const cyfs = new Cyfs(query)
  const method = action ? action.do : "select"
  const ao = action ? action.options : null
  const isPreview = options ? !!options.preview : false
  switch (method) {
    case "select":
      return cyfs.select(ao, isPreview)
    case "delete":
      return cyfs.delete(ao, isPreview)
    case "rename":
      return cyfs.rename(ao, isPreview)
    case "fetch":
      return cyfs.fetch(ao, isPreview)
    case "copy":
      return cyfs.copy(ao, isPreview)
    case "move":
      return cyfs.move(ao, isPreview)
    default:
      throw new Error()
  }
}
