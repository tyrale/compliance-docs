# tools/project-summarizer.py added the bit about tracking tokens

import os
import ast
from pathlib import Path
import logging
from anthropic import Anthropic
import json
import re

MIN_FILE_SIZE = 1024  # 1KB minimum

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
            analysis = self.analyze_generic_file(content)
            
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

    def analyze_generic_file(self, content):
        """Analyzes any other file type."""
        lines = content.splitlines()
        return {
            'type': 'generic',
            'total_lines': len(lines),
            'extension': Path(file_path).suffix
        }

    def generate_summary(self, file_path):
        """Generates a summary using Claude."""
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
        
        return response.content[0].text

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