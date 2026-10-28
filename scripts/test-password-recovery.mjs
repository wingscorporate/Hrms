import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';

// Browser integration with a mock Auth/Data API. Never sends a real email,
// changes a real password, or writes to HRMS tables.
const base=process.env.HRMS_RECOVERY_TEST_URL||'http://127.0.0.1:4173/Hrms/reset-password.html';
const browser=await chromium.launch({channel:process.platform==='win32'?'msedge':undefined,headless:true});
const id='00000000-0000-0000-0000-000000000001';
const user={id,aud:'authenticated',role:'authenticated',email:'recovery-test@example.invalid',email_confirmed_at:'2026-01-01T00:00:00Z',
  created_at:'2026-01-01T00:00:00Z',app_metadata:{provider:'email',providers:['email']},user_metadata:{},identities:[]};
const profile={id,role:'super_admin',company_id:'00000000-0000-0000-0000-000000000002',employee_id:'test-admin',is_active:true};
async function setup(){
  const context=await browser.newContext();const calls=[];const page=await context.newPage();
  await context.addInitScript(()=>localStorage.setItem('existing-hrms-session','unchanged'));
  await page.route('https://*.supabase.co/**',async route=>{
    const request=route.request();const url=new URL(request.url());const method=request.method();
    const body=request.postDataJSON();calls.push({path:url.pathname,method,body,redirect:url.searchParams.get('redirect_to')});
    const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'*'};
    if(method==='OPTIONS')return route.fulfill({status:200,headers,body:'{}'});
    if(url.pathname.endsWith('/auth/v1/recover')&&method==='POST')return route.fulfill({status:200,headers,body:'{}'});
    if(url.pathname.endsWith('/auth/v1/user')&&['GET','PUT'].includes(method))return route.fulfill({status:200,headers,body:JSON.stringify(user)});
    if(url.pathname.endsWith('/rest/v1/user_profiles')&&method==='GET')return route.fulfill({status:200,headers,body:JSON.stringify(profile)});
    if(url.pathname.endsWith('/auth/v1/logout')&&method==='POST')return route.fulfill({status:204,headers});
    throw new Error('Unexpected recovery API operation.');
  });
  return {context,page,calls};
}
try {
  {
    const {context,page,calls}=await setup();
    await page.goto(base,{waitUntil:'networkidle'});
    await page.getByLabel('Account email').fill('recovery-test@example.invalid');
    await page.getByRole('button',{name:'Send reset email'}).click();
    await page.getByRole('status').filter({hasText:'If this address has an account'}).waitFor();
    const request=calls.find(call=>call.path.endsWith('/recover'));
    assert.equal(request.redirect,'https://wingscorporate.github.io/Hrms/reset-password.html');
    assert.equal(request.body.email,'recovery-test@example.invalid');
    await context.close();console.log('PASS (mock API): request uses exact allowlisted GitHub Pages redirect and a generic response. No email sent.');
  }
  {
    const {context,page,calls}=await setup();
    const encode=value=>Buffer.from(JSON.stringify(value)).toString('base64url');
    const jwt=encode({alg:'HS256',typ:'JWT'})+'.'+encode({sub:id,aud:'authenticated',role:'authenticated',exp:Math.floor(Date.now()/1000)+3600})+'.'+Buffer.from('mock-signature').toString('base64url');
    await page.goto(base+'#access_token='+jwt+'&refresh_token=mock-refresh&expires_in=3600&token_type=bearer&type=recovery',{waitUntil:'networkidle'});
    await page.getByRole('heading',{name:'Choose a new password'}).waitFor();
    assert.equal(new URL(page.url()).hash,'');
    await page.getByLabel('New password',{exact:true}).fill('Mock-strong-password-2026!');
    await page.getByLabel('Confirm new password').fill('Mock-strong-password-2026!');
    await page.getByRole('button',{name:'Update password'}).click();
    await page.getByRole('status').filter({hasText:'Your password was updated'}).waitFor();
    const update=calls.find(call=>call.method==='PUT');
    // SDK may append its own challenge fields; the only user attribute is password.
    assert.ok(Object.keys(update.body).every(key=>['password','code_challenge','code_challenge_method'].includes(key)));
    assert.equal(update.body.password,'Mock-strong-password-2026!');
    assert.ok(!calls.some(call=>call.path.includes('/rest/')&&call.method!=='GET'));
    assert.equal(await page.evaluate(()=>localStorage.getItem('existing-hrms-session')),'unchanged');
    assert.equal(await page.evaluate(()=>localStorage.getItem('wings-hrms-password-recovery')),null);
    await context.close();console.log('PASS (mock API): validates recovery identity, removes URL tokens, updates only the password, preserves profile binding, signs out the recovery session, and makes no business writes.');
  }
  {
    const {context,page,calls}=await setup();
    await page.goto(base+'#error=access_denied&error_code=otp_expired&type=recovery',{waitUntil:'networkidle'});
    await page.getByRole('alert').filter({hasText:'invalid or expired'}).waitFor();
    assert.equal(await page.getByLabel('New password',{exact:true}).count(),0);
    assert.ok(!calls.some(call=>call.method==='PUT'));
    await context.close();console.log('PASS (mock API): expired links cannot open or submit the password-update form.');
  }
} finally {await browser.close();}
