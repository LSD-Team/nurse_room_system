import os

sitemap_path = r'E:\GitHub_Repo\nurse_room_system\PRD\sitemap.txt'

print(f"File exists: {os.path.exists(sitemap_path)}")
print(f"File size: {os.path.getsize(sitemap_path)} bytes")

if os.path.exists(sitemap_path):
    with open(sitemap_path, 'r', encoding='utf-8-sig') as f:
        content = f.read()
        print("=== SITEMAP CONTENT ===")
        print(content)
        
    # Also write to a log file
    with open(r'E:\GitHub_Repo\nurse_room_system\sitemap_log.txt', 'w', encoding='utf-8') as log:
        log.write(content)
        print("\n=== Content saved to sitemap_log.txt ===")
