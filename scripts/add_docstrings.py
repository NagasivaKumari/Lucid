"""
Module: add_docstrings.py
Description: Implementation of add_docstrings.py for Lucid project.
"""

import os
import subprocess

def run_git(args):
    subprocess.run(["git"] + args, check=True)

def has_docstring(content):
    return '"""' in content[:100] or "'''" in content[:100]

def add_docstring(filepath):
    with open(filepath, 'r') as f:
        content = f.read()
    
    if has_docstring(content):
        return False
        
    filename = os.path.basename(filepath)
    docstring = f'"""\nModule: {filename}\nDescription: Implementation of {filename} for Lucid project.\n"""\n\n'
    
    with open(filepath, 'w') as f:
        f.write(docstring + content)
    return True

target_dirs = ["contracts", "backend", "scripts"]
for d in target_dirs:
    for root, _, files in os.walk(d):
        for file in files:
            if file.endswith(".py"):
                path = os.path.join(root, file)
                if add_docstring(path):
                    run_git(["add", path])
                    run_git(["commit", "-m", f"Docs: Add docstrings to {file}"])
                    print(f"Committed docstring for {file}")
