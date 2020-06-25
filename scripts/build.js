const svgr = require("@svgr/core").default;
const svgrRollup = require('@svgr/rollup').default
const rollup = require("rollup");
const commonjs = require('@rollup/plugin-commonjs')
const resolve = require('@rollup/plugin-node-resolve').default
const babel = require('@rollup/plugin-babel').default;
const external = require('rollup-plugin-peer-deps-external')
const fs = require("fs-extra");
const path = require("./paths");

const upperFirst = word => `${word[0].toUpperCase()}${word.slice(1)}`;

const getIcons = async () => {
  const filenames = await new Promise(resolve =>
    fs.readdir(path.icons, (err, filenames) => resolve(filenames))
  );
  const icons = filenames.map(filename => ({
    name: filename
      .split(".")[0]
      .split("-")
      .map(upperFirst)
      .join(""),
    svg: fs.readFileSync(`${path.icons}/${filename}`, { encoding: "utf8" })
  }));
  return icons;
};

const convertToSVGR = async icons => {
  const iconPromises = icons.map(icon =>
    svgr(
      icon.svg,
      {
        dimensions: false,
        svgProps: { fill: "currentColor" }
      },
      { componentName: icon.name }
    )
  );
  const converted = await Promise.all(iconPromises);
  const newIcons = icons.map(({ name }, i) => ({ name: `${name}.js`, svg: converted[i] }));
  return newIcons;
};

const writeIconsToFile = icons => {
  if (!fs.existsSync(`${path.src}/react`)){
    fs.mkdirSync(`${path.src}/react`);
  }
  icons.forEach(icon => {
    fs.writeFileSync(`${path.src}/react/${icon.name}`, icon.svg)
  })
}

const build = async () => {
  fs.emptyDirSync(path.dist);
  const rawIcons = await getIcons();
  const icons = await convertToSVGR(rawIcons);
  await writeIconsToFile(icons);
  try {
    const bundle = await rollup.rollup({
      external: ['react', 'react-dom'],
      input: icons.map(icon => `${path.src}/react/${icon.name}`),
      plugins: [
        external(),
        babel({
          exclude: 'node_modules/**',
          babelHelpers: 'bundled',
          "presets": [
            ["@babel/preset-env", {"modules": false}],
            "@babel/preset-react"
          ],
          "plugins": [
            "@babel/plugin-proposal-object-rest-spread"
          ]
        }),
        svgrRollup(),
        resolve(),
        commonjs()
      ]
    });
    bundle.write({
      dir: path.dist + '/cjs',
      format: "cjs",
      sourcemap: true
    })
    bundle.write({
      dir: path.dist,
      format: 'es',
      sourcemap: true
    })
  } catch (e) {
    console.error(e)
  }
};

build();
