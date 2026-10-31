"""Switch the single reviewed PM2 app and startup service to the tested LTS.
Keeps the previous interpreter, unit and private dump for code/config rollback.
Does not restore or replace any database.
"""
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
STAGE=Path('/var/backups/vancore/codex-20261031-node24-qa')
NODE=Path('/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node')
PM2=BASE/'node_modules/pm2/bin/pm2'
UNIT=Path('/etc/systemd/system/pm2-vancore.service')
DUMP=Path('/home/vancore/.pm2/dump.pm2')


def pm2(*args,node=NODE,capture=False,check=True):
    command=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2',str(node),str(PM2),*args]
    if capture:return subprocess.check_output(command,text=True)
    return subprocess.run(command,check=check,stdout=subprocess.DEVNULL)


def app_state():
    apps=json.loads(pm2('jlist',capture=True))
    assert len(apps)==1 and apps[0]['name']=='vancore-backend','Unexpected process list; do not stop other applications'
    assert apps[0]['pm2_env']['pm_exec_path']==str(BASE/'server.js'),'Unexpected application path'
    return apps[0]


def health():
    for _ in range(20):
        try:
            with urllib.request.urlopen('http://127.0.0.1:3001/api/health',timeout=2) as response:
                if json.load(response).get('status')=='ok':return
        except Exception:pass
        time.sleep(.5)
    raise RuntimeError('Backend did not become healthy')


def public_content():
    with urllib.request.urlopen('http://127.0.0.1:3001/api/content',timeout=5) as response:
        return json.dumps(json.load(response),sort_keys=True)


def main():
    assert subprocess.check_output([str(NODE),'--version'],text=True).strip()=='v24.22.2'
    app_state();health()
    assert hashlib.sha256((BASE/'server.js').read_bytes()).hexdigest()=='1126c21049c5cd1ffd21015232912a9ad5e493ce09cfaba161e9a80a9d4ea12c','Unexpected source revision'
    before_content=public_content()
    original_unit=UNIT.read_bytes();original_dump=DUMP.read_bytes()
    rollback=STAGE/'runtime-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    for name,data in [('pm2-vancore.service',original_unit),('dump.pm2',original_dump)]:
        target=rollback/name;target.write_bytes(data);target.chmod(0o600)
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    text=original_unit.decode()
    assert text.count('/usr/bin/node ')==3,'Unexpected startup unit'
    text=text.replace('/usr/bin/node ',str(NODE)+' ')
    lines=text.splitlines();found=False
    for i,line in enumerate(lines):
        if line.startswith('Environment=PATH='):
            lines[i]='Environment=PATH='+str(NODE.parent)+':'+line[len('Environment=PATH='):];found=True
    assert found,'Startup PATH not found'
    try:
        # First prove the application itself runs with the candidate interpreter.
        pm2('restart','vancore-backend','--interpreter',str(NODE));health()
        app=app_state()
        assert os.readlink('/proc/'+str(app['pid'])+'/exe')==str(NODE),'Interpreter switch did not take effect'
        pm2('save')
        UNIT.write_text('\n'.join(lines)+'\n');UNIT.chmod(0o644)
        subprocess.run(['systemctl','daemon-reload'],check=True)
        subprocess.run(['systemctl','enable','pm2-vancore'],check=True,stdout=subprocess.DEVNULL)
        # Recreate the daemon inside systemd's cgroup; the old unit was inactive.
        transition_started=time.monotonic()
        pm2('kill')
        subprocess.run(['systemctl','start','pm2-vancore'],check=True,stdout=subprocess.DEVNULL)
        health()
        app=app_state()
        daemon_pid=int(Path('/home/vancore/.pm2/pm2.pid').read_text().strip())
        assert os.readlink('/proc/'+str(daemon_pid)+'/exe')==str(NODE),'Daemon still uses the old runtime'
        assert os.readlink('/proc/'+str(app['pid'])+'/exe')==str(NODE),'Application interpreter changed'
        subprocess.run(['systemctl','is-active','--quiet','pm2-vancore'],check=True)
        subprocess.run(['systemctl','is-enabled','--quiet','pm2-vancore'],check=True)
        assert public_content()==before_content,'Public content changed during restart'
        with sqlite3.connect('file:'+str(BASE/'data/vancore.db')+'?mode=ro',uri=True) as database:
            assert database.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
            assert not database.execute('PRAGMA foreign_key_check').fetchall()
        pm2('save')
        result={'activeRuntime':'v24.22.2','applicationAndDaemonVerified':True,'startupService':'active and enabled','controlledTransitionSeconds':round(time.monotonic()-transition_started,2),'health':'ok','publicContentPreserved':True,'databaseIntegrity':'ok','backup':backup,'privateRollback':str(rollback),'oldSystemRuntimeRetainedForRollback':True,'machineRebootPerformed':False}
        (STAGE/'activation-result.json').write_text(json.dumps(result,indent=2))
        print(json.dumps(result))
    except Exception:
        subprocess.run(['systemctl','stop','pm2-vancore'],check=False,stdout=subprocess.DEVNULL)
        pidfile=Path('/home/vancore/.pm2/pm2.pid')
        if pidfile.exists() and Path('/proc/'+pidfile.read_text().strip()).exists():pm2('kill',check=False)
        UNIT.write_bytes(original_unit);UNIT.chmod(0o644)
        DUMP.write_bytes(original_dump);os.chown(DUMP,(BASE/'server.js').stat().st_uid,(BASE/'server.js').stat().st_gid)
        subprocess.run(['systemctl','daemon-reload'],check=True)
        subprocess.run(['systemctl','start','pm2-vancore'],check=True,stdout=subprocess.DEVNULL)
        health()
        raise


if __name__=='__main__':main()
