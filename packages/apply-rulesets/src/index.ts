import { applyRulesets } from './apply-rulesets.ts';

try {
  await applyRulesets();
  console.log('Rulesets applied successfully.');
} catch (error) {
  console.log('Failed to apply rulesets.');
  throw error;
}
