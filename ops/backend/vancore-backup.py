#!/usr/bin/python3
"""Online SQLite backup plus application/config archive; root-only output."""
import datetime
from contextlib import closing
import hashlib
import json
import os
from pathlib import Path
import sqlite3
import tarfile

base = Path('/home/vancore/vancore-backend')
backup_root = Path('/var/backups/vancore/daily')
backup_root.mkdir(parents=True, exist_ok=True, mode=0o700)
os.chmod(backup_root, 0o700)
stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S.%fZ')
destination = backup_root / stamp
destination.mkdir(mode=0o700)
with closing(sqlite3.connect('file:' + str(base / 'data/vancore.db') + '?mode=ro', uri=True)) as source:
    with closing(sqlite3.connect(str(destination / 'vancore.db'))) as target:
        source.backup(target)
        if target.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
            raise RuntimeError('Backup database integrity check failed')
archive = destination / 'restore.tar.gz'
with tarfile.open(archive, 'w:gz') as output:
    for item in base.iterdir():
        if item.name not in ('node_modules', 'backups', 'data'):
            output.add(item, arcname='backend/' + item.name)
    for item in (base / 'data').iterdir():
        if item.suffix == '.json':
            output.add(item, arcname='backend/data/' + item.name)
    output.add(destination / 'vancore.db', arcname='backend/data/vancore.db')
    output.add('/etc/nginx/sites-available', arcname='nginx-sites-available')
    for name in ('pm2-vancore.service', 'vancore-backup.service', 'vancore-backup.timer'):
        item = Path('/etc/systemd/system') / name
        if item.exists(): output.add(item, arcname='systemd/' + name)
    for filename, member in [('/home/vancore/.pm2/dump.pm2', 'pm2/dump.pm2'),
                             ('/etc/vancore/runtime-manifest.json', 'runtime/runtime-manifest.json'),
                             ('/usr/local/sbin/vancore-backup.py', 'maintenance/vancore-backup.py')]:
        item = Path(filename)
        if item.is_file(): output.add(item, arcname=member)
manifest = {'created_utc': stamp, 'sqlite_integrity': 'ok', 'sha256': hashlib.sha256(archive.read_bytes()).hexdigest(), 'bytes': archive.stat().st_size}
(destination / 'manifest.json').write_text(json.dumps(manifest, indent=2))
for item in destination.iterdir(): os.chmod(item, 0o600)
print(json.dumps({'backup': str(destination), **manifest}))
