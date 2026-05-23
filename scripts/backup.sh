#!/bin/bash
# Production backup script for PostgreSQL

set -e

# Configuration
BACKUP_DIR="/backups/postgres"
RETENTION_DAYS=30
S3_BUCKET="s3://erp-backups/yourcompany"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/erp_db_${TIMESTAMP}.sql.gz"
ENCRYPTED_FILE="${BACKUP_FILE}.gpg"

# Load environment variables
source /etc/erp/backup.env

# Create backup directory
mkdir -p $BACKUP_DIR

# Function to send notification
send_notification() {
    local subject=$1
    local message=$2
    
    curl -X POST https://ntfy.sh/${NTFY_TOPIC} \
        -H "Title: ERP Backup - $subject" \
        -d "$message"
}

# Perform database backup
echo "Starting database backup at $(date)"
echo "Backup file: $BACKUP_FILE"

# pg_dump with compression
PGPASSWORD=$DB_PASSWORD pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME \
    --format=custom \
    --compress=9 \
    --verbose \
    --file=$BACKUP_FILE

# Check backup size
BACKUP_SIZE=$(stat -f%z "$BACKUP_FILE" 2>/dev/null || stat -c%s "$BACKUP_FILE")
echo "Backup size: $BACKUP_SIZE bytes"

if [ $BACKUP_SIZE -lt 1000 ]; then
    send_notification "ERROR" "Backup file is too small ($BACKUP_SIZE bytes)"
    exit 1
fi

# Encrypt backup
gpg --batch --yes --passphrase $GPG_PASSPHRASE \
    --symmetric --cipher-algo AES256 \
    --output $ENCRYPTED_FILE $BACKUP_FILE

# Upload to S3 (if configured)
if [ -n "$S3_BUCKET" ]; then
    aws s3 cp $ENCRYPTED_FILE $S3_BUCKET/$(date +%Y/%m/%d)/ --storage-class STANDARD_IA
    echo "Uploaded to S3: $S3_BUCKET"
fi

# Upload to backup server via SFTP (optional)
if [ -n "$SFTP_HOST" ]; then
    sshpass -p $SFTP_PASSWORD sftp $SFTP_USER@$SFTP_HOST <<EOF
    put $ENCRYPTED_FILE /backups/erp/
    bye
EOF
    echo "Uploaded to SFTP server"
fi

# Cleanup old backups locally
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.gpg" -mtime +$RETENTION_DAYS -delete

# Cleanup old S3 backups (after 90 days)
if [ -n "$S3_BUCKET" ]; then
    aws s3 ls $S3_BUCKET/ | while read -r line; do
        date=$(echo $line | awk '{print $2}')
        if [[ $(date -d "$date" +%s) -lt $(date -d "90 days ago" +%s) ]]; then
            aws s3 rm $S3_BUCKET/$date --recursive
        fi
    done
fi

send_notification "SUCCESS" "Backup completed: $BACKUP_FILE (${BACKUP_SIZE} bytes)"

echo "Backup completed successfully at $(date)"