const cyfs = require("../../")
const yaml = require("js-yaml")
const shell = require("shelljs")
const exec = require("child_process").execSync

test("select name contain", async () => {
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
  expect(await cyfs(order)).toEqual(expected)
})

test("select regex", async () => {
  const order = yaml.safeLoad(`
  select:
    pattern: "test/dataset/colors/**"
    include:
      name:
        regex:
          pattern: "^R.*T$"
          flags: i
  `)
  const expected = ["test/dataset/colors/red.txt"]
  expect(await cyfs(order)).toEqual(expected)
})

test("select size min/max", async () => {
  const order = yaml.safeLoad(`
  select:
    pattern: "test/dataset/**"
    include:
      size:
        min: 350
        max: 470
  `)
  const expected = [
    "test/dataset/coffee/Grande.coffee",
    "test/dataset/coffee/Tall.coffee",
  ]
  expect(await cyfs(order)).toEqual(expected)
})

test("select date after/before", async () => {
  // Run on Mac
  exec('touch -mt 201805041259.59 "test/dataset/holidays/Greenery Day.h"')
  exec('touch -mt 201805051259.59 "test/dataset/holidays/Children\'s Day.h"')
  exec('touch -mt 201807161259.59 "test/dataset/holidays/Marine Day.h"')
  exec('touch -mt 201808111259.59 "test/dataset/holidays/Mountain Day.h"')
  const order = yaml.safeLoad(`
  select:
    pattern: "test/dataset/holidays/**/*"
    include:
      date:
        modify:
          after: "2018-05-05"
          before: "2018-07-16"
  `)
  const expected = [
    "test/dataset/holidays/.DS_Store",
    "test/dataset/holidays/Children's Day.h",
    "test/dataset/holidays/Marine Day.h",
  ]
  expect(await cyfs(order)).toEqual(expected)
})

test("select date after/before exif", async () => {
  const order = yaml.safeLoad(`
  select:
    pattern: "test/dataset/photos/**/*"
    include:
      date:
        exif:
          after: "2013-01-04"
          before: "2013-01-06"
  `)
  const expected = ["test/dataset/photos/drip.jpg"]
  expect(await cyfs(order)).toEqual(expected)
})

test("select preset emptydir", async () => {
  shell.mkdir("-p", "test/dataset/blankdir")
  const order = yaml.safeLoad(`
  select:
    pattern: "test/dataset/**"
    include:
      preset: emptydir
  `)
  const expected = ["test/dataset/blankdir"]
  expect(await cyfs(order)).toEqual(expected)
})
