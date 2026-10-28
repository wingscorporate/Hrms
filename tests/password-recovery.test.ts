import { test } from 'node:test';
import assert from 'node:assert/strict';
import { recoveryLinkState, recoveryRedirectUrl, validateNewPassword } from '../src/lib/passwordRecovery.ts';

test('recovery redirect is the exact GitHub Pages HTML file, not a missing SPA route',()=>{
  assert.equal(recoveryRedirectUrl,'https://wingscorporate.github.io/Hrms/reset-password.html');
});
test('only a complete recovery callback may open the password form',()=>{
  assert.equal(recoveryLinkState('#access_token=test&refresh_token=test&type=recovery','').hasRecoverySession,true);
  assert.equal(recoveryLinkState('#access_token=test&refresh_token=test&type=signup','').hasRecoverySession,false);
  assert.equal(recoveryLinkState('#type=recovery&access_token=test','').hasRecoverySession,false);
  assert.equal(recoveryLinkState('#error=access_denied&error_code=otp_expired','').hasError,true);
});
test('new password is validated without trimming or changing its characters',()=>{
  assert.match(validateNewPassword('short','short'),/12 characters/);
  assert.match(validateNewPassword('A-new-long-password','different-password'),/do not match/);
  assert.equal(validateNewPassword('  A-new-long-password  ','  A-new-long-password  '),'');
});
