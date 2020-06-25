const path = require('path')
const fs = require('fs')

var appDirectory = fs.realpathSync(process.cwd());

function resolveApp(relativePath) {
  return path.resolve(appDirectory, relativePath);
}

module.exports = {
  src: resolveApp('src'),
  icons: resolveApp('src/icons'),
  index: resolveApp('src/index.js'),
  dist: resolveApp('dist')
}
