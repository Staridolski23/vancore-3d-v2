"""Validate an offline VANCORE archive without printing records or executing code.

Usage: python scripts/verify-backup.py ARCHIVE --sha256 EXPECTED --report REPORT
Only SQLite files are restored, inside a fresh temporary directory. Live paths
and live databases are never opened. The report contains structural counts only.
"""
import argparse
from contextlib import closing
import hashlib
import json
from pathlib import Path, PurePosixPath
import sqlite3
import tarfile
import tempfile


def verify(archive, expected):
    with archive.open('rb') as source:
        digest = hashlib.file_digest(source, 'sha256').hexdigest()
    if digest != expected.lower():
        raise ValueError('Archive checksum mismatch')
    result = {'sha256': digest, 'databaseChecks': [], 'clientRecordsPrinted': False}
    with tarfile.open(archive, 'r:gz') as bundle, tempfile.TemporaryDirectory(prefix='vancore-restore-') as scratch:
        members = bundle.getmembers()
        for member in members:
            member_path = PurePosixPath(member.name)
            if member_path.is_absolute() or '..' in member_path.parts or '\\' in member.name or ':' in member.name:
                raise ValueError('Unsafe archive path')
            if not (member.isfile() or member.isdir()):
                raise ValueError('Unsupported archive member type')
        result['archiveMembers'] = len(members)
        for index, member in enumerate(members):
            if not member.isfile() or not member.name.endswith('.db'):
                continue
            destination = Path(scratch) / f'database-{index}.db'
            destination.write_bytes(bundle.extractfile(member).read())
            with closing(sqlite3.connect(destination.as_uri() + '?mode=ro', uri=True)) as database:
                integrity = [row[0] for row in database.execute('PRAGMA integrity_check')]
                foreign_keys = len(database.execute('PRAGMA foreign_key_check').fetchall())
                tables = database.execute("SELECT count(*) FROM sqlite_master WHERE type='table'").fetchone()[0]
                if integrity != ['ok'] or foreign_keys:
                    raise ValueError('Restored database consistency check failed')
                result['databaseChecks'].append({'archivePath': member.name, 'integrity': 'ok', 'foreignKeyViolations': foreign_keys, 'tables': tables})
        if not result['databaseChecks']:
            raise ValueError('No database found in archive')
    result['status'] = 'PASS'
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('archive', type=Path)
    parser.add_argument('--sha256', required=True)
    parser.add_argument('--report', type=Path, required=True)
    args = parser.parse_args()
    report = verify(args.archive, args.sha256)
    args.report.write_text(json.dumps(report, indent=2), encoding='utf8')
    print(json.dumps(report))
