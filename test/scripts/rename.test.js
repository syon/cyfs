const cyfs = require("../../")
const yaml = require("js-yaml")

test("rename regex", async () => {
  const order = yaml.safeLoad(`
  select:
    pattern: "test/dataset/week/*.log"
  action:
    do: rename
    args:
      regex: true
      find: ^(F.*)
      replace: PREMIUM-$1
  `)
  const expected = ["test/dataset/week/PREMIUM-Friday.log"]
  const result = await cyfs(order, { preview: true })
  expect(result).toEqual(expected)
})
