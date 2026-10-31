"""Preserve bookings while replacing all-status slot uniqueness with interval guards.

Default is a full transactional rehearsal followed by ROLLBACK. --apply commits.
Use only after an online database/application backup and an isolated restore test.
"""
import argparse
from contextlib import closing
import hashlib
import json
from pathlib import Path
import re
import sqlite3
import subprocess


def fingerprint(database):
    rows = database.execute('SELECT * FROM bookings ORDER BY id').fetchall()
    return len(rows), hashlib.sha256(repr(rows).encode('utf8')).hexdigest()


def migrate(filename, policy, apply=False):
    if not filename.is_file():
        raise ValueError('Existing database file required')
    guards = subprocess.check_output(['node', '-e', 'process.stdout.write(require(process.argv[1]).bookingOverlapGuards)', str(policy.resolve())], text=True)
    if guards.count('CREATE TRIGGER') != 2 or 'VANCORE_BOOKING_OVERLAP' not in guards:
        raise ValueError('Unexpected interval guard definition')
    with closing(sqlite3.connect(str(filename), timeout=10, isolation_level=None)) as database:
        foreign_keys = database.execute('PRAGMA foreign_keys').fetchone()[0]
        if database.execute('PRAGMA integrity_check').fetchone()[0] != 'ok' or database.execute('PRAGMA foreign_key_check').fetchall():
            raise ValueError('Database consistency preflight failed')
        database.execute('PRAGMA foreign_keys=OFF')
        database.execute('BEGIN IMMEDIATE')
        try:
            before = fingerprint(database)
            sql = database.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='bookings'").fetchone()[0]
            objects = database.execute("SELECT type,name,sql FROM sqlite_master WHERE tbl_name='bookings' AND type IN ('index','trigger') AND sql IS NOT NULL").fetchall()
            # A conflict already in the database requires a human decision; never
            # cancel, delete, or shift customer appointments automatically.
            conflict_sql = """SELECT count(*) FROM bookings a JOIN bookings b
              ON a.id<b.id AND a.date=b.date
              WHERE coalesce(a.status,'new')!='cancelled' AND coalesce(b.status,'new')!='cancelled'
              AND (cast(substr(a.time,1,2) AS integer)*60+cast(substr(a.time,4,2) AS integer))
                  <(cast(substr(b.time,1,2) AS integer)*60+cast(substr(b.time,4,2) AS integer))+45
              AND (cast(substr(b.time,1,2) AS integer)*60+cast(substr(b.time,4,2) AS integer))
                  <(cast(substr(a.time,1,2) AS integer)*60+cast(substr(a.time,4,2) AS integer))+45"""
            if database.execute(conflict_sql).fetchone()[0]:
                raise ValueError('Existing active intervals overlap; no changes applied')
            pattern = r',\s*UNIQUE\s*\(\s*date\s*,\s*time\s*\)\s*(?=\))'
            rebuilt_sql, replacements = re.subn(pattern, '', sql, flags=re.I)
            if replacements not in (0, 1):
                raise ValueError('Unexpected uniqueness schema')
            if replacements:
                if database.execute("SELECT count(*) FROM sqlite_master WHERE name='bookings_interval_stage'").fetchone()[0]:
                    raise ValueError('Staging table already exists')
                sequence = database.execute("SELECT seq FROM sqlite_sequence WHERE name='bookings'").fetchone()
                staged_sql, count = re.subn(r'^CREATE TABLE\s+(?:"bookings"|bookings)\s*\(', 'CREATE TABLE bookings_interval_stage (', rebuilt_sql, count=1, flags=re.I)
                if count != 1:
                    raise ValueError('Unexpected booking table definition')
                database.execute(staged_sql)
                columns = [row[1] for row in database.execute('PRAGMA table_info(bookings)')]
                quoted = ','.join('"'+name.replace('"','""')+'"' for name in columns)
                database.execute(f'INSERT INTO bookings_interval_stage ({quoted}) SELECT {quoted} FROM bookings')
                database.execute('DROP TABLE bookings')
                database.execute('ALTER TABLE bookings_interval_stage RENAME TO bookings')
                if sequence:
                    database.execute("UPDATE sqlite_sequence SET seq=max(seq,?) WHERE name='bookings'", [sequence[0]])
                for kind, name, definition in objects:
                    database.execute(definition)
            database.execute("CREATE UNIQUE INDEX IF NOT EXISTS vancore_active_booking_slot ON bookings(date,time) WHERE status IS NULL OR status!='cancelled'")
            # executescript commits implicitly; use complete_statement to retain
            # the surrounding transaction while executing the trigger bodies.
            statement = ''
            for line in guards.splitlines(True):
                statement += line
                if sqlite3.complete_statement(statement):
                    database.execute(statement)
                    statement = ''
            if statement.strip():
                raise ValueError('Incomplete guard SQL')
            after = fingerprint(database)
            if before != after:
                raise ValueError('Booking content changed during migration')
            if database.execute('PRAGMA foreign_key_check').fetchall() or database.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise ValueError('Post-migration database checks failed')
            database.execute('COMMIT' if apply else 'ROLLBACK')
            return {'status': 'PASS', 'committed': apply, 'tableRebuilt': bool(replacements), 'rowsPreserved': before[0], 'contentSha256': before[1], 'foreignKeyViolations': 0}
        except Exception:
            database.execute('ROLLBACK')
            raise
        finally:
            database.execute('PRAGMA foreign_keys='+str(foreign_keys))


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--database', required=True, type=Path)
    parser.add_argument('--policy', required=True, type=Path)
    parser.add_argument('--apply', action='store_true')
    args = parser.parse_args()
    print(json.dumps(migrate(args.database, args.policy, args.apply)))
