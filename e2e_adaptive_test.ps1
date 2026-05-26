$ErrorActionPreference='Stop'
$base='http://localhost:5000/api'
$stamp=[DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email="e2e.$stamp@pragyan.test"
$password = $env:E2E_PASSWORD
if (-not $password) { Write-Host "E2E_PASSWORD environment variable is not set. Aborting."; exit 1 }
$fullName='E2E Test User'
$report=@()
function Add-Check($step,$status,$detail){ $global:report += [pscustomobject]@{Step=$step;Status=$status;Detail=$detail} }

try {
  try {
    $regBody=@{fullName=$fullName;email=$email;password=$password}|ConvertTo-Json
    $null=Invoke-RestMethod -Uri "$base/auth/register" -Method Post -ContentType 'application/json' -Body $regBody
    Add-Check '1.Register' 'PASS' "Created $email"
  } catch {
    Add-Check '1.Register' 'WARN' 'Register failed, attempting login fallback'
  }

  $loginBody=@{email=$email;password=$password}|ConvertTo-Json
  $login=Invoke-RestMethod -Uri "$base/auth/login" -Method Post -ContentType 'application/json' -Body $loginBody
  $token=$login.data.accessToken
  if(-not $token){ throw 'No access token from login' }
  $headers=@{Authorization="Bearer $token"}
  Add-Check '2.Login' 'PASS' 'Access token acquired'

  $start=Invoke-RestMethod -Uri "$base/assessment/start" -Method Get
  $sessionId=$start.data.sessionId
  $question=$start.data.question
  if(-not $sessionId){ throw 'No sessionId from start' }
  Add-Check '3.AssessmentStart' 'PASS' "sessionId=$sessionId"

  $answered=0
  for($i=0; $i -lt 15; $i++){
    if(-not $question){ break }
    $answer = $question.options[0]
    $ansBody=@{sessionId=$sessionId;questionId=$question.id;answer=$answer}|ConvertTo-Json
    $ans=Invoke-RestMethod -Uri "$base/assessment/answer" -Method Post -Headers $headers -ContentType 'application/json' -Body $ansBody
    $answered++
    if($ans.data.shouldSubmit -eq $true){
      $question=$null
      break
    }
    $question=$ans.data.nextQuestion
  }
  Add-Check '4.AdaptiveAnswers' 'PASS' "Answered $answered questions"

  $submitBody=@{sessionId=$sessionId}|ConvertTo-Json
  $submit=Invoke-RestMethod -Uri "$base/assessment/submit" -Method Post -Headers $headers -ContentType 'application/json' -Body $submitBody
  $resultId=$submit.data.resultId
  if(-not $resultId){ throw 'No resultId from submit' }
  Add-Check '5.AssessmentSubmit' 'PASS' "resultId=$resultId"

  $result=Invoke-RestMethod -Uri "$base/assessment/results/$resultId" -Method Get -Headers $headers
  Add-Check '6.FetchResults' 'PASS' "suggestedCareers=$($result.data.suggestedCareers.Count)"

  $topMatches = $submit.data.topMatches
  $summary = $submit.data.summary
  $reportBody=@{topMatches=$topMatches;confidence=$submit.data.confidence;strengths=$summary.strengths;weaknesses=$summary.weaknesses;targetCareer=$summary.topMatch.career}|ConvertTo-Json -Depth 8
  $null=Invoke-RestMethod -Uri "$base/ai/report" -Method Post -Headers $headers -ContentType 'application/json' -Body $reportBody
  Add-Check '7.AIReport' 'PASS' 'Report endpoint responded'

  $roadmapBody=@{targetCareer=$summary.topMatch.career;skillGaps=$summary.topMatch.skillGaps;timelineWeeks=12;profileSummary='E2E flow validation'}|ConvertTo-Json -Depth 8
  $null=Invoke-RestMethod -Uri "$base/ai/roadmap" -Method Post -Headers $headers -ContentType 'application/json' -Body $roadmapBody
  Add-Check '8.AIRoadmap' 'PASS' 'Roadmap endpoint responded'

  $history=Invoke-RestMethod -Uri "$base/ai/memory/recommendations" -Method Get -Headers $headers
  $hCount=0; if($history.data){ $hCount=$history.data.Count }
  Add-Check '9.RecommendationHistory' 'PASS' "historyItems=$hCount"

  $latest=Invoke-RestMethod -Uri "$base/assessment/latest" -Method Get -Headers $headers
  Add-Check '10.AssessmentPersistence' 'PASS' "latestId=$($latest.data.id)"

  try {
    $null=Invoke-RestMethod -Uri "$base/recommendations/top-career" -Method Get -Headers $headers
    Add-Check '11.DashboardTopCareer' 'PASS' 'top-career available'
  } catch {
    Add-Check '11.DashboardTopCareer' 'WARN' 'top-career unavailable for this fresh user profile'
  }

} catch {
  Add-Check 'E2E.Fatal' 'FAIL' $_.Exception.Message
}

$report | ConvertTo-Json -Depth 5
