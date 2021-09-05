const dayjs = require("dayjs")
const customParseFormat = require("dayjs/plugin/customParseFormat.js")
const isSameOrAfter = require("dayjs/plugin/isSameOrAfter.js")
const isSameOrBefore = require("dayjs/plugin/isSameOrBefore.js")

dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/**
 * Date Util
 */
module.exports = (datetime, format) => {
  return dayjs(datetime, format)
}
