const Cyfs = require("./lib/cyfs")

module.exports = async (order, flags) => {
  const { select: query, action } = order
  const cyfs = new Cyfs()
  await cyfs.init(query)
  const method = action ? action.do : "select"
  const args = action ? action.args : null
  const isPreview = flags ? !!flags.preview : false
  const isForce = flags ? !!flags.force : false
  switch (method) {
    case "select":
      return cyfs.select(args, isPreview)
    case "delete":
      return cyfs.delete(args, isPreview)
    case "rename":
      return cyfs.rename(args, isPreview)
    case "fetch":
      return cyfs.fetch(args, isPreview)
    case "chronicle":
      return cyfs.chronicle(args, isPreview, isForce)
    case "copy":
      return cyfs.copy(args, isPreview)
    case "move":
      return cyfs.move(args, isPreview)
    default:
      throw new Error()
  }
}
