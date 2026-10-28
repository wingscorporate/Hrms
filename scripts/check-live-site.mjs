import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const config={...process.env};
try { for(const line of readFileSync('.env.local','utf8').split(/\r?\n/)) {
  const match=line.match(/^([A-Z_]+)=(.*)$/);if(match&&!config[match[1]])config[match[1]]=match[2];
} } catch { /* CI may provide environment variables. */ }
const site=process.env.HRMS_CHECK_URL||'https://wingscorporate.github.io/Hrms/';
const browser=await chromium.launch({channel:process.platform==='win32'?'msedge':undefined,headless:true});
const page=await browser.newPage();
const errors=[];const failedAssets=[];
page.on('pageerror',error=>errors.push(error.message));
page.on('response',response=>{
  if(response.url().includes('/Hrms/assets/')&&response.status()>=400)failedAssets.push({url:response.url(),status:response.status()});
});
try {
  const response=await page.goto(`${site}?verification=${Date.now()}`,{waitUntil:'networkidle',timeout:60000});
  assert.equal(response.status(),200);
  await page.getByRole('heading',{name:'Wings Corporation',exact:true}).waitFor();
  await page.getByPlaceholder('Enter your account email').waitFor();
  await page.waitForFunction(()=>{
    const button=document.querySelector('button[type="submit"]');return button&&!button.disabled;
  });
  assert.equal(await page.getByRole('alert').count(),0,'Unexpected startup error');
  assert.deepEqual(failedAssets,[]);
  assert.deepEqual(errors,[]);
  console.log('PASS: Published site renders the existing Wings login, loads assets, and finishes Auth initialization without runtime errors.');
  const connection=await page.evaluate(async({url,key})=>{
    const auth=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key}});
    const anonymous=await fetch(`${url}/rest/v1/employees?select=id&limit=1`,{headers:{apikey:key}});
    return {authStatus:auth.status,anonymousEmployeeStatus:anonymous.status};
  },{url:config.VITE_SUPABASE_URL,key:config.VITE_SUPABASE_PUBLISHABLE_KEY});
  assert.equal(connection.authStatus,200);
  assert.ok([401,403].includes(connection.anonymousEmployeeStatus));
  console.log('PASS: Browser requests from the live origin reach Supabase Auth; anonymous employee access is rejected.',connection);
  await page.reload({waitUntil:'networkidle'});
  await page.getByPlaceholder('Enter your account email').waitFor();
  assert.deepEqual(errors,[]);
  console.log('PASS: Public login page reloads successfully. Authenticated administrator login and saved-record refresh require a private account session and are not verified by this smoke test.');
} finally { await browser.close(); }
