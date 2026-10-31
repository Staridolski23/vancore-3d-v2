"""Extend existing private archives with the PM2 dump and pinned runtime record."""
import hashlib
import json
from pathlib import Path
import subprocess

stage=Path('/var/backups/vancore/codex-20261031-node24-qa')
installed=Path('/usr/local/sbin/vancore-backup.py')
assert hashlib.sha256(installed.read_text().replace('\r\n','\n').encode()).hexdigest()=='88c672ca62be0c574dcfc35a5dd1d385e808b605b298cd9aa546b29f4c4ab3e8','Backup script changed since inspection'
subprocess.run(['systemctl','is-active','--quiet','pm2-vancore'],check=True)
subprocess.run(['/usr/bin/python3','-m','py_compile',str(stage/'vancore-backup.py')],check=True)
rollback=stage/'runtime-rollback'
(rollback/'vancore-backup.py').write_bytes(installed.read_bytes());(rollback/'vancore-backup.py').chmod(0o600)
runtime=json.loads((stage/'runtime-manifest.json').read_text())
runtime['activeRuntimeChanged']=True
runtime['startupService']='pm2-vancore.service'
runtime['globalOldRuntime']='Retained solely for rollback; application and daemon use the pinned path'
config=Path('/etc/vancore');config.mkdir(mode=0o700,exist_ok=True)
(config/'runtime-manifest.json').write_text(json.dumps(runtime,indent=2));(config/'runtime-manifest.json').chmod(0o600)
temporary=Path('/usr/local/sbin/vancore-backup.stage.py')
temporary.write_text((stage/'vancore-backup.py').read_text().replace('\r\n','\n'));temporary.chmod(0o700)
temporary.replace(installed)
print(subprocess.check_output([str(installed)],text=True).strip())
