const cyfs = require("../../")
const yaml = require("js-yaml")

test("rename regex", () => {
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
  const expected = [
    {
      before: "test/dataset/week/Friday.log",
      after: "test/dataset/week/PREMIUM-Friday.log",
      renamed: true,
    },
  ]
  const result = cyfs(order, { preview: true })
  const renamed = result.list.filter(o => o.renamed)
  expect(renamed).toEqual(expected)
})
