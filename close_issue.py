import urllib.request
import urllib.error
import json
import os

TOKEN = os.environ.get("GITHUB_TOKEN")
REPO = "JasonIngersoll9000/Debate-me-bro"
ISSUE_NUM = 1

def close_issue(issue_number):
    url = f"https://api.github.com/repos/{REPO}/issues/{issue_number}"
    data = json.dumps({"state": "closed"}).encode('utf-8')
    req = urllib.request.Request(url, data=data, method='PATCH')
    req.add_header('Authorization', f'token {TOKEN}')
    req.add_header('Accept', 'application/vnd.github.v3+json')
    req.add_header('Content-Type', 'application/json')
    
    try:
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                print(f"Closed: Issue #{issue_number}")
            else:
                print(f"Failed to close Issue #{issue_number} (Status {response.status})")
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} for closing issue #{issue_number}")
        error_info = e.read().decode('utf-8')
        print(f"Details: {error_info}")

if __name__ == "__main__":
    if not TOKEN:
        print("ERROR: GITHUB_TOKEN environment variable not set.")
        exit(1)
        
    print(f"Closing issue #{ISSUE_NUM} in repository: {REPO}...")
    close_issue(ISSUE_NUM)
    print("Done!")
