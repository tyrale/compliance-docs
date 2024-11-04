# tools/token-analysis.py

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
        """Parse the token savings log file and organize by date."""
        daily_data = defaultdict(lambda: {
            'files': set(),
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
                    
                # Extract data using regex
                timestamp = re.search(r'\[(.*?)\]', entry).group(1)
                file_path = re.search(r'\] (.*?)\n', entry).group(1)
                original = int(re.search(r'Original file tokens: (\d+)', entry).group(1))
                summary = int(re.search(r'Summary tokens: (\d+)', entry).group(1))
                
                date = datetime.strptime(timestamp, "%Y-%m-%d %H:%M:%S").date()
                
                # Aggregate by date
                daily_data[date]['files'].add(file_path)
                daily_data[date]['total_original'] += original
                daily_data[date]['total_summary'] += summary
                daily_data[date]['interactions'] += 1
                
        except FileNotFoundError:
            print("No log file found.")
            
        return daily_data
        
    def calculate_daily_savings(self, average_reads_per_file=5):
        """Calculate savings for each day."""
        daily_stats = {}
        
        for date, data in self.data.items():
            # Traditional approach (reading full file each time)
            traditional_cost = data['total_original'] * average_reads_per_file * len(data['files'])
            
            # With summaries approach
            # First read: original + summary
            # Subsequent reads: just summary
            summary_cost = (data['total_original'] + 
                          (data['total_summary'] * (average_reads_per_file - 1))) * len(data['files'])
            
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
                'cost_savings': cost_savings
            }
            
        return daily_stats
    
    def project_monthly_savings(self, daily_stats):
        """Project monthly savings based on current usage patterns."""
        if not daily_stats:
            return None
            
        # Calculate averages
        total_days = len(daily_stats)
        avg_daily_savings = sum(day['tokens_saved'] for day in daily_stats.values()) / total_days
        avg_daily_cost_savings = sum(day['cost_savings'] for day in daily_stats.values()) / total_days
        avg_files_per_day = sum(day['files_processed'] for day in daily_stats.values()) / total_days
        
        monthly_projection = {
            'working_days': 22,  # Typical working days in a month
            'projected_files': avg_files_per_day * 22,
            'projected_token_savings': avg_daily_savings * 22,
            'projected_cost_savings': avg_daily_cost_savings * 22,
            'avg_files_per_day': avg_files_per_day,
            'avg_daily_token_savings': avg_daily_savings,
            'avg_daily_cost_savings': avg_daily_cost_savings
        }
        
        return monthly_projection
    
    def generate_daily_report(self):
        """Generate a comprehensive daily savings report."""
        daily_stats = self.calculate_daily_savings()
        monthly_projection = self.project_monthly_savings(daily_stats)
        
        report = """
Daily Token Usage Analysis Report
===============================
"""
        # Daily breakdown
        for date, stats in sorted(daily_stats.items()):
            report += f"\nDate: {date}"
            report += f"\n- Files Processed: {stats['files_processed']}"
            report += f"\n- Total Interactions: {stats['interactions']}"
            report += f"\n- Traditional Approach Tokens: {stats['traditional_tokens']:,}"
            report += f"\n- With Summaries Tokens: {stats['summary_tokens']:,}"
            report += f"\n- Tokens Saved: {stats['tokens_saved']:,}"
            report += f"\n- Savings Percentage: {stats['savings_percentage']:.1f}%"
            report += f"\n- Cost Savings: ${stats['cost_savings']:.2f}"
            report += "\n" + "-" * 50
            
        if monthly_projection:
            report += f"""
\nMonthly Projections (Based on Current Usage)
=========================================
Average Daily Stats:
- Files Processed: {monthly_projection['avg_files_per_day']:.1f}
- Token Savings: {monthly_projection['avg_daily_token_savings']:,.0f}
- Cost Savings: ${monthly_projection['avg_daily_cost_savings']:.2f}

Monthly Projections (22 working days):
- Total Files: {monthly_projection['projected_files']:,.0f}
- Total Token Savings: {monthly_projection['projected_token_savings']:,.0f}
- Total Cost Savings: ${monthly_projection['projected_cost_savings']:.2f}
"""
        
        return report

def main():
    analyzer = TokenAnalyzer()
    print(analyzer.generate_daily_report())

if __name__ == '__main__':
    main()