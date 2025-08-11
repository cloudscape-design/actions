import { BASIC_CHECKS, BASIC_REPOS, CODECOV_CHECKS, CODECOV_REPOS, DRY_RUN_CHECKS, DRY_RUN_REPOS, MERGE_QUEUE_REPOS } from './constants.js';
import { createOrUpdateRuleset } from './create-or-update-ruleset.js';

export async function applyRulesets() {
  await createOrUpdateRuleset({
    repos: BASIC_REPOS,
    name: 'Basic rulesets',
    rules: [
      {
        type: 'required_linear_history',
      },
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

  await createOrUpdateRuleset({
    name: 'Merge-queue ruleset',
    repos: MERGE_QUEUE_REPOS,
    rules: [
      {
        type: 'merge_queue',
        parameters: {
          merge_method: 'SQUASH',
          max_entries_to_build: 5,
          min_entries_to_merge: 1,
          min_entries_to_merge_wait_minutes: 5,
          max_entries_to_merge: 1,
          check_response_timeout_minutes: 60,
          grouping_strategy: 'ALLGREEN'
        }
      }
    ]
  });
};
