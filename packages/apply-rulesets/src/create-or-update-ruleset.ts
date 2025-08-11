import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import { GH_ORG } from './constants.js';

export interface RulesetParams {
  name: string;
  repos: string[];
  rules: RestEndpointMethodTypes['repos']['updateOrgRuleset']['parameters']['rules'];
  level: 'repo' | 'org';
}

type LevelRulesetParams = Omit<RulesetParams, 'level'> & {
  octokit: Octokit;
};

async function createOrUpdateRepoRuleset({ name, repos, rules, octokit }: LevelRulesetParams) {
  const tasks = repos.map(async repo => {
    const { data: rulesets } = await octokit.rest.repos.getRepoRulesets({ repo, owner: GH_ORG });
    const ruleset_id = rulesets.find(ruleset => ruleset.name === name)?.id;

    type BaseParams = RestEndpointMethodTypes['repos']['createRepoRuleset']['parameters'];
    const baseParams: BaseParams = {
      enforcement: 'active',
      repo,
      owner: GH_ORG,
      name,
      rules,
      target: 'branch',
      conditions: {
        ref_name: {
          include: ['~DEFAULT_BRANCH'],
          exclude: []
        },
      },
    };

    if (ruleset_id) {
      await octokit.rest.repos.updateRepoRuleset({ ...baseParams, ruleset_id });
    } else {
      await octokit.rest.repos.createRepoRuleset(baseParams);
    }
  });

  await Promise.all(tasks);
}

async function createOrUpdateOrgRuleset({ name, repos, rules, octokit }: LevelRulesetParams) {
  const { data: rulesets } = await octokit.rest.repos.getOrgRulesets({ org: GH_ORG });

  type BaseParams = RestEndpointMethodTypes['repos']['createOrgRuleset']['parameters'];
  const baseParams: BaseParams = {
    enforcement: 'active',
    name,
    org: GH_ORG,
    target: 'branch',
    conditions: {
      ref_name: {
        include: ['~DEFAULT_BRANCH'],
        exclude: [],
      },
      repository_name: {
        include: repos,
        exclude: [],
      },
    },
    rules,
  };

  const ruleset_id = rulesets.find(ruleset => ruleset.name === name)?.id;
  if (ruleset_id) {
    await octokit.rest.repos.updateOrgRuleset({ ...baseParams, ruleset_id });
  } else {
    await octokit.rest.repos.createOrgRuleset(baseParams);
  }
}

export async function createOrUpdateRuleset({ name, repos, rules, level = 'org' }: RulesetParams) {
  const token = process.env.GH_ORG_TOKEN;
  const octokit = new Octokit({ auth: token });
  const params: LevelRulesetParams = { name, repos, rules, octokit };

  switch (level) {
    case 'org':
      return await createOrUpdateOrgRuleset(params);
    case 'repo':
      return await createOrUpdateRepoRuleset(params);
  }
}
