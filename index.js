const Cyfs = require("./cyfs")

module.exports = (order, isPreview) => {
  const { select: query, action } = order
  const cyfs = new Cyfs(query)
  switch (action.do) {
    case "select":
      return cyfs.select(action.options, isPreview)
    case "delete":
      return cyfs.delete(action.options, isPreview)
    case "rename":
      return cyfs.rename(action.options, isPreview)
    case "fetch":
      return cyfs.fetch(action.options, isPreview)
    case "copy":
      return cyfs.copy(action.options, isPreview)
    case "move":
      return cyfs.move(action.options, isPreview)
    default:
      throw new Error()
  }
}
