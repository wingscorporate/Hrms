import { test } from 'node:test';
import assert from 'node:assert/strict';
import { emptyData, changesBetween } from '../src/lib/hrmsDatabase.ts';
import { validateSupabaseConfig } from '../src/lib/supabase.ts';

test('database diff sends only edited rows and preserves nested employee data', () => {
  const before=emptyData();
  before.departments=[{id:'dept',name:'HR',code:'HR',description:'',isActive:true,createdAt:'2026-01-01'}];
  const after=structuredClone(before);
  after.departments[0].name='Human Resources';
  const changes=changesBetween(before,after,'company',{'departments/dept':7});
  assert.deepEqual(changes,[{table:'departments',id:'dept',operation:'update',data:after.departments[0],revision:7}]);
  assert.equal(before.departments[0].name,'HR');
});

test('unchanged startup data never writes or seeds records', () => {
  const data=emptyData();
  assert.deepEqual(changesBetween(data,structuredClone(data),'company',{}),[]);
});

test('leave balances are employee keyed and audit payloads cannot be uploaded', () => {
  const before=emptyData(); const after=emptyData();
  after.leaveBalances.employee={casual:{allocated:12,used:0},sick:{allocated:10,used:0},paid:{allocated:18,used:0},wfh:{allocated:24,used:0}};
  after.auditLogs=[{id:'forged'} as any];
  const changes=changesBetween(before,after,'company',{});
  assert.equal(changes.length,1);
  assert.equal(changes[0].table,'leave_balances');
  assert.equal(changes[0].id,'employee');
});

test('missing configuration and privileged keys are rejected before creating a client', () => {
  assert.match(validateSupabaseConfig(undefined,undefined),/not configured/);
  assert.match(validateSupabaseConfig('https://project.supabase.co','sb_secret_example'),/never a secret/);
  assert.match(validateSupabaseConfig('https://project.supabase.co','eyJhbGciOi-service-role'),/never a secret/);
  assert.equal(validateSupabaseConfig('https://project.supabase.co','sb_publishable_example'),'');
});
