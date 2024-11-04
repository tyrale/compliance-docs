import re
from datetime import datetime, timedelta
from collections import defaultdict

class TokenAnalyzer:
    def __init__(self, log_file="token_savings.log"):  # Updated filename
        self.log_file = log_file
        self.data = self.parse_log_file()
        
    def parse_log_file(self):
        """Parse the token savings log file and organize by date."""
        daily_data = defaultdict(lambda: {
            'files': set(),
            'entries': [],
            'total_original': 0,
            'total_summary': 0,
            'interactions': 0
        })
        
        try:
            with open(self.log_file, 'r') as f:
                content = f.read()
                entries = content.split('-' * 50)
                
            for entry in entries:
                if not entry.strip():
                    continue
                
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
                    
                    # Store full entry details
                    daily_data[date]['entries'].append({
                        'time': datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").time(),
                        'file': file_path,
                        'original': original,
                        'summary': summary,
                        'savings': original - summary
                    })
                    
                    daily_data[date]['files'].add(file_path)
                    daily_data[date]['total_original'] += original
                    daily_data[date]['total_summary'] += summary
                    daily_data[date]['interactions'] += 1
                
        except FileNotFoundError:
            print("No log file found.")
            
        return daily_data
    
    def generate_daily_report(self):
        """Generate a comprehensive daily savings report."""
        report = """
Token Usage Analysis Report
==========================
"""
        # Process each day
        for date, data in sorted(self.data.items()):
            report += f"\n{date:%Y-%m-%d} Summary:"
            report += f"\n{'='*50}"
            report += f"\nTotal Files Processed: {len(data['files'])}"
            report += f"\nTotal Interactions: {data['interactions']}"
            report += f"\nTotal Original Tokens: {data['total_original']:,}"
            report += f"\nTotal Summary Tokens: {data['total_summary']:,}"
            
            # Calculate savings
            daily_savings = data['total_original'] - data['total_summary']
            savings_percentage = (daily_savings / data['total_original'] * 100) if data['total_original'] > 0 else 0
            cost_savings = daily_savings * 15 / 1_000_000  # $15 per million tokens
            
            report += f"\nTotal Token Savings: {daily_savings:,}"
            report += f"\nSavings Percentage: {savings_percentage:.1f}%"
            report += f"\nEstimated Cost Savings: ${cost_savings:.2f}"
            
            # Detailed breakdown
            report += "\n\nDetailed Breakdown:"
            report += "\n-----------------"
            for entry in sorted(data['entries'], key=lambda x: x['time']):
                report += f"\n{entry['time']:%H:%M:%S} - {entry['file']}"
                report += f"\n  Original: {entry['original']:,} tokens"
                report += f"\n  Summary: {entry['summary']:,} tokens"
                report += f"\n  Savings: {entry['savings']:,} tokens"
                report += f"\n"
            
            report += f"\n{'='*50}\n"
            
        # Add total statistics
        total_original = sum(data['total_original'] for data in self.data.values())
        total_summary = sum(data['total_summary'] for data in self.data.values())
        total_savings = total_original - total_summary
        total_cost_savings = total_savings * 15 / 1_000_000
        
        report += f"\nOverall Statistics:"
        report += f"\n{'='*50}"
        report += f"\nTotal Days: {len(self.data)}"
        report += f"\nTotal Original Tokens: {total_original:,}"
        report += f"\nTotal Summary Tokens: {total_summary:,}"
        report += f"\nTotal Token Savings: {total_savings:,}"
        report += f"\nTotal Cost Savings: ${total_cost_savings:.2f}"
        
        return report

def main():
    analyzer = TokenAnalyzer()
    print(analyzer.generate_daily_report())

if __name__ == '__main__':
    main()