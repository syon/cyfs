import Renamer from "renamer"

const renamer = new Renamer()

const opts = {
  dryRun: true,
  find: /^(F.*)/,
  replace: "PREMIUM-$1",
  files: [
    "test/dataset/week/Friday.log",
    "test/dataset/week/Monday.log",
    "test/dataset/week/Saturday.log",
    "test/dataset/week/Sunday.log",
    "test/dataset/week/Thursday.log",
    "test/dataset/week/Tuesday.log",
    "test/dataset/week/Wednesday.log",
  ],
}

await renamer.rename(opts)
