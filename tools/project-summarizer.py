# First part of your file up to the TokenAnalyzer class (lines 1-341)
import os
import ast
from pathlib import Path
import logging
from anthropic import Anthropic
import json
import re
from datetime import datetime
import tiktoken

MIN_FILE_SIZE = 1024  # 1KB minimum

class TokenTracker:
    def __init__(self):
        self.encoder = tiktoken.get_encoding("cl100k_base")
        self.log_file = "token_savings.log"  # Updated to correct filename
        
    def count_tokens(self, text):
        """Count tokens in a piece of text"""
        return len(self.encoder.encode(text))
    
    def log_summary(self, file_path, original_tokens, summary_tokens):
        """Log token counts and savings"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        log_entry = (
            f"\n[{timestamp}] {file_path}\n"
            f"Original file tokens: {original_tokens}\n"
            f"Summary tokens: {summary_tokens}\n"
            f"Savings per read: {original_tokens - summary_tokens}\n"
            f"Break-even after {original_tokens/(original_tokens - summary_tokens):.1f} reads\n"
            f"{'-' * 50}"
        )
        
        # Always append to the log file
        with open(self.log_file, 'a') as f:
            f.write(log_entry + '\n')
        
        print(f"Token analysis appended to {self.log_file}")
    
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
        
class CodeSummaryGenerator:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        
    def should_summarize(self, file_path):
        """Check if file meets criteria for summarization."""
        file_size = os.path.getsize(file_path)
        if file_size < MIN_FILE_SIZE:
            print(f"Skipping {file_path} (size: {file_size} bytes) - below threshold")
            return False
        return True

    def find_critical_details(self, content):
        """Find critical operational details in code."""
        # Find ports
        port_patterns = [
            r'port\s*=\s*(\d+)',
            r'PORT\s*=\s*(\d+)',
            r'\.listen\(\s*(\d+)',
            r'port:\s*(\d+)',
        ]
        ports = []
        for pattern in port_patterns:
            matches = re.findall(pattern, content)
            ports.extend(matches)

        # Find environment variables
        env_patterns = [
            r'process\.env\.(\w+)',
            r'os\.environ\.get\([\'"](\w+)[\'"]\)',
            r'os\.getenv\([\'"](\w+)[\'"]\)',
            r'ENV\[[\'"](\w+)[\'"]\]'
        ]
        env_vars = []
        for pattern in env_patterns:
            matches = re.findall(pattern, content)
            env_vars.extend(matches)

        # Find API endpoints
        endpoint_patterns = [
            r'@app\.route\([\'"]([^\'"]+)[\'"]\)',
            r'app\.(get|post|put|delete)\([\'"]([^\'"]+)[\'"]\)',
            r'router\.(get|post|put|delete)\([\'"]([^\'"]+)[\'"]\)',
            r'endpoint:\s*[\'"]([^\'"]+)[\'"]'
        ]
        endpoints = []
        for pattern in endpoint_patterns:
            matches = re.findall(pattern, content)
            endpoints.extend(m[1] if isinstance(m, tuple) else m for m in matches)

        return {
            'ports': list(set(ports)),
            'env_vars': list(set(env_vars)),
            'endpoints': list(set(endpoints))
        }

    def analyze_file(self, file_path):
        """Analyzes file based on its type."""
        ext = Path(file_path).suffix.lower()
        
        # Read content first for critical details
        with open(file_path, 'r') as file:
            content = file.read()
            
        # Get critical details regardless of file type
        critical_details = self.find_critical_details(content)
        
        # Get type-specific analysis
        if ext == '.py':
            analysis = self.analyze_python_file(content)
        elif ext in ['.js', '.jsx', '.ts', '.tsx']:
            analysis = self.analyze_js_file(content)
        elif ext in ['.json']:
            analysis = self.analyze_json_file(content)
        elif ext in ['.md', '.markdown']:
            analysis = self.analyze_markdown_file(content)
        else:
            analysis = self.analyze_generic_file(content, file_path)  # Pass file_path here
                
        # Add critical details to analysis
        analysis['critical_details'] = critical_details
        return analysis

    def analyze_python_file(self, content):
        """Analyzes Python files."""
        code_lines = len([line for line in content.splitlines() 
                         if line.strip() and not line.strip().startswith('#')])
                         
        tree = ast.parse(content)
        functions = []
        classes = []
        
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef):
                functions.append({
                    'name': node.name,
                    'docstring': ast.get_docstring(node) or '',
                    'lines': len(node.body)
                })
            elif isinstance(node, ast.ClassDef):
                classes.append({
                    'name': node.name,
                    'docstring': ast.get_docstring(node) or '',
                    'lines': len(node.body)
                })
                
        return {
            'type': 'python',
            'total_lines': code_lines,
            'functions': functions,
            'classes': classes
        }

    def analyze_js_file(self, content):
        """Analyzes JavaScript/TypeScript files."""
        lines = content.splitlines()
        code_lines = len([line for line in lines 
                         if line.strip() and not line.strip().startswith('//')])
        
        # Basic function detection
        functions = []
        for line in lines:
            if 'function' in line or '=>' in line:
                functions.append(line.strip())
                
        return {
            'type': 'javascript',
            'total_lines': code_lines,
            'functions': functions
        }

    def analyze_json_file(self, content):
        """Analyzes JSON files."""
        json_content = json.loads(content)
        return {
            'type': 'json',
            'structure': type(json_content).__name__,
            'top_level_keys': list(json_content.keys()) if isinstance(json_content, dict) else None,
            'length': len(json_content) if isinstance(json_content, (dict, list)) else None
        }

    def analyze_markdown_file(self, content):
        """Analyzes Markdown files."""
        lines = content.splitlines()
        headers = []
        for line in lines:
            if line.strip().startswith('#'):
                headers.append(line.strip())
                
        return {
            'type': 'markdown',
            'total_lines': len(lines),
            'headers': headers
        }

    def analyze_generic_file(self, content, file_path):
        """Analyzes any other file type."""
        lines = content.splitlines()
        return {
            'type': 'generic',
            'total_lines': len(lines),
            'extension': Path(file_path).suffix
        }

    def generate_summary(self, file_path):
        """Generates a summary using Claude with token tracking."""
        tracker = TokenTracker()
        
        # Read and analyze file
        with open(file_path, 'r') as f:
            original_content = f.read()
        
        # Count tokens in original file
        original_tokens = tracker.count_tokens(original_content)
        
        analysis = self.analyze_file(file_path)
        file_size = os.path.getsize(file_path)
        file_size_kb = file_size / 1024
        
        prompt = f"""Create a concise summary for {file_path}:
        
        File Stats:
        - Type: {analysis.get('type', 'unknown')}
        - Size: {file_size_kb:.1f}KB
        - Lines: {analysis.get('total_lines', 'N/A')}
        
        Analysis: {json.dumps(analysis, indent=2)}
        
        Format as:
        # Summary
        type: {analysis.get('type', 'unknown')}
        size: {file_size_kb:.1f}KB
        purpose: (brief purpose)
        
        ## Structure
        (key components and their purpose)
        
        ## Critical Details
        - Ports: {', '.join(analysis.get('critical_details', {}).get('ports', []) or ['none found'])}
        - Environment Variables: {', '.join(analysis.get('critical_details', {}).get('env_vars', []) or ['none found'])}
        - API Endpoints: {', '.join(analysis.get('critical_details', {}).get('endpoints', []) or ['none found'])}
        
        ## Important Notes
        (any critical information for developers)
        """
        
        response = self.client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        summary = response.content[0].text
        
        # Count tokens in summary
        summary_tokens = tracker.count_tokens(summary)
        
        # Log the token analysis
        tracker.log_summary(file_path, original_tokens, summary_tokens)
        
        return summary

def update_summary(file_path):
    """Updates or creates summary for a single file if it meets size criteria."""
    generator = CodeSummaryGenerator()
    
    if not generator.should_summarize(file_path):
        return
        
    summary = generator.generate_summary(file_path)
    summary_path = f"{file_path}.summary"
    
    with open(summary_path, 'w') as f:
        f.write(summary)
    print(f"Updated summary for {file_path} ({os.path.getsize(file_path)/1024:.1f}KB)")

if __name__ == '__main__':
    import sys
    if len(sys.argv) > 1:
        update_summary(sys.argv[1])