import React, { useState } from "react";
import { UserDto } from "../models/UserDto"; 
import "../styles/LoginForm.css"; 
import { useNavigate } from "react-router-dom";

interface LoginFormProps {
  onLoginSuccess: (user: UserDto) => void;
  onSwitchToSignUp: () => void;
}

export function LoginForm({ onLoginSuccess, onSwitchToSignUp }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h2 className="login-title">Login</h2>
        <form className="login-form" onSubmit={(e) => login(e)}>
          <div className="input-group">
            <label htmlFor="username" className="input-label">Username:</label>
            <input
              type="text"
              name="username"
              id="username"
              className="login-input"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password" className="input-label">Password:</label>
            <input
              type="password"
              name="password"
              id="password"
              className="login-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {formError ? <p className="error-message">{formError}</p> : null}
          <div className="button-container">
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </div>
          <p className="switch-text">
            Don't have an account? <span onClick={onSwitchToSignUp} className="switch-link">Sign up</span>
          </p>
          
        </form>
      </div>
    </div>
  );

  async function login(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setFormError("");
    setLoading(true);

    try {
      const loginRes = await fetch("/api/authentication/login", {
        method: "POST",
        body: JSON.stringify({ userName: username, password }),
        headers: { "Content-Type": "application/json" },
      });

      if (!loginRes.ok) {
        throw new Error("Login failed");
      }

      // Fetch logged-in user from session
      const meRes = await fetch("/api/authentication/me");
      if (!meRes.ok) {
        throw new Error("Unable to retrieve user info.");
      }

      const user: UserDto = await meRes.json();
      onLoginSuccess(user); // Update currentUser in App.tsx
      navigate("/");
    } catch (err) {
      console.error(err);
      setFormError("Wrong username or password");
    } finally {
      setLoading(false);
    }
  }
}
