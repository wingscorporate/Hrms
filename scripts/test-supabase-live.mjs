import { readFileSync } from 'node:fs';
import { createInterface } from 'node:readline/promises';
import { Writable } from 'node:stream';
import { createClient } from '@supabase/supabase-js';

const verifyOnly=process.argv.includes('--verify-admin');
const expectedAdminEmail='wingscorporate1504@gmail.com';

// Run locally after provisioning. Credentials are prompted on this terminal,
// never passed as command-line arguments, written to disk, or printed in output.
if(!process.stdin.isTTY) throw new Error('Run this test in an interactive local terminal. Do not put passwords in command-line arguments.');
const config={...process.env};
try { for (const line of readFileSync('.env.local','utf8').split(/\r?\n/)) {
  const match=line.match(/^([A-Z_]+)=(.*)$/); if(match&&!config[match[1]]) config[match[1]]=match[2];
} } catch { /* Environment variables may be configured directly. */ }
if(!config.VITE_SUPABASE_PUBLISHABLE_KEY?.startsWith('sb_publishable_')) throw new Error('Configure the publishable key in .env.local first.');
let muted=false;
const output=new Writable({write(chunk,_encoding,callback){if(!muted)process.stdout.write(chunk);callback();}});
const prompt=createInterface({input:process.stdin,output,terminal:true});
const email=(await prompt.question(verifyOnly ? `Administrator email [${expectedAdminEmail}]: ` : 'Provisioned administrator email: ')).trim() || (verifyOnly ? expectedAdminEmail : '');
process.stdout.write('Password (hidden): '); muted=true;
let password=await prompt.question('');
muted=false; process.stdout.write('\n'); prompt.close();
const makeClient=()=>createClient(config.VITE_SUPABASE_URL,config.VITE_SUPABASE_PUBLISHABLE_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
let client=makeClient();
let companyId;
let created=false;
const id='connection-test-'+crypto.randomUUID();
async function login(){const {data,error}=await client.auth.signInWithPassword({email,password});if(error)throw new Error('Authentication failed. Check the email/password and profile provisioning.');return data.user;}
async function rpc(changes){const {error}=await client.rpc('apply_hrms_changes',{target_company:companyId,changes});if(error)throw new Error(error.message);}
async function read(){const {data,error}=await client.from('holidays').select('id,data,revision').eq('company_id',companyId).eq('id',id).maybeSingle();if(error)throw new Error(error.message);return data;}
try {
  const user=await login();
  const profile=await client.from('user_profiles').select('*').eq('id',user.id).single();
  if(profile.error||!['super_admin','hr'].includes(profile.data?.role))throw new Error('This test requires a provisioned HR or administrator account.');
  companyId=profile.data.company_id;
  if(verifyOnly) {
    if(user.email?.toLowerCase()!==expectedAdminEmail || profile.data.role!=='super_admin' || !profile.data.is_active) throw new Error('Expected the named administrator with an active super_admin profile.');
    const verified=await client.auth.getUser();
    if(verified.error||verified.data.user?.id!==user.id)throw new Error('Supabase did not validate the signed-in identity.');
    if(!verified.data.user.email_confirmed_at)throw new Error('Administrator email is not confirmed.');
    console.log('PASS: Supabase password sign-in and server-validated administrator identity.');
    const company=await client.from('companies').select('id,name').eq('id',companyId).single();
    if(company.error||company.data?.name!=='Wings Corporation')throw new Error('Wings company association is missing or incorrect.');
    const employee=await client.from('employees').select('id,data,department_id').eq('company_id',companyId).eq('id',profile.data.employee_id).single();
    if(employee.error||!employee.data?.data.status||['Deactivated','Inactive','Terminated','Resigned'].includes(employee.data.data.status))throw new Error('Linked employee is missing or inactive.');
    if(employee.data.department_id!==profile.data.department_id)throw new Error('Employee and profile departments do not match.');
    const settings=await client.from('company_settings').select('id').eq('company_id',companyId).single();
    if(settings.error)throw new Error('Company settings are missing or inaccessible.');
    console.log('PASS: Active super_admin profile, Wings company association, employee and settings access.');
    const tables=['departments','employees','attendance','leave_records','leave_balances','tasks','performance_reviews','payroll','documents','holidays','announcements','notifications','company_settings','audit_logs'];
    for(const table of tables) {
      const permitted=await client.from(table).select('id').eq('company_id',companyId).limit(1);
      if(permitted.error)throw new Error(`Cannot read ${table}: ${permitted.error.message}`);
      const outside=await client.from(table).select('id').neq('company_id',companyId).limit(1);
      if(outside.error||outside.data.length)throw new Error(`Company isolation check failed for ${table}.`);
    }
    await rpc([]);
    console.log('PASS: All HRMS module reads, company-isolation queries, and empty save RPC. No business records changed.');
    const signOut=await client.auth.signOut({scope:'local'});if(signOut.error)throw signOut.error;
    client=makeClient();const again=await login();
    const restored=await client.from('user_profiles').select('role,company_id').eq('id',again.id).single();
    if(restored.error||restored.data.role!=='super_admin'||restored.data.company_id!==companyId)throw new Error('Administrator access was not restored after sign-in.');
    console.log('PASS: Logout and a new authenticated session preserve administrator role and company binding.');
  } else {
  const record={id,name:'Temporary Supabase integration test',date:'2099-01-01',type:'Company Holiday',description:'Created and removed by the local live verification script.'};
  await rpc([{table:'holidays',id,operation:'insert',data:record,revision:null}]);created=true;
  if(!(await read()))throw new Error('Inserted record was not retrieved.');
  console.log('PASS: Authenticated create and retrieve.');
  await rpc([{table:'holidays',id,operation:'update',data:{...record,name:'Updated integration test'},revision:1}]);
  if((await read())?.data.name!=='Updated integration test')throw new Error('Update did not persist.');
  console.log('PASS: Update persisted.');
  const signOut=await client.auth.signOut({scope:'local'});if(signOut.error)throw signOut.error;
  client=makeClient();await login();
  if((await read())?.data.name!=='Updated integration test')throw new Error('Record disappeared across logout and a new client session.');
  console.log('PASS: Saved data survives logout and a new authenticated client session.');
  await rpc([{table:'holidays',id,operation:'delete',revision:2}]);created=false;
  if(await read())throw new Error('Deleted record still exists.');
  console.log('PASS: Delete persisted.');
  }
  const anon=await makeClient().from('employees').select('id').limit(1);
  if(!anon.error)throw new Error('Anonymous employee access unexpectedly succeeded.');
  console.log('PASS: Anonymous employee access denied.');
} catch(error) {
  console.error('FAIL:',error.message);process.exitCode=1;
} finally {
  if(created){try{const existing=await read();if(existing)await rpc([{table:'holidays',id,operation:'delete',revision:existing.revision}]);}catch{console.error('Cleanup needed: delete temporary holiday '+id+' using the HRMS Holidays page.');}}
  password='';await client.auth.signOut({scope:'local'});
}
