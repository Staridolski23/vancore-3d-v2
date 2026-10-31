"""Guarded deployment on the existing host; reviewed files must already be staged.
No environment values, client records or email contents are printed.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import shutil
import sqlite3
import subprocess
import time
import urllib.request
import urllib.error

BASE=Path('/home/vancore/vancore-backend')
STAGE=Path('/var/backups/vancore/codex-20261031-interval-qa')
EXPECTED_SERVER='1126c21049c5cd1ffd21015232912a9ad5e493ce09cfaba161e9a80a9d4ea12c'
EXPECTED_MODULE='c5e66fff318db3ecf78a523515dad79cfe1f47b711ec1c426c0aa62072c0b5ce'


def content():
    with urllib.request.urlopen('http://127.0.0.1:3001/api/content',timeout=5) as response:
        return json.dumps(json.load(response),sort_keys=True)


def main():
    target=BASE/'maintenance/bookings.cjs'
    original=target.read_bytes()
    assert hashlib.sha256((BASE/'server.js').read_bytes()).hexdigest()==EXPECTED_SERVER,'Unexpected server revision'
    assert hashlib.sha256(original.decode().replace('\r\n','\n').encode()).hexdigest()==EXPECTED_MODULE,'Unexpected booking module revision'
    for name in ['booking-policy.cjs','bookings-maintenance.cjs']:
        subprocess.run(['node','--check',str(STAGE/name)],check=True)
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    rollback=STAGE/'booking-code-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    (rollback/'bookings.cjs').write_bytes(original);os.chmod(rollback/'bookings.cjs',0o600)
    before_content=content()
    spec=importlib.util.spec_from_file_location('booking_interval_migration',STAGE/'booking-interval-migration.py')
    migration=importlib.util.module_from_spec(spec);spec.loader.exec_module(migration)
    # This transaction preserves every booking row and validates all foreign keys.
    result=migration.migrate(BASE/'data/vancore.db',STAGE/'booking-policy.cjs',apply=True)
    owner=target.stat()
    for source,destination in [('booking-policy.cjs','booking-policy.cjs'),('bookings-maintenance.cjs','bookings.cjs')]:
        staged=BASE/'maintenance'/(destination+'.stage')
        shutil.copyfile(STAGE/source,staged);os.chown(staged,owner.st_uid,owner.st_gid);os.chmod(staged,0o644)
        os.replace(staged,BASE/'maintenance'/destination)
    pm2=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2','node',str(BASE/'node_modules/pm2/bin/pm2')]
    try:
        subprocess.run(pm2+['restart','vancore-backend'],check=True,stdout=subprocess.DEVNULL)
        healthy=False
        for _ in range(12):
            try:
                with urllib.request.urlopen('http://127.0.0.1:3001/api/health',timeout=2) as response:
                    healthy=json.load(response).get('status')=='ok'
                if healthy:break
            except Exception:
                pass
            time.sleep(1)
        assert healthy,'Backend health check failed'
        assert content()==before_content,'Public content changed'
        with sqlite3.connect('file:'+str(BASE/'data/vancore.db')+'?mode=ro',uri=True) as database:
            row=database.execute("SELECT date,time FROM bookings WHERE coalesce(status,'new')!='cancelled' LIMIT 1").fetchone()
            assert database.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
            assert not database.execute('PRAGMA foreign_key_check').fetchall()
        # Guaranteed conflicting insert: the DB guard rejects it before any write.
        # No valid new appointment, customer message, or email is created.
        if row:
            request=urllib.request.Request('http://127.0.0.1:3001/api/bookings',data=json.dumps({'date':row[0],'time':row[1],'name':'Synthetic conflict probe','email':'qa@example.invalid'}).encode(),headers={'Content-Type':'application/json'})
            try:
                urllib.request.urlopen(request,timeout=5)
                raise AssertionError('Conflict probe unexpectedly succeeded')
            except urllib.error.HTTPError as error:
                assert error.code==409
                assert json.load(error).get('error')=='This time overlaps an existing booking'
        subprocess.run(pm2+['save'],check=True,stdout=subprocess.DEVNULL)
        report={'deployed':True,'health':'ok','publicContentPreserved':True,'migration':result,'backup':backup,'codeRollback':str(rollback),'bookingModuleSha256':hashlib.sha256(target.read_bytes()).hexdigest()}
        (STAGE/'deployment-result.json').write_text(json.dumps(report,indent=2))
        print(json.dumps(report))
    except Exception:
        target.write_bytes(original);os.chown(target,owner.st_uid,owner.st_gid)
        subprocess.run(pm2+['restart','vancore-backend'],check=True,stdout=subprocess.DEVNULL)
        # Keep the compatible forward schema/guards and all new customer rows.
        raise


if __name__=='__main__':
    main()
