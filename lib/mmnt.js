import dayjs from "dayjs"
import customParseFormat from "dayjs/plugin/customParseFormat.js"
import isSameOrAfter from "dayjs/plugin/isSameOrAfter.js"
import isSameOrBefore from "dayjs/plugin/isSameOrBefore.js"

dayjs.extend(customParseFormat)
dayjs.extend(isSameOrAfter)
dayjs.extend(isSameOrBefore)

/**
 * Date Util
 */
export default (datetime, format) => {
  return dayjs(datetime, format)
}
