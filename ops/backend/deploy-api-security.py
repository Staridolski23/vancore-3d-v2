"""Install reviewed access modules, then separately enforce after frontend checks.
Rollback changes code only and keeps enforcement on once it has been activated.
"""
from contextlib import closing
import argparse
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import subprocess
import time
import urllib.request
import urllib.error

BASE=Path('/home/vancore/vancore-backend')
STAGE=Path('/var/backups/vancore/codex-20261107-calendar-privacy')
NODE='/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node'
PM2_PATH=str(BASE/'node_modules/pm2/bin/pm2')
EXPECTED={
 'backend-auth.cjs':'ef80b04b12044b461f7bddd1d3e6cf54228be48951ccb3f5b7533cc2ede8c4c8',
 'portal-maintenance.cjs':'98b2bb6b3e43e3bd6d5aca27962600db191ea3955a76bb120b00e7b1f1c22cde',
 'bookings.cjs':'cb4baab31c2a261602a40cd183ce9f0c51801a2aa3f53c11f2253acca79c2c12',
}
SOURCE={'backend-auth.cjs':'backend-auth.cjs','portal-maintenance.cjs':'portal-maintenance.cjs','bookings.cjs':'bookings-maintenance.cjs'}

def pm2(*args,enforce=None,capture=False):
    cmd=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2']
    if enforce is not None:cmd+=['VANCORE_AUTH_ENFORCE='+str(enforce).lower()]
    cmd += [NODE,PM2_PATH,*args]
    if capture:return subprocess.check_output(cmd,text=True)
    subprocess.run(cmd,check=True,stdout=subprocess.DEVNULL)

def probe(url):
    try:
        with urllib.request.urlopen(url,timeout=8) as r:return r.status,r.read()
    except urllib.error.HTTPError as e:return e.code,e.read()

def data(path):
    status,body=probe('http://127.0.0.1:3001'+path)
    assert status==200,'Unexpected service status'
    return json.loads(body)

def rows():
    with closing(sqlite3.connect('file:'+str(BASE/'data/vancore.db')+'?mode=ro',uri=True)) as db:
        db.row_factory=sqlite3.Row
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        assert not db.execute('PRAGMA foreign_key_check').fetchall()
        return [dict(r) for r in db.execute('SELECT * FROM bookings ORDER BY id')]

def healthy():
    for attempt in range(12):
        try:
            assert data('/api/health')['status']=='ok'
            return
        except Exception:
            if attempt==11:raise
            time.sleep(1)

def install():
    assert hashlib.sha256((BASE/'server.js').read_bytes()).hexdigest()=='c9ef532b2c529728fd81a68c791a79501f69822bd08c5f27c9f5d524eac6ac62','Unexpected server revision'
    original={}
    for name,expected in EXPECTED.items():
        original[name]=(BASE/'maintenance'/name).read_bytes()
        assert hashlib.sha256(original[name]).hexdigest()==expected,'Unexpected module '+name
        subprocess.run([NODE,'--check',str(STAGE/SOURCE[name])],check=True)
    before=rows();before_content=data('/api/content')
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    rollback=STAGE/'security-code-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    for name,body in original.items():(rollback/name).write_bytes(body);os.chmod(rollback/name,0o600)
    try:
        for name in EXPECTED:
            target=BASE/'maintenance'/name;owner=target.stat();staged=target.with_suffix('.security-stage.cjs')
            staged.write_bytes((STAGE/SOURCE[name]).read_bytes());os.chown(staged,owner.st_uid,owner.st_gid);os.chmod(staged,0o644);os.replace(staged,target)
        pm2('restart','vancore-backend');healthy()
        assert data('/api/content')==before_content,'Public content changed'
        current={r['id']:r for r in rows()};assert all(current.get(r['id'])==r for r in before),'Existing booking content changed'
        pm2('save')
        report={'installed':True,'backup':backup,'modules':{n:hashlib.sha256((BASE/'maintenance'/n).read_bytes()).hexdigest() for n in EXPECTED},'existingBookingsPreserved':len(before),'databaseWritten':False,'enforcementChanged':False,'rollback':str(rollback)}
        (STAGE/'security-module-install.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
    except Exception:
        for name,body in original.items():(BASE/'maintenance'/name).write_bytes(body)
        pm2('restart','vancore-backend');raise

def activate():
    manifest=json.loads((STAGE/'security-module-install.json').read_text())
    for name,digest in manifest['modules'].items():assert hashlib.sha256((BASE/'maintenance'/name).read_bytes()).hexdigest()==digest,'Module changed after verification'
    # The current public frontend must verify/forward identity before enforcement.
    frontend={}
    for path in ['/api/bookings','/api/documents','/api/adminv2/clients']:
        status,_=probe('https://www.vancoresys.com'+path);frontend[path]=status
        assert status==401,'Production frontend authentication not ready at '+path
    before=rows();before_content=data('/api/content')
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    pm2('restart','vancore-backend','--update-env',enforce=True);healthy()
    results={}
    for path in ['/api/bookings','/api/bookings/upcoming','/api/documents','/api/settings']:
        status,_=probe('http://127.0.0.1:3001'+path);results[path]=status
        assert status==401,'Direct private route did not require identity: '+path
    assert data('/api/content')==before_content,'Public content changed'
    monthly=data('/api/bookings?year=2026&month=10')
    assert all(set(r)=={'date','time','status'} for r in monthly['bookings'])
    status,_=probe('https://api.vancoresys.com/auth/reset-password');assert status==200
    current={r['id']:r for r in rows()};assert all(current.get(r['id'])==r for r in before),'Existing booking content changed'
    pm2('save')
    report={'activated':True,'backup':backup,'frontendAnonymousChecks':frontend,'backendAnonymousChecks':results,'publicRecoveryStatus':status,'publicContentPreserved':True,'existingBookingsPreserved':len(before),'databaseWritten':False,'rollbackPolicy':'Keep enforcement enabled; roll back modules only, never restore an older database'}
    (STAGE/'auth-enforcement-activation.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))

if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--activate',action='store_true');args=p.parse_args()
    if args.activate:activate()
    else:install()
