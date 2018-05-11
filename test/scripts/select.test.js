const cyfs = require("../../")
const yaml = require("js-yaml")

const order = yaml.safeLoad(`
select:
  pattern: "test/dataset/colors/**"
  include:
    name:
      contain:
        - blue
        - green
`)

const expected = [
  "test/dataset/colors/blue.txt",
  "test/dataset/colors/green.txt",
]

test("select name contain", () => {
  expect(cyfs(order)).toEqual(expected)
})
