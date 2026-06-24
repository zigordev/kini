# 🚀 SonarQube + Grafana Quick Reference

## 📍 Access URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana Dashboard** | http://localhost:3001 | admin / admin |
| **SonarQube** | http://localhost:9000 | admin / admin |
| **Prometheus** | http://localhost:9090 | - |
| **Loki** | http://localhost:3100 | - |

## ⚡ Quick Commands

### Setup (One-time)

```bash
# 1. Start all services
cd infra/monitoring
docker-compose up -d

# 2. Get SonarQube token
# → Visit http://localhost:9000
# → My Account → Security → Generate Token

# 3. Configure token
echo "SONAR_TOKEN=your_token_here" > .env
docker-compose restart sonarqube-exporter
```

### Run Analysis

#### Using Setup Script (Easiest)
```bash
cd infra/monitoring
./setup-sonarqube.sh
```

#### Using NPM Scripts
```bash
# Kini API
cd apps/api
npm run sonar:install  # First time only
npm run sonar:scan

# Kini Frontend
cd apps/mobile
npm run sonar:install  # First time only
npm run sonar:scan
```

#### Manual
```bash
# With token from .env
cd apps/api
npx sonar-scanner -Dsonar.login=$SONAR_TOKEN

cd ../../apps/mobile
npx sonar-scanner -Dsonar.login=$SONAR_TOKEN
```

## 📊 View Results

### In Grafana
1. Go to http://localhost:3001
2. Login: admin / admin
3. Dashboards → Browse → Security → **SonarQube Code Quality**

### In SonarQube
1. Go to http://localhost:9000
2. Click on project name (kini-api or kini-front)

## 🔧 Troubleshooting

### No metrics in Grafana?
```bash
# 1. Check Prometheus targets (should show "UP")
open http://localhost:9090/targets

# 2. Check if analysis ran
curl -s http://localhost:9000/api/components/search | jq

# 3. Check token is set
docker-compose exec sonarqube-exporter env | grep SONAR_TOKEN

# 4. Restart exporter
docker-compose restart sonarqube-exporter
```

### SonarQube not responding?
```bash
# Check logs
docker-compose logs sonarqube

# Restart
docker-compose restart sonarqube

# Wait for startup (takes 30-60 seconds)
```

### Analysis fails?
```bash
# Verify sonar-project.properties exists
ls -la apps/api/sonar-project.properties
ls -la apps/mobile/sonar-project.properties

# Check SonarQube is accessible
curl http://localhost:9000/api/system/status
```

## 🎯 Daily Workflow

```bash
# 1. Code changes
git pull
# make your changes...

# 2. Run analysis
npm run sonar:scan  # in kini-api or kini-front

# 3. View results in Grafana
open http://localhost:3001

# 4. Fix issues shown in SonarQube
open http://localhost:9000
```

## 🔄 Automated Analysis

### Cron (Daily at 2 AM)
```bash
crontab -e

# Add these lines:
0 2 * * * cd apps/api && npm run sonar:scan
0 2 * * * cd apps/mobile && npm run sonar:scan
```

### Git Pre-commit Hook
```bash
# In project root
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
cd apps/api && npm run sonar:scan
cd ../../apps/mobile && npm run sonar:scan
EOF

chmod +x .git/hooks/pre-commit
```

## 📈 Key Metrics to Monitor

| Metric | Good | Warning | Critical |
|--------|------|---------|----------|
| **Bugs** | 0 | 1-5 | >5 |
| **Vulnerabilities** | 0 | 1-3 | >3 |
| **Code Smells** | <10 | 10-50 | >50 |
| **Coverage** | >80% | 60-80% | <60% |
| **Duplication** | <3% | 3-5% | >5% |
| **Tech Debt Ratio** | <5% | 5-10% | >10% |
| **Quality Gate** | A | B-C | D-E |

## 🛠️ Maintenance Commands

```bash
# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Stop all
docker-compose down

# Update images
docker-compose pull && docker-compose up -d

# Clean up (⚠️ deletes data!)
docker-compose down -v
```

## 📚 Documentation

- [Full Setup Guide](./SONARQUBE_SETUP.md)
- [README](./README.md)
- [SonarQube Docs](https://docs.sonarqube.org)
- [Grafana Docs](https://grafana.com/docs)

