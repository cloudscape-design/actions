import { BASIC_CHECKS, CODECOV_CHECKS, CODECOV_REPOS, DRY_RUN_CHECKS, DRY_RUN_REPOS } from './constants.js';
import { createOrUpdateRuleset } from './create-or-update-ruleset.js';

export async function applyRulesets() {
  await createOrUpdateRuleset({
    // We'll roll out repositories slowly over time to avoid operational load.
    // As we roll out to a repo, the branch protection rules will be deleted for that repo.
    // The value will be eventually replaced with ['~ALL'] at the end of the roll-out
    repos: ['actions', 'test-utils', 'demos', 'components'],

    name: 'Basic rulesets',
    rules: [
      {
        type: 'pull_request',
        parameters: {
          require_code_owner_review: false,
          require_last_push_approval: true,
          required_approving_review_count: 1,
          required_review_thread_resolution: false,
          allowed_merge_methods: ['merge'],
          dismiss_stale_reviews_on_push: true,
        },
      },
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: BASIC_CHECKS.map(context => ({ context })),
        },
      },
    ],
  });

  await createOrUpdateRuleset({
    name: 'Code-cov rulesets',
    repos: CODECOV_REPOS,
    rules: [
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: CODECOV_CHECKS.map(context => ({ context })),
        },
      },
    ],
  });

  await createOrUpdateRuleset({
    name: 'Dry-run rulesets',
    repos: DRY_RUN_REPOS,
    rules: [
      {
        type: 'required_status_checks',
        parameters: {
          strict_required_status_checks_policy: true,
          required_status_checks: DRY_RUN_CHECKS.map(context => ({ context })),
        },
      },
    ],
  });
}
