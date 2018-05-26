const cyfs = require("../../")
const yaml = require("js-yaml")
const exec = require("child_process").execSync

test("chronicle default", async () => {
  exec('touch -mt 201805201259.59 "test/dataset/photos/tg2_drip.jpg"')
  const order = yaml.safeLoad(`
  select:
    pattern: "test/dataset/photos/tg2_drip.jpg"
  action:
    do: chronicle
  `)
  const expected = ["_dest/2018/05/20/tg2_drip.jpg"]
  const result = await cyfs(order, { preview: true })
  expect(result).toEqual(expected)
})

test("chronicle exif", async () => {
  const order = yaml.safeLoad(`
  select:
    pattern: "test/dataset/photos/tg2_drip.jpg"
  action:
    do: chronicle
    args:
      mode: exif
  `)
  const expected = ["_dest/2013/01/05/tg2_drip.jpg"]
  const result = await cyfs(order, { preview: true })
  expect(result).toEqual(expected)
})
