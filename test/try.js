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
    date:
      exif:
        after: 2018-05-19
        before: 2018-05-20
action:
  do: select
  args:
`)

/* eslint-disable */
console.log(doc)
console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
cyfs(doc, { preview: true, force: false }).then(res => {
  console.log(res)
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
})
