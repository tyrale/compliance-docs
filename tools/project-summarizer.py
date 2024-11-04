# tools/summary_generator.py

import os
import glob
import ast
from pathlib import Path
import logging
from anthropic import Anthropic

# Set minimum file size (in bytes) - e.g., 1KB = 1024 bytes
MIN_FILE_SIZE = 1024  # Adjust this threshold as needed

class CodeSummaryGenerator:
    def __init__(self):
        self.client = Anthropic(api_key=os.getenv('ANTHROPIC_API_KEY'))
        
    def should_summarize(self, file_path):
        """Check if file meets criteria for summarization."""
        # Check file size
        file_size = os.path.getsize(file_path)
        if file_size < MIN_FILE_SIZE:
            print(f"Skipping {file_path} (size: {file_size} bytes) - below threshold")
            return False
        return True

    def analyze_file(self, file_path):
        """Extracts function/class info from Python file."""
        with open(file_path, 'r') as file:
            content = file.read()
            
        # Count lines of code (excluding empty lines and comments)
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
                    'lines': len(node.body)  # Approximate function length
                })
            elif isinstance(node, ast.ClassDef):
                classes.append({
                    'name': node.name,
                    'docstring': ast.get_docstring(node) or '',
                    'lines': len(node.body)  # Approximate class length
                })
                
        return {
            'total_lines': code_lines,
            'functions': functions,
            'classes': classes
        }

    def generate_summary(self, file_path):
        """Generates a summary using Claude."""
        analysis = self.analyze_file(file_path)
        
        # Add file size to summary
        file_size = os.path.getsize(file_path)
        file_size_kb = file_size / 1024
        
        prompt = f"""Create a concise summary for {file_path}:
        
        File Stats:
        - Size: {file_size_kb:.1f}KB
        - Lines of Code: {analysis['total_lines']}
        
        Functions: {[f'{f["name"]} ({f["lines"]} lines)' for f in analysis['functions']]}
        Classes: {[f'{c["name"]} ({c["lines"]} lines)' for c in analysis['classes']]}
        
        Format as:
        # Summary
        size: {file_size_kb:.1f}KB
        lines: {analysis['total_lines']}
        purpose: (brief purpose)
        
        ## Functions
        - function_name (lines): purpose
        
        ## Classes
        - class_name (lines): purpose
        """
        
        response = self.client.messages.create(
            model="claude-3-haiku-20240307",
            max_tokens=500,
            temperature=0,
            messages=[{"role": "user", "content": prompt}]
        )
        
        return response.content

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