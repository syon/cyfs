import fs from "node:fs/promises"
import { isNotJunk } from "junk"

const files = await fs.readdir(".")

console.log(files)
//=> ['.DS_Store', 'test.jpg']

console.log(files.filter(isNotJunk))
//=> ['test.jpg']
