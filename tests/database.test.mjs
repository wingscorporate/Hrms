import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { PGlite } from '@electric-sql/pglite';

// A real embedded PostgreSQL engine. Only Supabase's managed auth/storage schemas
// are shimmed; the application migration, RLS, grants, triggers and RPC run unchanged.
test('HRMS PostgreSQL persistence and authorization', async t => {
  const db = new PGlite();
  const company = '10000000-0000-0000-0000-000000000001';
  const other = '10000000-0000-0000-0000-000000000002';
  const admin = '20000000-0000-0000-0000-000000000001';
  const employee = '20000000-0000-0000-0000-000000000002';
  const manager = '20000000-0000-0000-0000-000000000003';
  const outsider = '20000000-0000-0000-0000-000000000004';
  const unprovisioned = '20000000-0000-0000-0000-000000000005';
  const insert = (table, cid, id, data) => db.query(`insert into public.${table}(company_id,id,data) values($1,$2,$3)`, [cid,id,JSON.stringify(data)]);
  async function as(user, fn, role='authenticated') {
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user || '']);
    await db.exec(`set role ${role}`);
    try { return await fn(); }
    finally { await db.exec('reset role'); await db.query("select set_config('request.jwt.claim.sub','',false)"); }
  }
  const change = (table,id,data,revision=null,operation='insert') => ({table,id,data,revision,operation});
  const rpc = (user,changes,cid=company) => as(user,() => db.query('select public.apply_hrms_changes($1,$2)',[cid,JSON.stringify(changes)]));
  const row = async (table,id) => (await db.query(`select * from public.${table} where company_id=$1 and id=$2`,[company,id])).rows[0];
  try {
    await db.exec(`
      create role anon nologin; create role authenticated nologin;
      create schema auth; create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated,anon;
      grant execute on function auth.uid() to authenticated,anon;
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated,anon;
      grant select,insert,delete on storage.objects to authenticated;
    `);
    await db.exec(await readFile(new URL('../supabase/migrations/202610280001_hrms.sql',import.meta.url),'utf8'));
    await db.query('insert into companies(id,name) values($1,$2),($3,$4)',[company,'Wings',other,'Other company']);
    await insert('departments',company,'d-a',{id:'d-a',name:'HR',code:'HR'});
    await insert('departments',company,'d-b',{id:'d-b',name:'Sales',code:'SALES'});
    await insert('departments',other,'d-other',{id:'d-other',name:'Other',code:'OTHER'});
    for (const [id,dept,cid] of [['admin','d-a',company],['employee','d-a',company],['colleague','d-b',company],['manager','d-a',company],['outsider','d-other',other]]) {
      await insert('employees',cid,id,{id,departmentId:dept,employeeCode:id,workEmail:id+'@example.test',fullName:id,status:'Active'});
    }
    for (const [id,emp,role,cid,dept] of [[admin,'admin','super_admin',company,'d-a'],[employee,'employee','employee',company,'d-a'],[manager,'manager','manager',company,'d-a'],[outsider,'outsider','super_admin',other,'d-other']]) {
      await db.query('insert into auth.users(id) values($1)',[id]);
      await db.query('insert into user_profiles(id,company_id,employee_id,role,department_id,email,full_name) values($1,$2,$3,$4,$5,$6,$3)',[id,cid,emp,role,dept,emp+'@example.test']);
    }
    await db.query('insert into auth.users(id) values($1)',[unprovisioned]);
    await insert('company_settings',company,company,{companyName:'Wings'});
    await insert('company_settings',other,other,{companyName:'Other'});

    await t.test('migration enables RLS on every application table',async()=>{
      const result=await db.query("select relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind='r' and not c.relrowsecurity");
      assert.deepEqual(result.rows,[]);
    });
    await t.test('admin creates, reads, updates and deletes permanent rows',async()=>{
      await rpc(admin,[change('holidays','holiday',{id:'holiday',name:'Original',date:'2026-12-25',type:'Company Holiday'})]);
      assert.equal((await row('holidays','holiday')).data.name,'Original');
      await rpc(admin,[change('holidays','holiday',{id:'holiday',name:'Updated',date:'2026-12-25',type:'Company Holiday'},1,'update')]);
      assert.equal((await row('holidays','holiday')).data.name,'Updated');
      assert.equal((await row('holidays','holiday')).revision,2);
      await rpc(admin,[change('holidays','holiday',undefined,2,'delete')]);
      assert.equal(await row('holidays','holiday'),undefined);
    });
    await t.test('employee reads only own employee/payroll data',async()=>{
      const ids=await as(employee,()=>db.query('select id from employees'));
      assert.deepEqual(ids.rows.map(r=>r.id),['employee']);
      await insert('payroll',company,'pay-own',{id:'pay-own',employeeId:'employee',monthYear:'2026-10',status:'Draft',netSalary:100});
      await insert('payroll',company,'pay-other',{id:'pay-other',employeeId:'colleague',monthYear:'2026-10',status:'Draft',netSalary:100});
      assert.equal((await as(employee,()=>db.query('select * from payroll'))).rows.length,1);
    });
    await t.test('employee CRUD persists, reloads from storage, and removes related balance atomically',async()=>{
      const data={id:'employee-crud',employeeCode:'WC-TEST',workEmail:'employee-crud@example.test',
        firstName:'Integration',lastName:'Test',fullName:'Integration Test',departmentId:'d-a',status:'Active',
        salary:{basic:10000,hra:0},bankDetails:{accountNumber:''},emergencyContact:{name:'',phone:''}};
      await rpc(admin,[change('employees',data.id,data)]);
      const created=await as(admin,()=>db.query('select data,revision from employees where company_id=$1 and id=$2',[company,data.id]));
      assert.equal(created.rows[0].data.fullName,'Integration Test');
      assert.equal((await row('leave_balances',data.id)).data.paid.used,0);
      await rpc(admin,[change('employees',data.id,{...data,fullName:'Updated Integration Test',phone:'12345'},1,'update')]);
      assert.equal((await row('employees',data.id)).data.phone,'12345');
      const snapshot=await db.dumpDataDir();
      const reopened=new PGlite({loadDataDir:snapshot});
      try {
        const persisted=(await reopened.query('select data from employees where company_id=$1 and id=$2',[company,data.id])).rows[0];
        assert.equal(persisted.data.fullName,'Updated Integration Test');
        assert.equal(persisted.data.salary.basic,10000);
      } finally { await reopened.close(); }
      assert.equal((await as(outsider,()=>db.query('select id from employees where id=$1',[data.id]))).rows.length,0);
      const balance=await row('leave_balances',data.id);
      await rpc(admin,[change('employees',data.id,undefined,2,'delete'),change('leave_balances',data.id,undefined,balance.revision,'delete')]);
      assert.equal(await row('employees',data.id),undefined);
      assert.equal(await row('leave_balances',data.id),undefined);
    });
    await t.test('manager access stays within their department',async()=>{
      const ids=(await as(manager,()=>db.query('select id from employees order by id'))).rows.map(r=>r.id);
      assert.deepEqual(ids,['admin','employee','manager']);
      await assert.rejects(rpc(manager,[change('payroll','pay-other',{id:'pay-other',employeeId:'colleague',monthYear:'2026-10',status:'Paid'},1,'update')]));
      await assert.rejects(rpc(manager,[change('payroll','pay-manager',{id:'pay-manager',employeeId:'manager',monthYear:'2026-10',status:'Paid'})]));
    });
    await t.test('cross-company reads and writes are denied, including forged FKs',async()=>{
      assert.equal((await as(outsider,()=>db.query('select * from employees where company_id=$1',[company]))).rows.length,0);
      await assert.rejects(rpc(outsider,[change('holidays','intrusion',{id:'intrusion'})]));
      await assert.rejects(rpc(admin,[change('employees','bad-fk',{id:'bad-fk',employeeCode:'bad',workEmail:'bad@test',departmentId:'d-other',status:'Active'})]));
    });
    await t.test('anonymous and unprovisioned users cannot retrieve HRMS data',async()=>{
      await assert.rejects(as(null,()=>db.query('select * from employees'),'anon'));
      assert.equal((await as(unprovisioned,()=>db.query('select * from employees'))).rows.length,0);
      await assert.rejects(rpc(unprovisioned,[change('holidays','bad',{id:'bad'})]));
    });
    await t.test('profiles and roles cannot be escalated from the browser',async()=>{
      await assert.rejects(as(employee,()=>db.query("update user_profiles set role='super_admin' where id=$1",[employee])));
      await assert.rejects(as(admin,()=>db.query("update user_profiles set role='super_admin' where id=$1",[employee])));
    });
    await t.test('leave application, approval and balance accounting are atomic',async()=>{
      const leave={id:'leave-1',employeeId:'employee',leaveType:'Paid Leave',startDate:'2026-12-01',endDate:'2026-12-02',totalDays:2,reason:'Family',status:'Pending'};
      await rpc(employee,[change('leave_records',leave.id,leave)]);
      assert.equal((await row('leave_records',leave.id)).data.status,'Pending');
      await assert.rejects(rpc(employee,[change('leave_records',leave.id,{...leave,status:'Approved'},1,'update')]));
      await rpc(manager,[change('leave_records',leave.id,{...leave,status:'Approved',reviewedBy:'manager'},1,'update')]);
      assert.equal((await row('leave_balances','employee')).data.paid.used,2);
      await assert.rejects(rpc(employee,[change('leave_balances','employee',{paid:{allocated:999,used:0}},2,'update')]));
      assert.ok((await db.query("select * from notifications where data->>'userId'='employee'")).rows.length>0);
    });
    await t.test('employees can cancel only their own pending leave',async()=>{
      const leave={id:'leave-cancel',employeeId:'employee',leaveType:'Sick Leave',startDate:'2026-12-03',endDate:'2026-12-03',totalDays:1,status:'Pending'};
      await rpc(employee,[change('leave_records',leave.id,leave)]);
      await rpc(employee,[change('leave_records',leave.id,{...leave,status:'Cancelled'},1,'update')]);
      assert.equal((await row('leave_records',leave.id)).data.status,'Cancelled');
      await assert.rejects(rpc(employee,[change('leave_records','forged',{...leave,id:'forged',employeeId:'colleague'})]));
    });
    await t.test('task updates preserve ownership and authentic comment authorship',async()=>{
      const task={id:'task',assignedToId:'employee',createdById:'manager',departmentId:'d-a',status:'To Do',comments:[]};
      await rpc(manager,[change('tasks','task',task)]);
      const own={...task,status:'In Progress',comments:[{id:'comment',taskId:'task',authorId:'employee',authorName:'employee',text:'Done'}]};
      await rpc(employee,[change('tasks','task',own,1,'update')]);
      await assert.rejects(rpc(employee,[change('tasks','task',{...own,assignedToId:'colleague'},2,'update')]));
      await assert.rejects(rpc(employee,[change('tasks','task',{...own,comments:[...own.comments,{taskId:'task',authorId:'manager',authorName:'manager'}]},2,'update')]));
    });
    await t.test('concurrent stale writes are rejected without losing newer changes',async()=>{
      await rpc(admin,[change('holidays','versioned',{id:'versioned',name:'One'})]);
      await rpc(admin,[change('holidays','versioned',{id:'versioned',name:'Two'},1,'update')]);
      await assert.rejects(rpc(admin,[change('holidays','versioned',{id:'versioned',name:'Stale'},1,'update')]));
      assert.equal((await row('holidays','versioned')).data.name,'Two');
    });
    await t.test('a failed multi-record batch rolls back all earlier operations',async()=>{
      await assert.rejects(rpc(admin,[change('holidays','rollback',{id:'rollback'}),change('holidays','missing',{id:'missing'},1,'update')]));
      assert.equal(await row('holidays','rollback'),undefined);
    });
    await t.test('audit history is server-generated and cannot be forged or deleted',async()=>{
      assert.ok((await db.query('select * from audit_logs')).rows.length>0);
      await assert.rejects(rpc(admin,[change('audit_logs','forged',{id:'forged'})]));
      await assert.rejects(as(admin,()=>db.query('delete from audit_logs')));
    });
    await t.test('notification content cannot be changed by its recipient',async()=>{
      const n=(await db.query("select * from notifications where data->>'userId'='employee' limit 1")).rows[0];
      await rpc(employee,[change('notifications',n.id,{...n.data,isRead:true},n.revision,'update')]);
      await assert.rejects(rpc(employee,[change('notifications',n.id,{...n.data,message:'forged'},n.revision+1,'update')]));
    });
    await t.test('private storage separates companies and individual employee documents',async()=>{
      await as(employee,()=>db.query("insert into storage.objects(bucket_id,name) values('hrms-documents',$1)",[company+'/employee/file/document.pdf']));
      await assert.rejects(as(employee,()=>db.query("insert into storage.objects(bucket_id,name) values('hrms-documents',$1)",[other+'/outsider/file/document.pdf'])));
      await assert.rejects(as(employee,()=>db.query("insert into storage.objects(bucket_id,name) values('hrms-documents',$1)",[company+'/company/file/document.pdf'])));
      assert.equal((await as(outsider,()=>db.query('select * from storage.objects'))).rows.length,0);
      await as(employee,()=>db.query('delete from storage.objects where name=$1',[company+'/employee/file/document.pdf']));
    });
    await t.test('attendance punches persist and historical self-corrections are denied',async()=>{
      const today=(await db.query("select to_char(now() at time zone 'Asia/Kolkata','YYYY-MM-DD') as today")).rows[0].today;
      const attendance={id:'attendance-own',employeeId:'employee',date:today,checkIn:'11:00',workingHours:0,breakMinutes:0,overtimeHours:0,status:'Present'};
      await rpc(employee,[change('attendance',attendance.id,attendance)]);
      await rpc(employee,[change('attendance',attendance.id,{...attendance,checkOut:'20:00',workingHours:9},1,'update')]);
      assert.equal((await row('attendance',attendance.id)).data.checkOut,'20:00');
      await assert.rejects(rpc(employee,[change('attendance','historical',{...attendance,id:'historical',date:'2001-01-01'})]));
    });
    await t.test('remaining modules persist under their actual table and role constraints',async()=>{
      const dept=await row('departments','d-a');
      const settings=await row('company_settings',company);
      await rpc(admin,[
        change('departments','d-a',{...dept.data,description:'Updated department'},dept.revision,'update'),
        change('company_settings',company,{...settings.data,phone:'12345'},settings.revision,'update'),
        change('performance_reviews','review',{id:'review',employeeId:'employee',reviewerId:'manager',status:'Completed',finalRating:4}),
        change('documents','document',{id:'document',employeeId:'employee',title:'Contract',fileUrl:company+'/employee/random/contract.pdf'}),
        change('announcements','private-ann',{id:'private-ann',audience:'Specific Department',targetDepartmentId:'d-b',title:'Sales update'}),
      ]);
      assert.equal((await row('departments','d-a')).data.description,'Updated department');
      assert.equal((await row('company_settings',company)).data.phone,'12345');
      assert.equal((await as(employee,()=>db.query("select * from performance_reviews where id='review'"))).rows.length,1);
      assert.equal((await as(employee,()=>db.query("select * from documents where id='document'"))).rows.length,1);
      assert.equal((await as(employee,()=>db.query("select * from announcements where id='private-ann'"))).rows.length,0);
      await assert.rejects(rpc(employee,[change('company_settings',company,{companyName:'Hacked'},2,'update')]));
      await rpc(admin,[change('documents','document',undefined,1,'delete')]);
      assert.equal(await row('documents','document'),undefined);
    });
    await t.test('deactivated employees immediately lose database access',async()=>{
      const e=await row('employees','employee');
      await rpc(admin,[change('employees','employee',{...e.data,status:'Deactivated'},e.revision,'update')]);
      assert.equal((await as(employee,()=>db.query('select * from employees'))).rows.length,0);
      await assert.rejects(rpc(employee,[change('holidays','inactive',{id:'inactive'})]));
    });
    await t.test('first administrator provisioning creates a complete isolated company',async()=>{
      await db.query('insert into auth.users(id) values($1)',['20000000-0000-0000-0000-000000000006']);
      await db.exec('alter table auth.users add column email text');
      await db.query('update auth.users set email=$1 where id=$2',['new-admin@example.test','20000000-0000-0000-0000-000000000006']);
      const sql=await readFile(new URL('../supabase/provision-first-admin.sql',import.meta.url),'utf8');
      await db.exec(sql.replace(/admin_email text := '[^']*'/,"admin_email text := 'new-admin@example.test'"));
      const profile=(await db.query('select * from user_profiles where email=$1',['new-admin@example.test'])).rows[0];
      assert.equal(profile.role,'super_admin');
      assert.notEqual(profile.company_id,company);
      const settings=(await db.query('select * from company_settings where company_id=$1',[profile.company_id])).rows[0];
      assert.equal(settings.data.officeStartTime,'11:00');
      assert.equal((await as(profile.id,()=>db.query('select * from employees'))).rows.length,1);
    });
    await t.test('read-only admin diagnostic validates the provisioned account and actual RLS grants',async()=>{
      await db.exec('alter table auth.users add column email_confirmed_at timestamptz; alter table auth.users add column banned_until timestamptz; alter table auth.users add column last_sign_in_at timestamptz;');
      await db.query('update auth.users set email_confirmed_at=now() where email=$1',['new-admin@example.test']);
      const before=(await db.query('select count(*)::int as n from audit_logs')).rows[0].n;
      const sql=await readFile(new URL('../supabase/verify-admin-access.sql',import.meta.url),'utf8');
      const results=await db.exec(sql.replaceAll('wingscorporate1504@gmail.com','new-admin@example.test'));
      const report=results.flatMap(result=>result.rows).find(result=>result.verification_result);
      assert.match(report.verification_result,/PASS/);
      assert.equal(report.hrms_role,'super_admin');
      assert.equal((await db.query('select count(*)::int as n from audit_logs')).rows[0].n,before);
    });
    await t.test('committed records survive reopening the database from persisted storage',async()=>{
      const snapshot=await db.dumpDataDir();
      const reopened=new PGlite({loadDataDir:snapshot});
      try {
        const persisted=(await reopened.query('select data from holidays where company_id=$1 and id=$2',[company,'versioned'])).rows[0];
        assert.equal(persisted.data.name,'Two');
        assert.ok((await reopened.query('select count(*)::int as total from audit_logs')).rows[0].total>0);
      } finally { await reopened.close(); }
    });
  } finally { await db.close(); }
});
