# Kini Monitoring Stack

Complete monitoring and code quality solution for the Kini project, featuring security scanning, static code analysis, and centralized logging.

## 🏗️ Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│  SonarQube  │────▶│  Prometheus  │────▶│   Grafana   │
│  Analysis   │     │   Metrics    │     │  Dashboard  │
└─────────────┘     └──────────────┘     └─────────────┘
                            ▲
                            │
                    ┌───────┴────────┐
                    │  SonarQube     │
                    │  Exporter      │
                    └────────────────┘

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Trivy     │────▶│     Loki     │────▶│   Grafana   │
│  Security   │     │     Logs     │     │  Dashboard  │
└─────────────┘     └──────────────┘     └─────────────┘
                            ▲
                            │
                    ┌───────┴────────┐
                    │   Promtail     │
                    └────────────────┘
```

## 📦 Components

### Core Services

| Service | Port | Description |
|---------|------|-------------|
| **Grafana** | 3001 | Visualization dashboard and alerting |
| **SonarQube** | 9000 | Static code analysis and quality gates |
| **Prometheus** | 9090 | Metrics collection and time-series database |
| **Loki** | 3100 | Log aggregation system |
| **Promtail** | 9080 | Log collection agent |
| **SonarQube Exporter** | 8198 | Prometheus exporter for SonarQube |
| **PostgreSQL** | - | SonarQube database (internal) |

### Dashboards

1. **SonarQube Code Quality** (`/dashboards/Security/sonarqube.json`)
   - Code metrics (bugs, vulnerabilities, code smells)
   - Test coverage trends
   - Technical debt tracking
   - Maintainability ratings
   - Quality gate status

2. **Trivy Security** (`/dashboards/Security/trivy.json`)
   - Vulnerability scanning
   - Dependency analysis
   - Security compliance

## 🚀 Quick Start

### 1. Initial Setup

```bash
# Navigate to monitoring directory
cd infra/monitoring

# Start all services
docker-compose up -d

# Wait for services to be ready (about 30 seconds)
```

### 2. Configure SonarQube

1. **Access SonarQube**: http://localhost:9000
2. **Login** with default credentials:
   - Username: `admin`
   - Password: `admin`
3. **Change the password** when prompted
4. **Generate a token**:
   - Go to: My Account → Security → Generate Tokens
   - Name: `prometheus-exporter`
   - Type: `Global Analysis Token`
   - Copy the token

5. **Create `.env` file**:
```bash
# In kini-monitoring directory
echo "SONAR_TOKEN=your_token_here" > .env
```

6. **Restart the exporter**:
```bash
docker-compose restart sonarqube-exporter
```

### 3. Run Code Analysis

#### Option A: Using the Setup Script (Recommended)

```bash
cd infra/monitoring
./setup-sonarqube.sh
```

This interactive script will:
- Check SonarQube status
- Install dependencies
- Run analysis on selected projects
- Configure everything automatically

#### Option B: Manual Analysis

**For Kini API:**
```bash
cd ../../apps/api
npm install -D sonarqube-scanner
npx sonar-scanner -Dsonar.login=your_token_here
```

**For Kini Web:**
```bash
cd ../../apps/ui
npm install -D sonarqube-scanner
npx sonar-scanner -Dsonar.login=your_token_here
```

### 4. Access Dashboards

1. **Grafana**: http://localhost:3001
   - Username: `admin`
   - Password: `admin`
   - Navigate to: Dashboards → Browse → Security → SonarQube Code Quality

2. **SonarQube**: http://localhost:9000
   - View detailed code analysis

3. **Prometheus**: http://localhost:9090
   - View raw metrics and targets

## 📊 Available Metrics

### Code Quality Metrics

- `sonarqube_bugs` - Number of bugs
- `sonarqube_vulnerabilities` - Security vulnerabilities
- `sonarqube_code_smells` - Code quality issues
- `sonarqube_coverage` - Test coverage percentage
- `sonarqube_duplicated_lines_density` - Code duplication percentage
- `sonarqube_lines` - Total lines of code
- `sonarqube_sqale_debt_ratio` - Technical debt ratio
- `sonarqube_sqale_index` - Technical debt in minutes
- `sonarqube_sqale_rating` - Maintainability rating (A-E)
- `sonarqube_quality_gate_status` - Quality gate status

### Security Metrics (Trivy)

- Vulnerability counts by severity
- Affected packages
- CVE tracking

## 🔄 Continuous Analysis

### Option 1: Scheduled Analysis (Cron)

Add to your crontab:
```bash
# Run analysis daily at 2 AM
0 2 * * * cd /path/to/ki../../apps/api && npx sonar-scanner -Dsonar.login=token
0 2 * * * cd /path/to/ki../../apps/ui && npx sonar-scanner -Dsonar.login=token
```

### Option 2: CI/CD Integration

See [SONARQUBE_SETUP.md](./SONARQUBE_SETUP.md) for GitHub Actions and other CI/CD examples.

### Option 3: Git Hooks

```bash
# Pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
cd apps/api && npx sonar-scanner -Dsonar.login=$SONAR_TOKEN
cd ../../apps/ui && npx sonar-scanner -Dsonar.login=$SONAR_TOKEN
EOF

chmod +x .git/hooks/pre-commit
```

## 🛠️ Maintenance

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f sonarqube
docker-compose logs -f prometheus
docker-compose logs -f grafana
```

### Restart Services

```bash
# All services
docker-compose restart

# Specific service
docker-compose restart sonarqube-exporter
```

### Update Services

```bash
docker-compose pull
docker-compose up -d
```

### Backup Data

```bash
# Backup volumes
docker-compose down
docker run --rm -v kini-monitoring_sonarqube_data:/data -v $(pwd):/backup ubuntu tar czf /backup/sonarqube-backup.tar.gz /data
docker run --rm -v kini-monitoring_grafana_data:/data -v $(pwd):/backup ubuntu tar czf /backup/grafana-backup.tar.gz /data
docker run --rm -v kini-monitoring_prometheus_data:/data -v $(pwd):/backup ubuntu tar czf /backup/prometheus-backup.tar.gz /data
```

### Clean Up

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (⚠️ This deletes all data!)
docker-compose down -v
```

## 🔍 Troubleshooting

### SonarQube is not accessible

```bash
# Check if container is running
docker-compose ps sonarqube

# Check logs
docker-compose logs sonarqube

# Wait for initialization (first start can take 2-3 minutes)
```

### No metrics in Grafana

1. **Check Prometheus targets**: http://localhost:9090/targets
   - Ensure `sonarqube` target is UP
   
2. **Verify SonarQube token**:
   ```bash
   docker-compose exec sonarqube-exporter env | grep SONAR_TOKEN
   ```

3. **Run analysis at least once**:
   ```bash
   cd apps/api && npx sonar-scanner -Dsonar.login=token
   ```

### Dashboard shows "No Data"

1. **Check data source**: Grafana → Configuration → Data Sources → Prometheus (should be green)
2. **Verify metrics exist**: http://localhost:9090/graph (search for `sonarqube_`)
3. **Check time range**: Dashboard might be showing future/past data

### SonarQube analysis fails

1. **Check project configuration**: Verify `sonar-project.properties` exists
2. **Verify token**: Make sure token has analysis permissions
3. **Check SonarQube server**: http://localhost:9000/api/system/status

## 📚 Documentation

- [SonarQube Setup Guide](./SONARQUBE_SETUP.md) - Detailed setup instructions
- [SonarQube Docs](https://docs.sonarqube.org/latest/)
- [Prometheus Docs](https://prometheus.io/docs/)
- [Grafana Docs](https://grafana.com/docs/)
- [Loki Docs](https://grafana.com/docs/loki/latest/)

## 🔐 Security Notes

1. **Change default passwords** for:
   - Grafana (admin/admin)
   - SonarQube (admin/admin)

2. **Protect your tokens**:
   - Never commit `.env` files
   - Use secrets management in production
   - Rotate tokens regularly

3. **Network security**:
   - Use reverse proxy in production
   - Enable HTTPS/TLS
   - Restrict port access

## 🎯 Next Steps

1. ✅ Set up SonarQube token
2. ✅ Run initial code analysis
3. ✅ Configure Grafana dashboards
4. 📧 Set up Grafana alerting (email/Slack)
5. 🔄 Configure CI/CD integration
6. 📊 Create custom dashboards
7. 🎨 Set quality gates in SonarQube

