#!/bin/bash
# Database restore script

set -e

BACKUP_FILE=$1

if [ -z "$BACKUP_FILE" ]; then
    echo "Usage: $0 <backup-file>"
    exit 1
fi

# Decrypt backup
DECRYPTED_FILE="${BACKUP_FILE}.decrypted"
gpg --batch --yes --passphrase $GPG_PASSPHRASE \
    --decrypt --output $DECRYPTED_FILE $BACKUP_FILE

# Drop existing connections
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -U $DB_USER -d postgres <<EOF
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();
DROP DATABASE IF EXISTS $DB_NAME;
CREATE DATABASE $DB_NAME;
EOF

# Restore from backup
PGPASSWORD=$DB_PASSWORD pg_restore -h $DB_HOST -U $DB_USER -d $DB_NAME \
    --verbose \
    --clean \
    --if-exists \
    $DECRYPTED_FILE

# Cleanup
rm $DECRYPTED_FILE

echo "Restore completed successfully!"