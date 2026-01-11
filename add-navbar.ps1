# Script to update navbar on all subdomain pages
$navbarContent = @'
    <!-- Navigation Bar -->
    <nav style="position:sticky;top:0;z-index:1000;background:var(--bg-primary);border-bottom:1px solid var(--border-subtle);padding:12px 16px;backdrop-filter:blur(10px)">
        <div style="max-width:1400px;margin:0 auto;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">
            <!-- Logo -->
            <a href="../../index.html" style="display:flex;align-items:center;gap:8px;text-decoration:none;color:var(--text-primary);flex-shrink:0">
                <img src="../../public/image/logopic.png" alt="VedSAAS" style="height:28px">
                <span style="font-weight:800;font-size:1.1rem">VedSAAS</span>
            </a>

            <!-- Quick Links -->
            <div style="display:flex;gap:16px;align-items:center;overflow-x:auto;padding-bottom:4px; -ms-overflow-style: none; scrollbar-width: none;">
                <a href="../docs/docs.html" style="color:var(--text-secondary);text-decoration:none;font-size:0.9rem;white-space:nowrap">Docs</a>
                <a href="../api/api.html" style="color:var(--text-secondary);text-decoration:none;font-size:0.9rem;white-space:nowrap">API</a>
                <a href="../help/help.html" style="color:var(--text-secondary);text-decoration:none;font-size:0.9rem;white-space:nowrap">Help</a>
                <a href="../status/status.html" style="color:var(--text-secondary);text-decoration:none;font-size:0.9rem;white-space:nowrap">Status</a>
                
                <!-- Install Button -->
                <button id="install-btn" style="display:none;padding:6px 12px;background:var(--accent-purple);color:#fff;border:none;border-radius:6px;font-weight:600;font-size:0.85rem;cursor:pointer;white-space:nowrap;margin-right:4px">
                    Install
                </button>

                <!-- App Button -->
                <a href="../../chat/" style="padding:6px 16px;background:var(--accent-cyan);color:#000;border-radius:6px;text-decoration:none;font-weight:600;font-size:0.9rem;white-space:nowrap">App</a>
            </div>
        </div>
    </nav>
'@

# Get all HTML files in subdomains
$files = Get-ChildItem -Path "subdomains" -Recurse -Filter "*.html"

foreach ($file in $files) {
    if ($file.Name -eq "navbar-component.html") { continue }
    
    $content = Get-Content $file.FullName -Raw
    
    # Remove existing navbar if present (regex to match <nav>...</nav>)
    $content = $content -replace '(?s)<!-- Navigation Bar -->.*?<\/nav>', ''
    $content = $content -replace '(?s)<nav.*?<\/nav>', ''
    
    # Insert new navbar after <body>
    if ($content -match '<body[^>]*>') {
        $content = $content -replace '(<body[^>]*>)', "`$1`n$navbarContent"
        Set-Content -Path $file.FullName -Value $content
        Write-Host "Updated $($file.Name)"
    }
    else {
        Write-Host "Skipped $($file.Name) (no body tag)"
    }
}

