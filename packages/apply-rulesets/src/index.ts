import { applyRulesets } from './apply-rulesets.js';

try {
  await applyRulesets();
  console.log('Rulesets applied successfully.');
} catch (error) {
  console.log('Failed to apply rulesets.');
  throw error;
}
