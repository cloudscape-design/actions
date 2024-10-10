const packageName = process.env.INPUT_PACKAGE;

async function generateBuildMatrix() {
  const groups = await buildDependencyGroupsForPackage('modified-package-name');
  let matrix = [];

  for (const level in groups) {
    for (const packageName of groups[level]) {
      matrix.push({ package: packageName });
    }
  }

  console.log(`::set-output name=matrix::${JSON.stringify(matrix)}`);
}

generateBuildMatrix();