"""Install a checksum-pinned official Node LTS beside the current runtime.
Does not change PATH, PM2, systemd or any running application.
"""
import hashlib
import json
from pathlib import Path, PurePosixPath
import posixpath
import subprocess
import tarfile
import urllib.request

VERSION='v24.22.2'
NAME='node-'+VERSION+'-linux-x64'
SHA256='48cc0e21e048790e54c0cf5749c2725005313d652651c40b7a21feb9697aaf75'
URL='https://nodejs.org/dist/'+VERSION+'/'+NAME+'.tar.xz'
STAGE=Path('/var/backups/vancore/codex-20261031-node24-qa')
PARENT=Path('/opt/vancore/runtimes')


def main():
    STAGE.mkdir(mode=0o700,parents=True,exist_ok=True)
    archive=STAGE/(NAME+'.tar.xz')
    digest=hashlib.sha256()
    with urllib.request.urlopen(URL,timeout=30) as response, archive.open('wb') as output:
        total=0
        while True:
            block=response.read(1024*1024)
            if not block:break
            total+=len(block)
            if total>200*1024*1024:raise ValueError('Unexpected archive size')
            digest.update(block);output.write(block)
    archive.chmod(0o600)
    if digest.hexdigest()!=SHA256:raise ValueError('Official runtime archive checksum mismatch')
    PARENT.mkdir(mode=0o755,parents=True,exist_ok=True)
    destination=PARENT/NAME
    if destination.exists():raise ValueError('Runtime destination already exists; inspect before replacing')
    with tarfile.open(archive,'r:xz') as bundle:
        for member in bundle.getmembers():
            p=PurePosixPath(member.name)
            if p.is_absolute() or '..' in p.parts or not p.parts or p.parts[0]!=NAME:raise ValueError('Unsafe runtime member path')
            if not (member.isfile() or member.isdir() or member.issym() or member.islnk()):raise ValueError('Unsupported runtime member')
            if member.issym() or member.islnk():
                target=posixpath.normpath(posixpath.join(str(p.parent),member.linkname)) if member.issym() else posixpath.normpath(member.linkname)
                if not target.startswith(NAME+'/'):raise ValueError('Runtime link leaves its directory')
    subprocess.run(['tar','-xJf',str(archive),'-C',str(PARENT),'--no-same-owner'],check=True)
    node=destination/'bin/node'
    version=subprocess.check_output([str(node),'--version'],text=True).strip()
    if version!=VERSION:raise ValueError('Runtime version mismatch')
    report={'version':version,'source':URL,'archiveSha256':SHA256,'node':str(node),'activeRuntimeChanged':False}
    (STAGE/'runtime-manifest.json').write_text(json.dumps(report,indent=2))
    print(json.dumps(report))


if __name__=='__main__':main()
