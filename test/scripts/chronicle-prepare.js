/**
 * [Workaround]
 * Until jest ESM works
 */
import { utimes } from "utimes"
import mmnt from "../../lib/mmnt.js"

function changeTimestamp(path, datetime) {
  const mo = mmnt(datetime, "YYYY-MM-DDTHH:mm:ss.SSSZ")
  const unixtime = mo.valueOf() // msec
  utimes(path, { mtime: unixtime })
}

changeTimestamp(
  "test/dataset/holidays/Greenery Day.h",
  "2018-05-04T12:59:59.000Z"
)
changeTimestamp(
  "test/dataset/holidays/Children's Day.h",
  "2018-05-05T12:59:59.000Z"
)
changeTimestamp(
  "test/dataset/holidays/Marine Day.h",
  "2018-07-16T12:59:59.000Z"
)
changeTimestamp(
  "test/dataset/holidays/Mountain Day.h",
  "2018-08-11T12:59:59.000Z"
)
