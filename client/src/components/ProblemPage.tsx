import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { problemService, sessionService, hintService } from '../services/api';
import { Problem, Session } from '../types';
import './ProblemPage.css';

const ProblemPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [problem, setProblem] = useState<Problem | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [currentHintLevel, setCurrentHintLevel] = useState<1 | 2 | 3>(1);
  const [userCode, setUserCode] = useState('');
  const [currentHint, setCurrentHint] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [showSolution, setShowSolution] = useState(false);

  const loadProblemAndCreateSession = useCallback(async () => {
    try {
      setLoading(true);
      const problemData = await problemService.getById(id!);
      setProblem(problemData);
      
      const sessionData = await sessionService.create(id!);
      setSession(sessionData);
    } catch (error) {
      console.error('Error loading problem:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadProblemAndCreateSession();
    }
  }, [id, loadProblemAndCreateSession]);

  const requestHint = async (level: 1 | 2 | 3) => {
    if (!problem || !session) return;
    
    try {
      const hintResponse = await hintService.getHint(problem._id, level);
      setCurrentHint(hintResponse.hint);
      setCurrentHintLevel(level);
      
      // Update session to record hint usage
      await sessionService.update(session.sessionId, { hintLevel: level });
    } catch (error) {
      console.error('Error getting hint:', error);
    }
  };

  const submitCode = async () => {
    if (!session) return;
    
    try {
      // For now, we'll just record the attempt
      // In a real implementation, you'd run the code against test cases
      await sessionService.update(session.sessionId, { 
        userCode, 
        isCorrect: false // This would be determined by actual code execution
      });
      
      alert('Code submitted! (Note: Code execution not implemented yet)');
    } catch (error) {
      console.error('Error submitting code:', error);
    }
  };

  const showFullSolution = () => {
    setShowSolution(true);
  };

  if (loading) {
    return <div className="loading">Loading problem...</div>;
  }

  if (!problem) {
    return <div className="error">Problem not found</div>;
  }

  return (
    <div className="problem-page">
      <div className="container">
        <div className="problem-header">
          <button onClick={() => navigate('/')} className="back-button">
            ← Back to Problems
          </button>
          <h1>{problem.title}</h1>
          <div className="problem-meta">
            <span className={`difficulty ${problem.difficulty}`}>
              {problem.difficulty}
            </span>
            <span className="language">{problem.language}</span>
            <span className="category">{problem.category}</span>
          </div>
        </div>

        <div className="problem-content">
          <div className="problem-description">
            <h2>Problem Description</h2>
            <p>{problem.description}</p>
            
            {problem.testCases.length > 0 && (
              <div className="test-cases">
                <h3>Test Cases</h3>
                {problem.testCases.map((testCase, index) => (
                  <div key={index} className="test-case">
                    <div className="test-input">
                      <strong>Input:</strong> {testCase.input}
                    </div>
                    <div className="test-output">
                      <strong>Expected Output:</strong> {testCase.expectedOutput}
                    </div>
                    {testCase.description && (
                      <div className="test-description">
                        <strong>Description:</strong> {testCase.description}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="hint-section">
            <h2>SocraticCode Hints</h2>
            <p>Choose your hint level to get guided help:</p>
            
            <div className="hint-buttons">
              <button 
                onClick={() => requestHint(1)}
                className={`hint-button level-1 ${currentHintLevel >= 1 ? 'active' : ''}`}
              >
                Level 1: Conceptual Questions
              </button>
              <button 
                onClick={() => requestHint(2)}
                className={`hint-button level-2 ${currentHintLevel >= 2 ? 'active' : ''}`}
                disabled={currentHintLevel < 1}
              >
                Level 2: Algorithmic Steps
              </button>
              <button 
                onClick={() => requestHint(3)}
                className={`hint-button level-3 ${currentHintLevel >= 3 ? 'active' : ''}`}
                disabled={currentHintLevel < 2}
              >
                Level 3: Detailed Pseudocode
              </button>
            </div>

            {currentHint && (
              <div className="current-hint">
                <h3>Level {currentHintLevel} Hint:</h3>
                <div className="hint-content">{currentHint}</div>
              </div>
            )}

            <div className="solution-section">
              <button 
                onClick={showFullSolution}
                className="solution-button"
                disabled={currentHintLevel < 3}
              >
                Show Complete Solution
              </button>
              {showSolution && (
                <div className="solution-content">
                  <h3>Complete Solution:</h3>
                  <pre>{problem.solution}</pre>
                </div>
              )}
            </div>
          </div>

          <div className="code-section">
            <h2>Your Code</h2>
            <textarea
              value={userCode}
              onChange={(e) => setUserCode(e.target.value)}
              placeholder="Write your solution here..."
              className="code-editor"
              rows={15}
            />
            <button onClick={submitCode} className="submit-button">
              Submit Code
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProblemPage;
