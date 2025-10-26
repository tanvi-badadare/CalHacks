"""
Utility functions for the CoDei backend
"""

def extract_code_blocks(text: str) -> list:
    """Extract code blocks from markdown or plain text"""
    import re
    
    # Look for code blocks in markdown format
    markdown_blocks = re.findall(r'```[\w]*\n([\s\S]*?)```', text)
    
    if markdown_blocks:
        return markdown_blocks
    
    # Otherwise return the whole text as a single block
    return [text]

def validate_code_language(code: str, language: str) -> bool:
    """Basic validation of code language"""
    if language.lower() == "python":
        # Check for Python-specific patterns
        return "def " in code or "print(" in code or "import " in code
    return True

def sanitize_code(code: str) -> str:
    """Sanitize user input"""
    # Remove potentially harmful characters
    # In production, add more robust sanitization
    return code.strip()

