"""
FastAPI backend for CoDei - Socratic Coding Tutor
Uses Fetch.ai uAgents for autonomous agent processing
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from dotenv import load_dotenv
import os
import sys

# Load environment variables
load_dotenv()

# Add services directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from services.code_analyzer import CodeAnalyzer
from services.claude_service import ClaudeService

app = FastAPI(
    title="CoDei Backend",
    description="Socratic Coding Tutor Backend with uAgents",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
code_analyzer = CodeAnalyzer()
claude_service = ClaudeService()

# Note: In production, you would start the uAgent separately:
# uagent run agents.tutor_agent:tutor_agent

class CodeUpdate(BaseModel):
    code: str
    context: Optional[str] = None
    language: Optional[str] = "python"

class Response(BaseModel):
    question: Optional[str]
    analysis: dict
    needs_conceptual_help: bool

def _looks_like_code(text: str) -> bool:
    """Check if the input looks like code"""
    if not text or len(text.strip()) < 3:
        return False
    
    code_keywords = ['def ', 'function ', 'import ', 'class ', 'const ', 'let ', 'var ',
                     'print(', 'for(', 'while(', 'if(', 'return ', '=']
    
    has_code_keyword = any(keyword in text for keyword in code_keywords)
    has_operators = any(op in text for op in ['=', '<', '>', '+', '-', '*', '/'])
    has_parens = '(' in text and ')' in text
    has_brackets = ('[' in text and ']' in text) or ('{' in text and '}' in text)
    
    # If it has code keywords, definitely code
    if has_code_keyword:
        return True
    
    # If it has operators with parens/brackets, probably code
    if has_operators and (has_parens or has_brackets):
        return True
    
    return False

@app.get("/")
async def root():
    return {
        "message": "CoDei Backend - Socratic Coding Tutor",
        "status": "active",
        "version": "1.0.0"
    }

@app.post("/api/code_update", response_model=Response)
async def code_update(update: CodeUpdate):
    """
    Receive code update, analyze it, and return Socratic question if needed.
    """
    try:
        # Step 1: Let CodeMentor intelligently handle any input (code, questions, chat, etc.)
        # No hardcoding - CodeMentor will figure it out based on the sophisticated prompt
        
        needs_conceptual_help = False
        question = None
        
        # Try to analyze if it looks like code first (optional check)
        try:
            analysis = code_analyzer.analyze(update.code, update.language)
            needs_conceptual_help = analysis.get("has_conceptual_issue", False)
            issue_type = analysis.get("issue_type", "general")
        except:
            # If analysis fails, just send everything to CodeMentor
            analysis = {"has_errors": False, "errors": []}
            issue_type = "general"
        
        # Step 2: Send to Claude
        try:
            question = await claude_service.generate_socratic_question(
                code=update.code,
                issue_type=issue_type,
                context=update.context or ""
            )
        except Exception as e:
            print(f"Error calling Claude API: {e}")
            question = "I'm here to help you learn! What can I help you with today?"
        
        return Response(
            question=question,
            analysis=analysis,
            needs_conceptual_help=needs_conceptual_help
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing code: {str(e)}")

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "services": {
            "code_analyzer": "active",
            "claude_service": claude_service.enabled and "active" or "disabled"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

