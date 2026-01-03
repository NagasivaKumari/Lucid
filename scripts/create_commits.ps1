<#
PowerShell script to create commits per file.
Usage:
  .\scripts\create_commits.ps1 -Mode empty -Count 10
  .\scripts\create_commits.ps1 -Mode modify -Count 10

Modes:
  empty  - create N empty commits per tracked file (fast, non-destructive)
  modify - append a small line to each file and commit (will change files)

Note: Run this in the repo root. Make sure `git` is installed and `git init`/`git remote` already set up.
#>
param(
    [ValidateSet('empty','modify')]
    [string]$Mode = 'empty',
    [int]$Count = 10
)

function Check-Git {
    $git = Get-Command git -ErrorAction SilentlyContinue
    if (-not $git) {
        Write-Error "git not found. Install Git for Windows and ensure it's on PATH."
        exit 1
    }
    $inside = git rev-parse --is-inside-work-tree 2>$null
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Current folder is not a git repository. Initialize first: git init"
        exit 1
    }
}

Check-Git

# Get tracked files (relative paths)
$files = git ls-files | Where-Object { $_ -ne '.gitignore' } | ForEach-Object { $_ }
if ($files.Count -eq 0) {
    Write-Error "No tracked files found. Add files and commit at least once before running this script."
    exit 1
}

Write-Host "Found $($files.Count) tracked files. Mode=$Mode, Count per file=$Count"

foreach ($file in $files) {
    for ($i = 1; $i -le $Count; $i++) {
        if ($Mode -eq 'modify') {
            # Append a small automation line to the file
            try {
                Add-Content -Path $file -Value "# automated commit $i for $file - $(Get-Date -Format o)"
                git add -- $file
                git commit -m "chore: update $file - automated commit #$i"
            } catch {
                Write-Warning "Failed modifying/committing $file: $_"
            }
        } else {
            # empty commit
            try {
                git commit --allow-empty -m "chore: empty commit #$i for $file"
            } catch {
                Write-Warning "Failed to create empty commit for $file: $_"
            }
        }
    }
}

Write-Host "Done creating commits. Review with: git log --oneline -n 50"
