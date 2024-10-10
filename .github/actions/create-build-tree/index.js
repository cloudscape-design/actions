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
  const outputFilePath = process.env.GITHUB_OUTPUT;

  if (!outputFilePath) {
    throw new Error(`Missing file at path: ${outputFilePath}`)
  }

  const output = JSON.stringify(matrix);
  console.log('Build matrix json', output);
  fs.appendFileSync(outputFilePath, `matrix=${output}\n`, { encoding: 'utf8' });
});
