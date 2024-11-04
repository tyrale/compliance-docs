# tools/project-summarizer.py

import os
import ast
from pathlib import Path
import logging
from anthropic import Anthropic
import json

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

    def analyze_file(self, file_path):
        """Analyzes file based on its type."""
        ext = Path(file_path).suffix.lower()
        
        if ext == '.py':
            return self.analyze_python_file(file_path)
        elif ext in ['.js', '.jsx', '.ts', '.tsx']:
            return self.analyze_js_file(file_path)
        elif ext in ['.json']:
            return self.analyze_json_file(file_path)
        elif ext in ['.md', '.markdown']:
            return self.analyze_markdown_file(file_path)
        else:
            return self.analyze_generic_file(file_path)

    def analyze_python_file(self, file_path):
        """Analyzes Python files."""
        with open(file_path, 'r') as file:
            content = file.read()
            
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

    def analyze_js_file(self, file_path):
        """Analyzes JavaScript/TypeScript files."""
        with open(file_path, 'r') as file:
            content = file.read()
            
        # Simple analysis for now
        lines = content.splitlines()
        code_lines = len([line for line in lines 
                         if line.strip() and not line.strip().startswith('//')])
        
        # Basic function detection (can be improved)
        functions = []
        for line in lines:
            if 'function' in line or '=>' in line:
                functions.append(line.strip())
                
        return {
            'type': 'javascript',
            'total_lines': code_lines,
            'functions': functions
        }

    def analyze_json_file(self, file_path):
        """Analyzes JSON files."""
        with open(file_path, 'r') as file:
            content = json.load(file)
            
        return {
            'type': 'json',
            'structure': type(content).__name__,
            'top_level_keys': list(content.keys()) if isinstance(content, dict) else None,
            'length': len(content) if isinstance(content, (dict, list)) else None
        }

    def analyze_markdown_file(self, file_path):
        """Analyzes Markdown files."""
        with open(file_path, 'r') as file:
            lines = file.readlines()
            
        headers = []
        for line in lines:
            if line.strip().startswith('#'):
                headers.append(line.strip())
                
        return {
            'type': 'markdown',
            'total_lines': len(lines),
            'headers': headers
        }

    def analyze_generic_file(self, file_path):
        """Analyzes any other file type."""
        with open(file_path, 'r') as file:
            lines = file.readlines()
            
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