import fs from "node:fs/promises"
import yaml from "js-yaml"
import cyfs from "../index.js"

if (process.argv.length < 3) {
  console.error("invalid args.")
  console.log("\n  $ node try\\cyfs.mjs path\\to\\sample.yml")
  process.exit(1)
}

const ymlPath = process.argv[2]
const preview = process.argv[3] || true

console.log("--------------------------------------------------------")
console.log({ ymlPath, preview })
console.log("--------------------------------------------------------")

const text = await fs.readFile(ymlPath, "utf-8")
const order = yaml.load(text)
const result = await cyfs(order, { preview })
console.log(result)
