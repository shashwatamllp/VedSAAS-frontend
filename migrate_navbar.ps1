# Mass Migration Script - Replace Hardcoded Navbar with Dynamic Placeholder

$files = Get-ChildItem -Path "." -Recurse -Filter "*.html"

foreach ($file in $files) {
    # Skip the component template itself
    if ($file.FullName -like "*components\navbar.html*") { continue }
    
    $content = Get-Content $file.FullName -Raw
    
    # 1. Regex to remove ANY existing <nav>...</nav> block (including potentially multiline)
    # The regex '(?s)<nav.*?>.*?</nav>' matches <nav ...> ... </nav> spanning newlines
    if ($content -match '(?s)<nav.*?>.*?</nav>') {
        $content = $content -replace '(?s)<nav.*?>.*?</nav>', '<!-- Navbar (Loaded Dynamically) -->
    <div id="navbar-placeholder"></div>'
        Write-Host "Replaced Navbar in $($file.Name)"
    }
    else {
        # If no navbar found, we still might need to inject the placeholder if it's missing
        if (-not ($content -match 'id="navbar-placeholder"')) {
            # Inject at top of body if no navbar existed
            if ($content -match '<body[^>]*>') {
                $content = $content -replace '(<body[^>]*>)', "`$1`n    <!-- Navbar (Loaded Dynamically) -->`n    <div id='navbar-placeholder'></div>"
                Write-Host "Injected Placeholder in $($file.Name)"
            }
        }
    }

    # 2. Inject the Script Loader if missing
    if (-not ($content -match 'src="/public/js/components.js"')) {
        # Try to inject before pwa-init.js (best case)
        if ($content -match '<script src="/pwa-init.js"></script>') {
            $content = $content -replace '(<script src="/pwa-init.js"></script>)', '<!-- Component Loader -->
    <script src="/public/js/components.js"></script>
    $1'
            Write-Host "Injected Script in $($file.Name)"
        }
        elseif ($content -match '</body>') {
            # Fallback: End of body
            $content = $content -replace '(</body>)', '    <!-- Component Loader -->
    <script src="/public/js/components.js"></script>
    $1'
            Write-Host "Injected Script (Fallback) in $($file.Name)"
        }
    }

    Set-Content -Path $file.FullName -Value $content
}
