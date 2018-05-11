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
  <dt>copy</dt>
  <dd>copy selected files as you like (dirname can be changed)</dd>
  <dt>move</dt>
  <dd>move selected files as you like (dirname can be changed)</dd>
</dl>

## install

```bash
$ npm install syon/cyfs
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
      nocase: true,
    },
  },
}

const selected = cyfs(order)
/*
[ 'Photos Library.photoslibrary/Masters/2018/02/02/20180201-120000/IMG_0022.MOV',
  'Photos Library.photoslibrary/Masters/2018/03/03/20180301-120000/IMG_0103.MOV',
  'Photos Library.photoslibrary/Masters/2018/04/04/20180401-120000/IMG_0144.MOV',
  'Photos Library.photoslibrary/Masters/2018/05/05/20180501-120000/IMG_0205.MOV',
  'Photos Library.photoslibrary/Masters/2018/06/06/20180601-120000/IMG_0360.MOV' ]
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
      max: 3000000,
    },
  },
  action: {
    do: "delete",
  },
}

const deleted = cyfs(order, { preview: true })
/*
[ 'path/to/May-2018_access.debug.log',
  'path/to/May-2018_access.warn.log',
  'path/to/May-2018_access.error.log' ]
*/
```

### rename

```js
const order = {
  select: {
    pattern: "test/dataset/week/*.log",
  },
  action: {
    do: "rename",
    options: {
      regex: true,
      find: "^F",
      replace: "PREMIUM-F",
    },
  },
}

const result = cyfs(order, { preview: true })
/*
Results {
  list:
   [ Result {
       before: 'test/dataset/week/Friday.log',
       after: 'test/dataset/week/PREMIUM-Friday.log',
       renamed: true },
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
      nocase: true,
    },
  },
  action: {
    do: "fetch",
    options: {
      baseDir: "Photos Library.photoslibrary/Masters/2018",
      destDir: "2018-movies",
    },
  },
}

const fetched = cyfs(order)
/*
[ { src: 'Photos Library.photoslibrary/Masters/2018/02/02/20180201-120000/IMG_0022.MOV',
    dest: '2018-movies/02/02/20180201-120000/IMG_0022.MOV' },
  { src: 'Photos Library.photoslibrary/Masters/2018/03/03/20180301-120000/IMG_0103.MOV',
    dest: '2018-movies/03/03/20180301-120000/IMG_0103.MOV' },
  { src: 'Photos Library.photoslibrary/Masters/2018/04/04/20180401-120000/IMG_0144.MOV',
    dest: '2018-movies/04/04/20180401-120000/IMG_0144.MOV' },
  { src: 'Photos Library.photoslibrary/Masters/2018/05/05/20180501-120000/IMG_0205.MOV',
    dest: '2018-movies/05/05/20180501-120000/IMG_0205.MOV' },
  { src: 'Photos Library.photoslibrary/Masters/2018/06/06/20180601-120000/IMG_0360.MOV',
    dest: '2018-movies/06/06/20180601-120000/IMG_0360.MOV' } ]
*/
```
