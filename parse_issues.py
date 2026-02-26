import urllib.request
import urllib.error
import json
import re
import os

TOKEN = os.environ.get("GITHUB_TOKEN")
REPO = "JasonIngersoll9000/Debate-me-bro"

def parse_issues(markdown_file_path):
    with open(markdown_file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    issues = []
    parts = re.split(r'## Issue #\d+: ', content)
    
    if len(parts) > 1:
        for part in parts[1:]:
            lines = part.strip().split('\n')
            title = lines[0].strip()
            labels = []
            body_lines = []
            
            for line in lines[1:]:
                if line.startswith('**Labels:**'):
                    raw_labels = line.replace('**Labels:**', '').strip()
                    labels = [l.strip().strip('`') for l in raw_labels.split(',')]
                elif line.startswith('**Milestone:**') or line.startswith('**Assignee:**'):
                    # Skip these for simple issue creation to avoid API errors if they don't exist
                    continue
                else:
                    body_lines.append(line)
            
            body = '\n'.join(body_lines).strip()
            issues.append({"title": title, "body": body, "labels": labels})
    return issues

def create_issue(title, body, labels):
    url = f"https://api.github.com/repos/{REPO}/issues"
    data = json.dumps({"title": title, "body": body, "labels": labels}).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='POST')
    req.add_header('Authorization', f'token {TOKEN}')
    req.add_header('Accept', 'application/vnd.github.v3+json')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 201:
                resp_body = json.loads(response.read().decode('utf-8'))
                print(f"Created: {title} ({resp_body['html_url']})")
            else:
                print(f"Failed: {title} (Status {response.status})")
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} for issue '{title}'")
        error_info = e.read().decode('utf-8')
        print(f"Details: {error_info}")

if __name__ == "__main__":
    if not TOKEN:
        print("ERROR: GITHUB_TOKEN environment variable not set.")
        exit(1)
        
    print(f"Creating issues in repository: {REPO}...")
    issues = parse_issues("Docs/Github_Issues.md")
    for issue in issues:
        create_issue(issue["title"], issue["body"], issue["labels"])
    print("Done!")
