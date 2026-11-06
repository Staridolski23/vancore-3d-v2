"""Guarded, data-preserving calendar serialization fix on the existing host."""
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import time
import urllib.request

BASE=Path('/home/vancore/vancore-backend')
STAGE=Path('/var/backups/vancore/codex-20261107-calendar-privacy')
NODE='/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node'
SERVER_SHA='c9ef532b2c529728fd81a68c791a79501f69822bd08c5f27c9f5d524eac6ac62'
MODULE_SHA='7ba6bcb0a32d98d0b23e1c3649a8de8ad7e6a7d4cfa36a44d15562d2450177a0'
PM2=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2',NODE,str(BASE/'node_modules/pm2/bin/pm2')]

def get(url):
    with urllib.request.urlopen(url,timeout=5) as r:return json.load(r)

def booking_state():
    with closing(sqlite3.connect('file:'+str(BASE/'data/vancore.db')+'?mode=ro',uri=True)) as db:
        db.row_factory=sqlite3.Row
        assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
        assert not db.execute('PRAGMA foreign_key_check').fetchall()
        return [dict(row) for row in db.execute('SELECT * FROM bookings ORDER BY id')]

def main():
    target=BASE/'maintenance/bookings.cjs';original=target.read_bytes();owner=target.stat()
    assert hashlib.sha256((BASE/'server.js').read_bytes()).hexdigest()==SERVER_SHA,'Unexpected server source'
    assert hashlib.sha256(original).hexdigest()==MODULE_SHA,'Unexpected booking module'
    subprocess.run([NODE,'--check',str(STAGE/'bookings-maintenance.cjs')],check=True)
    before_content=get('http://127.0.0.1:3001/api/content');before_rows=booking_state()
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    rollback=STAGE/'code-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    (rollback/'bookings.cjs').write_bytes(original);os.chmod(rollback/'bookings.cjs',0o600)
    staged=BASE/'maintenance/bookings.privacy-stage.cjs';shutil.copyfile(STAGE/'bookings-maintenance.cjs',staged)
    os.chown(staged,owner.st_uid,owner.st_gid);os.chmod(staged,0o644);os.replace(staged,target)
    try:
        subprocess.run(PM2+['restart','vancore-backend'],check=True,stdout=subprocess.DEVNULL)
        for attempt in range(12):
            try:
                assert get('http://127.0.0.1:3001/api/health')['status']=='ok'
                break
            except Exception:
                if attempt==11:raise
                time.sleep(1)
        assert get('http://127.0.0.1:3001/api/content')==before_content,'Public content changed'
        after_rows=booking_state();after_map={r['id']:r for r in after_rows}
        assert all(after_map.get(r['id'])==r for r in before_rows),'Existing booking content changed'
        for row in before_rows:
            date=row.get('date','')
            if len(date)!=10:continue
            response=get('http://127.0.0.1:3001/api/bookings?year='+date[:4]+'&month='+str(int(date[5:7])-1))
            assert response['bookings'] and all(set(r)=={'date','time','status'} for r in response['bookings'])
            break
        subprocess.run(PM2+['save'],check=True,stdout=subprocess.DEVNULL)
        report={'deployed':True,'moduleSha256':hashlib.sha256(target.read_bytes()).hexdigest(),'backup':backup,'preservedExistingBookings':len(before_rows),'databaseWritten':False,'integrity':'ok','publicContentPreserved':True,'anonymousMonthlyPrivateFields':False,'remainingRisk':'Other legacy private routes still require coordinated frontend/auth rollout','rollbackModule':str(rollback/'bookings.cjs')}
        (STAGE/'deployment-result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
    except Exception:
        target.write_bytes(original);os.chown(target,owner.st_uid,owner.st_gid)
        subprocess.run(PM2+['restart','vancore-backend'],check=True,stdout=subprocess.DEVNULL)
        raise

if __name__=='__main__':main()
