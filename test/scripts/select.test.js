const cyfs = require("../../")
const yaml = require("js-yaml")
const shell = require("shelljs")
const rimraf = require("rimraf")

test("select name contain", () => {
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
  expect(cyfs(order)).toEqual(expected)
})

test("select regex", () => {
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
  expect(cyfs(order)).toEqual(expected)
})

test("select size min/max", () => {
  rimraf.sync("test/dataset/blankdir")
  shell.mkdir("test/dataset/blankdir")
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
  expect(cyfs(order)).toEqual(expected)
})

test("select preset emptydir", () => {
  shell.mkdir("-p", "test/dataset/blankdir")
  const order = yaml.safeLoad(`
  select:
    pattern: "test/dataset/**"
    include:
      preset: emptydir
  `)
  const expected = ["test/dataset/blankdir"]
  expect(cyfs(order)).toEqual(expected)
})
