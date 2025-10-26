"""
Script to run the uAgent separately
Usage: python run_agent.py
"""

import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from agents.tutor_agent import tutor_agent

if __name__ == "__main__":
    print("Starting Tutor Agent (uAgent)...")
    print(f"Agent name: {tutor_agent.name}")
    print(f"Agent address: {tutor_agent.address}")
    print("\nAgent is running... Press Ctrl+C to stop")
    
    try:
        tutor_agent.run()
    except KeyboardInterrupt:
        print("\nAgent stopped by user")

