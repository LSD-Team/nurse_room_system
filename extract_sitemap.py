import os
import sys

sitemap_path = r'E:\GitHub_Repo\nurse_room_system\PRD\sitemap.txt'
log_path = r'E:\GitHub_Repo\nurse_room_system\sitemap_output.log'

try:
    if os.path.exists(sitemap_path):
        # Try different encodings
        for encoding in ['utf-8-sig', 'utf-8', 'cp1252', 'utf-16']:
            try:
                with open(sitemap_path, 'r', encoding=encoding) as f:
                    content = f.read()
                
                # Write to log
                with open(log_path, 'w', encoding='utf-8') as log:
                    log.write(f"Successfully read with encoding: {encoding}\n")
                    log.write("=" * 80 + "\n")
                    log.write(content)
                
                print(f"Success! Written to {log_path}")
                sys.exit(0)
            except Exception as e:
                continue
        
        # If all encodings fail
        with open(log_path, 'w', encoding='utf-8') as log:
            log.write("Failed to read file with any encoding\n")
    else:
        with open(log_path, 'w', encoding='utf-8') as log:
            log.write(f"File not found: {sitemap_path}\n")
except Exception as e:
    with open(log_path, 'w', encoding='utf-8') as log:
        log.write(f"Error: {str(e)}\n")
