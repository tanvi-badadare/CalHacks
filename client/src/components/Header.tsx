import React from 'react';
import { Link } from 'react-router-dom';
import './Header.css';

const Header: React.FC = () => {
  return (
    <header className="header">
      <div className="header-container">
        <Link to="/" className="logo">
          <h1>SocraticCode</h1>
        </Link>
        <nav className="nav">
          <Link to="/" className="nav-link">Problems</Link>
        </nav>
      </div>
    </header>
  );
};

export default Header;
