import cyfs from "../index.js"
import yaml from "js-yaml"

const order = yaml.load(`
select:
  pattern: "test/dataset/**"
  include:
    size:
      min: 350
      max: 470
`)

const result = await cyfs(order, { preview: true })
console.log(result)
