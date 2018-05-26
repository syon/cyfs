# cyfs

🌀 cyfs :: Cyclone in file system. Order based file handling Node.js module.

## overview

<dl>
  <dt>select</dt>
  <dd>get selected files</dd>
  <dt>delete</dt>
  <dd>delete selected files</dd>
  <dt>rename</dt>
  <dd>rename selected files (filename only)</dd>
  <dt>fetch</dt>
  <dd>copy selected files and keep the tree</dd>
  <dt>chronicle</dt>
  <dd>restructure files to timestamp-based path</dd>
  <dt>copy</dt>
  <dd>copy selected files as you like (dirname can be changed)</dd>
  <dt>move</dt>
  <dd>move selected files as you like (dirname can be changed)</dd>
</dl>

## install

```bash
$ npm install cyfs
```

## usage

### select

* https://github.com/isaacs/node-glob#options

```js
const cyfs = require("cyfs")

const order = {
  select: {
    pattern: "Photos Library.photoslibrary/Masters/**/*.mov",
    options: {
      cwd: "/Users/syon/Pictures",
    },
  },
}

const selected = cyfs(order)
/*
Photos Library.photoslibrary/Masters/2018/02/02/20180201-120000/IMG_0022.MOV
Photos Library.photoslibrary/Masters/2018/03/03/20180301-120000/IMG_0103.MOV
Photos Library.photoslibrary/Masters/2018/04/04/20180401-120000/IMG_0144.MOV
Photos Library.photoslibrary/Masters/2018/05/05/20180501-120000/IMG_0205.MOV
Photos Library.photoslibrary/Masters/2018/06/06/20180601-120000/IMG_0360.MOV
*/
```

### delete

```js
const cyfs = require("cyfs")

const order = {
  select: {
    pattern: "**/*.log",
    name: {
      regex: {
        pattern: "^may-20..",
        flags: "gi",
      },
      contain: ["debug", "warn", "error"],
    },
    size: {
      min: 1000,
      max: "3MB",
    },
  },
  action: {
    do: "delete",
  },
}

const deleted = cyfs(order, { preview: true })
/*
path/to/May-2018_access.debug.log
path/to/May-2018_access.warn.log
path/to/May-2018_access.error.log
*/
```

### rename

#### RegEx

```js
const order = {
  select: {
    pattern: "test/dataset/week/*.log",
  },
  action: {
    do: "rename",
    args: {
      regex: true,
      find: "^F",
      replace: "PREMIUM-F",
    },
  },
}

const result = cyfs(order, { preview: true })
/*
test/dataset/week/PREMIUM-Friday.log
*/
```

#### Append timestamp (file modified time)

- https://momentjs.com/docs/#/parsing/special-formats/

```js
const order = {
  select: {
    pattern: "test/dataset/holidays/*",
  },
  action: {
    do: "rename",
    args: {
      timestamp: {
        format: "YYYYMMDD - ",
        /* Remove original filename */
        // only: true
      },
    },
  },
}

const result = cyfs(order, { preview: true })
/*
test/dataset/holidays/20180505 - Children\'s Day.h
test/dataset/holidays/20180504 - Greenery Day.h
test/dataset/holidays/20180716 - Marine Day.h
test/dataset/holidays/20180811 - Mountain Day.h
*/
```

### fetch

```js
const cyfs = require("cyfs")

const order = {
  select: {
    pattern: "Photos Library.photoslibrary/Masters/2018/**/*.mov",
    options: {
      cwd: "/Users/syon/Pictures",
    },
  },
  action: {
    do: "fetch",
    args: {
      baseDir: "Photos Library.photoslibrary/Masters/2018",
      destDir: "2018-movies",
    },
  },
}

const fetched = cyfs(order)
/*
2018-movies/02/02/20180201-120000/IMG_0022.MOV
2018-movies/03/03/20180301-120000/IMG_0103.MOV
2018-movies/04/04/20180401-120000/IMG_0144.MOV
2018-movies/05/05/20180501-120000/IMG_0205.MOV
2018-movies/06/06/20180601-120000/IMG_0360.MOV
*/
```

### chronicle

```js
const cyfs = require("cyfs")

const order = {
  select: {
    pattern: "Photos Library.photoslibrary/Masters/2018/**/*.mov",
    options: {
      cwd: "/Users/syon/Pictures",
    },
  },
  action: {
    do: "chronicle",
    args: {
      baseDir: "Photos Library.photoslibrary/Masters/2018",
      destDir: "2018-movies",
      // https://momentjs.com/docs/#/parsing/string/
      destFormat: "YYYY/MM/DD",
    },
  },
}

const fetched = cyfs(order)
/*
2018-movies/2018/02/01/IMG_0022.MOV
2018-movies/2018/03/01/IMG_0103.MOV
2018-movies/2018/04/01/IMG_0144.MOV
2018-movies/2018/05/01/IMG_0205.MOV
2018-movies/2018/06/01/IMG_0360.MOV
*/
```

### copy / move

```js
const cyfs = require("cyfs")

const order = {
  select: {
    pattern: "test/dataset/colors/*",
  },
  action: {
    do: "copy", // "move"
    args: {
      find: "dataset/colors/(.*).txt",
      replace: "market/$1-ocean.txt",
    },
  },
}

const result = cyfs(order, { preview: true })
/*
test/market/blue-ocean.txt
test/market/green-ocean.txt
test/market/red-ocean.txt
*/
```

## order scheme

```yaml
select:
  pattern: "path/of/glob/**"
  options:
    cwd: "/Users/syon/Pictures"
    dot: true
    nodir: true
    nocase: true
  include:
    name:
      regex:
        pattern: "(JPG|PNG)$"
        flags: gi
      contain:
        - IMG
        - DSC
    size:
      min: 1000,
      max: "5MB",
    date:
      mode: modify
      after: 2000-01-01
      before: 2000-12-31
    datetime:
      mode: modify
      after: "2000-01-01 00:00:00.000"
      before: "2000-12-31 23:59:59.999"
action:
  do: select|delete|rename|fetch|chronicle|copy|move
  args: <object>
```

### select.pattern

https://github.com/isaacs/node-glob#glob-primer

### select.options

https://github.com/isaacs/node-glob#options

- (default)
  - __dot__: `true`
  - __nodir__: `true`
  - __nocase__: `true`

### select.include.date

https://momentjs.com/docs/#/query/is-same-or-before/

- __mode__:
  - `exif` | `access` | `modify` | `change` | `birth`
- __after__
  - `YYYY-MM-DD`
- __before__
  - `YYYY-MM-DD`

### select.include.datetime

https://momentjs.com/docs/#/parsing/string/

- __mode__:
  - `exif` | `access` | `modify` | `change` | `birth`
- __after__
  - `YYYY-MM-DD HH:mm:ss.SSS`
- __before__
  - `YYYY-MM-DD HH:mm:ss.SSS`
