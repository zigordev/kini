#!/bin/bash

# SonarQube Setup and Analysis Script for Kini Project

set -e

echo "🔧 SonarQube Setup and Analysis Script"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  No .env file found. Creating one...${NC}"
    echo "SONAR_TOKEN=" > .env
    echo -e "${YELLOW}📝 Please add your SonarQube token to infra/monitoring/.env${NC}"
    echo -e "${YELLOW}   Get your token from: http://localhost:9000 → My Account → Security → Generate Tokens${NC}"
    exit 1
fi

# Source the .env file
source .env

if [ -z "$SONAR_TOKEN" ]; then
    echo -e "${RED}❌ SONAR_TOKEN is not set in .env file${NC}"
    echo -e "${YELLOW}   Get your token from: http://localhost:9000 → My Account → Security → Generate Tokens${NC}"
    exit 1
fi

# Start services
echo -e "${GREEN}🚀 Starting SonarQube and monitoring services...${NC}"
docker-compose up -d

# Wait for SonarQube to be ready
echo -e "${YELLOW}⏳ Waiting for SonarQube to be ready...${NC}"
sleep 30

# Check SonarQube status
until curl -s http://localhost:9000/api/system/status | grep -q '"status":"UP"'; do
    echo -e "${YELLOW}   Still waiting for SonarQube...${NC}"
    sleep 10
done

echo -e "${GREEN}✅ SonarQube is ready!${NC}"

# Function to install sonarqube-scanner if not present
install_scanner() {
    local project_dir=$1
    if [ ! -f "$project_dir/node_modules/.bin/sonar-scanner" ]; then
        echo -e "${YELLOW}📦 Installing sonarqube-scanner in $project_dir...${NC}"
        (cd "$project_dir" && npm install -D sonarqube-scanner)
    fi
}

# Function to run analysis
run_analysis() {
    local project_dir=$1
    local project_name=$2
    
    echo -e "${GREEN}🔍 Analyzing $project_name...${NC}"
    
    # Update sonar-project.properties with token
    if [ -f "$project_dir/sonar-project.properties" ]; then
        sed -i.bak "s|# sonar.login=.*|sonar.login=$SONAR_TOKEN|g" "$project_dir/sonar-project.properties"
        rm -f "$project_dir/sonar-project.properties.bak"
    fi
    
    # Run the analysis
    (cd "$project_dir" && npx sonar-scanner -Dsonar.login="$SONAR_TOKEN")
    
    echo -e "${GREEN}✅ $project_name analysis complete!${NC}"
}

# Menu
echo ""
echo "Select what to analyze:"
echo "1) Kini API only"
echo "2) Kini Frontend only"
echo "3) Both projects"
echo "4) Exit"
echo ""
read -p "Enter your choice [1-4]: " choice

case $choice in
    1)
        install_scanner "../../apps/api"
        run_analysis "../../apps/api" "Kini API"
        ;;
    2)
        install_scanner "../../apps/mobile"
        run_analysis "../../apps/mobile" "Kini Frontend"
        ;;
    3)
        install_scanner "../../apps/api"
        install_scanner "../../apps/mobile"
        run_analysis "../../apps/api" "Kini API"
        run_analysis "../../apps/mobile" "Kini Frontend"
        ;;
    4)
        echo -e "${YELLOW}👋 Exiting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}❌ Invalid choice${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}🎉 Analysis complete!${NC}"
echo ""
echo "📊 View results:"
echo "   - SonarQube: http://localhost:9000"
echo "   - Prometheus: http://localhost:9090"
echo "   - Grafana Dashboard: http://localhost:3001"
echo ""
echo "📈 In Grafana:"
echo "   1. Login with admin/admin"
echo "   2. Go to Dashboards → Browse → Security"
echo "   3. Open 'SonarQube Code Quality' dashboard"
echo ""

