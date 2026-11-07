"""Check and clean exactly one generated contact-browser fixture; print no records."""
from contextlib import closing
import json
from pathlib import Path
import re
import sqlite3
import sys

tag=sys.argv[1]
assert re.fullmatch(r'contact-browser-20261107-[a-z0-9]+',tag)
with closing(sqlite3.connect('/home/vancore/vancore-backend/data/vancore.db')) as db:
    rows=db.execute("SELECT i.id,i.type,d.status,d.attempts FROM incoming_messages i JOIN vancore_contact_deliveries d ON d.message_id=i.id WHERE i.sender_name='Synthetic QA' AND i.sender_email='qa@example.invalid' AND i.message LIKE ?",('%'+tag+'%',)).fetchall()
    assert len(rows)==1,'Expected exactly one browser fixture'
    fixture_id,kind,status,attempts=rows[0]
    assert (kind,status,attempts)==('contact','queued',0)
    before=db.execute('SELECT count(*) FROM incoming_messages').fetchone()[0]
    with db:
        assert db.execute('DELETE FROM vancore_contact_deliveries WHERE message_id=? AND status=? AND attempts=0',(fixture_id,'queued')).rowcount==1
        assert db.execute("DELETE FROM incoming_messages WHERE id=? AND sender_email='qa@example.invalid' AND message LIKE ?",(fixture_id,'%'+tag+'%')).rowcount==1
    assert db.execute('SELECT count(*) FROM incoming_messages').fetchone()[0]==before-1
    assert db.execute('PRAGMA integrity_check').fetchone()[0]=='ok'
report={'fixtureTag':tag,'browserToDatabase':'PASS','recordType':'contact','notificationStatus':'queued','notificationAttempts':0,'fixtureCleaned':True,'otherRecordsDeleted':0,'realEmailsSent':0}
print(json.dumps(report))
