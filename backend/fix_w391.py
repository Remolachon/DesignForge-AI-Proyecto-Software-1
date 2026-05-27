import os
import glob

for fpath in glob.glob('app/**/*.py', recursive=True):
    with open(fpath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if content:
        new_content = content.rstrip() + '\n'
        if content != new_content:
            with open(fpath, 'w', encoding='utf-8', newline='\n') as f:
                f.write(new_content)
