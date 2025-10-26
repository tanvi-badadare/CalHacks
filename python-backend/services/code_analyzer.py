"""
Code Analyzer Service
Analyzes code for syntax errors and basic logic patterns
"""

import ast
import re
from typing import Dict, List, Any

class CodeAnalyzer:
    """Analyzes Python code for syntax and logical issues"""
    
    def __init__(self):
        self.syntax_patterns = {
            "undefined_variable": r"NameError.*name '(.+)' is not defined",
            "type_error": r"TypeError",
            "indentation_error": r"IndentationError",
            "syntax_error": r"SyntaxError"
        }
        
        self.conceptual_patterns = [
            (r"def\s+\w+\s*\([^)]*\)\s*:", "Function definitions"),
            (r"for\s+\w+\s+in\s+", "Loops"),
            (r"if\s+.*:", "Conditionals"),
            (r"\.append\s*\(", "List operations"),
            (r"return\s+", "Return statements"),
        ]
    
    def analyze(self, code: str, language: str = "python") -> Dict[str, Any]:
        """Analyze code and return structured analysis"""
        
        # Basic validation
        if not code or not code.strip():
            return {
                "status": "empty",
                "has_errors": False,
                "has_conceptual_issue": True,
                "issue_type": "empty_code",
                "errors": [],
                "warnings": []
            }
        
        analysis = {
            "status": "valid",
            "has_errors": False,
            "has_conceptual_issue": False,
            "issue_type": None,
            "errors": [],
            "warnings": [],
            "suggestions": []
        }
        
        # Check syntax
        syntax_check = self._check_syntax(code)
        if not syntax_check["is_valid"]:
            analysis["has_errors"] = True
            analysis["errors"] = syntax_check["errors"]
        
        # Check for conceptual issues (like undefined variables)
        conceptual_check = self._check_conceptual_issues(code)
        if conceptual_check["has_issues"]:
            analysis["has_conceptual_issue"] = True
            analysis["issue_type"] = conceptual_check["issue_type"]
            analysis["warnings"] = conceptual_check["issues"]
        
        # Code structure analysis
        structure = self._analyze_structure(code)
        analysis.update(structure)
        
        return analysis
    
    def _check_syntax(self, code: str) -> Dict[str, Any]:
        """Check if Python code has syntax errors"""
        try:
            ast.parse(code)
            return {"is_valid": True, "errors": []}
        except SyntaxError as e:
            return {
                "is_valid": False,
                "errors": [{
                    "type": "SyntaxError",
                    "message": str(e),
                    "line": getattr(e, 'lineno', None),
                    "offset": getattr(e, 'offset', None)
                }]
            }
        except Exception as e:
            return {
                "is_valid": False,
                "errors": [{"type": "Error", "message": str(e)}]
            }
    
    def _check_conceptual_issues(self, code: str) -> Dict[str, Any]:
        """Check for conceptual issues like undefined variables"""
        issues = []
        
        # Look for potential undefined variables (simple heuristic)
        undefined_patterns = [
            r'return\s+(\w+)\s*[^=]',  # returning undefined var
        ]
        
        has_undefined = False
        for pattern in undefined_patterns:
            matches = re.findall(pattern, code)
            if matches:
                has_undefined = True
                issues.append({
                    "type": "potential_undefined_variable",
                    "message": f"Potential undefined variable detected: {', '.join(matches)}"
                })
                break
        
        # Check for common beginner mistakes
        if "input()" in code and "int(" not in code and "float(" not in code:
            issues.append({
                "type": "type_conversion",
                "message": "Consider converting input to the appropriate type"
            })
        
        if "for" in code and "range" not in code and "in" in code:
            issues.append({
                "type": "iteration_pattern",
                "message": "Good use of iteration! Consider what you're iterating over."
            })
        
        return {
            "has_issues": len(issues) > 0 or has_undefined,
            "issue_type": "conceptual" if issues else None,
            "issues": issues
        }
    
    def _analyze_structure(self, code: str) -> Dict[str, Any]:
        """Analyze code structure and patterns"""
        structure = {
            "has_functions": "def " in code,
            "has_loops": "for " in code or "while " in code,
            "has_conditionals": "if " in code,
            "has_classes": "class " in code,
            "patterns_detected": []
        }
        
        # Detect patterns
        for pattern, description in self.conceptual_patterns:
            if re.search(pattern, code):
                structure["patterns_detected"].append(description)
        
        return structure

