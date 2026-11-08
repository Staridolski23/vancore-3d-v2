"""Retire legacy unmetered model routes; keep protected-role verification intact."""
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
STAGE=Path('/var/backups/vancore/codex-20261108-vera')
NODE='/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node'
SERVER='f1428aaa6fd849032bb94c7bb706e29db5ade10e51774336b9ab4fc929211002'
BOOKINGS='3233fb43ef33d1858672d2afa93e856a50ca30d43ab8eeefe26541159bdbc188'
PREVIOUS='159dba194bb6ac8d056304581fd2700f2274f23f481543308e6235b0a4526bf8'
CANDIDATE='a6e719a3466d71759274900b7a3b7fa92bdb3695efc95bc90461a8d18c4b6a57'
PM2=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2','VANCORE_AUTH_ENFORCE=true','VANCORE_CONTACT_MAIL_ENABLED=false',NODE,str(BASE/'node_modules/pm2/bin/pm2')]
def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def get(path,token=None,method='GET'):
    request=urllib.request.Request('http://127.0.0.1:3001'+path,method=method,headers={} if token is None else {'Authorization':'Bearer '+token})
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
    target=BASE/'maintenance/backend-auth.cjs';original=target.read_bytes();owner=target.stat()
    assert digest(BASE/'server.js')==SERVER and digest(BASE/'maintenance/bookings.cjs')==BOOKINGS,'Unexpected backend source'
    assert digest(target)==PREVIOUS,'Unexpected protected-role verifier'
    assert digest(STAGE/'backend-auth.cjs')==CANDIDATE,'Untested candidate'
    subprocess.run([NODE,'--check',str(STAGE/'backend-auth.cjs')],check=True)
    before=state();content=get('/api/content')
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    rollback=STAGE/'installation-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    (rollback/'backend-auth.cjs').write_bytes(original);os.chmod(rollback/'backend-auth.cjs',0o600)
    temporary=BASE/'maintenance/backend-auth.vera-stage.cjs';shutil.copyfile(STAGE/'backend-auth.cjs',temporary)
    os.chown(temporary,owner.st_uid,owner.st_gid);os.chmod(temporary,owner.st_mode & 0o777);os.replace(temporary,target)
    try:
        restart()
        for path in ['/api/bookings','/api/documents','/api/incoming','/api/settings','/api/adminv2/clients']:
            assert get(path)[0]==401 and get(path,'synthetic-invalid-token')[0]==401
        for path in ['/api/ai-analyst','/api/analyze']:
            assert get(path,method='POST')[0]==410 and get(path,'synthetic-invalid-token','POST')[0]==410
        assert get('/api/content')==content,'Public content changed'
        assert digest(BASE/'server.js')==SERVER and digest(BASE/'maintenance/bookings.cjs')==BOOKINGS
        after=state();subprocess.run(PM2+['save'],check=True,stdout=subprocess.DEVNULL)
        apps=json.loads(subprocess.check_output(PM2+['jlist'],text=True));app=next(item for item in apps if item['name']=='vancore-backend')
        assert app['pm2_env'].get('VANCORE_AUTH_ENFORCE')=='true' and app['pm2_env'].get('VANCORE_CONTACT_MAIL_ENABLED')=='false'
        report={'deployed':True,'moduleSha256':digest(target),'backup':backup,'databaseWritesByInstaller':False,'sqliteUnchanged':before==after,'existingRowsBefore':sum(item['rows'] for item in before.values()),'existingRowsAfter':sum(item['rows'] for item in after.values()),'publicContentUnchanged':True,'canonicalRoleAuthorityPreserved':True,'negativePrivateChecks':10,'retiredModelRouteChecks':4,'notificationDeliveryEnabled':False,'rollbackLimit':'After the canonical Vera release use forward fixes preserving both protected-role verification and retired legacy model routes; the previous module reopens unmetered model endpoints.'}
        (STAGE/'deployment-result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
    except Exception:
        # Installation-only rollback, before publishing the new Vera frontend.
        target.write_bytes(original);os.chown(target,owner.st_uid,owner.st_gid);os.chmod(target,owner.st_mode & 0o777);restart()
        raise
if __name__=='__main__':main()
