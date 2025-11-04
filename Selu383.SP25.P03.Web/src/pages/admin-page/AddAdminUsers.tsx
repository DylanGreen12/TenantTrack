import React, { useState } from "react";
import { UserDto } from "../../models/UserDto";
import { Toast } from "../../components/Toast";

interface AddAdminFormProps {
  currentUser?: UserDto;
  onAdminAdded: () => void;
}

export function AddAdminUsers({ currentUser, onAdminAdded }: AddAdminFormProps) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const isAdmin = currentUser?.roles?.includes("Admin") || false;

  if (!currentUser || !isAdmin) {
    return (
      <div className="p-20px max-w-1200px mx-auto">
        <h1 className="text-gray-800 text-2xl font-semibold mb-10px">Add Admin User</h1>
        <div className="text-[#dc3545] my-10px py-10px bg-[#f8d7da] border-1 border-[#f5c6cb] rounded-4px">
          Access denied. Administrator privileges required.
        </div>
      </div>
    );
  }

  return (
    <div className="p-20px max-w-1200px mx-auto">
      <div className="flex justify-between items-center mb-10px">
        <h1 className="text-gray-800 text-2xl font-semibold">Add Admin User</h1>
        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
          Administrator
        </div>
      </div>

      <div className="login-wrapper">
        <div className="login-box">
          <h2 className="login-title">Create New Admin Account</h2>
          <p className="text-sm text-gray-600 mb-4 text-center">
            Create a new administrator account with full system access
          </p>
          
          <form className="login-form" onSubmit={(e) => addAdmin(e)}>
            <div className="input-group">
              <label htmlFor="username" className="input-label">Username:</label>
              <input
                type="text"
                id="username"
                className="login-input"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
              />
            </div>
            <div className="input-group">
              <label htmlFor="email" className="input-label">Email:</label>
              <input
                type="email"
                id="email"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Required for admin accounts"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="phone" className="input-label">Phone:</label>
              <input
                type="tel"
                id="phone"
                className="login-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Optional"
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
                placeholder="Enter secure password"
                minLength={6}
              />
              <p className="text-xs text-gray-500 mt-1">
                Password must be at least 6 characters long
              </p>
            </div>
            
            <div className="input-group">
              <label htmlFor="role" className="input-label">Role:</label>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-blue-800 text-sm font-medium">
                  Administrator
                </p>
                <p className="text-blue-600 text-xs mt-1">
                  Full system access - can manage all properties, units, tenants, and users
                </p>
              </div>
            </div>

            {formError ? <p className="error-message">{formError}</p> : null}
            
            <div className="button-container">
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Creating Admin..." : "Create Admin Account"}
              </button>
            </div>
          </form>
        </div>
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

  async function addAdmin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (loading) return;

    setFormError("");
    setLoading(true);

    const payload = {
      Username: username,
      Password: password,
      Roles: ["Admin"], 
      Email: email || null,
      Phone: phone || null
    };

    try {
      const response = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Failed to create admin account");
      }

      setToastMessage("Admin account created successfully!");
      setShowToast(true);

      // Reset form
      setUsername("");
      setEmail("");
      setPhone("");
      setPassword("");

      // Notify parent component
      onAdminAdded();

      setTimeout(() => {
        setShowToast(false);
      }, 3000);

    } catch (err: any) {
      console.error("Admin creation error:", err);
      setFormError(err.message || "Failed to create admin account. Try a different username or stronger password.");
    } finally {
      setLoading(false);
    }
  }
}

export default AddAdminUsers;