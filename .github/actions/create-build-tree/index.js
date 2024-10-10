const fs = require('node:fs');
const { buildDependencyGroupsForPackage } = require('./build-tree');

const packageName = process.env.INPUT_PACKAGE;

async function generateBuildMatrix(packageName) {
  console.log('Creating dependency groups for package', packageName);
  const groups = await buildDependencyGroupsForPackage(packageName);
  let matrix = [];

  for (const level in groups) {
    for (const packageName of groups[level]) {
      matrix.push({ package: packageName });
    }
  }

  return matrix;
}

generateBuildMatrix(packageName).then(matrix => {
  const output = JSON.stringify(matrix);
  const outputFilePath = process.env.GITHUB_OUTPUT;

  if (outputFilePath) {
    fs.appendFileSync(outputFilePath, `matrix=${output}\n`);
  } else {
    console.error('GITHUB_OUTPUT is not defined.');
  }
});
