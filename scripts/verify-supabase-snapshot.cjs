// Offline logical restore drill. Never connects to a hosted database or Auth.
// Requires the pinned isolated ../qa-runtime package, not a production dependency.
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const runtime = process.env.VANCORE_QA_RUNTIME || path.join(__dirname, '../ops/qa-runtime');
const { PGlite } = require(path.join(runtime, 'node_modules/@electric-sql/pglite'));
const quote = value => '"' + value.replaceAll('"', '""') + '"';
const relation = (schema, name) => quote(schema) + '.' + quote(name);

async function restoreSnapshot(directory) {
  const data = JSON.parse(await fs.readFile(path.join(directory, 'data-snapshot.json'), 'utf8'));
  assert.equal(data.project, 'wqvhivuyvzdbuguuojhk');
  const catalog = JSON.parse(await fs.readFile(path.join(directory, 'catalog.json'), 'utf8'));
  const objects = [];
  for (const name of await fs.readdir(path.join(directory, 'public-schema'))) {
    objects.push(JSON.parse(await fs.readFile(path.join(directory, 'public-schema', name), 'utf8')));
  }
  // Recreate the two identity tables needed for accounts and application FKs.
  // Auth service internals, live sessions and password sign-in are not exercised.
  for (const name of ['auth.users.json', 'auth.identities.json']) {
    objects.unshift(JSON.parse(await fs.readFile(path.join(directory, 'managed-schema', name), 'utf8')));
  }
  const database = new PGlite();
  await database.exec(`CREATE SCHEMA auth;
    CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN;
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
    GRANT USAGE ON SCHEMA public, auth TO anon, authenticated, service_role;
    CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    CREATE FUNCTION auth.role() RETURNS text LANGUAGE sql STABLE AS
      $$ SELECT nullif(current_setting('request.jwt.claim.role', true),'') $$;`);
  try {
    for (const object of objects) {
      const columns = [...object.columns].sort((a,b) => a.position-b.position).map(column => {
        assert.ok(!column.identity, 'Identity sequences need an explicit restore implementation');
        return quote(column.name) + ' ' + column.type +
          (column.generated ? ` GENERATED ALWAYS AS (${column.default}) STORED` : column.default ? ' DEFAULT ' + column.default : '') +
          (column.not_null ? ' NOT NULL' : '');
      });
      await database.exec(`CREATE TABLE ${relation(object.table.schema, object.table.name)} (${columns.join(',')})`);
    }
    for (const object of objects) {
      const name = object.table.schema + '.' + object.table.name;
      for (const row of data.data[name] || []) {
        const columns = object.columns.filter(column => !column.generated && Object.hasOwn(row, column.name));
        const values = columns.map(column => {
          const value = row[column.name];
          return value !== null && ['json','jsonb'].includes(column.type) ? JSON.stringify(value) : value;
        });
        await database.query(`INSERT INTO ${relation(object.table.schema,object.table.name)} (${columns.map(c=>quote(c.name)).join(',')}) VALUES (${values.map((_,i)=>'$'+(i+1)).join(',')})`, values);
      }
    }
    // Add and validate constraints after import, with PK/unique constraints first.
    for (const foreign of [false,true]) for (const object of objects) for (const constraint of object.constraints || []) {
      if ((constraint.kind === 'f') !== foreign) continue;
      await database.exec(`ALTER TABLE ${relation(object.table.schema,object.table.name)} ADD CONSTRAINT ${quote(constraint.name)} ${constraint.definition}`);
    }
    for (const object of objects) for (const index of object.indexes || []) {
      if (!(object.constraints || []).some(c=>c.name===index.indexname)) await database.exec(index.indexdef);
    }
    for (const fn of catalog.functions) await database.exec(fn.definition);
    for (const trigger of catalog.triggers) await database.exec(trigger.definition);
    for (const object of objects.filter(o=>o.table.schema==='public')) {
      const name=relation(object.table.schema,object.table.name);
      if (object.table.rls) await database.exec(`ALTER TABLE ${name} ENABLE ROW LEVEL SECURITY`);
      for (const policy of object.policies || []) {
        await database.exec(`CREATE POLICY ${quote(policy.policyname)} ON ${name} AS ${policy.permissive} FOR ${policy.cmd} TO ${policy.roles.map(quote).join(',')}${policy.qual?' USING ('+policy.qual+')':''}${policy.with_check?' WITH CHECK ('+policy.with_check+')':''}`);
      }
      for (const grant of object.grants || []) {
        if (['anon','authenticated','service_role'].includes(grant.grantee)) await database.exec(`GRANT ${grant.privilege_type} ON ${name} TO ${quote(grant.grantee)}`);
      }
    }
    const checks = [];
    for (const object of objects) {
      const name = object.table.schema+'.'+object.table.name;
      const result = await database.query(`SELECT count(*)::integer AS total FROM ${relation(object.table.schema,object.table.name)}`);
      const expected = (data.data[name] || []).length;
      assert.equal(result.rows[0].total, expected);
      // Compare complete row contents privately; only equality is reported.
      const columns = object.columns.filter(c=>!c.generated).map(c=>quote(c.name)).join(',');
      const restored = await database.query(`SELECT to_jsonb(t) AS row FROM (SELECT ${columns} FROM ${relation(object.table.schema,object.table.name)}) t`);
      const canonical = row => JSON.stringify(Object.fromEntries(Object.entries(row).filter(([key])=>object.columns.some(c=>!c.generated&&c.name===key)).sort(([a],[b])=>a.localeCompare(b))));
      const normalize = rows => rows.map(canonical).sort();
      assert.deepEqual(normalize(restored.rows.map(r=>r.row)), normalize(data.data[name] || []));
      checks.push({table:name,rows:expected,contentEqual:true});
    }
    const report = {date:new Date().toISOString(),status:'PASS',environment:'offline in-memory PGlite; no hosted connection',checks,functionsRestored:catalog.functions.length,triggersRestored:catalog.triggers.length,limitations:['Managed Auth login, SMTP, sessions, settings and complete hosted recovery are not tested','Only application tables and auth.users/auth.identities restored; empty managed tables are catalogued separately']};
    return {database,report};
  } catch(error) { await database.close(); throw error; }
}
exports.restoreSnapshot=restoreSnapshot;
if(require.main===module) (async()=>{
  const {database,report}=await restoreSnapshot(path.resolve(process.argv[2]));
  await database.close();
  await fs.writeFile(path.resolve(process.argv[3]),JSON.stringify(report,null,2));
  console.log(JSON.stringify(report));
})().catch(error=>{ console.error('Offline restore failed:',{code:error.code||'ASSERTION',reason:error.code?'Database rejected a schema or data operation':'Snapshot validation failed'}); process.exitCode=1; });
