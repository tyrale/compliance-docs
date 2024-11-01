# Maintenance Guide

This guide provides detailed procedures for maintaining the Compliance Documents Management System.

## Backup Procedures

### 1. Database Backups

#### Automated Daily Backups
```bash
# Check backup status
aws backup get-backup-plan \
  --backup-plan-id $BACKUP_PLAN_ID

# Verify recent backups
aws backup list-recovery-points-by-backup-vault \
  --backup-vault-name compliance-docs-vault \
  --by-created-before $(date -u +"%Y-%m-%dT%H:%M:%SZ")
```

#### Manual Backup
```bash
# Create MongoDB backup
mongodump \
  --uri="$MONGODB_URI" \
  --out=/backup/mongodb_$(date +%Y%m%d)

# Create Elasticsearch snapshot
curl -X PUT "localhost:9200/_snapshot/compliance-docs-backup/snapshot_$(date +%Y%m%d)?wait_for_completion=true"
```

### 2. Application Backups

#### Configuration Backup
```bash
# Backup environment files
tar -czf config_backup_$(date +%Y%m%d).tar.gz \
  .env* \
  docker-compose*.yml \
  nginx/*.conf

# Upload to S3
aws s3 cp config_backup_$(date +%Y%m%d).tar.gz \
  s3://compliance-docs-backup/config/
```

## Update Procedures

### 1. System Updates

#### OS Updates
```bash
# Update package list
apt-get update

# Install security updates
apt-get upgrade -y

# Restart services if needed
systemctl restart docker
```

#### Docker Updates
```bash
# Update Docker Engine
apt-get install docker-ce docker-ce-cli containerd.io

# Update Docker Compose
curl -L "https://github.com/docker/compose/releases/download/latest/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. Application Updates

#### Dependencies Update
```bash
# Update frontend dependencies
cd frontend
npm update
npm audit fix

# Update backend dependencies
cd ../backend
npm update
npm audit fix
```

#### Database Updates
```bash
# Check MongoDB version
mongod --version

# Update MongoDB
apt-get install mongodb-org

# Check Elasticsearch version
curl -X GET "localhost:9200"

# Update Elasticsearch
apt-get install elasticsearch
```

## Monitoring Procedures

### 1. System Monitoring

#### Resource Usage
```bash
# Check disk usage
df -h

# Check memory usage
free -m

# Check CPU usage
top -b -n 1
```

#### Log Monitoring
```bash
# Check application logs
docker-compose logs --tail=100 backend frontend

# Check nginx logs
tail -f /var/log/nginx/error.log

# Check system logs
journalctl -u docker
```

### 2. Performance Monitoring

#### Application Metrics
```bash
# Check API response times
curl -s localhost:5000/metrics | grep http_request_duration_seconds

# Check error rates
curl -s localhost:5000/metrics | grep http_requests_total
```

#### Database Metrics
```bash
# MongoDB stats
mongo "$MONGODB_URI" --eval "db.stats()"

# Elasticsearch health
curl -X GET "localhost:9200/_cluster/health?pretty"
```

## Troubleshooting Guide

### 1. Common Issues

#### High CPU Usage
1. Check process usage:
```bash
top -b -n 1 | head -n 20
```

2. Check Docker stats:
```bash
docker stats --no-stream
```

3. Actions:
- Scale up resources
- Optimize queries
- Check for memory leaks

#### Database Connection Issues
1. Check connectivity:
```bash
mongo "$MONGODB_URI" --eval "db.runCommand({ping:1})"
```

2. Check logs:
```bash
docker-compose logs backend | grep "MongoDB connection"
```

3. Actions:
- Verify network connectivity
- Check credentials
- Restart services

#### Search Performance Issues
1. Check Elasticsearch health:
```bash
curl -X GET "localhost:9200/_cluster/health?pretty"
```

2. Check indices:
```bash
curl -X GET "localhost:9200/_cat/indices?v"
```

3. Actions:
- Optimize indices
- Update mappings
- Increase resources

### 2. Recovery Procedures

#### Service Recovery
```bash
# Restart services
docker-compose restart

# Check service status
docker-compose ps

# Check logs
docker-compose logs --tail=100
```

#### Data Recovery
```bash
# Restore MongoDB backup
mongorestore --uri="$MONGODB_URI" /backup/mongodb_latest/

# Restore Elasticsearch snapshot
curl -X POST "localhost:9200/_snapshot/compliance-docs-backup/snapshot_latest/_restore"
```

## Maintenance Schedule

### 1. Regular Maintenance

#### Daily Tasks
- Monitor system resources
- Check error logs
- Verify backup completion

#### Weekly Tasks
- Review performance metrics
- Clean up old logs
- Update documentation

#### Monthly Tasks
- Security updates
- Dependency updates
- Backup testing

### 2. Emergency Maintenance

#### High Priority Issues
1. System down
2. Data corruption
3. Security breach

#### Response Procedures
1. Assess impact
2. Notify stakeholders
3. Implement fix
4. Document incident

## Security Procedures

### 1. Access Management

#### User Access Review
```bash
# List IAM users
aws iam list-users

# Review permissions
aws iam list-user-policies --user-name $USERNAME
```

#### Certificate Management
```bash
# Check SSL expiry
openssl x509 -enddate -noout -in /etc/ssl/certs/your-cert.pem

# Renew certificates
certbot renew
```

### 2. Security Monitoring

#### Audit Logs
```bash
# Check authentication logs
grep "authentication failure" /var/log/auth.log

# Check API access logs
tail -f /var/log/nginx/access.log | grep "POST /api"
```

#### Security Scans
```bash
# Run vulnerability scan
npm audit

# Check Docker images
docker scan compliance-docs-backend
