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

