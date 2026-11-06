"""Read-only service/restart checks; never print saved environment secrets."""
import json
import os
from pathlib import Path
import subprocess

NODE='/opt/vancore/runtimes/node-v24.22.2-linux-x64/bin/node'
BASE=Path('/home/vancore/vancore-backend')
cmd=['runuser','-u','vancore','--','env','PM2_HOME=/home/vancore/.pm2',NODE,str(BASE/'node_modules/pm2/bin/pm2'),'jlist']
apps=json.loads(subprocess.check_output(cmd,text=True));live=[a for a in apps if a.get('name')=='vancore-backend']
assert len(live)==1 and live[0]['pm2_env']['status']=='online'
live_app=live[0];saved=json.loads(Path('/home/vancore/.pm2/dump.pm2').read_text());saved_apps=[a for a in saved if a.get('name')=='vancore-backend']
assert len(saved_apps)==1
active_enforced=live_app['pm2_env'].get('VANCORE_AUTH_ENFORCE')=='true'
saved_enforced=(saved_apps[0].get('VANCORE_AUTH_ENFORCE') or saved_apps[0].get('env',{}).get('VANCORE_AUTH_ENFORCE'))=='true'
assert active_enforced and saved_enforced,'Access enforcement is not persistent'
runtime=os.readlink('/proc/'+str(live_app['pid'])+'/exe');assert runtime==NODE
daemon_pid=int(Path('/home/vancore/.pm2/pm2.pid').read_text());daemon_runtime=os.readlink('/proc/'+str(daemon_pid)+'/exe');assert daemon_runtime==NODE
services={name:subprocess.check_output(['systemctl','is-enabled',name],text=True).strip() for name in ['pm2-vancore.service','vancore-backup.timer']}
assert all(v=='enabled' for v in services.values())
print(json.dumps({'status':'PASS','appOnline':True,'activeEnforcement':active_enforced,'savedEnforcement':saved_enforced,'appInterpreter':runtime,'pm2Interpreter':daemon_runtime,'enabledServices':services,'environmentValuesPrinted':False}))
