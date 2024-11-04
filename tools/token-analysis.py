# tools/token-analysis.py

import re
from datetime import datetime, timedelta
from collections import defaultdict

class TokenAnalyzer:
    def __init__(self, log_file="token_savings.log"):
        self.log_file = log_file
        self.data = self.parse_log_file()
        
    def parse_log_file(self):
        """Parse the token savings log file and organize by date."""
        daily_data = defaultdict(lambda: {
            'files': set(),
            'total_original': 0,
            'total_summary': 0,
            'interactions': 0,
            'file_details': []  # Add this to store details for debugging
        })
        
        try:
            with open(self.log_file, 'r') as f:
                content = f.read()
                entries = content.split('-' * 50)
                
            for entry in entries:
                if not entry.strip():
                    continue
                    
                # Print raw entry for debugging
                print(f"\nProcessing entry:\n{entry}")
                
                # Extract data using regex
                timestamp_match = re.search(r'\[(.*?)\]', entry)
                file_match = re.search(r'\] (.*?)\n', entry)
                original_match = re.search(r'Original file tokens: (\d+)', entry)
                summary_match = re.search(r'Summary tokens: (\d+)', entry)
                
                if all([timestamp_match, file_match, original_match, summary_match]):
                    timestamp = timestamp_match.group(1)
                    file_path = file_match.group(1)
                    original = int(original_match.group(1))
                    summary = int(summary_match.group(1))
                    
                    date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").date()
                    
                    # Print parsed data for debugging
                    print(f"\nParsed data:")
                    print(f"Date: {date}")
                    print(f"File: {file_path}")
                    print(f"Original tokens: {original}")
                    print(f"Summary tokens: {summary}")
                    
                    # Aggregate by date
                    daily_data[date]['files'].add(file_path)
                    daily_data[date]['total_original'] += original
                    daily_data[date]['total_summary'] += summary
                    daily_data[date]['interactions'] += 1
                    daily_data[date]['file_details'].append({
                        'file': file_path,
                        'original': original,
                        'summary': summary
                    })
                else:
                    print(f"Failed to parse entry: {entry}")
                
        except FileNotFoundError:
            print("No log file found.")
        
        # Print final aggregated data for debugging
        print("\nFinal daily data:")
        for date, data in daily_data.items():
            print(f"\nDate: {date}")
            print(f"Files: {len(data['files'])}")
            print(f"Files list: {data['files']}")
            print(f"Total original: {data['total_original']}")
            print(f"Total summary: {data['total_summary']}")
            
        return daily_data
        
    def calculate_daily_savings(self, average_reads_per_file=5):
        """Calculate savings for each day."""
        daily_stats = {}
        
        for date, data in self.data.items():
            # Traditional approach (reading full file each time)
            traditional_cost = data['total_original'] * average_reads_per_file
            
            # With summaries approach
            summary_cost = (data['total_original'] + 
                          (data['total_summary'] * (average_reads_per_file - 1)))
            
            savings = traditional_cost - summary_cost
            savings_percentage = (savings / traditional_cost * 100) if traditional_cost > 0 else 0
            cost_savings = savings * 15 / 1_000_000  # $15 per million tokens
            
            daily_stats[date] = {
                'files_processed': len(data['files']),
                'interactions': data['interactions'],
                'traditional_tokens': traditional_cost,
                'summary_tokens': summary_cost,
                'tokens_saved': savings,
                'savings_percentage': savings_percentage,
                'cost_savings': cost_savings,
                'file_list': list(data['files'])  # Add file list for verification
            }
            
        return daily_stats
    
    def generate_daily_report(self):
        """Generate a comprehensive daily savings report."""
        daily_stats = self.calculate_daily_savings()
        
        report = """
Daily Token Usage Analysis Report
===============================
"""
        # Daily breakdown
        for date, stats in sorted(daily_stats.items()):
            report += f"\nDate: {date}"
            report += f"\n- Files Processed: {stats['files_processed']}"
            report += f"\n- Files List: {', '.join(stats['file_list'])}"  # Add file list
            report += f"\n- Total Interactions: {stats['interactions']}"
            report += f"\n- Traditional Approach Tokens: {stats['traditional_tokens']:,}"
            report += f"\n- With Summaries Tokens: {stats['summary_tokens']:,}"
            report += f"\n- Tokens Saved: {stats['tokens_saved']:,}"
            report += f"\n- Savings Percentage: {stats['savings_percentage']:.1f}%"
            report += f"\n- Cost Savings: ${stats['cost_savings']:.2f}"
            report += "\n" + "-" * 50
            
        return report

def main():
    analyzer = TokenAnalyzer()
    print(analyzer.generate_daily_report())

if __name__ == '__main__':
    main()