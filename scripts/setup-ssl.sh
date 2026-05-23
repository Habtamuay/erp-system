#!/bin/bash
# setup-ssl.sh - Complete SSL setup for ERP system

set -e

# Configuration
DOMAIN=${1:-"erp.yourcompany.com"}
EMAIL=${2:-"admin@yourcompany.com"}
PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "🔐 Setting up SSL certificates for $DOMAIN"
echo "📍 Project root: $PROJECT_ROOT"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Step 1: Install prerequisites
echo -e "\n${YELLOW}📦 Step 1: Installing prerequisites...${NC}"

if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows with WSL
    echo "Detected Windows. Please ensure WSL and Docker Desktop are installed."
    echo "Run these commands in WSL Ubuntu:"
    echo "  sudo apt update && sudo apt install -y certbot nginx"
    exit 0
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command_exists apt-get; then
        sudo apt-get update
        sudo apt-get install -y certbot nginx python3-certbot-nginx
    elif command_exists yum; then
        sudo yum install -y certbot nginx python3-certbot-nginx
    fi
elif [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    if ! command_exists brew; then
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    fi
    brew install certbot nginx
fi

echo -e "${GREEN}✅ Prerequisites installed${NC}"

# Step 2: Create necessary directories
echo -e "\n${YELLOW}📁 Step 2: Creating directories...${NC}"
mkdir -p "$PROJECT_ROOT/certbot/conf"
mkdir -p "$PROJECT_ROOT/certbot/www"
mkdir -p "$PROJECT_ROOT/nginx/ssl"
mkdir -p "$PROJECT_ROOT/nginx/conf.d"

echo -e "${GREEN}✅ Directories created${NC}"

# Step 3: Stop any existing nginx on port 80/443
echo -e "\n${YELLOW}🛑 Step 3: Stopping existing web servers...${NC}"
sudo systemctl stop nginx 2>/dev/null || true
sudo docker stop nginx 2>/dev/null || true

echo -e "${GREEN}✅ Stopped existing services${NC}"

# Step 4: Obtain SSL certificate
echo -e "\n${YELLOW}🔑 Step 4: Obtaining SSL certificate from Let's Encrypt...${NC}"

# For local development (self-signed certificate)
if [ "$DOMAIN" == "localhost" ] || [ "$DOMAIN" == "erp.yourcompany.com" ]; then
    echo -e "${YELLOW}⚠️  Using self-signed certificate for development${NC}"
    
    # Generate self-signed certificate
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$PROJECT_ROOT/nginx/ssl/privkey.pem" \
        -out "$PROJECT_ROOT/nginx/ssl/fullchain.pem" \
        -subj "/C=ET/ST=Addis Ababa/L=Addis Ababa/O=Hilina Foods/CN=$DOMAIN"
    
    # Generate DH parameters
    openssl dhparam -out "$PROJECT_ROOT/nginx/ssl/dhparam.pem" 2048
    
    echo -e "${GREEN}✅ Self-signed certificate created${NC}"
else
    # For production with real domain
    sudo certbot certonly --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        --preferred-challenges http \
        --http-01-port 80
    
    # Copy certificates to project
    sudo cp "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" "$PROJECT_ROOT/nginx/ssl/"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/privkey.pem" "$PROJECT_ROOT/nginx/ssl/"
    sudo cp "/etc/letsencrypt/live/$DOMAIN/chain.pem" "$PROJECT_ROOT/nginx/ssl/"
    
    # Generate DH parameters
    sudo openssl dhparam -out "$PROJECT_ROOT/nginx/ssl/dhparam.pem" 2048
    
    echo -e "${GREEN}✅ SSL certificate obtained from Let's Encrypt${NC}"
fi

# Step 5: Update nginx configuration with correct paths
echo -e "\n${YELLOW}⚙️  Step 5: Updating nginx configuration...${NC}"

# Create nginx configuration with proper paths
cat > "$PROJECT_ROOT/nginx/conf.d/erp.conf" << EOF
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate $PROJECT_ROOT/nginx/ssl/fullchain.pem;
    ssl_certificate_key $PROJECT_ROOT/nginx/ssl/privkey.pem;
    ssl_dhparam $PROJECT_ROOT/nginx/ssl/dhparam.pem;
    
    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
EOF

echo -e "${GREEN}✅ Nginx configuration updated${NC}"

# Step 6: Setup auto-renewal cron job
echo -e "\n${YELLOW}🔄 Step 6: Setting up auto-renewal...${NC}"

if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Create renewal script
    cat > "$PROJECT_ROOT/scripts/renew-ssl.sh" << 'EOF'
#!/bin/bash
# Renew SSL certificates

PROJECT_ROOT=$(cd "$(dirname "$0")/.." && pwd)

echo "Renewing SSL certificates..."
certbot renew --quiet

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/*/fullchain.pem "$PROJECT_ROOT/nginx/ssl/"
sudo cp /etc/letsencrypt/live/*/privkey.pem "$PROJECT_ROOT/nginx/ssl/"

# Reload nginx
docker exec nginx nginx -s reload

echo "SSL certificates renewed at $(date)"
EOF
    
    chmod +x "$PROJECT_ROOT/scripts/renew-ssl.sh"
    
    # Add to crontab (runs twice daily)
    (crontab -l 2>/dev/null; echo "0 */12 * * * $PROJECT_ROOT/scripts/renew-ssl.sh") | crontab -
    
    echo -e "${GREEN}✅ Auto-renewal configured (runs twice daily)${NC}"
fi

# Step 7: Test configuration
echo -e "\n${YELLOW}🧪 Step 7: Testing SSL configuration...${NC}"

# Test if certificates are valid
if openssl x509 -in "$PROJECT_ROOT/nginx/ssl/fullchain.pem" -noout -dates 2>/dev/null; then
    echo -e "${GREEN}✅ Certificates are valid${NC}"
    
    # Show expiry date
    expiry_date=$(openssl x509 -in "$PROJECT_ROOT/nginx/ssl/fullchain.pem" -noout -enddate | cut -d= -f2)
    echo -e "${GREEN}📅 Certificate expires: $expiry_date${NC}"
else
    echo -e "${RED}❌ Certificate validation failed${NC}"
fi

# Step 8: Setup for Docker
echo -e "\n${YELLOW}🐳 Step 8: Creating Docker SSL configuration...${NC}"

cat > "$PROJECT_ROOT/docker/docker-compose.ssl.yml" << EOF
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - $PROJECT_ROOT/nginx/conf.d:/etc/nginx/conf.d:ro
      - $PROJECT_ROOT/nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - backend
      - frontend
    networks:
      - erp_network

  certbot:
    image: certbot/certbot:latest
    volumes:
      - $PROJECT_ROOT/certbot/conf:/etc/letsencrypt
      - $PROJECT_ROOT/certbot/www:/var/www/certbot
    entrypoint: "/bin/sh -c 'trap exit TERM; while :; do certbot renew; sleep 12h & wait \$\${!}; done;'"

networks:
  erp_network:
    driver: bridge
EOF

echo -e "${GREEN}✅ Docker SSL configuration created${NC}"

# Final instructions
echo -e "\n${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ SSL Setup Completed Successfully!${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "📁 Certificate location: ${YELLOW}$PROJECT_ROOT/nginx/ssl/${NC}"
echo -e "📄 Nginx config: ${YELLOW}$PROJECT_ROOT/nginx/conf.d/erp.conf${NC}"
echo ""
echo -e "🔧 To start with SSL:"
echo -e "   ${YELLOW}docker-compose -f docker/docker-compose.yml -f docker/docker-compose.ssl.yml up -d${NC}"
echo ""
echo -e "🔄 To renew certificates manually:"
echo -e "   ${YELLOW}$PROJECT_ROOT/scripts/renew-ssl.sh${NC}"
echo ""
echo -e "🌐 Access your ERP system at: ${GREEN}https://$DOMAIN${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"