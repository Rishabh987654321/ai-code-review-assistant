"""
Service layer for GitHub API interactions.
Separates business logic from views.
"""
import requests
from django.conf import settings


def get_github_repos(access_token):
    """
    Fetch user's GitHub repositories.
    
    Args:
        access_token: GitHub OAuth access token
        
    Returns:
        list: List of repository dictionaries
    """
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    try:
        response = requests.get(
            "https://api.github.com/user/repos",
            headers=headers,
            params={"per_page": 100, "sort": "updated"},
            timeout=10
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch GitHub repos: {str(e)}")


def get_github_repo_contents(access_token, owner, repo, path=""):
    """
    Fetch contents of a GitHub repository.
    
    Args:
        access_token: GitHub OAuth access token
        owner: Repository owner username
        repo: Repository name
        path: Path within repository (empty for root)
        
    Returns:
        list: List of file/directory dictionaries
    """
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch repo contents: {str(e)}")


def get_github_file_content(access_token, owner, repo, path):
    """
    Fetch content of a specific file from GitHub.
    
    Args:
        access_token: GitHub OAuth access token
        owner: Repository owner username
        repo: Repository name
        path: Path to file
        
    Returns:
        str: File content (decoded from base64)
    """
    import base64
    
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"
    
    try:
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        data = response.json()
        
        if data.get("type") != "file":
            raise ValueError("Path is not a file")
        
        # Decode base64 content
        content = base64.b64decode(data["content"]).decode("utf-8")
        return content
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch file content: {str(e)}")


def should_ignore_path(path):
    """
    Check if a path should be ignored based on common patterns.
    
    Args:
        path: File or directory path
        
    Returns:
        bool: True if path should be ignored
    """
    ignore_patterns = [
        'node_modules',
        '.git',
        'dist',
        'build',
        'bin',
        '__pycache__',
        '.pytest_cache',
        '.venv',
        'venv',
        'env',
        '.env',
        'target',
        'out',
        '.idea',
        '.vscode',
        '.DS_Store',
        '*.pyc',
        '*.pyo',
        '*.pyd',
        '*.so',
        '*.dll',
        '*.exe',
        '*.dylib',
        '*.class',
        '*.jar',
        '*.war',
        '*.ear',
        '*.zip',
        '*.tar',
        '*.gz',
        '*.rar',
        '*.7z',
    ]
    
    path_lower = path.lower()
    path_parts = path.split('/')
    
    for pattern in ignore_patterns:
        # Check if pattern matches any part of the path
        if pattern in path_parts or path_lower.endswith(pattern):
            return True
        # Check for wildcard patterns
        if '*' in pattern:
            import fnmatch
            if fnmatch.fnmatch(path_lower, pattern):
                return True
    
    return False


def get_github_file_tree(access_token, owner, repo, branch="main", path=""):
    """
    Recursively fetch file tree from GitHub repository.
    Ignores common build artifacts and dependencies.
    
    Args:
        access_token: GitHub OAuth access token
        owner: Repository owner username
        repo: Repository name
        branch: Branch name (default: main)
        path: Starting path (empty for root)
        
    Returns:
        list: List of file/directory dictionaries with tree structure
    """
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.v3+json",
    }
    
    def fetch_directory(dir_path=""):
        """Recursively fetch directory contents."""
        url = f"https://api.github.com/repos/{owner}/{repo}/contents/{dir_path}"
        params = {"ref": branch}
        
        try:
            response = requests.get(url, headers=headers, params=params, timeout=10)
            response.raise_for_status()
            contents = response.json()
            
            # Handle single file response (not a list)
            if not isinstance(contents, list):
                contents = [contents]
            
            directory_tree = []
            
            for item in contents:
                item_path = item.get("path", "")
                
                # Skip ignored paths
                if should_ignore_path(item_path):
                    continue
                
                file_info = {
                    "name": item.get("name"),
                    "path": item_path,
                    "type": item.get("type"),  # "file" or "dir"
                    "size": item.get("size", 0),
                    "sha": item.get("sha"),
                    "url": item.get("url"),
                    "html_url": item.get("html_url"),
                }
                
                # Recursively fetch subdirectories
                if item.get("type") == "dir":
                    file_info["children"] = fetch_directory(item_path)
                
                directory_tree.append(file_info)
            
            return directory_tree
        
        except requests.RequestException as e:
            # Log error but continue (some directories might not be accessible)
            import logging
            logger = logging.getLogger(__name__)
            logger.warning(f"Failed to fetch {dir_path}: {str(e)}")
            return []
    
    return fetch_directory(path)


def get_github_diff(access_token, owner, repo, base, head):
    """
    Get diff between two commits/branches.
    
    Args:
        access_token: GitHub OAuth access token
        owner: Repository owner username
        repo: Repository name
        base: Base branch/commit SHA
        head: Head branch/commit SHA
        
    Returns:
        dict: Diff information with files changed
    """
    headers = {
        "Authorization": f"token {access_token}",
        "Accept": "application/vnd.github.v3.diff",
    }
    
    url = f"https://api.github.com/repos/{owner}/{repo}/compare/{base}...{head}"
    
    try:
        # Get comparison metadata
        response = requests.get(
            url.replace("/compare/", "/compare/").replace(".diff", ""),
            headers={
                "Authorization": f"token {access_token}",
                "Accept": "application/vnd.github.v3+json",
            },
            timeout=10
        )
        response.raise_for_status()
        comparison = response.json()
        
        # Get actual diff
        diff_response = requests.get(f"{url}.diff", headers=headers, timeout=30)
        diff_response.raise_for_status()
        diff_text = diff_response.text
        
        # Parse diff to extract file changes
        files_changed = []
        current_file = None
        
        for line in diff_text.split('\n'):
            if line.startswith('diff --git'):
                # New file in diff
                if current_file:
                    files_changed.append(current_file)
                current_file = {
                    "path": None,
                    "old_path": None,
                    "status": None,  # added, removed, modified, renamed
                    "additions": 0,
                    "deletions": 0,
                    "changes": 0,
                    "patch": []
                }
            elif line.startswith('---') and current_file:
                # Old file path
                old_path = line[4:].strip()
                if old_path != '/dev/null':
                    current_file["old_path"] = old_path.split('\t')[0]
            elif line.startswith('+++') and current_file:
                # New file path
                new_path = line[4:].strip()
                if new_path != '/dev/null':
                    current_file["path"] = new_path.split('\t')[0]
            elif line.startswith('@@') and current_file:
                # Hunk header - count additions/deletions
                current_file["patch"].append(line)
            elif current_file and line.startswith('+') and not line.startswith('+++'):
                current_file["additions"] += 1
                current_file["changes"] += 1
            elif current_file and line.startswith('-') and not line.startswith('---'):
                current_file["deletions"] += 1
                current_file["changes"] += 1
        
        if current_file:
            files_changed.append(current_file)
        
        # Determine file status from comparison data
        for file_info in files_changed:
            # Match with comparison files
            for comp_file in comparison.get("files", []):
                if comp_file.get("filename") == file_info.get("path"):
                    file_info["status"] = comp_file.get("status")
                    file_info["additions"] = comp_file.get("additions", 0)
                    file_info["deletions"] = comp_file.get("deletions", 0)
                    file_info["changes"] = comp_file.get("changes", 0)
                    break
        
        return {
            "base": base,
            "head": head,
            "ahead_by": comparison.get("ahead_by", 0),
            "behind_by": comparison.get("behind_by", 0),
            "total_commits": comparison.get("total_commits", 0),
            "files_changed": files_changed,
            "diff_text": diff_text,  # Full diff for reference
        }
        
    except requests.RequestException as e:
        raise Exception(f"Failed to fetch diff: {str(e)}")

