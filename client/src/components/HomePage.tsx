import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { problemService } from '../services/api';
import { Problem } from '../types';
import './HomePage.css';

const HomePage: React.FC = () => {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    difficulty: '',
    language: '',
    category: ''
  });

  const loadProblems = useCallback(async () => {
    try {
      setLoading(true);
      const data = await problemService.getByFilters(
        filters.difficulty || undefined,
        filters.language || undefined,
        filters.category || undefined
      );
      setProblems(data);
    } catch (error) {
      console.error('Error loading problems:', error);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadProblems();
  }, [loadProblems]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#27ae60';
      case 'intermediate': return '#f39c12';
      case 'advanced': return '#e74c3c';
      default: return '#95a5a6';
    }
  };

  return (
    <div className="home-page">
      <div className="container">
        <div className="hero">
          <h1>Welcome to SocraticCode</h1>
          <p>Learn programming through guided hints and step-by-step problem solving</p>
        </div>

        <div className="filters">
          <h3>Filter Problems</h3>
          <div className="filter-group">
            <select 
              value={filters.difficulty} 
              onChange={(e) => setFilters({...filters, difficulty: e.target.value})}
            >
              <option value="">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            <select 
              value={filters.language} 
              onChange={(e) => setFilters({...filters, language: e.target.value})}
            >
              <option value="">All Languages</option>
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
              <option value="cpp">C++</option>
            </select>

            <select 
              value={filters.category} 
              onChange={(e) => setFilters({...filters, category: e.target.value})}
            >
              <option value="">All Categories</option>
              <option value="algorithms">Algorithms</option>
              <option value="data-structures">Data Structures</option>
              <option value="arrays">Arrays</option>
              <option value="strings">Strings</option>
              <option value="math">Math</option>
            </select>
          </div>
        </div>

        <div className="problems-grid">
          {loading ? (
            <div className="loading">Loading problems...</div>
          ) : problems.length === 0 ? (
            <div className="no-problems">No problems found matching your criteria.</div>
          ) : (
            problems.map((problem) => (
              <div key={problem._id} className="problem-card">
                <div className="problem-header">
                  <h3>{problem.title}</h3>
                  <span 
                    className="difficulty-badge"
                    style={{ backgroundColor: getDifficultyColor(problem.difficulty) }}
                  >
                    {problem.difficulty}
                  </span>
                </div>
                <p className="problem-description">{problem.description}</p>
                <div className="problem-meta">
                  <span className="language">{problem.language}</span>
                  <span className="category">{problem.category}</span>
                </div>
                <Link to={`/problem/${problem._id}`} className="start-button">
                  Start Problem
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
