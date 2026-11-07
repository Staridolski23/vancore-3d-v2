"""Replace only the reviewed booking module; preserve canonical identity and data."""
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
STAGE=Path('/var/backups/vancore/codex-20261107-booking-lifecycle')
NODE='/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node'
EXPECTED_SERVER='f1428aaa6fd849032bb94c7bb706e29db5ade10e51774336b9ab4fc929211002'
EXPECTED_AUTH='159dba194bb6ac8d056304581fd2700f2274f23f481543308e6235b0a4526bf8'
EXPECTED_BOOKINGS='6955eefb155222b3f62cf379d0552c3046aa72709d2fc0def35e2376a107ac37'
CANDIDATE='3233fb43ef33d1858672d2afa93e856a50ca30d43ab8eeefe26541159bdbc188'
PM2=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2','VANCORE_AUTH_ENFORCE=true','VANCORE_CONTACT_MAIL_ENABLED=false',NODE,str(BASE/'node_modules/pm2/bin/pm2')]

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def get(path,token=None):
    request=urllib.request.Request('http://127.0.0.1:3001'+path,headers={} if token is None else {'Authorization':'Bearer '+token})
    try:
        with urllib.request.urlopen(request,timeout=10) as response:return response.status,json.load(response)
    except urllib.error.HTTPError as error:return error.code,json.load(error)

def state():
    with closing(sqlite3.connect('file:'+str(BASE/'data/vancore.db')+'?mode=ro',uri=True)) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        assert not db.execute('PRAGMA foreign_key_check').fetchall()
        tables={}
        for (name,) in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"):
            rows=db.execute('SELECT * FROM "'+name.replace('"','""')+'"').fetchall()
            tables[name]={'rows':len(rows),'sha256':hashlib.sha256(json.dumps(sorted(json.dumps(row,default=str) for row in rows)).encode()).hexdigest()}
        return tables

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
    target=BASE/'maintenance/bookings.cjs';original=target.read_bytes();owner=target.stat()
    assert digest(BASE/'server.js')==EXPECTED_SERVER,'Unexpected server revision'
    assert digest(BASE/'maintenance/backend-auth.cjs')==EXPECTED_AUTH,'Canonical identity verifier changed'
    assert digest(target)==EXPECTED_BOOKINGS,'Unexpected booking revision'
    assert digest(STAGE/'bookings-maintenance.cjs')==CANDIDATE,'Candidate differs from tested source'
    subprocess.run([NODE,'--check',str(STAGE/'bookings-maintenance.cjs')],check=True)
    before=state();content=get('/api/content')
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    rollback=STAGE/'code-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    (rollback/'bookings.cjs').write_bytes(original);os.chmod(rollback/'bookings.cjs',0o600)
    temporary=BASE/'maintenance/bookings.lifecycle-stage.cjs';shutil.copyfile(STAGE/'bookings-maintenance.cjs',temporary)
    os.chown(temporary,owner.st_uid,owner.st_gid);os.chmod(temporary,owner.st_mode & 0o777);os.replace(temporary,target)
    try:
        restart()
        for path in ['/api/bookings','/api/documents','/api/incoming','/api/settings','/api/adminv2/clients']:
            assert get(path)[0]==401
            assert get(path,'synthetic-invalid-token')[0]==401
        assert get('/api/content')==content,'Public content changed'
        assert digest(BASE/'maintenance/backend-auth.cjs')==EXPECTED_AUTH,'Canonical verifier changed'
        after=state()
        subprocess.run(PM2+['save'],check=True,stdout=subprocess.DEVNULL)
        apps=json.loads(subprocess.check_output(PM2+['jlist'],text=True));app=next(item for item in apps if item['name']=='vancore-backend')
        assert app['pm2_env'].get('VANCORE_AUTH_ENFORCE')=='true' and app['pm2_env'].get('VANCORE_CONTACT_MAIL_ENABLED')=='false'
        report={'deployed':True,'moduleSha256':digest(target),'backup':backup,'databaseWritesByInstaller':False,'sqliteUnchanged':before==after,'existingRowsBefore':sum(item['rows'] for item in before.values()),'existingRowsAfter':sum(item['rows'] for item in after.values()),'publicContentUnchanged':True,'canonicalIdentityUnchanged':True,'negativeChecks':10,'notificationDeliveryEnabled':False,'rollbackModule':str(rollback/'bookings.cjs'),'rollbackLimit':'Restore only this booking module; preserve canonical identity, strict auth, databases and uploads.'}
        (STAGE/'deployment-result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
    except Exception:
        target.write_bytes(original);os.chown(target,owner.st_uid,owner.st_gid);os.chmod(target,owner.st_mode & 0o777)
        restart()
        raise

if __name__=='__main__':main()
