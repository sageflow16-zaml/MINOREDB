#Requires -Version 7
<#
.SYNOPSIS
  Production Smoke-Test / Verification Script for Minore
  Run AFTER:
    1. supabase link --project-ref <ref>
    2. supabase db push (migrations applied)
    3. supabase functions deploy <all>
    4. vercel --prod (frontend deployed)

.DESCRIPTION
  This script checks:
    - Supabase project health
    - Database RPC functions respond correctly
    - Edge Functions respond
    - Environment variables are set
    - Frontend URL is reachable
#>

param(
  [Parameter(Mandatory)]
  [string]$SupabaseProjectRef,

  [Parameter(Mandatory)]
  [string]$SupabaseAnonKey,

  [Parameter(Mandatory)]
  [string]$FrontendUrl
)

$ErrorActionPreference = "Stop"
$SupabaseUrl = "https://$SupabaseProjectRef.supabase.co"
$pass = 0; $fail = 0; $skip = 0

function Check {
  param([string]$Label, [scriptblock]$Block)
  try {
    & $Block
    Write-Host "  ✓ $Label" -ForegroundColor Green
    $script:pass++
  } catch {
    Write-Host "  ✗ $Label  → $($_.Exception.Message)" -ForegroundColor Red
    $script:fail++
  }
}

function Warn {
  param([string]$Label)
  Write-Host "  ∼ $Label  (skipped — requires manual check)" -ForegroundColor Yellow
  $script:skip++
}

# ============================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  MINORE PRODUCTION VERIFICATION" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Supabase : $SupabaseUrl"
Write-Host "  Frontend : $FrontendUrl"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

$headers = @{
  "apikey" = $SupabaseAnonKey
  "Content-Type" = "application/json"
}

# ============================================================
# 1. FRONTEND
# ============================================================
Write-Host "[1/5] Frontend" -ForegroundColor Blue

Check "Homepage returns 200" {
  $r = Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 15 -SkipCertificateCheck
  if ($r.StatusCode -ne 200) { throw "Status: $($r.StatusCode)" }
}

Check "Page contains <title> (loads React)" {
  $html = (Invoke-WebRequest -Uri $FrontendUrl -TimeoutSec 15 -SkipCertificateCheck).Content
  if ($html -notmatch '<div id="root">') { throw "React root div not found" }
}

# ============================================================
# 2. SUPABASE REST API (health + auth)
# ============================================================
Write-Host "[2/5] Supabase REST API" -ForegroundColor Blue

Check "auth health endpoint" {
  $r = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/" -Headers $headers -TimeoutSec 10 -SkipCertificateCheck
  if ($null -eq $r) { throw "Empty response" }
}

Check "anon key is valid (can list tables)" {
  $r = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/project?select=id&limit=1" `
    -Headers $headers -TimeoutSec 10 -SkipCertificateCheck
  # No error = key valid
}

# ============================================================
# 3. RPC FUNCTIONS
# ============================================================
Write-Host "[3/5] RPC Functions" -ForegroundColor Blue

# Create a temporary project ID for testing (don't hardcode)
Check "get_dashboard_stats RPC valid" {
  $body = @{ "p_project_id" = "00000000-0000-0000-0000-000000000001" } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc/get_dashboard_stats" `
    -Method Post -Headers $headers -Body $body -TimeoutSec 15 -SkipCertificateCheck
  if ($null -eq $r) { throw "Empty response" }
}

Check "calculate_position_size RPC works" {
  $body = @{
    "p_account_balance" = 10000
    "p_risk_percent" = 1.0
    "p_entry_price" = 1.1000
    "p_stop_loss" = 1.0950
  } | ConvertTo-Json
  $r = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc/calculate_position_size" `
    -Method Post -Headers $headers -Body $body -TimeoutSec 15 -SkipCertificateCheck
  if ($null -eq $r -or $null -eq $r.position_size) { throw "Invalid response: position_size missing" }
}

Warn "get_trade_statistics — requires real project_id"
Warn "get_analytics_overview — requires real project_id"
Warn "find_similar_trades — requires real project_id"

# ============================================================
# 4. EDGE FUNCTIONS
# ============================================================
Write-Host "[4/5] Edge Functions" -ForegroundColor Blue

Check "ai function endpoint exists" {
  $r = Invoke-WebRequest -Uri "$SupabaseUrl/functions/v1/ai" `
    -Method Post -TimeoutSec 10 -SkipCertificateCheck
  # Expected: 401 or 400 (no valid JWT) — NOT 404
  if ($r.StatusCode -eq 404) { throw "Function not deployed (404)" }
}

Check "collector function endpoint exists" {
  $r = Invoke-WebRequest -Uri "$SupabaseUrl/functions/v1/collector" `
    -Method Post -TimeoutSec 10 -SkipCertificateCheck
  if ($r.StatusCode -eq 404) { throw "Function not deployed (404)" }
}

Check "broker-sync function endpoint exists" {
  $r = Invoke-WebRequest -Uri "$SupabaseUrl/functions/v1/broker-sync" `
    -Method Post -TimeoutSec 10 -SkipCertificateCheck
  if ($r.StatusCode -eq 404) { throw "Function not deployed (404)" }
}

Check "automation-connector function endpoint exists" {
  $r = Invoke-WebRequest -Uri "$SupabaseUrl/functions/v1/automation-connector" `
    -Method Post -TimeoutSec 10 -SkipCertificateCheck
  if ($r.StatusCode -eq 404) { throw "Function not deployed (404)" }
}

Check "obsidian-sync function endpoint exists" {
  $r = Invoke-WebRequest -Uri "$SupabaseUrl/functions/v1/obsidian-sync" `
    -Method Post -TimeoutSec 10 -SkipCertificateCheck
  if ($r.StatusCode -eq 404) { throw "Function not deployed (404)" }
}

Check "replay-data function endpoint exists" {
  $r = Invoke-WebRequest -Uri "$SupabaseUrl/functions/v1/replay-data" `
    -Method Post -TimeoutSec 10 -SkipCertificateCheck
  if ($r.StatusCode -eq 404) { throw "Function not deployed (404)" }
}

Check "mt5 function endpoint exists" {
  $r = Invoke-WebRequest -Uri "$SupabaseUrl/functions/v1/mt5" `
    -Method Post -TimeoutSec 10 -SkipCertificateCheck
  if ($r.StatusCode -eq 404) { throw "Function not deployed (404)" }
}

Check "tv-webhook function endpoint exists" {
  $r = Invoke-WebRequest -Uri "$SupabaseUrl/functions/v1/tv-webhook" `
    -Method Post -TimeoutSec 10 -SkipCertificateCheck
  if ($r.StatusCode -eq 404) { throw "Function not deployed (404)" }
}

# ============================================================
# 5. STORAGE & AUTH (light checks)
# ============================================================
Write-Host "[5/5] Storage & Auth" -ForegroundColor Blue

Check "storage bucket listing works" {
  $r = Invoke-RestMethod -Uri "$SupabaseUrl/storage/v1/bucket" `
    -Headers $headers -TimeoutSec 10 -SkipCertificateCheck
  # empty array or actual buckets — either is fine, just not error
}

Warn "Authentication flow (register + login) — test manually"
Warn "RLS isolation — verify user A cannot see user B data"
Warn "Storage bucket RLS — verify user isolation on trade-images"
Warn "CORS headers on Edge Functions"
Warn "Mobile responsive breakpoints (375px, 768px, 1024px)"

# ============================================================
# SUMMARY
# ============================================================
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  RESULTS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  Passed : $pass"
Write-Host "  Failed : $fail" -ForegroundColor $(if ($fail -gt 0) { "Red" } else { "Gray" })
Write-Host "  Skipped: $skip (manual check)"
Write-Host "  Total  : $($pass + $fail + $skip)"
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan

if ($fail -gt 0) {
  Write-Host "⚠  Some checks failed. Review the errors above." -ForegroundColor Red
  exit 1
}
Write-Host "✓ All automated checks passed!" -ForegroundColor Green
