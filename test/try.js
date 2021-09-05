const fs = require("fs/promises")
const yaml = require("js-yaml")
const cyfs = require("../index.js")

if (process.argv.length < 3) {
  console.error("invalid args.")
  console.log("\n  $ node try\\cyfs.mjs path\\to\\sample.yml")
  process.exit(1)
}

const ymlName = process.argv[2]
const ymlPath = `./test/yml/${ymlName}.yml`
const hasArgv3 = typeof process.argv[3] !== "undefined"
const preview = hasArgv3 ? !!JSON.parse(process.argv[3]) : true

console.log("--------------------------------------------------------")
console.log({ ymlPath, preview })
console.log("--------------------------------------------------------")

/**
 * $ node .\test\try.js select_size
 */
;(async () => {
  const text = await fs.readFile(ymlPath, "utf-8")
  const order = yaml.load(text)
  const result = await cyfs(order, { preview })
  console.log(result)
})().catch((e) => {
  // Deal with the fact the chain failed
  console.warn(e)
})
