import { NavLink } from "react-router-dom";
import "./Navigation.css";

function Navigation() {
  return (
    <header className="app-header">
      <div className="app-header-content">
        <NavLink className="app-brand" to="/">
          <span className="app-brand-icon" aria-hidden="true">
            🦈
          </span>

          <span className="app-brand-text">
            <strong>White Shark Explorer</strong>
            <small>Information Visualization Project</small>
          </span>
        </NavLink>

        <nav className="app-navigation" aria-label="Main navigation">
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? "navigation-link active" : "navigation-link"
            }
          >
            Overview
          </NavLink>

          <NavLink
            to="/map"
            className={({ isActive }) =>
              isActive ? "navigation-link active" : "navigation-link"
            }
          >
            Movement Explorer
          </NavLink>

          <NavLink
            to="/analysis"
            className={({ isActive }) =>
              isActive ? "navigation-link active" : "navigation-link"
            }
          >
            Analysis
          </NavLink>
        </nav>
      </div>
    </header>
  );
}

export default Navigation;
