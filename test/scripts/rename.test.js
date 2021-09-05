const cyfs = require("../../index.js")
const yaml = require("js-yaml")

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

test("rename with timestamp", async () => {
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
  const expected = {
    from: "test/dataset/exif/drip.jpg",
    to: "test\\dataset\\exif\\2013-01-05T112157(10913B).jpg",
  }
  const result = await cyfs(order, { preview: true })
  expect(result[0]).toEqual(expected)
})
