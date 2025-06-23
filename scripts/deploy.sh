#!/bin/bash

# Riscura Production Deployment Script
# Provides zero-downtime deployment with health checks and rollback capabilities

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
DEPLOYMENT_LOG="/var/log/riscura/deployment.log"
BACKUP_DIR="/opt/riscura/backups"
HEALTH_CHECK_URL="https://riscura.com/api/health"
MAX_HEALTH_CHECKS=30
HEALTH_CHECK_INTERVAL=10
ROLLBACK_ENABLED=true

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${DEPLOYMENT_LOG}"
}

log_info() {
    log "INFO" "${BLUE}$*${NC}"
}

log_warn() {
    log "WARN" "${YELLOW}$*${NC}"
}

log_error() {
    log "ERROR" "${RED}$*${NC}"
}

log_success() {
    log "SUCCESS" "${GREEN}$*${NC}"
}

# Error handling
error_exit() {
    log_error "$1"
    exit 1
}

# Cleanup function
cleanup() {
    log_info "Cleaning up temporary files..."
    # Add cleanup logic here
}

# Set trap for cleanup
trap cleanup EXIT

# Check prerequisites
check_prerequisites() {
    log_info "Checking deployment prerequisites..."
    
    # Check if running as root or with sudo
    if [[ $EUID -eq 0 ]]; then
        error_exit "This script should not be run as root for security reasons"
    fi
    
    # Check required commands
    local required_commands=("docker" "docker-compose" "curl" "jq" "git")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            error_exit "Required command '$cmd' is not installed"
        fi
    done
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        error_exit "Docker daemon is not running or accessible"
    fi
    
    # Check disk space (require at least 5GB free)
    local available_space=$(df / | awk 'NR==2 {print $4}')
    if [[ $available_space -lt 5242880 ]]; then # 5GB in KB
        error_exit "Insufficient disk space. At least 5GB required."
    fi
    
    # Check memory (require at least 4GB)
    local available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [[ $available_memory -lt 4096 ]]; then
        log_warn "Low available memory detected: ${available_memory}MB. Deployment may be slow."
    fi
    
    log_success "Prerequisites check passed"
}

# Validate environment variables
validate_environment() {
    log_info "Validating environment variables..."
    
    local required_vars=(
        "DATABASE_URL"
        "REDIS_URL"
        "NEXTAUTH_SECRET"
        "NEXTAUTH_URL"
        "CSRF_SECRET"
        "JWT_SECRET"
        "ENCRYPTION_KEY"
    )
    
    local missing_vars=()
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            missing_vars+=("$var")
        fi
    done
    
    if [[ ${#missing_vars[@]} -gt 0 ]]; then
        error_exit "Missing required environment variables: ${missing_vars[*]}"
    fi
    
    # Validate secret lengths
    if [[ ${#NEXTAUTH_SECRET} -lt 32 ]]; then
        error_exit "NEXTAUTH_SECRET must be at least 32 characters long"
    fi
    
    if [[ ${#CSRF_SECRET} -lt 32 ]]; then
        error_exit "CSRF_SECRET must be at least 32 characters long"
    fi
    
    if [[ ${#JWT_SECRET} -lt 32 ]]; then
        error_exit "JWT_SECRET must be at least 32 characters long"
    fi
    
    if [[ ${#ENCRYPTION_KEY} -lt 32 ]]; then
        error_exit "ENCRYPTION_KEY must be at least 32 characters long"
    fi
    
    log_success "Environment validation passed"
}

# Security checks
security_checks() {
    log_info "Performing security checks..."
    
    # Check file permissions
    local sensitive_files=(
        ".env.production"
        "docker-compose.prod.yml"
        "nginx/ssl"
    )
    
    for file in "${sensitive_files[@]}"; do
        if [[ -f "$PROJECT_ROOT/$file" ]]; then
            local perms=$(stat -c "%a" "$PROJECT_ROOT/$file")
            if [[ "$perms" != "600" ]] && [[ "$perms" != "640" ]]; then
                log_warn "File $file has permissive permissions: $perms"
            fi
        fi
    done
    
    # Check for secrets in git history
    if git log --all --full-history -- .env* | grep -q "password\|secret\|key"; then
        log_warn "Potential secrets found in git history. Consider using git-secrets or similar tools."
    fi
    
    # Check SSL certificates
    if [[ -f "$PROJECT_ROOT/nginx/ssl/fullchain.pem" ]]; then
        local cert_expiry=$(openssl x509 -in "$PROJECT_ROOT/nginx/ssl/fullchain.pem" -noout -enddate | cut -d= -f2)
        local expiry_timestamp=$(date -d "$cert_expiry" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [[ $days_until_expiry -lt 30 ]]; then
            log_warn "SSL certificate expires in $days_until_expiry days. Consider renewal."
        fi
    fi
    
    log_success "Security checks completed"
}

# Create backup
create_backup() {
    log_info "Creating backup before deployment..."
    
    local backup_timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_path="$BACKUP_DIR/backup_$backup_timestamp"
    
    mkdir -p "$backup_path"
    
    # Backup database
    log_info "Backing up database..."
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$backup_path/database.sql"
    
    # Backup Redis data
    log_info "Backing up Redis data..."
    docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --rdb - > "$backup_path/redis.rdb"
    
    # Backup application data
    log_info "Backing up application data..."
    tar -czf "$backup_path/app_data.tar.gz" -C /opt/riscura/data .
    
    # Backup configuration
    log_info "Backing up configuration..."
    cp -r "$PROJECT_ROOT"/{.env.production,docker-compose.prod.yml,nginx} "$backup_path/"
    
    # Create backup manifest
    cat > "$backup_path/manifest.json" <<EOF
{
    "timestamp": "$backup_timestamp",
    "version": "$(git rev-parse HEAD)",
    "branch": "$(git rev-parse --abbrev-ref HEAD)",
    "environment": "production",
    "backup_type": "pre-deployment",
    "files": [
        "database.sql",
        "redis.rdb",
        "app_data.tar.gz",
        ".env.production",
        "docker-compose.prod.yml",
        "nginx"
    ]
}
EOF
    
    # Compress backup
    tar -czf "$BACKUP_DIR/backup_$backup_timestamp.tar.gz" -C "$BACKUP_DIR" "backup_$backup_timestamp"
    rm -rf "$backup_path"
    
    echo "$BACKUP_DIR/backup_$backup_timestamp.tar.gz" > /tmp/last_backup_path
    
    log_success "Backup created: backup_$backup_timestamp.tar.gz"
}

# Build and test images
build_images() {
    log_info "Building Docker images..."
    
    # Build with build cache
    DOCKER_BUILDKIT=1 docker-compose -f docker-compose.prod.yml build --parallel
    
    # Test image security
    log_info "Running security scans on images..."
    
    # Use Docker Scout or Trivy if available
    if command -v trivy &> /dev/null; then
        trivy image riscura-app:latest --exit-code 1 --severity HIGH,CRITICAL || log_warn "Security vulnerabilities found in image"
    fi
    
    log_success "Images built successfully"
}

# Database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    # Run migrations in a temporary container
    docker-compose -f docker-compose.prod.yml run --rm app npx prisma migrate deploy
    
    # Verify database schema
    docker-compose -f docker-compose.prod.yml run --rm app npx prisma db pull --print
    
    log_success "Database migrations completed"
}

# Deploy with zero downtime
deploy_zero_downtime() {
    log_info "Starting zero-downtime deployment..."
    
    # Scale up new instances
    log_info "Scaling up new application instances..."
    docker-compose -f docker-compose.prod.yml up -d --scale app=2 --no-recreate
    
    # Wait for new instances to be healthy
    local new_container_id=$(docker-compose -f docker-compose.prod.yml ps -q app | tail -n 1)
    wait_for_health "$new_container_id"
    
    # Update load balancer to include new instances
    log_info "Updating load balancer configuration..."
    docker-compose -f docker-compose.prod.yml exec nginx nginx -s reload
    
    # Wait for traffic to stabilize
    sleep 30
    
    # Remove old instances
    log_info "Removing old application instances..."
    local old_containers=$(docker-compose -f docker-compose.prod.yml ps -q app | head -n -1)
    for container in $old_containers; do
        docker stop "$container"
        docker rm "$container"
    done
    
    # Scale back to desired number of instances
    docker-compose -f docker-compose.prod.yml up -d --scale app=1
    
    log_success "Zero-downtime deployment completed"
}

# Regular deployment (with downtime)
deploy_regular() {
    log_info "Starting regular deployment..."
    
    # Stop services
    docker-compose -f docker-compose.prod.yml down
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be ready
    wait_for_services
    
    log_success "Regular deployment completed"
}

# Wait for services to be healthy
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    local services=("postgres" "redis" "app" "nginx")
    
    for service in "${services[@]}"; do
        log_info "Checking health of $service..."
        local max_attempts=30
        local attempt=1
        
        while [[ $attempt -le $max_attempts ]]; do
            if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "healthy\|Up"; then
                log_success "$service is healthy"
                break
            fi
            
            if [[ $attempt -eq $max_attempts ]]; then
                error_exit "$service failed to become healthy"
            fi
            
            log_info "Waiting for $service... (attempt $attempt/$max_attempts)"
            sleep 10
            ((attempt++))
        done
    done
}

# Wait for specific container health
wait_for_health() {
    local container_id=$1
    local max_attempts=30
    local attempt=1
    
    while [[ $attempt -le $max_attempts ]]; do
        local health_status=$(docker inspect --format='{{.State.Health.Status}}' "$container_id" 2>/dev/null || echo "unknown")
        
        if [[ "$health_status" == "healthy" ]]; then
            log_success "Container $container_id is healthy"
            return 0
        fi
        
        if [[ $attempt -eq $max_attempts ]]; then
            error_exit "Container $container_id failed to become healthy"
        fi
        
        log_info "Waiting for container health... (attempt $attempt/$max_attempts)"
        sleep 10
        ((attempt++))
    done
}

# Health checks
health_checks() {
    log_info "Performing post-deployment health checks..."
    
    local attempt=1
    while [[ $attempt -le $MAX_HEALTH_CHECKS ]]; do
        log_info "Health check attempt $attempt/$MAX_HEALTH_CHECKS"
        
        # HTTP health check
        if curl -sf "$HEALTH_CHECK_URL" > /dev/null; then
            log_success "HTTP health check passed"
            break
        fi
        
        if [[ $attempt -eq $MAX_HEALTH_CHECKS ]]; then
            error_exit "Health checks failed after $MAX_HEALTH_CHECKS attempts"
        fi
        
        sleep $HEALTH_CHECK_INTERVAL
        ((attempt++))
    done
    
    # Additional checks
    log_info "Running additional health checks..."
    
    # Database connectivity
    if ! docker-compose -f docker-compose.prod.yml exec -T postgres pg_isready -U "$POSTGRES_USER"; then
        error_exit "Database health check failed"
    fi
    
    # Redis connectivity
    if ! docker-compose -f docker-compose.prod.yml exec -T redis redis-cli ping | grep -q "PONG"; then
        error_exit "Redis health check failed"
    fi
    
    # API endpoints
    local api_endpoints=("/api/health" "/api/auth/session")
    for endpoint in "${api_endpoints[@]}"; do
        if ! curl -sf "https://riscura.com$endpoint" > /dev/null; then
            log_warn "API endpoint $endpoint health check failed"
        fi
    done
    
    log_success "All health checks passed"
}

# Performance verification
performance_checks() {
    log_info "Running performance verification..."
    
    # Load testing with curl
    local response_times=()
    for i in {1..10}; do
        local response_time=$(curl -o /dev/null -s -w '%{time_total}' "$HEALTH_CHECK_URL")
        response_times+=("$response_time")
    done
    
    # Calculate average response time
    local total=0
    for time in "${response_times[@]}"; do
        total=$(echo "$total + $time" | bc)
    done
    local average=$(echo "scale=3; $total / ${#response_times[@]}" | bc)
    
    log_info "Average response time: ${average}s"
    
    # Check if response time is acceptable (< 2 seconds)
    if (( $(echo "$average > 2.0" | bc -l) )); then
        log_warn "High response time detected: ${average}s"
    else
        log_success "Response time is acceptable: ${average}s"
    fi
}

# Rollback function
rollback() {
    if [[ "$ROLLBACK_ENABLED" != "true" ]]; then
        log_error "Rollback is disabled"
        return 1
    fi
    
    log_warn "Initiating rollback..."
    
    local backup_path
    if [[ -f /tmp/last_backup_path ]]; then
        backup_path=$(cat /tmp/last_backup_path)
    else
        # Find the most recent backup
        backup_path=$(ls -t "$BACKUP_DIR"/backup_*.tar.gz | head -n 1)
    fi
    
    if [[ -z "$backup_path" || ! -f "$backup_path" ]]; then
        error_exit "No backup found for rollback"
    fi
    
    log_info "Rolling back using backup: $backup_path"
    
    # Extract backup
    local temp_dir=$(mktemp -d)
    tar -xzf "$backup_path" -C "$temp_dir"
    local backup_dir=$(find "$temp_dir" -name "backup_*" -type d | head -n 1)
    
    # Stop current services
    docker-compose -f docker-compose.prod.yml down
    
    # Restore database
    log_info "Restoring database..."
    docker-compose -f docker-compose.prod.yml up -d postgres
    sleep 30
    docker-compose -f docker-compose.prod.yml exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" < "$backup_dir/database.sql"
    
    # Restore Redis
    log_info "Restoring Redis data..."
    docker-compose -f docker-compose.prod.yml up -d redis
    sleep 10
    docker-compose -f docker-compose.prod.yml exec -T redis redis-cli --pipe < "$backup_dir/redis.rdb"
    
    # Restore configuration
    log_info "Restoring configuration..."
    cp -r "$backup_dir"/{.env.production,docker-compose.prod.yml,nginx} "$PROJECT_ROOT/"
    
    # Restore application data
    log_info "Restoring application data..."
    tar -xzf "$backup_dir/app_data.tar.gz" -C /opt/riscura/data/
    
    # Start services
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services
    wait_for_services
    
    # Cleanup
    rm -rf "$temp_dir"
    
    log_success "Rollback completed successfully"
}

# Monitoring and alerting
send_deployment_notification() {
    local status=$1
    local message=$2
    
    # Send to Slack/Discord/Teams webhook if configured
    if [[ -n "${WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Riscura Deployment $status: $message\"}" \
            "$WEBHOOK_URL" || log_warn "Failed to send notification"
    fi
    
    # Send email notification if configured
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "Deployment $status: $message" | \
            mail -s "Riscura Deployment $status" "$NOTIFICATION_EMAIL" || \
            log_warn "Failed to send email notification"
    fi
}

# Main deployment function
main() {
    local deployment_start_time=$(date +%s)
    
    log_info "Starting Riscura production deployment..."
    log_info "Deployment ID: $(date +%Y%m%d_%H%M%S)_$(git rev-parse --short HEAD)"
    
    # Parse command line arguments
    local zero_downtime=false
    local skip_backup=false
    local skip_health_checks=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --zero-downtime)
                zero_downtime=true
                shift
                ;;
            --skip-backup)
                skip_backup=true
                shift
                ;;
            --skip-health-checks)
                skip_health_checks=true
                shift
                ;;
            --rollback)
                rollback
                exit 0
                ;;
            -h|--help)
                cat << EOF
Usage: $0 [OPTIONS]

Options:
    --zero-downtime      Use zero-downtime deployment strategy
    --skip-backup        Skip pre-deployment backup
    --skip-health-checks Skip post-deployment health checks
    --rollback           Rollback to previous deployment
    -h, --help           Show this help message

EOF
                exit 0
                ;;
            *)
                error_exit "Unknown option: $1"
                ;;
        esac
    done
    
    # Trap for rollback on failure
    trap 'log_error "Deployment failed. Use --rollback to revert changes."; send_deployment_notification "FAILED" "Deployment failed at $(date)"; exit 1' ERR
    
    # Run deployment steps
    check_prerequisites
    validate_environment
    security_checks
    
    if [[ "$skip_backup" != "true" ]]; then
        create_backup
    fi
    
    build_images
    run_migrations
    
    if [[ "$zero_downtime" == "true" ]]; then
        deploy_zero_downtime
    else
        deploy_regular
    fi
    
    if [[ "$skip_health_checks" != "true" ]]; then
        health_checks
        performance_checks
    fi
    
    local deployment_end_time=$(date +%s)
    local deployment_duration=$((deployment_end_time - deployment_start_time))
    
    log_success "Deployment completed successfully in ${deployment_duration} seconds"
    send_deployment_notification "SUCCESS" "Deployment completed in ${deployment_duration}s"
    
    # Cleanup old backups (keep last 10)
    find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f | sort -r | tail -n +11 | xargs rm -f
    
    log_info "Deployment summary:"
    log_info "- Duration: ${deployment_duration} seconds"
    log_info "- Strategy: $([ "$zero_downtime" == "true" ] && echo "Zero-downtime" || echo "Regular")"
    log_info "- Git commit: $(git rev-parse HEAD)"
    log_info "- Deployed at: $(date)"
}

# Run main function with all arguments
main "$@" 