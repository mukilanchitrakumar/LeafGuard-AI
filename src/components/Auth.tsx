import React, { useState } from "react";
import type { User } from "../types";
import { Lock, Mail, User as UserIcon, Eye, EyeOff } from "lucide-react";

interface AuthProps {
  onAuthSuccess: (user: User) => void;
}

export const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    if (isSignUp) {
      if (!name) {
        alert("Please enter your name!");
        return;
      }
      if (password !== confirmPassword) {
        alert("Passwords do not match!");
        return;
      }
      if (!agreeTerms) {
        alert("Please agree to the Terms & Conditions!");
        return;
      }

      // Check if email already registered
      const existingUser = localStorage.getItem(email);
      if (existingUser) {
        alert("This email is already registered. Please sign in instead.");
        setIsSignUp(false);
        return;
      }

      // Save user
      const userData = { name, email, password };
      localStorage.setItem(email, JSON.stringify(userData));
      alert(`Account created successfully! Welcome, ${name}!`);
      
      onAuthSuccess({ name, email });
    } else {
      const storedUserRaw = localStorage.getItem(email);
      if (!storedUserRaw) {
        alert("No account found with this email. Please sign up first.");
        return;
      }

      try {
        const storedUser = JSON.parse(storedUserRaw);
        if (storedUser.password !== password) {
          alert("Incorrect password!");
          return;
        }

        onAuthSuccess({ name: storedUser.name, email: storedUser.email });
      } catch (err) {
        alert("An error occurred during authentication.");
      }
    }
  };

  return (
    <div className="auth-wrapper animate-fadeIn">
      <div className="cyber-card auth-card">
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <h1 className="cyber-title" style={{ fontSize: "1.8rem", marginBottom: "6px", letterSpacing: "2px" }}>
            LEAFGUARD AI PORTAL
          </h1>
          <p className="font-orbitron" style={{ fontSize: "0.8rem", color: "var(--text-muted)", letterSpacing: "1px", textTransform: "uppercase" }}>
            {isSignUp ? "Register LeafGuard Session" : "LeafGuard AI Gateway"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignUp && (
            <div className="form-group">
              <label className="form-label">
                <UserIcon size={14} /> Full Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="cyber-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">
              <Mail size={14} /> Email Address
            </label>
            <input
              type="email"
              placeholder="Enter your email"
              className="cyber-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Lock size={14} /> Password
            </label>
            <div className="password-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={isSignUp ? "Create password" : "Enter password"}
                className="cyber-input password-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="eye-button"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <div className="form-group">
              <label className="form-label">
                <Lock size={14} /> Confirm Password
              </label>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Confirm password"
                className="cyber-input"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          )}

          {!isSignUp && (
            <div className="auth-options">
              <label className="checkbox-row">
                <input type="checkbox" />
                Remember Me
              </label>
              <button
                type="button"
                className="link-btn"
                onClick={() => alert("Password reset link (mock) has been sent to your email!")}
              >
                Forgot Password?
              </button>
            </div>
          )}

          {isSignUp && (
            <label className="checkbox-row" style={{ alignItems: "flex-start" }}>
              <input
                type="checkbox"
                style={{ marginTop: "2px" }}
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                required
              />
              <span style={{ lineHeight: "1.4" }}>I agree to the terms and security conditions</span>
            </label>
          )}

          <button type="submit" className="cyber-btn" style={{ width: "100%", marginTop: "8px" }}>
            {isSignUp ? "Register Account" : "Enter LeafGuard AI"}
          </button>
        </form>

        <div className="divider-row">
          <div className="divider-line"></div>
          <span className="divider-text font-orbitron">OR</span>
          <div className="divider-line"></div>
        </div>

        <div style={{ textAlign: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
          {isSignUp ? "Already have an account? " : "Don't have an account? "}
          <button
            type="button"
            className="link-btn"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
};
