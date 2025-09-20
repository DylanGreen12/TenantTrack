import React, { useState } from "react";
import { UserDto } from "../models/UserDto";
import "../styles/LoginForm.css";
import { Toast } from "../components/Toast";

interface SignUpFormProps {
  onSignUpSuccess: (user: UserDto) => void;
  onSwitchToLogin: () => void;
}

const AVAILABLE_ROLES = [
  { value: "Landlord", label: "Landlord" },
  { value: "Tenant", label: "Tenant" },
  { value: "Maintenance", label: "Maintenance" }
];

export function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("Tenant"); 
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  return (
    <div className="login-wrapper">
      <div className="login-box">
        <h2 className="login-title">Sign Up</h2>
        <form className="login-form" onSubmit={(e) => signUp(e)}>
          <div className="input-group">
            <label htmlFor="username" className="input-label">Username:</label>
            <input
              type="text"
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
              id="password"
              className="login-input"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="input-group">
            <label htmlFor="role" className="input-label">Role:</label>
            <select
              id="role"
              className="login-input"
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              {AVAILABLE_ROLES.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>
          {formError ? <p className="error-message">{formError}</p> : null}
          <div className="button-container">
            <button type="submit" className="login-button" disabled={loading}>
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </div>
          <p className="switch-text">
            Already have an account? <span onClick={onSwitchToLogin} className="switch-link">Log in</span>
          </p>
        </form>
      </div>

      {/* Toast rendered here */}
      {showToast && (
        <Toast
          message={toastMessage}
          type="success"
          onClose={() => setShowToast(false)}
        />
      )}
    </div>
  );

  async function signUp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setFormError("");
    setLoading(true);

    const payload = {
      Username: username,    
      Password: password,    
      Roles: [selectedRole], 
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Signup failed");
      }

      setToastMessage("Signup successful! Please log in.");
      setShowToast(true);

      setTimeout(() => {
        setShowToast(false);
        onSwitchToLogin();
      }, 2000);

    } catch (err: any) {
      console.error("Signup error:", err);
      setFormError("Signup failed. Try a different username or stronger password.");
    } finally {
      setLoading(false);
    }
  }
}