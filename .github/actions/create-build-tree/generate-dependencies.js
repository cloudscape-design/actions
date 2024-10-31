// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import 'dotenv/config';
import { Octokit } from '@octokit/rest';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const OUTPUT_DIR = 'dist';
const ORG_NAME = 'cloudscape-design';
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function getPackageJsonContent(data) {
  return 'content' in data && typeof data.content === 'string'
    ? Buffer.from(data.content, 'base64').toString('utf-8')
    : null;
}

async function fetchRepositoriesInOrg(orgName) {
  const response = await octokit.rest.repos.listForOrg({
    org: orgName,
    type: 'public',
    per_page: 100,
  });

  return response.data.map(repo => repo.name);
}

async function fetchPackageJson(owner, repo) {
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path: 'package.json',
  });
  const content = getPackageJsonContent(data);

  if (content) {
    return JSON.parse(content);
  } else {
    console.warn(`Invalid response for ${owner}/${repo}/package.json`);
    return null;
  }
}

async function main() {
  const allRepositories = await fetchRepositoriesInOrg(ORG_NAME);
  console.log(`Repositories found in org ${ORG_NAME}:`, allRepositories);

  const dependenciesMap = {};
  const dependentMap = {};

  const filterByCloudscape = dep => dep.startsWith('@cloudscape-design');
  const transformToRepoName = dep => dep.slice(1);

  for (const repo of allRepositories.filter(repo => !repo.includes('.') && repo !== 'actions')) {
    console.log(`Fetching package.json for ${ORG_NAME}/${repo}...`);
    const packageJson = await fetchPackageJson(ORG_NAME, repo);

    if (!packageJson) {
      continue;
    }

    const dependencies = Object.keys(packageJson.dependencies || {})
      .filter(filterByCloudscape)
      .map(transformToRepoName);
    const devDependencies = Object.keys(packageJson.devDependencies || {})
      .filter(filterByCloudscape)
      .map(transformToRepoName);

    const repoKey = `${ORG_NAME}/${repo}`;
    dependenciesMap[repoKey] = [...dependencies, ...devDependencies];

    for (const dep of [...dependencies, ...devDependencies]) {
      if (!dependentMap[dep]) {
        dependentMap[dep] = [];
      }

      dependentMap[dep].push(repoKey);
    }
  }

  await fs.writeFile(path.join(OUTPUT_DIR, 'dependencies.json'), JSON.stringify(dependenciesMap, null, 2));
  console.log('Dependencies map saved to dependencies.json');

  await fs.writeFile(path.join(OUTPUT_DIR, 'dependents.json'), JSON.stringify(dependentMap, null, 2));
  console.log('Dependent map saved to dependents.json');

  return dependenciesMap;
}

console.log('Generating dependencies map...');
await main();
console.log('Done!');
