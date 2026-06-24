# SonarQube Integration with Grafana

This guide explains how to set up SonarQube static code analysis integration with Grafana.

## Architecture

The setup includes:
- **SonarQube**: Code quality and security analysis platform (Port 9000)
- **SonarQube Exporter**: Prometheus exporter for SonarQube metrics (Port 9144)
- **Prometheus**: Time-series database for metrics (Port 9090)
- **Grafana**: Visualization dashboard (Port 3001)

## Setup Steps

### 1. Start the Services

```bash
cd infra/monitoring
docker-compose up -d
```

### 2. Configure SonarQube

1. **Access SonarQube**: Navigate to http://localhost:9000
2. **Login** with default credentials:
   - Username: `admin`
   - Password: `admin`
3. **Change Password**: You'll be prompted to change the default password
4. **Create a Token**:
   - Go to: My Account → Security → Generate Tokens
   - Name: `prometheus-exporter`
   - Type: `Global Analysis Token` or `User Token`
   - Click "Generate"
   - **Copy the token** (you won't see it again!)

### 3. Update SonarQube Exporter with Token

Create a `.env` file in the `kini-monitoring` directory:

```bash
# infra/monitoring/.env
SONAR_TOKEN=your_sonarqube_token_here
```

Then restart the exporter:

```bash
docker-compose restart sonarqube-exporter
```

### 4. Analyze Your Projects

#### For kini-api (NestJS/TypeScript):

```bash
cd ../../apps/api

# Install SonarQube Scanner
npm install -D sonarqube-scanner

# Create sonar-project.properties
cat > sonar-project.properties << EOF
sonar.projectKey=kini-api
sonar.projectName=Kini API
sonar.projectVersion=1.0
sonar.sources=src
sonar.host.url=http://localhost:9000
sonar.login=your_sonarqube_token_here
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/dist/**,**/test/**
EOF

# Run analysis
npx sonar-scanner
```

#### For kini-front (React Native/Expo):

```bash
cd ../../apps/mobile

# Install SonarQube Scanner
npm install -D sonarqube-scanner

# Create sonar-project.properties
cat > sonar-project.properties << EOF
sonar.projectKey=kini-front
sonar.projectName=Kini Frontend
sonar.projectVersion=1.0
sonar.sources=app
sonar.host.url=http://localhost:9000
sonar.login=your_sonarqube_token_here
sonar.typescript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/dist/**,**/*.spec.ts,**/*.spec.tsx,**/android/**,**/ios/**
EOF

# Run analysis
npx sonar-scanner
```

### 5. Access Grafana Dashboard

1. Navigate to http://localhost:3001
2. Login with:
   - Username: `admin`
   - Password: `admin`
3. Go to Dashboards → Browse → Security folder
4. Open **"SonarQube Code Quality"** dashboard

## Dashboard Metrics

The dashboard displays:

### Overview Panels
- **Bugs**: Number of bugs detected
- **Vulnerabilities**: Security vulnerabilities found
- **Code Smells**: Maintainability issues
- **Quality Gate Status**: Overall project health

### Time Series
- **Test Coverage**: Code coverage percentage over time
- **Code Duplication**: Duplicated code percentage
- **Issues Over Time**: Trends of bugs, vulnerabilities, and code smells

### Technical Debt
- **Technical Debt Ratio**: Percentage of technical debt
- **Technical Debt**: Time required to fix issues (in minutes)
- **Maintainability Rating**: A-E rating for code maintainability

## Automated Analysis (Optional)

### Add to CI/CD Pipeline

#### GitHub Actions Example:

```yaml
# .github/workflows/sonar.yml
name: SonarQube Analysis

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  sonarqube:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      
      - name: SonarQube Scan
        uses: sonarsource/sonarqube-scan-action@master
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: http://your-sonarqube-url:9000
```

### Scheduled Analysis (Cron Job)

```bash
# Add to crontab: Run analysis daily at 2 AM
0 2 * * * cd /path/../../apps/api && npx sonar-scanner
0 2 * * * cd /path/../../apps/mobile && npx sonar-scanner
```

## Troubleshooting

### SonarQube Exporter shows no data

1. Check if SonarQube is accessible:
   ```bash
   curl http://localhost:9000/api/system/status
   ```

2. Verify the token is set:
   ```bash
   docker-compose exec sonarqube-exporter env | grep SONAR_TOKEN
   ```

3. Check exporter logs:
   ```bash
   docker-compose logs sonarqube-exporter
   ```

### Prometheus not scraping metrics

1. Check Prometheus targets:
   - Navigate to http://localhost:9090/targets
   - Ensure `sonarqube` target is UP

2. Check Prometheus logs:
   ```bash
   docker-compose logs prometheus
   ```

### No projects in SonarQube

1. Ensure you've run `sonar-scanner` at least once for each project
2. Check SonarQube UI at http://localhost:9000 to verify projects exist

## Resources

- [SonarQube Documentation](https://docs.sonarqube.org/latest/)
- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)

