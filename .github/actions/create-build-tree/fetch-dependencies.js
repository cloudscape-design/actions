const { Octokit } = require('@octokit/rest');

const ORG_NAME = 'cloudscape-design';
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function getPackageJsonContent(data) {
  return 'content' in data && typeof data.content === 'string'
    ? Buffer.from(data.content, 'base64').toString('utf-8')
    : null;
}

async function fetchRepositoriesInOrg(orgName) {
  try {
    const response = await octokit.rest.repos.listForOrg({
      org: orgName,
      type: 'public',
      per_page: 100,
    });
    return response.data.map(repo => repo.name);
  } catch (error) {
    console.error(`Error fetching repositories for org ${orgName}:`, error);
    return [];
  }
}

async function fetchPackageJson(owner, repo) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: 'package.json',
    });
    const content = getPackageJsonContent(data);
    if (content) {
      return JSON.parse(content);
    } else {
      console.error(`Invalid response for ${owner}/${repo}/package.json`);
      return null;
    }
  } catch (error) {
    console.error(`Failed to fetch package.json for ${owner}/${repo}:`, error);
    return null;
  }
}

export async function fetchAllDependencies() {
  const allRepositories = await fetchRepositoriesInOrg(ORG_NAME);
  console.log(`Repositories found in org ${ORG_NAME}:`, allRepositories);

  const dependenciesMap = {};
  const dependentMap = {};
  const allPackagesMap = {};
  const filterByCloudscape = dep => dep.startsWith('@cloudscape-design');

  for (const repo of allRepositories.filter(repo => !repo.includes('.') && repo !== 'actions')) {
    console.log(`Fetching package.json for ${ORG_NAME}/${repo}...`);
    const packageJson = await fetchPackageJson(ORG_NAME, repo);

    if (packageJson) {
      const dependencies = Object.keys(packageJson.dependencies || {}).filter(filterByCloudscape);
      const devDependencies = Object.keys(packageJson.devDependencies || {}).filter(filterByCloudscape);
      const repoKey = `@${ORG_NAME}/${repo}`;
      dependenciesMap[repoKey] = [...dependencies, ...devDependencies];

      for (const dep of [...dependencies, ...devDependencies]) {
        if (!dependentMap[dep]) {
          dependentMap[dep] = [];
        }
        dependentMap[dep].push(repoKey);
        allPackagesMap[dep] = true;
      }
    }
  }

  return { dependenciesMap, dependentMap, allPackagesMap };
}
