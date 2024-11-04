# tools/show_token_savings.py

import re
from datetime import datetime, timedelta

def analyze_savings(days=30):
    """Analyze token savings over the specified number of days"""
    cutoff_date = datetime.now() - timedelta(days=days)
    total_original = 0
    total_summary = 0
    files_analyzed = set()
    
    with open("token_savings.log", 'r') as f:
        content = f.read()
        
    # Parse log entries
    entries = content.split('-' * 50)
    for entry in entries:
        if not entry.strip():
            continue
            
        # Parse date from entry
        date_match = re.search(r'\[(.*?)\]', entry)
        if date_match:
            entry_date = datetime.strptime(date_match.group(1), "%Y-%m-%d %H:%M:%S")
            if entry_date >= cutoff_date:
                # Parse token counts
                original = int(re.search(r'Original file tokens: (\d+)', entry).group(1))
                summary = int(re.search(r'Summary tokens: (\d+)', entry).group(1))
                file = re.search(r'\] (.*?)\n', entry).group(1)
                
                total_original += original
                total_summary += summary
                files_analyzed.add(file)
    
    # Calculate savings assuming each file is read 5 times
    reads_per_file = 5
    potential_savings = (total_original - total_summary) * reads_per_file
    cost_savings = potential_savings * 15 / 1_000_000  # $15 per million tokens
    
    print(f"\nToken Savings Analysis (Last {days} days)")
    print(f"Files analyzed: {len(files_analyzed)}")
    print(f"Total original tokens: {total_original:,}")
    print(f"Total summary tokens: {total_summary:,}")
    print(f"\nAssuming each file is read {reads_per_file} times:")
    print(f"Potential token savings: {potential_savings:,}")
    print(f"Estimated cost savings: ${cost_savings:.2f}")

if __name__ == '__main__':
    analyze_savings()
