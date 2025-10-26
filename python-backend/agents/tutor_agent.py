"""
Tutor Agent using Fetch.ai uAgents
This agent autonomously analyzes code and generates learning questions
"""

from uagents import Agent, Context, Model
from typing import Optional
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.code_analyzer import CodeAnalyzer
from services.groq_service import GroqService

# Define models for agent communication
class CodeAnalysisRequest(Model):
    """Request model for code analysis"""
    code: str
    context: Optional[str] = None
    language: str = "python"

class CodeAnalysisResponse(Model):
    """Response model for code analysis"""
    question: Optional[str]
    analysis: dict
    needs_conceptual_help: bool
    agent_id: str

# Create the Tutor Agent
tutor_agent = Agent(
    name="tutor_agent",
    seed="tutor_agent_secret_seed_123",  # In production, use secure seed
    port=8001,
    endpoint=f"http://localhost:8001/submit"
)

# Initialize services
code_analyzer = CodeAnalyzer()
groq_service = GroqService()

@tutor_agent.on_query(model=CodeAnalysisRequest, replies=CodeAnalysisResponse)
async def analyze_code(ctx: Context, sender: str, msg: CodeAnalysisRequest):
    """
    Handle code analysis requests
    This is called when another agent or the API requests code analysis
    """
    ctx.logger.info(f"Received code analysis request from {sender}")
    
    try:
        # Step 1: Analyze code
        analysis = code_analyzer.analyze(msg.code, msg.language)
        
        needs_conceptual_help = False
        question = None
        
        # Step 2: Check if conceptual help is needed
        if analysis.get("has_conceptual_issue", False):
            needs_conceptual_help = True
            
            # Step 3: Generate Socratic question
            try:
                question = await groq_service.generate_socratic_question(
                    code=msg.code,
                    issue_type=analysis.get("issue_type", "general"),
                    context=msg.context or ""
                )
            except Exception as e:
                ctx.logger.error(f"Error generating Socratic question: {e}")
                question = "What do you think this code is trying to accomplish?"
        
        # Send response
        await ctx.send(
            sender,
            CodeAnalysisResponse(
                question=question,
                analysis=analysis,
                needs_conceptual_help=needs_conceptual_help,
                agent_id=tutor_agent.address
            )
        )
        
        ctx.logger.info("Code analysis completed successfully")
        
    except Exception as e:
        ctx.logger.error(f"Error in code analysis: {e}")
        await ctx.send(
            sender,
            CodeAnalysisResponse(
                question=None,
                analysis={"error": str(e)},
                needs_conceptual_help=False,
                agent_id=tutor_agent.address
            )
        )

@tutor_agent.on_event("startup")
async def agent_startup(ctx: Context):
    """Called when the agent starts up"""
    ctx.logger.info("Tutor Agent started and ready")
    ctx.logger.info(f"Agent address: {tutor_agent.address}")

@tutor_agent.on_interval(period=60.0)
async def agent_status(ctx: Context):
    """Periodic status check"""
    ctx.logger.info("Tutor Agent is active and ready to analyze code")

# For testing/development
if __name__ == "__main__":
    tutor_agent.run()

