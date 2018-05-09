const Cyfs = require("./cyfs")

module.exports = (order, { preview }) => {
  const { select: query, action } = order
  const cyfs = new Cyfs(query)
  const method = action ? action.do : "select"
  const options = action ? action.options : null
  const isPreview = !!preview
  switch (method) {
    case "select":
      return cyfs.select(options, isPreview)
    case "delete":
      return cyfs.delete(options, isPreview)
    case "rename":
      return cyfs.rename(options, isPreview)
    case "fetch":
      return cyfs.fetch(options, isPreview)
    case "copy":
      return cyfs.copy(options, isPreview)
    case "move":
      return cyfs.move(options, isPreview)
    default:
      throw new Error()
  }
}
