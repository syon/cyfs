import debug from "debug"
import yaml from "js-yaml" // eslint-disable-line
import cyfs from "../index.js"

const vw = debug("cyfs:view")
debug.enable("cyfs:*")

const doc = yaml.load(`
select:
  pattern: "/Users/syon/Downloads/20180818WK/**/*.*"
  include:
    date:
      mode: modify
      after: "2018-01-01"
      before: "2018-12-31"
action:
  do: "rename"
  args:
    timestamp:
      preferExif: true
      format: "YYYY-MM-DDTHHmmss"
      only: true
    filesize: true
`)

/* eslint-disable */
vw(doc)
;(async () => {
  vw(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
  const res = await cyfs(doc, { preview: 1, force: false })
  res.forEach((fp) => vw(fp))
  vw("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
})()
