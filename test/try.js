const yaml = require("js-yaml") // eslint-disable-line
const cyfs = require("..")

const doc = yaml.safeLoad(`
select:
  pattern: "test/dataset/photos/**"
  include:
    date:
      mode: exif
      after: "2013-01-04"
      before: "2013-01-06"
`)

/* eslint-disable */
console.log(doc)
console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>")
cyfs(doc, { preview: true, force: false }).then(res => {
  console.log(res)
  console.log("<<<<<<<<<<<<<<<<<<<<<<<<<<<<<")
})
