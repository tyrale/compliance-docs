# Deployment Procedures

This guide outlines the step-by-step procedures for deploying the Compliance Documents Management System.

## Pre-deployment Checklist

### 1. Environment Verification
- [ ] All required environment variables are set
- [ ] SSL certificates are valid and installed
- [ ] Database connections are configured
- [ ] Elasticsearch cluster is healthy
- [ ] AWS credentials are configured

### 2. Application Preparation
- [ ] All tests pass (unit, integration, E2E)
- [ ] Build artifacts are generated successfully
- [ ] Docker images are built and tested locally
- [ ] Database migrations are prepared
- [ ] Backup of current production data is created

## Deployment Steps

### 1. Database Migration

```bash
# Create backup of current database
mongodump --uri="$MONGODB_URI" --out=./backup

# Apply new migrations
cd backend
npm run migrate:up

# Verify migration success
npm run migrate:status
```

### 2. Build and Push Docker Images

```bash
# Build images
docker build -t compliance-docs-frontend ./frontend
docker build -t compliance-docs-backend ./backend

# Tag images
docker tag compliance-docs-frontend:latest $ECR_REGISTRY/compliance-docs-frontend:$VERSION
docker tag compliance-docs-backend:latest $ECR_REGISTRY/compliance-docs-backend:$VERSION

# Push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin $ECR_REGISTRY
docker push $ECR_REGISTRY/compliance-docs-frontend:$VERSION
docker push $ECR_REGISTRY/compliance-docs-backend:$VERSION
```

### 3. Update ECS Services

```bash
# Update task definitions
aws ecs register-task-definition --cli-input-json file://task-definitions/frontend-$VERSION.json
aws ecs register-task-definition --cli-input-json file://task-definitions/backend-$VERSION.json

# Update services
aws ecs update-service \
  --cluster compliance-docs \
  --service frontend-service \
  --task-definition compliance-docs-frontend:$VERSION \
  --force-new-deployment

aws ecs update-service \
  --cluster compliance-docs \
  --service backend-service \
  --task-definition compliance-docs-backend:$VERSION \
  --force-new-deployment
```

### 4. Verify Deployment

```bash
# Monitor deployment status
aws ecs describe-services \
  --cluster compliance-docs \
  --services frontend-service backend-service

# Check application health
curl -I https://yourdomain.com/health
curl -I https://api.yourdomain.com/health

# Monitor logs
aws logs get-log-events \
  --log-group-name /ecs/compliance-docs \
  --log-stream-name frontend-service
```

## Rollback Procedures

### 1. Service Rollback

```bash
# Revert to previous task definition
aws ecs update-service \
  --cluster compliance-docs \
  --service frontend-service \
  --task-definition compliance-docs-frontend:$PREVIOUS_VERSION

aws ecs update-service \
  --cluster compliance-docs \
  --service backend-service \
  --task-definition compliance-docs-backend:$PREVIOUS_VERSION
```

### 2. Database Rollback

```bash
# Restore database backup
mongorestore --uri="$MONGODB_URI" ./backup

# Verify data integrity
mongo "$MONGODB_URI" --eval "db.runCommand({ dbStats: 1 })"
```

## Post-deployment Tasks

### 1. Verification Checklist
- [ ] All services are running with new version
- [ ] Application health checks pass
- [ ] Database queries are performing as expected
- [ ] Search functionality is working
- [ ] Document upload/download is working
- [ ] User authentication is working
- [ ] SSL/TLS certificates are valid

### 2. Performance Monitoring
```bash
# Check application metrics
curl https://yourdomain.com/metrics

# Monitor error rates
aws cloudwatch get-metric-statistics \
  --namespace AWS/ApplicationELB \
  --metric-name HTTPCode_Target_5XX_Count \
  --dimensions Name=LoadBalancer,Value=$ALB_NAME \
  --start-time $(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "30 minutes ago") \
  --end-time $(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --period 300 \
  --statistics Sum
```

### 3. Documentation Update
- Update API documentation if needed
- Update changelog
- Document any deployment issues and solutions

## Emergency Procedures

### 1. High Error Rate Response
```bash
# Check error logs
aws logs filter-log-events \
  --log-group-name /ecs/compliance-docs \
  --filter-pattern "ERROR"

# Scale up services if needed
aws ecs update-service \
  --cluster compliance-docs \
  --service backend-service \
  --desired-count $((CURRENT_COUNT + 1))
```

### 2. Performance Issues
```bash
# Check resource utilization
aws cloudwatch get-metric-statistics \
  --namespace AWS/ECS \
  --metric-name CPUUtilization \
  --dimensions Name=ClusterName,Value=compliance-docs \
  --start-time $(date -u +"%Y-%m-%dT%H:%M:%SZ" -d "30 minutes ago") \
  --end-time $(date -u +"%Y-%m-%dT%H:%M:%SZ") \
  --period 300 \
  --statistics Average

# Adjust scaling if needed
aws application-autoscaling register-scalable-target \
  --service-namespace ecs \
  --scalable-dimension ecs:service:DesiredCount \
  --resource-id service/compliance-docs/backend-service \
  --min-capacity 2 \
  --max-capacity 6
```

## Deployment Schedule

### 1. Regular Deployments
- Schedule: Every two weeks
- Time: Off-peak hours (2 AM UTC)
- Duration: 30-60 minutes
- Notification: 48 hours in advance

### 2. Emergency Deployments
- Requires approval from:
  - Technical Lead
  - Product Owner
- Must have:
  - Documented issue
  - Tested fix
  - Rollback plan
