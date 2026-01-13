import os
import re

# The text to inject
NAVBAR_PLACEHOLDER = """    <!-- Navbar (Loaded Dynamically) -->
    <div id="navbar-placeholder"></div>"""

LOADER_SCRIPT = """    <!-- Component Loader -->
    <script src="/public/js/components.js"></script>
"""

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    original_content = content
    modified = False

    # 1. Remove old Navbar (Regex for <nav> block)
    # detailed pattern to match specific style to avoid removing other navs if any (though unlikely)
    # We look for the comment <!-- Navigation Bar --> if present, or just the nav block
    
    # Pattern 1: Comment + Nav
    pattern_comment_nav = re.compile(r'<!-- Navigation Bar -->\s*<nav.*?>.*?</nav>', re.DOTALL)
    
    # Pattern 2: Just Nav (fallback)
    pattern_nav = re.compile(r'<nav.*?>.*?</nav>', re.DOTALL)

    if pattern_comment_nav.search(content):
        content = pattern_comment_nav.sub(NAVBAR_PLACEHOLDER, content)
        modified = True
        print(f"Replaced Comment+Navbar in {filepath}")
    elif pattern_nav.search(content):
        # Only replace if it looks like the main navbar (has style or class)
        # To be safe, we replace ANY nav if we didn't match the specific one, assuming single page apps here.
        content = pattern_nav.sub(NAVBAR_PLACEHOLDER, content)
        modified = True
        print(f"Replaced Navbar in {filepath}")
    
    # Check if placeholder exists now
    if 'id="navbar-placeholder"' not in content:
        # Injection failed or wasn't needed? 
        # Force inject at top of body
        if '<body' in content:
           content = re.sub(r'(<body[^>]*>)', r'\1\n' + NAVBAR_PLACEHOLDER, content, count=1)
           modified = True
           print(f"Force Injected Placeholder in {filepath}")

    # 2. Inject Script Loader
    if 'src="/public/js/components.js"' not in content:
        if '<script src="/pwa-init.js"></script>' in content:
            content = content.replace('<script src="/pwa-init.js"></script>', LOADER_SCRIPT + '    <script src="/pwa-init.js"></script>')
            modified = True
            print(f"Injected Script before pwa-init in {filepath}")
        elif '</body>' in content:
            content = content.replace('</body>', LOADER_SCRIPT + '</body>')
            modified = True
            print(f"Injected Script at body end in {filepath}")

    if modified and content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Walk through all directories
root_dir = '.'
count = 0
for dirpath, dirnames, filenames in os.walk(root_dir):
    # Skip hidden folders and components folder
    if '.git' in dirpath or 'components' in dirpath:
        continue
        
    for filename in filenames:
        if filename.endswith('.html') and filename != 'navbar.html':
            filepath = os.path.join(dirpath, filename)
            if process_file(filepath):
                count += 1

print(f"Total files updated: {count}")
