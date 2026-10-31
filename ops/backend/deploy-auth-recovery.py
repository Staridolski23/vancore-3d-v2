"""Install only the public recovery document. No DB or credential changes."""
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import time
import urllib.request

BASE=Path('/home/vancore/vancore-backend')
STAGE=Path('/var/backups/vancore/codex-20261031-auth-recovery')
NODE='/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node'
EXPECTED='1126c21049c5cd1ffd21015232912a9ad5e493ce09cfaba161e9a80a9d4ea12c'
PM2=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2',NODE,str(BASE/'node_modules/pm2/bin/pm2')]

def get(url):
    with urllib.request.urlopen(url,timeout=5) as r:return r.read()

def main():
    server=BASE/'server.js';original=server.read_bytes()
    assert hashlib.sha256(original).hexdigest()==EXPECTED,'Unexpected server revision'
    conf=json.loads((STAGE/'auth-recovery-config.json').read_text())
    assert conf['url']=='https://wqvhivuyvzdbuguuojhk.supabase.co' and conf['publishableKey'].startswith('sb_publishable_')
    subprocess.run([NODE,'--check',str(STAGE/'auth-recovery.cjs')],check=True)
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    rollback=STAGE/'code-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    (rollback/'server.js').write_bytes(original);os.chmod(rollback/'server.js',0o600)
    before=get('http://127.0.0.1:3001/api/content');owner=server.stat()
    # Register before session/API middleware; document itself never receives tokens.
    anchor=b'app.use(express.json());'
    assert original.count(anchor)==1
    addition=b"\nrequire('./maintenance/auth-recovery.cjs').installAuthRecovery(app, require('./maintenance/auth-recovery-config.json'));"
    candidate=original.replace(anchor,anchor+addition)
    for name in ['auth-recovery.cjs','auth-recovery.html','auth-recovery-config.json']:
        target=BASE/'maintenance'/name
        assert not target.exists() or target.read_bytes()==(STAGE/name).read_bytes(),'Unexpected existing recovery file'
        shutil.copyfile(STAGE/name,target);os.chown(target,owner.st_uid,owner.st_gid);os.chmod(target,0o644)
    old_stage=BASE/'server.js.auth-stage'
    if old_stage.exists():
        assert old_stage.read_bytes()==candidate,'Unexpected prior staging content'
        os.replace(old_stage,rollback/'server.auth-stage.txt')
    stage_server=BASE/'server.auth-stage.js';stage_server.write_bytes(candidate)
    os.chown(stage_server,owner.st_uid,owner.st_gid);os.chmod(stage_server,0o644)
    subprocess.run([NODE,'--check',str(stage_server)],check=True)
    os.replace(stage_server,server)
    try:
        subprocess.run(PM2+['restart','vancore-backend'],check=True,stdout=subprocess.DEVNULL)
        for attempt in range(12):
            try:
                assert json.loads(get('http://127.0.0.1:3001/api/health'))['status']=='ok'
                break
            except Exception:
                if attempt==11:raise
                time.sleep(1)
        assert get('http://127.0.0.1:3001/api/content')==before,'Public content changed'
        with urllib.request.urlopen('http://127.0.0.1:3001/auth/reset-password',timeout=5) as r:
            assert r.status==200 and 'no-store' in r.headers['Cache-Control']
            assert "frame-ancestors 'none'" in r.headers['Content-Security-Policy']
            assert b'Set a new password' in r.read()
        subprocess.run(PM2+['save'],check=True,stdout=subprocess.DEVNULL)
        report={'deployed':True,'backup':backup,'serverSha256':hashlib.sha256(server.read_bytes()).hexdigest(),'health':'ok','publicContentPreserved':True,'codeRollback':str(rollback),'publicRecovery':'https://api.vancoresys.com/auth/reset-password','databaseChanged':False}
        (STAGE/'deployment-result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
    except Exception:
        server.write_bytes(original);os.chown(server,owner.st_uid,owner.st_gid)
        subprocess.run(PM2+['restart','vancore-backend'],check=True,stdout=subprocess.DEVNULL)
        raise

if __name__=='__main__':main()
