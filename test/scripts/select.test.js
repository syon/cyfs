import cyfs from "../../"
import yaml from "js-yaml"
import shell from "shelljs"
import { execSync as exec } from "child_process"

test("select name contain", async () => {
  const order = yaml.load(`
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
  const order = yaml.load(`
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
  const order = yaml.load(`
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
  const order = yaml.load(`
  select:
    pattern: "test/dataset/holidays/**/*"
    include:
      date:
        mode: modify
        after: "2018-05-05"
        before: "2018-07-16"
  `)
  const expected = [
    "test/dataset/holidays/Children's Day.h",
    "test/dataset/holidays/Marine Day.h",
  ]
  expect(await cyfs(order)).toEqual(expected)
})

test("select datetime after/before", async () => {
  // Run on Mac
  exec('touch -mt 201805041259.59 "test/dataset/holidays/Greenery Day.h"')
  exec('touch -mt 201805051259.59 "test/dataset/holidays/Children\'s Day.h"')
  exec('touch -mt 201807161259.59 "test/dataset/holidays/Marine Day.h"')
  exec('touch -mt 201808111259.59 "test/dataset/holidays/Mountain Day.h"')
  const order = yaml.load(`
  select:
    pattern: "test/dataset/holidays/**"
    include:
      datetime:
        mode: modify
        after: "2018-05-05 00:00:00.000"
        before: "2018-07-16 23:59:59.999"
  `)
  const expected = [
    "test/dataset/holidays/Children's Day.h",
    "test/dataset/holidays/Marine Day.h",
  ]
  expect(await cyfs(order)).toEqual(expected)
})

test("select date after/before exif", async () => {
  const order = yaml.load(`
  select:
    pattern: "test/dataset/photos/**"
    include:
      date:
        mode: exif
        after: "2013-01-04"
        before: "2013-01-06"
  `)
  const expected = [
    "test/dataset/photos/tg2_drip.jpg",
    "test/dataset/photos/tg2_pink.jpg",
  ]
  expect(await cyfs(order)).toEqual(expected)
})

test("select datetime after/before exif", async () => {
  const order = yaml.load(`
  select:
    pattern: "test/dataset/photos/**"
    include:
      datetime:
        mode: exif
        after: "2013-01-05 11:21:57.000"
        before: "2013-01-05 11:21:57.000"
  `)
  const expected = ["test/dataset/photos/tg2_drip.jpg"]
  expect(await cyfs(order)).toEqual(expected)
})

test("select preset emptydir", async () => {
  shell.mkdir("-p", "test/dataset/blankdir")
  const order = yaml.load(`
  select:
    pattern: "test/dataset/**"
    include:
      preset: emptydir
  `)
  const expected = ["test/dataset/blankdir"]
  expect(await cyfs(order)).toEqual(expected)
})
