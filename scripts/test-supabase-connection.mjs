import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

// Connectivity only: never weakens RLS or inserts test data into a production company.
const config={...process.env};
if (existsSync('.env.local')) for (const line of readFileSync('.env.local','utf8').split(/\r?\n/)) {
  const match=line.match(/^([A-Z_]+)=(.*)$/); if(match && !config[match[1]]) config[match[1]]=match[2];
}
const url=config.VITE_SUPABASE_URL;
const key=config.VITE_SUPABASE_PUBLISHABLE_KEY;
if(!url || !key?.startsWith('sb_publishable_')) throw new Error('Configure the project URL and publishable key in .env.local.');
const auth=await fetch(`${url}/auth/v1/settings`,{headers:{apikey:key}});
if(!auth.ok) throw new Error(`Supabase Auth connectivity failed: HTTP ${auth.status}`);
console.log(`PASS: Supabase Auth endpoint reachable (HTTP ${auth.status}); publishable key accepted.`);
const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
const {error}=await client.from('employees').select('id').limit(1);
if(!error) throw new Error('Anonymous employee SELECT unexpectedly succeeded. Review table grants and RLS.');
if(error.code==='PGRST205') {
  console.log('PENDING: HRMS tables do not exist yet. Run the migration in Supabase SQL Editor.');
  process.exitCode=2;
} else if(error.code==='42501') console.log('PASS: Anonymous access to employees is denied.');
else throw new Error(`Unexpected database response: ${error.code} ${error.message}`);
