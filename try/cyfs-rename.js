import cyfs from "../index.js"
import yaml from "js-yaml"

const order = yaml.load(`
select:
  pattern: "test/dataset/exif/**"
action:
  do: rename
  args:
    timestamp:
      preferExif: true
      format: "YYYY-MM-DDTHHmmss"
      only: true
    filesize: true
`)

const result = await cyfs(order, { preview: true })
console.log(result)
