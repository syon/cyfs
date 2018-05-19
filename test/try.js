const yaml = require("js-yaml") // eslint-disable-line
const cyfs = require("..")

const doc = yaml.safeLoad(`
select:
  pattern: "/Users/syon/Downloads/**"
  include:
    # name:
    #   regex:
    #     pattern: "(JPG|png)$"
    #     flags: gi
action:
  do: select
  args:
`)

/* eslint-disable */
console.log(doc)
console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
const result = cyfs(doc, { preview: false, force: false })
console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
console.log(result)
