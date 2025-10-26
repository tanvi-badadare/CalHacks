"""
Example client for testing the CoDei backend
"""

import requests
import json

# API endpoint
BASE_URL = "http://localhost:8000"

def test_code_update():
    """Test the /api/code_update endpoint"""
    
    # Example code with potential issues
    test_codes = [
        {
            "code": "def calculate(x):\n    return x * y",  # Undefined variable
            "context": "Learning about function parameters",
            "language": "python"
        },
        {
            "code": "x = input()\nresult = x + 10",  # Type conversion issue
            "context": "User is learning about type handling",
            "language": "python"
        },
        {
            "code": "for i in range(5):\n    print(i)",  # Good code
            "context": "Learning about loops",
            "language": "python"
        }
    ]
    
    print("Testing CoDei Backend API\n" + "="*50)
    
    for i, test in enumerate(test_codes, 1):
        print(f"\nTest {i}:")
        print(f"Code: {test['code']}")
        print(f"Context: {test['context']}")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/code_update",
                json=test,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                result = response.json()
                print(f"\n✓ Analysis successful!")
                print(f"Needs conceptual help: {result['needs_conceptual_help']}")
                
                if result['question']:
                    print(f"\nSocratic Question:")
                    print(f"  {result['question']}")
                
                print(f"\nAnalysis details:")
                print(json.dumps(result['analysis'], indent=2))
            else:
                print(f"✗ Error: {response.status_code}")
                print(response.text)
        
        except requests.exceptions.ConnectionError:
            print("✗ Error: Could not connect to server.")
            print("Make sure the backend is running: uvicorn main:app --reload")
            break
        except Exception as e:
            print(f"✗ Error: {e}")

def test_health():
    """Test the /health endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print("Health check:")
        print(json.dumps(response.json(), indent=2))
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    print("\nCoDei Backend API Example Client")
    print("="*50)
    
    # Test health first
    test_health()
    print("\n")
    
    # Test code update endpoint
    test_code_update()
    
    print("\n" + "="*50)
    print("Done!")

