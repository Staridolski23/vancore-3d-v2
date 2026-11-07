"""Guarded role-authority rollout before the audited role editor is published.

The historical allowlist backup is installation-only recovery. After any role
edit, keep the canonical verifier during rollback; never revive the old list.
"""
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import time
import urllib.error
import urllib.request

BASE=Path('/home/vancore/vancore-backend')
STAGE=Path('/var/backups/vancore/codex-20261107-account-admin')
NODE='/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node'
SERVER_SHA='f1428aaa6fd849032bb94c7bb706e29db5ade10e51774336b9ab4fc929211002'
AUTH_SHA='bad29bf03494cb6c12936225753bcd24333fe39fa02cdcedf9aa206e84d50377'
PM2=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2','VANCORE_AUTH_ENFORCE=true','VANCORE_CONTACT_MAIL_ENABLED=false',NODE,str(BASE/'node_modules/pm2/bin/pm2')]

def get(path,token=None):
    req=urllib.request.Request('http://127.0.0.1:3001'+path,headers={} if token is None else {'Authorization':'Bearer '+token})
    try:
        with urllib.request.urlopen(req,timeout=10) as response:return response.status,json.load(response)
    except urllib.error.HTTPError as error:return error.code,json.load(error)

def sqlite_state():
    with closing(sqlite3.connect('file:'+str(BASE/'data/vancore.db')+'?mode=ro',uri=True)) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        assert not db.execute('PRAGMA foreign_key_check').fetchall()
        state={}
        for (name,) in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"):
            rows=db.execute('SELECT * FROM "'+name.replace('"','""')+'"').fetchall()
            state[name]={'rows':len(rows),'sha256':hashlib.sha256(json.dumps(sorted(json.dumps(row,default=str) for row in rows)).encode()).hexdigest()}
        return state

def restart():
    subprocess.run(PM2+['restart','vancore-backend','--update-env'],check=True,stdout=subprocess.DEVNULL)
    for attempt in range(15):
        try:
            assert get('/api/health')[0]==200
            return
        except Exception:
            if attempt==14:raise
            time.sleep(1)

def main():
    target=BASE/'maintenance/backend-auth.cjs';original=target.read_bytes();owner=target.stat()
    assert hashlib.sha256((BASE/'server.js').read_bytes()).hexdigest()==SERVER_SHA,'Unexpected server source'
    assert hashlib.sha256(original).hexdigest()==AUTH_SHA,'Unexpected live verifier'
    baseline=json.loads((STAGE/'role-baseline.json').read_text())
    assert baseline.get('project')=='wqvhivuyvzdbuguuojhk' and baseline.get('administratorAllowlistAligned') is True,'Administrator baseline needs review'
    assert 0<=time.time()-baseline['capturedEpoch']<900,'Role baseline is stale'
    config=BASE/'maintenance/auth-recovery-config.json'
    public_config=json.loads(config.read_text());assert public_config.get('url')=='https://wqvhivuyvzdbuguuojhk.supabase.co'
    assert str(public_config.get('publishableKey','')).startswith('sb_publishable_')
    shutil.copyfile(config,STAGE/'auth-recovery-config.json');os.chmod(STAGE/'auth-recovery-config.json',0o600)
    subprocess.run([NODE,'--check',str(STAGE/'backend-auth.cjs')],check=True)
    # Verify the existing public-config default path without fetching or printing credentials.
    code="const fs=require('node:fs');const config=JSON.parse(fs.readFileSync(process.argv[1]));require(process.argv[2]).createSupabaseVerifier({projectUrl:config.url});"
    subprocess.run(['env','NODE_PATH='+str(BASE/'node_modules'),NODE,'-e',code,str(STAGE/'auth-recovery-config.json'),str(STAGE/'backend-auth.cjs')],check=True,stdout=subprocess.DEVNULL)
    before=sqlite_state();content=get('/api/content')
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    rollback=STAGE/'installation-code-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    (rollback/'backend-auth.cjs').write_bytes(original);os.chmod(rollback/'backend-auth.cjs',0o600)
    staged=BASE/'maintenance/backend-auth.role-stage.cjs';shutil.copyfile(STAGE/'backend-auth.cjs',staged)
    os.chown(staged,owner.st_uid,owner.st_gid);os.chmod(staged,owner.st_mode & 0o777);os.replace(staged,target)
    try:
        restart()
        for route in ['/api/bookings','/api/documents','/api/incoming','/api/settings','/api/adminv2/clients']:
            assert get(route)[0]==401,'Anonymous private access boundary failed'
            assert get(route,'synthetic-invalid-token')[0]==401,'Invalid signature boundary failed'
        assert get('/api/content')==content,'Public content changed'
        after=sqlite_state()
        subprocess.run(PM2+['save'],check=True,stdout=subprocess.DEVNULL)
        apps=json.loads(subprocess.check_output(PM2+['jlist'],text=True));app=next(item for item in apps if item['name']=='vancore-backend')
        assert app['pm2_env'].get('VANCORE_AUTH_ENFORCE')=='true' and app['pm2_env'].get('VANCORE_CONTACT_MAIL_ENABLED')=='false'
        report={'deployed':True,'backup':backup,'moduleSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'serverSourceUnchanged':True,'roleAuthority':'protected public.users profile, read on every authenticated request','publicKeyConfigurationVerified':True,'sqliteUnchanged':before==after,'existingRowsBefore':sum(item['rows'] for item in before.values()),'existingRowsAfter':sum(item['rows'] for item in after.values()),'databaseWritesByInstaller':False,'authEnforcement':True,'notificationDeliveryEnabled':False,'negativeChecks':10,'authenticatedLiveAcceptance':'pending browser read','installationRollback':str(rollback/'backend-auth.cjs'),'rollbackLimit':'Historical email-list verifier must not be restored after role edits; preserve canonical authority in subsequent rollbacks.'}
        (STAGE/'deployment-result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
    except Exception:
        # Installation failure only, before publishing the new role editor.
        target.write_bytes(original);os.chown(target,owner.st_uid,owner.st_gid);os.chmod(target,owner.st_mode & 0o777)
        restart()
        raise

if __name__=='__main__':main()
