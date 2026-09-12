# Production Deployment Guide

## Prerequisites

- Docker & Docker Compose installed
- At least 2GB RAM available
- Ports 80, 3000, 5432 available (or configure in .env)

## Quick Start

### 1. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your secure values
nano .env
```

**Important**: Change these values in production:
- `POSTGRES_PASSWORD` - Use a strong password
- `JWT_SECRET` - Generate with: `openssl rand -hex 32`

### 2. Build and Start

```bash
# Build images
docker-compose build

# Start all services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### 3. Initialize Database

The `db-init` service automatically creates the schema and demo merchant before the API starts. Check it with:

```bash
docker compose logs db-init
```

### 4. Access the Application

- **Frontend**: http://localhost (or http://your-domain.com)
- **Backend API**: http://localhost:3000
- **Database**: localhost:5432

## Default Credentials

**Merchant Login**:
- Email: `masedo@ketoprakin.com`
- Password: `password123`

⚠️ **Change this immediately in production!**

## Management Commands

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Volumes (⚠️ Deletes Data)
```bash
docker-compose down -v
```

### Restart Services
```bash
docker-compose restart
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Execute Commands in Containers
```bash
# Backend shell
docker-compose exec backend sh

# Database shell
docker-compose exec postgres psql -U postgres -d ketoprakin_aja

# Run npm commands
docker-compose exec backend npm run db:studio
```

### Update Application
```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose up -d --build
```

## Backup Database

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres ketoprakin_aja > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
cat backup.sql | docker-compose exec -T postgres psql -U postgres -d ketoprakin_aja
```

## Monitoring

### Check Health Status
```bash
# All services
docker-compose ps

# Backend health
curl http://localhost:3000/health

# Frontend health
curl http://localhost/health
```

### Resource Usage
```bash
docker stats
```

## Production Checklist

- [ ] Change `POSTGRES_PASSWORD` in .env
- [ ] Change `JWT_SECRET` in .env
- [ ] Change default merchant password
- [ ] Set up SSL/HTTPS (use Let's Encrypt with Nginx)
- [ ] Configure firewall rules
- [ ] Set up automated backups
- [ ] Configure log rotation
- [ ] Set up monitoring (Prometheus/Grafana)
- [ ] Configure domain DNS
- [ ] Test disaster recovery

## SSL/HTTPS Setup (Optional)

For production with SSL, update `nginx.conf`:

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # ... rest of config
}

server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

Mount SSL certificates in docker-compose.yml:
```yaml
frontend:
  volumes:
    - ./ssl:/etc/nginx/ssl:ro
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
docker-compose logs backend

# Verify database connection
docker-compose exec backend npm run db:push
```

### Frontend can't reach backend
```bash
# Check if backend is running
docker-compose ps backend

# Test backend from frontend container
docker-compose exec frontend wget -O- http://backend:3000/health
```

### Database connection issues
```bash
# Check if postgres is healthy
docker-compose ps postgres

# Test connection
docker-compose exec postgres psql -U postgres -d ketoprakin_aja -c "SELECT 1"
```

## Performance Tuning

### PostgreSQL
Add to docker-compose.yml:
```yaml
postgres:
  command: >
    -c shared_buffers=256MB
    -c max_connections=200
```

### Node.js
Add to backend Dockerfile:
```dockerfile
ENV NODE_OPTIONS="--max-old-space-size=512"
```

### Nginx
Already optimized in nginx.conf with:
- Gzip compression
- Static asset caching
- Connection pooling

## Security Best Practices

1. **Never commit .env file**
2. **Use strong passwords** (min 32 chars)
3. **Rotate secrets regularly**
4. **Keep images updated** (`docker-compose pull`)
5. **Limit exposed ports** (only 80/443 in production)
6. **Use non-root users** in containers
7. **Enable firewall** (ufw/iptables)
8. **Regular backups**
9. **Monitor logs** for suspicious activity
10. **Use HTTPS** in production

## Support

For issues:
1. Check logs: `docker-compose logs -f`
2. Verify all services are running: `docker-compose ps`
3. Test individual components
4. Check network connectivity between containers
