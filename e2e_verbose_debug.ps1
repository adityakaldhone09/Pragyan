$ErrorActionPreference='Stop'
$base='http://localhost:5000/api'
$stamp=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email="e2e.$stamp@pragyan.test"
$password = $env:E2E_PASSWORD
if (-not $password) { Write-Host "E2E_PASSWORD environment variable is not set. Aborting."; exit 1 }
$fullName='E2E Debug User'
function run($label, $script){
  Write-Output "STEP: $label"
  try{
    $res = & $script
    Write-Output "OK: $label"
    return $res
  } catch {
    $ex = $_.Exception
    if($ex.Response){
      $status = $ex.Response.StatusCode.value__ 2>$null
      $body = $ex.Response.Content 2>$null
      Write-Output "ERROR: $label -> HTTP $status"
      Write-Output "RESPONSE BODY: $body"
    } else {
      Write-Output "ERROR: $label -> $($ex.Message)"
    }
    throw
  }
}

# Register
run 'Register' { Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType 'application/json' -Body (@{fullName=$fullName;email=$email;password=$password}|ConvertTo-Json) }
# Login
$login = run 'Login' { Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' -Body (@{email=$email;password=$password}|ConvertTo-Json) }
$token = $login.data.accessToken
$headers=@{Authorization="Bearer $token"}
# Start
$start = run 'Start' { Invoke-RestMethod -Uri "$base/assessment/start" -Method Get }
$sessionId = $start.data.sessionId
$question = $start.data.question
# Answer one
$ans = run 'Answer' { Invoke-RestMethod -Uri "$base/assessment/answer" -Method Post -Headers $headers -ContentType 'application/json' -Body (@{sessionId=$sessionId;questionId=$question.id;answer=$question.options[0]}|ConvertTo-Json) }
# Submit
$submit = run 'Submit' { Invoke-RestMethod -Uri "$base/assessment/submit" -Method Post -Headers $headers -ContentType 'application/json' -Body (@{sessionId=$sessionId}|ConvertTo-Json) }
# Fetch results
$resultId = $submit.data.resultId
$fetch = run 'FetchResults' { Invoke-RestMethod -Uri "$base/assessment/results/$resultId" -Method Get -Headers $headers }
# AI Report
$topMatches = $submit.data.topMatches
$summary = $submit.data.summary
$reportBody=@{topMatches=$topMatches;confidence=$submit.data.confidence;strengths=$summary.strengths;weaknesses=$summary.weaknesses;targetCareer=$summary.topMatch.career}|ConvertTo-Json -Depth 8
run 'AIReport' { Invoke-RestMethod -Uri "$base/ai/report" -Method Post -Headers $headers -ContentType 'application/json' -Body $reportBody }
# AI Roadmap
$roadmapBody=@{targetCareer=$summary.topMatch.career;skillGaps=$summary.topMatch.skillGaps;timelineWeeks=12;profileSummary='E2E debug'}|ConvertTo-Json -Depth 8
run 'AIRoadmap' { Invoke-RestMethod -Uri "$base/ai/roadmap" -Method Post -Headers $headers -ContentType 'application/json' -Body $roadmapBody }
Write-Output 'E2E Debug Completed'
