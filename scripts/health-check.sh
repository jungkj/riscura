#!/bin/bash

# Riscura Production Health Check Script
# Comprehensive monitoring of all system components

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
HEALTH_LOG="/var/log/riscura/health.log"
METRICS_FILE="/var/log/riscura/metrics.json"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_RESPONSE_TIME=5.0
WEBHOOK_URL="${WEBHOOK_URL:-}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Health check results
declare -A health_results
declare -A metrics
health_score=0
total_checks=0

# Logging function
log() {
    local level=$1
    shift
    local message="$*"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo -e "${timestamp} [${level}] ${message}" | tee -a "${HEALTH_LOG}"
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

# Record health check result
record_check() {
    local check_name=$1
    local status=$2
    local message=$3
    local value=${4:-""}
    
    health_results["$check_name"]="$status|$message|$value"
    total_checks=$((total_checks + 1))
    
    if [[ "$status" == "PASS" ]]; then
        health_score=$((health_score + 1))
        log_success "$check_name: $message"
    elif [[ "$status" == "WARN" ]]; then
        log_warn "$check_name: $message"
    else
        log_error "$check_name: $message"
    fi
}

# System resource checks
check_system_resources() {
    log_info "Checking system resources..."
    
    # CPU usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2+$4}' | cut -d'%' -f1)
    metrics["cpu_usage"]=$cpu_usage
    
    if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        record_check "cpu_usage" "FAIL" "High CPU usage: ${cpu_usage}%" "$cpu_usage"
    elif (( $(echo "$cpu_usage > $(($ALERT_THRESHOLD_CPU - 10))" | bc -l) )); then
        record_check "cpu_usage" "WARN" "Elevated CPU usage: ${cpu_usage}%" "$cpu_usage"
    else
        record_check "cpu_usage" "PASS" "CPU usage normal: ${cpu_usage}%" "$cpu_usage"
    fi
    
    # Memory usage
    local memory_info=$(free | grep Mem)
    local total_memory=$(echo $memory_info | awk '{print $2}')
    local used_memory=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$(echo "scale=2; $used_memory * 100 / $total_memory" | bc)
    metrics["memory_usage"]=$memory_usage
    metrics["memory_total_mb"]=$(echo "scale=0; $total_memory / 1024" | bc)
    metrics["memory_used_mb"]=$(echo "scale=0; $used_memory / 1024" | bc)
    
    if (( $(echo "$memory_usage > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        record_check "memory_usage" "FAIL" "High memory usage: ${memory_usage}%" "$memory_usage"
    elif (( $(echo "$memory_usage > $(($ALERT_THRESHOLD_MEMORY - 10))" | bc -l) )); then
        record_check "memory_usage" "WARN" "Elevated memory usage: ${memory_usage}%" "$memory_usage"
    else
        record_check "memory_usage" "PASS" "Memory usage normal: ${memory_usage}%" "$memory_usage"
    fi
    
    # Disk usage
    local disk_usage=$(df / | awk 'NR==2 {print $(NF-1)}' | sed 's/%//')
    metrics["disk_usage"]=$disk_usage
    
    if [[ $disk_usage -gt $ALERT_THRESHOLD_DISK ]]; then
        record_check "disk_usage" "FAIL" "High disk usage: ${disk_usage}%" "$disk_usage"
    elif [[ $disk_usage -gt $((ALERT_THRESHOLD_DISK - 10)) ]]; then
        record_check "disk_usage" "WARN" "Elevated disk usage: ${disk_usage}%" "$disk_usage"
    else
        record_check "disk_usage" "PASS" "Disk usage normal: ${disk_usage}%" "$disk_usage"
    fi
    
    # Load average
    local load_avg=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local load_percentage=$(echo "scale=2; $load_avg * 100 / $cpu_cores" | bc)
    metrics["load_average"]=$load_avg
    metrics["load_percentage"]=$load_percentage
    
    if (( $(echo "$load_percentage > 100" | bc -l) )); then
        record_check "load_average" "FAIL" "High load average: $load_avg (${load_percentage}%)" "$load_avg"
    elif (( $(echo "$load_percentage > 80" | bc -l) )); then
        record_check "load_average" "WARN" "Elevated load average: $load_avg (${load_percentage}%)" "$load_avg"
    else
        record_check "load_average" "PASS" "Load average normal: $load_avg (${load_percentage}%)" "$load_avg"
    fi
}

# Docker service checks
check_docker_services() {
    log_info "Checking Docker services..."
    
    if ! command -v docker &> /dev/null; then
        record_check "docker_installed" "FAIL" "Docker is not installed"
        return
    fi
    
    record_check "docker_installed" "PASS" "Docker is installed"
    
    # Check Docker daemon
    if ! docker info &> /dev/null; then
        record_check "docker_daemon" "FAIL" "Docker daemon is not running"
        return
    fi
    
    record_check "docker_daemon" "PASS" "Docker daemon is running"
    
    # Check individual services
    local services=("riscura-app" "riscura-postgres" "riscura-redis" "riscura-nginx")
    
    for service in "${services[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "$service"; then
            local status=$(docker inspect --format='{{.State.Status}}' "$service" 2>/dev/null || echo "unknown")
            local health=$(docker inspect --format='{{.State.Health.Status}}' "$service" 2>/dev/null || echo "none")
            
            if [[ "$status" == "running" ]]; then
                if [[ "$health" == "healthy" ]] || [[ "$health" == "none" ]]; then
                    record_check "docker_$service" "PASS" "Service $service is running and healthy"
                else
                    record_check "docker_$service" "WARN" "Service $service is running but unhealthy: $health"
                fi
            else
                record_check "docker_$service" "FAIL" "Service $service is not running: $status"
            fi
            
            # Get container resource usage
            local container_stats=$(docker stats "$service" --no-stream --format "{{.CPUPerc}},{{.MemUsage}}" 2>/dev/null || echo "0%,0B / 0B")
            local cpu_perc=$(echo "$container_stats" | cut -d',' -f1 | sed 's/%//')
            local mem_usage=$(echo "$container_stats" | cut -d',' -f2)
            
            metrics["${service}_cpu"]=$cpu_perc
            metrics["${service}_memory"]="$mem_usage"
        else
            record_check "docker_$service" "FAIL" "Service $service is not found"
        fi
    done
}

# Database connectivity checks
check_database() {
    log_info "Checking database connectivity..."
    
    # PostgreSQL connection test
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres pg_isready -U "${POSTGRES_USER:-riscura}" &> /dev/null; then
        record_check "postgres_connection" "PASS" "PostgreSQL is accepting connections"
        
        # Check database size
        local db_size=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres psql -U "${POSTGRES_USER:-riscura}" -d "${POSTGRES_DB:-riscura}" -t -c "SELECT pg_size_pretty(pg_database_size('${POSTGRES_DB:-riscura}'));" 2>/dev/null | xargs || echo "unknown")
        metrics["database_size"]="$db_size"
        
        # Check active connections
        local active_connections=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres psql -U "${POSTGRES_USER:-riscura}" -d "${POSTGRES_DB:-riscura}" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';" 2>/dev/null | xargs || echo "0")
        metrics["database_active_connections"]=$active_connections
        
        if [[ $active_connections -gt 50 ]]; then
            record_check "postgres_connections" "WARN" "High number of active connections: $active_connections"
        else
            record_check "postgres_connections" "PASS" "Active connections normal: $active_connections"
        fi
        
        # Check for long-running queries
        local long_queries=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres psql -U "${POSTGRES_USER:-riscura}" -d "${POSTGRES_DB:-riscura}" -t -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active' AND now() - query_start > interval '5 minutes';" 2>/dev/null | xargs || echo "0")
        
        if [[ $long_queries -gt 0 ]]; then
            record_check "postgres_long_queries" "WARN" "Long-running queries detected: $long_queries"
        else
            record_check "postgres_long_queries" "PASS" "No long-running queries"
        fi
    else
        record_check "postgres_connection" "FAIL" "PostgreSQL is not accepting connections"
    fi
}

# Redis connectivity checks
check_redis() {
    log_info "Checking Redis connectivity..."
    
    # Redis ping test
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
        record_check "redis_connection" "PASS" "Redis is responding to ping"
        
        # Check Redis memory usage
        local redis_memory=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T redis redis-cli info memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r' || echo "unknown")
        metrics["redis_memory_used"]="$redis_memory"
        
        # Check Redis key count
        local redis_keys=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T redis redis-cli dbsize 2>/dev/null || echo "0")
        metrics["redis_keys"]=$redis_keys
        
        # Check Redis connected clients
        local redis_clients=$(docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T redis redis-cli info clients 2>/dev/null | grep "connected_clients" | cut -d: -f2 | tr -d '\r' || echo "0")
        metrics["redis_connected_clients"]=$redis_clients
        
        if [[ $redis_clients -gt 100 ]]; then
            record_check "redis_clients" "WARN" "High number of Redis clients: $redis_clients"
        else
            record_check "redis_clients" "PASS" "Redis client count normal: $redis_clients"
        fi
    else
        record_check "redis_connection" "FAIL" "Redis is not responding to ping"
    fi
}

# Application health checks
check_application() {
    log_info "Checking application health..."
    
    local app_url="${APP_URL:-https://riscura.com}"
    local health_endpoint="$app_url/api/health"
    
    # HTTP health check with response time
    local start_time=$(date +%s.%N)
    local http_status=$(curl -s -o /dev/null -w "%{http_code}" "$health_endpoint" --max-time 10 || echo "000")
    local end_time=$(date +%s.%N)
    local response_time=$(echo "$end_time - $start_time" | bc)
    
    metrics["http_response_time"]=$response_time
    metrics["http_status_code"]=$http_status
    
    if [[ "$http_status" == "200" ]]; then
        if (( $(echo "$response_time > $ALERT_THRESHOLD_RESPONSE_TIME" | bc -l) )); then
            record_check "app_http_health" "WARN" "Application responding but slow: ${response_time}s" "$response_time"
        else
            record_check "app_http_health" "PASS" "Application responding normally: ${response_time}s" "$response_time"
        fi
    else
        record_check "app_http_health" "FAIL" "Application not responding: HTTP $http_status" "$http_status"
    fi
    
    # Check specific API endpoints
    local api_endpoints=("/api/auth/session" "/api/dashboard/stats")
    
    for endpoint in "${api_endpoints[@]}"; do
        local endpoint_url="$app_url$endpoint"
        local endpoint_status=$(curl -s -o /dev/null -w "%{http_code}" "$endpoint_url" --max-time 5 || echo "000")
        
        if [[ "$endpoint_status" =~ ^[23] ]]; then
            record_check "api_endpoint_$(basename $endpoint)" "PASS" "Endpoint $endpoint responding: HTTP $endpoint_status"
        else
            record_check "api_endpoint_$(basename $endpoint)" "WARN" "Endpoint $endpoint issue: HTTP $endpoint_status"
        fi
    done
}

# SSL certificate checks
check_ssl_certificates() {
    log_info "Checking SSL certificates..."
    
    local domain="${DOMAIN:-riscura.com}"
    
    # Check certificate expiration
    local cert_info=$(echo | openssl s_client -servername "$domain" -connect "$domain:443" 2>/dev/null | openssl x509 -noout -dates 2>/dev/null || echo "")
    
    if [[ -n "$cert_info" ]]; then
        local expiry_date=$(echo "$cert_info" | grep "notAfter" | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s 2>/dev/null || echo "0")
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        metrics["ssl_days_until_expiry"]=$days_until_expiry
        
        if [[ $days_until_expiry -lt 7 ]]; then
            record_check "ssl_certificate" "FAIL" "SSL certificate expires in $days_until_expiry days" "$days_until_expiry"
        elif [[ $days_until_expiry -lt 30 ]]; then
            record_check "ssl_certificate" "WARN" "SSL certificate expires in $days_until_expiry days" "$days_until_expiry"
        else
            record_check "ssl_certificate" "PASS" "SSL certificate valid for $days_until_expiry days" "$days_until_expiry"
        fi
    else
        record_check "ssl_certificate" "FAIL" "Unable to check SSL certificate"
    fi
}

# Network connectivity checks
check_network() {
    log_info "Checking network connectivity..."
    
    # Check external connectivity
    if ping -c 1 8.8.8.8 &> /dev/null; then
        record_check "external_connectivity" "PASS" "External connectivity working"
    else
        record_check "external_connectivity" "FAIL" "No external connectivity"
    fi
    
    # Check DNS resolution
    if nslookup google.com &> /dev/null; then
        record_check "dns_resolution" "PASS" "DNS resolution working"
    else
        record_check "dns_resolution" "FAIL" "DNS resolution failed"
    fi
    
    # Check port availability
    local ports=("80:HTTP" "443:HTTPS" "22:SSH")
    
    for port_info in "${ports[@]}"; do
        local port=$(echo "$port_info" | cut -d: -f1)
        local service=$(echo "$port_info" | cut -d: -f2)
        
        if netstat -tuln | grep -q ":$port "; then
            record_check "port_$port" "PASS" "$service port $port is listening"
        else
            record_check "port_$port" "WARN" "$service port $port is not listening"
        fi
    done
}

# Security checks
check_security() {
    log_info "Checking security status..."
    
    # Check for failed login attempts
    local failed_logins=$(journalctl -u ssh --since "1 hour ago" | grep "Failed password" | wc -l || echo "0")
    metrics["failed_ssh_logins"]=$failed_logins
    
    if [[ $failed_logins -gt 10 ]]; then
        record_check "security_ssh_attempts" "WARN" "High number of failed SSH attempts: $failed_logins"
    else
        record_check "security_ssh_attempts" "PASS" "SSH login attempts normal: $failed_logins"
    fi
    
    # Check system updates
    local security_updates=$(apt list --upgradable 2>/dev/null | grep -i security | wc -l || echo "0")
    metrics["security_updates_available"]=$security_updates
    
    if [[ $security_updates -gt 0 ]]; then
        record_check "security_updates" "WARN" "$security_updates security updates available"
    else
        record_check "security_updates" "PASS" "No security updates pending"
    fi
    
    # Check firewall status
    if command -v ufw &> /dev/null; then
        local ufw_status=$(ufw status | head -n 1 | awk '{print $2}' || echo "unknown")
        if [[ "$ufw_status" == "active" ]]; then
            record_check "firewall_status" "PASS" "UFW firewall is active"
        else
            record_check "firewall_status" "WARN" "UFW firewall is not active"
        fi
    else
        record_check "firewall_status" "WARN" "UFW firewall not installed"
    fi
}

# Backup status checks
check_backups() {
    log_info "Checking backup status..."
    
    local backup_dir="/opt/riscura/backups"
    
    if [[ -d "$backup_dir" ]]; then
        local latest_backup=$(find "$backup_dir" -name "backup_*.tar.gz" -type f -printf '%T@ %p\n' | sort -n | tail -1 | cut -d' ' -f2- || echo "")
        
        if [[ -n "$latest_backup" ]]; then
            local backup_age=$(( ($(date +%s) - $(stat -c %Y "$latest_backup")) / 3600 ))
            metrics["backup_age_hours"]=$backup_age
            
            if [[ $backup_age -gt 48 ]]; then
                record_check "backup_status" "WARN" "Latest backup is $backup_age hours old"
            else
                record_check "backup_status" "PASS" "Latest backup is $backup_age hours old"
            fi
            
            # Check backup size
            local backup_size=$(du -h "$latest_backup" | cut -f1)
            metrics["backup_size"]="$backup_size"
            
        else
            record_check "backup_status" "FAIL" "No backups found"
        fi
    else
        record_check "backup_status" "FAIL" "Backup directory not found"
    fi
}

# Log analysis
check_logs() {
    log_info "Checking application logs..."
    
    local app_log_dir="/opt/riscura/logs/app"
    local nginx_log_dir="/opt/riscura/logs/nginx"
    
    # Check for application errors in the last hour
    if [[ -d "$app_log_dir" ]]; then
        local error_count=$(find "$app_log_dir" -name "*.log" -type f -mmin -60 -exec grep -i "error\|exception\|fatal" {} \; | wc -l || echo "0")
        metrics["app_errors_last_hour"]=$error_count
        
        if [[ $error_count -gt 10 ]]; then
            record_check "app_errors" "WARN" "$error_count application errors in the last hour"
        else
            record_check "app_errors" "PASS" "$error_count application errors in the last hour"
        fi
    fi
    
    # Check Nginx error logs
    if [[ -d "$nginx_log_dir" ]]; then
        local nginx_errors=$(find "$nginx_log_dir" -name "error.log" -type f -mmin -60 -exec wc -l {} \; | awk '{sum += $1} END {print sum}' || echo "0")
        metrics["nginx_errors_last_hour"]=$nginx_errors
        
        if [[ $nginx_errors -gt 5 ]]; then
            record_check "nginx_errors" "WARN" "$nginx_errors Nginx errors in the last hour"
        else
            record_check "nginx_errors" "PASS" "$nginx_errors Nginx errors in the last hour"
        fi
    fi
}

# Generate metrics JSON
generate_metrics() {
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    local health_percentage=$(echo "scale=2; $health_score * 100 / $total_checks" | bc)
    
    cat > "$METRICS_FILE" <<EOF
{
    "timestamp": "$timestamp",
    "health_score": $health_score,
    "total_checks": $total_checks,
    "health_percentage": $health_percentage,
    "metrics": {
EOF
    
    local first=true
    for key in "${!metrics[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$METRICS_FILE"
        fi
        echo -n "        \"$key\": \"${metrics[$key]}\"" >> "$METRICS_FILE"
    done
    
    cat >> "$METRICS_FILE" <<EOF

    },
    "checks": {
EOF
    
    first=true
    for check in "${!health_results[@]}"; do
        if [[ "$first" == "true" ]]; then
            first=false
        else
            echo "," >> "$METRICS_FILE"
        fi
        
        local status=$(echo "${health_results[$check]}" | cut -d'|' -f1)
        local message=$(echo "${health_results[$check]}" | cut -d'|' -f2)
        local value=$(echo "${health_results[$check]}" | cut -d'|' -f3)
        
        echo -n "        \"$check\": {\"status\": \"$status\", \"message\": \"$message\", \"value\": \"$value\"}" >> "$METRICS_FILE"
    done
    
    cat >> "$METRICS_FILE" <<EOF

    }
}
EOF
}

# Send alerts
send_alerts() {
    local failed_checks=()
    local warning_checks=()
    
    for check in "${!health_results[@]}"; do
        local status=$(echo "${health_results[$check]}" | cut -d'|' -f1)
        local message=$(echo "${health_results[$check]}" | cut -d'|' -f2)
        
        if [[ "$status" == "FAIL" ]]; then
            failed_checks+=("$check: $message")
        elif [[ "$status" == "WARN" ]]; then
            warning_checks+=("$check: $message")
        fi
    done
    
    if [[ ${#failed_checks[@]} -gt 0 ]] || [[ ${#warning_checks[@]} -gt 3 ]]; then
        local alert_message="🚨 Riscura Health Alert\n\n"
        
        if [[ ${#failed_checks[@]} -gt 0 ]]; then
            alert_message+="❌ FAILED CHECKS:\n"
            for check in "${failed_checks[@]}"; do
                alert_message+="  • $check\n"
            done
            alert_message+="\n"
        fi
        
        if [[ ${#warning_checks[@]} -gt 0 ]]; then
            alert_message+="⚠️  WARNING CHECKS:\n"
            for check in "${warning_checks[@]}"; do
                alert_message+="  • $check\n"
            done
            alert_message+="\n"
        fi
        
        local health_percentage=$(echo "scale=1; $health_score * 100 / $total_checks" | bc)
        alert_message+="📊 Overall Health: $health_percentage% ($health_score/$total_checks checks passed)\n"
        alert_message+="🕒 Timestamp: $(date)\n"
        
        # Send to webhook
        if [[ -n "$WEBHOOK_URL" ]]; then
            curl -X POST -H 'Content-type: application/json' \
                --data "{\"text\":\"$alert_message\"}" \
                "$WEBHOOK_URL" &> /dev/null || log_warn "Failed to send webhook alert"
        fi
        
        # Send email
        if [[ -n "$NOTIFICATION_EMAIL" ]]; then
            echo -e "$alert_message" | \
                mail -s "Riscura Health Alert - $(date)" "$NOTIFICATION_EMAIL" &> /dev/null || \
                log_warn "Failed to send email alert"
        fi
    fi
}

# Generate health report
generate_report() {
    local health_percentage=$(echo "scale=1; $health_score * 100 / $total_checks" | bc)
    
    echo ""
    echo "=================================="
    echo "    RISCURA HEALTH REPORT"
    echo "=================================="
    echo "Timestamp: $(date)"
    echo "Overall Health: $health_percentage% ($health_score/$total_checks)"
    echo ""
    
    # Group results by status
    local passed_checks=()
    local warning_checks=()
    local failed_checks=()
    
    for check in "${!health_results[@]}"; do
        local status=$(echo "${health_results[$check]}" | cut -d'|' -f1)
        local message=$(echo "${health_results[$check]}" | cut -d'|' -f2)
        
        case "$status" in
            "PASS")
                passed_checks+=("$check: $message")
                ;;
            "WARN")
                warning_checks+=("$check: $message")
                ;;
            "FAIL")
                failed_checks+=("$check: $message")
                ;;
        esac
    done
    
    if [[ ${#failed_checks[@]} -gt 0 ]]; then
        echo -e "${RED}FAILED CHECKS (${#failed_checks[@]}):${NC}"
        for check in "${failed_checks[@]}"; do
            echo -e "  ${RED}❌ $check${NC}"
        done
        echo ""
    fi
    
    if [[ ${#warning_checks[@]} -gt 0 ]]; then
        echo -e "${YELLOW}WARNING CHECKS (${#warning_checks[@]}):${NC}"
        for check in "${warning_checks[@]}"; do
            echo -e "  ${YELLOW}⚠️  $check${NC}"
        done
        echo ""
    fi
    
    if [[ ${#passed_checks[@]} -gt 0 ]]; then
        echo -e "${GREEN}PASSED CHECKS (${#passed_checks[@]}):${NC}"
        for check in "${passed_checks[@]}"; do
            echo -e "  ${GREEN}✅ $check${NC}"
        done
        echo ""
    fi
    
    echo "Key Metrics:"
    echo "  CPU Usage: ${metrics[cpu_usage]:-N/A}%"
    echo "  Memory Usage: ${metrics[memory_usage]:-N/A}%"
    echo "  Disk Usage: ${metrics[disk_usage]:-N/A}%"
    echo "  Load Average: ${metrics[load_average]:-N/A}"
    echo "  HTTP Response Time: ${metrics[http_response_time]:-N/A}s"
    echo "  Database Size: ${metrics[database_size]:-N/A}"
    echo "  Redis Keys: ${metrics[redis_keys]:-N/A}"
    echo ""
    echo "Logs: $HEALTH_LOG"
    echo "Metrics: $METRICS_FILE"
    echo "=================================="
}

# Main function
main() {
    # Create log directory if it doesn't exist
    mkdir -p "$(dirname "$HEALTH_LOG")"
    mkdir -p "$(dirname "$METRICS_FILE")"
    
    log_info "Starting comprehensive health check..."
    
    # Parse command line arguments
    local send_alerts_flag=true
    local verbose=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-alerts)
                send_alerts_flag=false
                shift
                ;;
            --verbose|-v)
                verbose=true
                shift
                ;;
            --help|-h)
                cat << EOF
Usage: $0 [OPTIONS]

Options:
    --no-alerts    Don't send alerts even if issues are found
    --verbose, -v  Show verbose output
    --help, -h     Show this help message

Environment Variables:
    WEBHOOK_URL           Webhook URL for alerts
    NOTIFICATION_EMAIL    Email address for alerts
    APP_URL              Application URL (default: https://riscura.com)
    DOMAIN               Domain name (default: riscura.com)

EOF
                exit 0
                ;;
            *)
                echo "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Run all health checks
    check_system_resources
    check_docker_services
    check_database
    check_redis
    check_application
    check_ssl_certificates
    check_network
    check_security
    check_backups
    check_logs
    
    # Generate outputs
    generate_metrics
    
    if [[ "$verbose" == "true" ]]; then
        generate_report
    fi
    
    # Send alerts if needed
    if [[ "$send_alerts_flag" == "true" ]]; then
        send_alerts
    fi
    
    # Exit with appropriate code
    local health_percentage=$(echo "scale=0; $health_score * 100 / $total_checks" | bc)
    
    if [[ $health_percentage -ge 90 ]]; then
        log_success "Health check completed: $health_percentage% healthy"
        exit 0
    elif [[ $health_percentage -ge 70 ]]; then
        log_warn "Health check completed with warnings: $health_percentage% healthy"
        exit 1
    else
        log_error "Health check completed with failures: $health_percentage% healthy"
        exit 2
    fi
}

# Run main function with all arguments
main "$@" 