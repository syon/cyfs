import cyfs from "../../index.js"
import yaml from "js-yaml"

test("rename regex", async () => {
  const order = yaml.load(`
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
