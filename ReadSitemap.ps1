$sitemapPath = 'E:\GitHub_Repo\nurse_room_system\PRD\sitemap.txt'

try {
    $content = Get-Content $sitemapPath -Raw -ErrorAction Stop
    
    # Write to output file
    $content | Out-File 'E:\GitHub_Repo\nurse_room_system\sitemap_content.txt' -Encoding UTF8
    
    # Also output in console
    Write-Host "File size: $($content.Length) characters"
    Write-Host "Content:"
    Write-Host $content
} catch {
    "Error: $_" | Out-File 'E:\GitHub_Repo\nurse_room_system\sitemap_error.txt'
}
