# tools/analyze_token_savings.py

import re
from datetime import datetime, timedelta
import matplotlib.pyplot as plt
from collections import defaultdict
import json

class TokenAnalyzer:
    def __init__(self, log_file="token_savings.log"):
        self.log_file = log_file
        self.data = self.parse_log_file()
        
    def parse_log_file(self):
        """Parse the token savings log file."""
        data = defaultdict(list)
        try:
            with open(self.log_file, 'r') as f:
                content = f.read()
                entries = content.split('-' * 50)
                
            for entry in entries:
                if not entry.strip():
                    continue
                    
                # Extract data using regex
                timestamp = re.search(r'\[(.*?)\]', entry).group(1)
                file_path = re.search(r'\] (.*?)\n', entry).group(1)
                original = int(re.search(r'Original file tokens: (\d+)', entry).group(1))
                summary = int(re.search(r'Summary tokens: (\d+)', entry).group(1))
                
                date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").date()
                
                data[file_path].append({
                    'date': date,
                    'original': original,
                    'summary': summary,
                    'savings': original - summary
                })
                
        except FileNotFoundError:
            print("No log file found.")
            
        return data
        
    def calculate_cumulative_savings(self, reads_per_file=5):
        """Calculate cumulative token savings over time."""
        total_original = 0
        total_with_summaries = 0
        files_analyzed = len(self.data)
        
        for file_path, entries in self.data.items():
            # Use the latest entry for each file
            latest = entries[-1]
            
            # Traditional approach (reading full file each time)
            total_original += latest['original'] * reads_per_file
            
            # With summaries approach
            # First read: original + summary
            # Subsequent reads: just summary
            total_with_summaries += latest['original'] + (latest['summary'] * (reads_per_file - 1))
        
        savings = total_original - total_with_summaries
        savings_percentage = (savings / total_original * 100) if total_original > 0 else 0
        cost_savings = savings * 15 / 1_000_000  # $15 per million tokens
        
        return {
            'files_analyzed': files_analyzed,
            'total_original_tokens': total_original,
            'total_with_summaries': total_with_summaries,
            'total_tokens_saved': savings,
            'savings_percentage': savings_percentage,
            'estimated_cost_savings': cost_savings,
            'reads_per_file': reads_per_file
        }
    
    def generate_report(self, reads_per_file=5):
        """Generate a comprehensive savings report."""
        stats = self.calculate_cumulative_savings(reads_per_file)
        
        report = f"""
Token Usage Analysis Report
==========================
Files Analyzed: {stats['files_analyzed']}
Assumed Reads Per File: {stats['reads_per_file']}

Traditional Approach (No Summaries):
- Total Tokens: {stats['total_original_tokens']:,}
- Estimated Cost: ${(stats['total_original_tokens'] * 15 / 1_000_000):.2f}

With Summaries Approach:
- Total Tokens: {stats['total_with_summaries']:,}
- Estimated Cost: ${(stats['total_with_summaries'] * 15 / 1_000_000):.2f}

Savings Analysis:
- Tokens Saved: {stats['total_tokens_saved']:,}
- Savings Percentage: {stats['savings_percentage']:.1f}%
- Estimated Cost Savings: ${stats['estimated_cost_savings']:.2f}

File Details:
"""
        
        # Add details for each file
        for file_path, entries in self.data.items():
            latest = entries[-1]
            savings_per_read = latest['original'] - latest['summary']
            break_even_reads = latest['original'] / savings_per_read if savings_per_read > 0 else 0
            
            report += f"\n{file_path}:"
            report += f"\n- Original Size: {latest['original']:,} tokens"
            report += f"\n- Summary Size: {latest['summary']:,} tokens"
            report += f"\n- Savings Per Read: {savings_per_read:,} tokens"
            report += f"\n- Breaks Even After: {break_even_reads:.1f} reads\n"
        
        return report

def main():
    analyzer = TokenAnalyzer()
    
    # Generate report with different read scenarios
    for reads in [3, 5, 10]:
        print(f"\nScenario: {reads} reads per file")
        print(analyzer.generate_report(reads))

if __name__ == '__main__':
    main()
