"""Install additive contact outbox with mail OFF and preserve existing records."""
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
import uuid

BASE=Path('/home/vancore/vancore-backend')
STAGE=Path('/var/backups/vancore/codex-20261107-contact-qa')
NODE='/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node'
SERVER_SHA='c9ef532b2c529728fd81a68c791a79501f69822bd08c5f27c9f5d524eac6ac62'
PM2=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2','VANCORE_AUTH_ENFORCE=true','VANCORE_CONTACT_MAIL_ENABLED=false',NODE,str(BASE/'node_modules/pm2/bin/pm2')]

def request(path,body=None):
    req=urllib.request.Request('http://127.0.0.1:3001'+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json'})
    try:
        with urllib.request.urlopen(req,timeout=15) as r:return r.status,json.load(r)
    except urllib.error.HTTPError as e:return e.code,json.load(e)

def rows_state():
    result={}
    with closing(sqlite3.connect(BASE/'data/vancore.db')) as db:
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        assert not db.execute('PRAGMA foreign_key_check').fetchall()
        tables=[r[0] for r in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'")]
        for table in tables:
            values=db.execute('SELECT * FROM "'+table.replace('"','""')+'"').fetchall()
            encoded=sorted(json.dumps(row,default=str,ensure_ascii=False) for row in values)
            result[table]={'count':len(values),'sha256':hashlib.sha256(json.dumps(encoded).encode()).hexdigest()}
    return result

def restart():
    subprocess.run(PM2+['restart','vancore-backend','--update-env'],check=True,stdout=subprocess.DEVNULL)
    for attempt in range(15):
        try:
            status,health=request('/api/health')
            assert status==200 and health.get('status')=='ok'
            return
        except Exception:
            if attempt==14:raise
            time.sleep(1)

def main():
    server=BASE/'server.js';original=server.read_bytes();owner=server.stat()
    assert hashlib.sha256(original).hexdigest()==SERVER_SHA,'Unexpected server source'
    assert b'installContactMaintenance' not in original
    anchor=b"require('./maintenance/content-maintenance.cjs').installContentMaintenance(app, db, loadContent, { requireAdmin: apiSecurity.requireAdmin, table: 'vancore_site_content' });"
    assert original.count(anchor)==1,'Unexpected route installation point'
    for name in ['contact-input.cjs','contact-maintenance.cjs']:
        assert not (BASE/'maintenance'/name).exists(),'Unexpected existing contact module'
        subprocess.run([NODE,'--check',str(STAGE/name)],check=True)
    before=rows_state();content=request('/api/content')
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    rollback=STAGE/'code-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    (rollback/'server.js').write_bytes(original);os.chmod(rollback/'server.js',0o600)
    injection=b"\nrequire('./maintenance/contact-maintenance.cjs').installContactMaintenance(app, db, { requireAdmin: apiSecurity.requireAdmin, deliveryEnabled: process.env.VANCORE_CONTACT_MAIL_ENABLED === 'true' });"
    try:
        for name in ['contact-input.cjs','contact-maintenance.cjs']:
            target=BASE/'maintenance'/name
            shutil.copyfile(STAGE/name,target);os.chown(target,owner.st_uid,owner.st_gid);os.chmod(target,0o644)
        staged=BASE/'server.contact-stage.js';staged.write_bytes(original.replace(anchor,anchor+injection))
        os.chown(staged,owner.st_uid,owner.st_gid);os.chmod(staged,owner.st_mode & 0o777)
        subprocess.run([NODE,'--check',str(staged)],check=True);os.replace(staged,server)
        restart()
        for route in ['/api/incoming','/api/bookings','/api/documents','/api/adminv2/clients']:
            assert request(route)[0]==401,'Private endpoint lost access control'
        assert request('/api/contact',{'name':'Invalid','email':'invalid','message':'Synthetic'})[0]==400
        assert rows_state().get('vancore_contact_deliveries',{}).get('count')==0
        tag='contact-qa-'+str(uuid.uuid4())
        status,result=request('/api/contact',{'name':'Synthetic QA','email':'qa@example.invalid','subject':tag,'message':'Disposable contact durability check. No email requested.','type':'client_chat'})
        assert status==201 and result.get('notification')=='queued'
        fixture_id=result['id']
        with closing(sqlite3.connect(BASE/'data/vancore.db')) as db:
            row=db.execute('SELECT subject,type FROM incoming_messages WHERE id=?',(fixture_id,)).fetchone()
            assert row==(tag,'contact')
            assert db.execute('SELECT status,attempts FROM vancore_contact_deliveries WHERE message_id=?',(fixture_id,)).fetchone()==('queued',0)
        # A controlled restart proves that the synthetic inquiry and queue persist.
        restart()
        with closing(sqlite3.connect(BASE/'data/vancore.db')) as db:
            assert db.execute('SELECT subject,type FROM incoming_messages WHERE id=?',(fixture_id,)).fetchone()==(tag,'contact')
            assert db.execute('SELECT status,attempts FROM vancore_contact_deliveries WHERE message_id=?',(fixture_id,)).fetchone()==('queued',0)
            with db:
                db.execute('DELETE FROM vancore_contact_deliveries WHERE message_id=? AND EXISTS(SELECT 1 FROM incoming_messages WHERE id=? AND subject=?)',(fixture_id,fixture_id,tag))
                assert db.execute('DELETE FROM incoming_messages WHERE id=? AND subject=?',(fixture_id,tag)).rowcount==1
        after=rows_state();assert all(after.get(name)==state for name,state in before.items()),'Existing records changed'
        assert after['vancore_contact_deliveries']['count']==0
        assert request('/api/content')==content,'Public content changed'
        subprocess.run(PM2+['save'],check=True,stdout=subprocess.DEVNULL)
        apps=json.loads(subprocess.check_output(PM2+['jlist'],text=True));app=next(a for a in apps if a['name']=='vancore-backend')
        assert app['pm2_env'].get('VANCORE_AUTH_ENFORCE')=='true'
        assert app['pm2_env'].get('VANCORE_CONTACT_MAIL_ENABLED')=='false'
        report={'deployed':True,'backup':backup,'serverSha256':hashlib.sha256(server.read_bytes()).hexdigest(),'moduleSha256':{name:hashlib.sha256((BASE/'maintenance'/name).read_bytes()).hexdigest() for name in ['contact-input.cjs','contact-maintenance.cjs']},'existingTablesPreserved':len(before),'existingRowsPreserved':sum(s['count'] for s in before.values()),'integrity':'ok','publicContentPreserved':True,'authEnforcement':True,'notificationDeliveryEnabled':False,'realEmailsSent':0,'syntheticEnquiryPersistedAcrossRestart':True,'syntheticEnquiryCleaned':True,'rollbackServer':str(rollback/'server.js')}
        (STAGE/'deployment-result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
    except Exception:
        # Roll back code only. Never restore an older database over live records.
        server.write_bytes(original);os.chown(server,owner.st_uid,owner.st_gid);os.chmod(server,owner.st_mode & 0o777)
        restart()
        raise

if __name__=='__main__':main()
