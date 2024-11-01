# Environment Setup Guide

This guide details the steps to set up the production environment for the Compliance Documents Management System.

## Infrastructure Requirements

### Hardware Requirements
- Minimum 4 CPU cores
- 8GB RAM
- 100GB SSD storage

### Software Requirements
1. Docker Engine 20.10+
2. Docker Compose 2.0+
3. Node.js 18+ (for build processes)
4. Nginx 1.20+
5. MongoDB 4.4+
6. Elasticsearch 7.9+

## Cloud Provider Setup (AWS)

### 1. VPC Configuration
```bash
# Create VPC
aws ec2 create-vpc --cidr-block 10.0.0.0/16

# Create subnets
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.1.0/24 --availability-zone us-east-1a
aws ec2 create-subnet --vpc-id <vpc-id> --cidr-block 10.0.2.0/24 --availability-zone us-east-1b
```

### 2. Security Groups
```bash
# Create security group
aws ec2 create-security-group --group-name compliance-docs-sg --description "Security group for Compliance Docs"

# Add rules
aws ec2 authorize-security-group-ingress --group-id <sg-id> --protocol tcp --port 80 --cidr 0.0.0.0/0
aws ec2 authorize-security-group-ingress --group-id <sg-id> --protocol tcp --port 443 --cidr 0.0.0.0/0
```

### 3. ECS Cluster Setup
```bash
# Create ECS cluster
aws ecs create-cluster --cluster-name compliance-docs

# Create task definitions
aws ecs register-task-definition --cli-input-json file://task-definitions/frontend.json
aws ecs register-task-definition --cli-input-json file://task-definitions/backend.json
```

## Database Setup

### 1. MongoDB Atlas Configuration
1. Create MongoDB Atlas cluster
2. Configure network access
3. Create database user
4. Get connection string

### 2. Elasticsearch Setup
```bash
# Create Elasticsearch domain
aws elasticsearch create-elasticsearch-domain \
  --domain-name compliance-docs \
  --elasticsearch-version 7.9 \
  --elasticsearch-cluster-config \
    InstanceType=t3.small.elasticsearch,InstanceCount=2 \
  --ebs-options EBSEnabled=true,VolumeType=gp2,VolumeSize=10
```

## SSL/TLS Configuration

### 1. Certificate Generation (Let's Encrypt)
```bash
# Install certbot
apt-get update
apt-get install certbot python3-certbot-nginx

# Generate certificate
certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 2. AWS Certificate Manager
```bash
# Request certificate
aws acm request-certificate \
  --domain-name yourdomain.com \
  --validation-method DNS \
  --subject-alternative-names www.yourdomain.com
```

## Monitoring Setup

### 1. CloudWatch Configuration
```bash
# Create log group
aws logs create-log-group --log-group-name /compliance-docs/production

# Create metric filters
aws logs put-metric-filter \
  --log-group-name /compliance-docs/production \
  --filter-name errors \
  --filter-pattern "ERROR" \
  --metric-transformations \
    metricName=ErrorCount,metricNamespace=ComplianceDocs,metricValue=1
```

### 2. Alerts Setup
```bash
# Create SNS topic
aws sns create-topic --name compliance-docs-alerts

# Create CloudWatch alarm
aws cloudwatch put-metric-alarm \
  --alarm-name high-error-rate \
  --metric-name ErrorCount \
  --namespace ComplianceDocs \
  --threshold 10 \
  --comparison-operator GreaterThanThreshold \
  --period 300 \
  --evaluation-periods 2 \
  --alarm-actions arn:aws:sns:region:account-id:compliance-docs-alerts
```

## Environment Variables

### 1. Production Environment Variables
```bash
# Backend
NODE_ENV=production
PORT=5000
MONGODB_URI=mongodb+srv://...
ELASTICSEARCH_NODE=https://...
JWT_SECRET=your-secure-jwt-secret
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1

# Frontend
VITE_API_URL=https://api.yourdomain.com
VITE_ENVIRONMENT=production
```

### 2. Secrets Management
```bash
# Store secrets in AWS Secrets Manager
aws secretsmanager create-secret \
  --name compliance-docs/production \
  --secret-string file://secrets.json
```

## Network Configuration

### 1. Load Balancer Setup
```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name compliance-docs-alb \
  --subnets subnet-1 subnet-2 \
  --security-groups sg-123

# Create target groups
aws elbv2 create-target-group \
  --name compliance-docs-frontend \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-123 \
  --target-type ip

aws elbv2 create-target-group \
  --name compliance-docs-backend \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-123 \
  --target-type ip
```

### 2. DNS Configuration
```bash
# Create Route 53 records
aws route53 change-resource-record-sets \
  --hosted-zone-id your-hosted-zone-id \
  --change-batch file://dns-records.json
```

## Backup Configuration

### 1. MongoDB Backup
```bash
# Configure MongoDB Atlas backup
atlas backup schedule create \
  --clusterName compliance-docs \
  --provider AWS \
  --policy type=continuous
```

### 2. Elasticsearch Snapshot
```bash
# Create snapshot repository
PUT _snapshot/compliance-docs-backup
{
  "type": "s3",
  "settings": {
    "bucket": "compliance-docs-backup",
    "region": "us-east-1"
  }
}

# Configure snapshot policy
PUT _slm/policy/daily-snapshots
{
  "schedule": "0 0 * * *",
  "name": "compliance-docs-snapshot",
  "repository": "compliance-docs-backup"
}
