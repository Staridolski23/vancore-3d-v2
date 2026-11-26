"""Install a read-only fixed-source relay, preserving the canonical identity guard.

No customer rows or authorization settings are changed. Stage the module and the
public Sectigo intermediate alongside this file in the root-private STAGE folder.
The missing intermediate must chain to the existing OS roots before scoped use.
"""
from contextlib import closing
from pathlib import Path
import hashlib,json,os,shutil,sqlite3,subprocess,time,urllib.request,urllib.error

BASE=Path('/home/vancore/vancore-backend')
STAGE=Path('/var/backups/vancore/codex-20261124-legal-source-proxy')
NODE='/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node'
SERVER='f1428aaa6fd849032bb94c7bb706e29db5ade10e51774336b9ab4fc929211002'
AUTH='a6e719a3466d71759274900b7a3b7fa92bdb3695efc95bc90461a8d18c4b6a57'
INTERMEDIATE='b40358316fd9e1caaaab92c382927d2c13ef51b481eec9371a82e16c86f2a687'
PM2=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2',NODE,str(BASE/'node_modules/pm2/bin/pm2')]

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()
def get(path,invalid=False):
    request=urllib.request.Request('http://127.0.0.1:3001'+path,headers={'Authorization':'Bearer synthetic-invalid-token'} if invalid else {})
    try:
        with urllib.request.urlopen(request,timeout=10) as response:return response.status,response.read()
    except urllib.error.HTTPError as error:return error.code,error.read()
def databases():
    result={}
    for relative in ['data/vancore.db','vancore.db']:
        path=BASE/relative
        if not path.exists():continue
        with closing(sqlite3.connect('file:'+str(path)+'?mode=ro',uri=True)) as db:
            assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
            tables={}
            for (name,) in db.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"):
                rows=db.execute('SELECT * FROM "'+name.replace('"','""')+'"').fetchall()
                tables[name]={'rows':len(rows),'sha256':hashlib.sha256(json.dumps(sorted(json.dumps(row,default=str) for row in rows)).encode()).hexdigest()}
            result[relative]=tables
    return result
def restart():
    subprocess.run(PM2+['restart','vancore-backend'],check=True,stdout=subprocess.DEVNULL)
    for attempt in range(15):
        try:
            assert get('/api/health')[0]==200
            return
        except Exception:
            if attempt==14:raise
            time.sleep(1)
def main():
    server=BASE/'server.js';original=server.read_bytes();owner=server.stat()
    assert digest(server)==SERVER and digest(BASE/'maintenance/backend-auth.cjs')==AUTH,'Unexpected deployed source'
    manifest=json.loads((STAGE/'candidate.json').read_text())
    candidate=STAGE/'legal-source-proxy.cjs'
    assert digest(candidate)==manifest['moduleSha256'],'Candidate differs from reviewed module'
    assert digest(STAGE/'sectigo-r36.pem')==INTERMEDIATE,'Unexpected public intermediate'
    subprocess.run(['openssl','verify','-CApath','/etc/ssl/certs',str(STAGE/'sectigo-r36.pem')],check=True,stdout=subprocess.DEVNULL)
    # This bundle is scoped to the Ministry host, never an OS trust-store change.
    bundle=STAGE/'legal-source-ca.pem'
    bundle.write_bytes(Path('/etc/ssl/certs/ca-certificates.crt').read_bytes()+b'\n'+(STAGE/'sectigo-r36.pem').read_bytes())
    subprocess.run([NODE,'--check',str(candidate)],check=True)
    smoke="""const m=require(process.argv[1]); (async()=>{const s=m.createSourceService();let out=[];for(const id of Object.keys(m.SOURCES)){const r=await s.read(id);if(r.status!==200)throw Error('Source unavailable: '+id);out.push({id,bytes:Buffer.byteLength(r.body.html),sha256:r.body.sha256,downloadedAt:r.body.downloadedAt,transportUrl:r.body.transportUrl});}console.log(JSON.stringify(out));})().catch(()=>process.exit(1));"""
    sources=json.loads(subprocess.check_output([NODE,'-e',smoke,str(candidate)],text=True,timeout=45))
    before=databases();content=get('/api/content')
    backup=json.loads(subprocess.check_output(['/usr/local/sbin/vancore-backup.py'],text=True))
    rollback=STAGE/'installation-rollback';rollback.mkdir(mode=0o700,exist_ok=True)
    (rollback/'server.js').write_bytes(original);os.chmod(rollback/'server.js',0o600)
    # Online copies of both active and legacy SQLite files, including WAL content.
    for relative in before:
        with closing(sqlite3.connect('file:'+str(BASE/relative)+'?mode=ro',uri=True)) as source:
            target_path=rollback/(relative.replace('/','-'))
            with closing(sqlite3.connect(str(target_path))) as target:
                source.backup(target);assert target.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
            os.chmod(target_path,0o600)
    anchor='app.use(apiSecurity.middleware);'
    text=original.decode();assert text.count(anchor)==1
    insertion="require('./maintenance/legal-source-proxy.cjs').installLegalSources(app, { principal: apiSecurity.principal });\n"
    targets=[BASE/'maintenance/legal-source-proxy.cjs',BASE/'maintenance/legal-source-ca.pem']
    assert all(not item.exists() for item in targets),'Relay already installed; use a forward update'
    try:
        for source,target in zip([candidate,bundle],targets):
            shutil.copyfile(source,target);os.chown(target,owner.st_uid,owner.st_gid);os.chmod(target,0o644)
        staged=BASE/'server.legal-stage.js';staged.write_text(text.replace(anchor,insertion+anchor))
        os.chown(staged,owner.st_uid,owner.st_gid);os.chmod(staged,owner.st_mode&0o777)
        subprocess.run([NODE,'--check',str(staged)],check=True);os.replace(staged,server)
        restart()
        for path in ['/api/legal-sources/bg-obligations','/api/legal-sources/eu-gdpr','/api/bookings','/api/documents','/api/adminv2/clients']:
            assert get(path)[0]==401 and get(path,True)[0]==401
        assert get('/api/content')==content,'Public content changed'
        assert digest(BASE/'maintenance/backend-auth.cjs')==AUTH
        after=databases();assert before==after,'Database rows changed during deployment'
        apps=json.loads(subprocess.check_output(PM2+['jlist'],text=True));app=next(a for a in apps if a['name']=='vancore-backend')
        assert app['pm2_env'].get('VANCORE_AUTH_ENFORCE')=='true' and app['pm2_env'].get('VANCORE_CONTACT_MAIL_ENABLED')=='false'
        subprocess.run(PM2+['save'],check=True,stdout=subprocess.DEVNULL)
        report={'deployed':True,'serverBefore':SERVER,'serverAfter':digest(server),'moduleSha256':digest(targets[0]),'backup':backup,'sqliteUnchanged':True,'sqliteFiles':len(before),'privateNegativeChecks':10,'sources':sources,'globalTrustStoreChanged':False,'canonicalIdentityPreserved':True,'newCredentials':False}
        (STAGE/'deployment-result.json').write_text(json.dumps(report,indent=2));print(json.dumps(report))
    except Exception:
        server.write_bytes(original);os.chown(server,owner.st_uid,owner.st_gid);os.chmod(server,owner.st_mode&0o777)
        restart()
        raise
if __name__=='__main__':main()
