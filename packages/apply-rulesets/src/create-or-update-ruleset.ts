import { Octokit, type RestEndpointMethodTypes } from '@octokit/rest';
import { GH_ORG } from './constants.js';

export interface RulesetParams {
  name: string;
  repos: string[];
  rules: RestEndpointMethodTypes['repos']['updateOrgRuleset']['parameters']['rules'];
}

type BaseParams = RestEndpointMethodTypes['repos']['createOrgRuleset']['parameters'];

export async function createOrUpdateRuleset({ name, repos, rules }: RulesetParams) {
  const token = process.env.GH_ORG_TOKEN;
  const octokit = new Octokit({ auth: token });
  const { data: rulesets } = await octokit.rest.repos.getOrgRulesets({ org: GH_ORG });

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
