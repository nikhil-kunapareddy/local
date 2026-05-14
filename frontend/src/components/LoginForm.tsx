"use client";

import { useState } from "react";
import { navigateToDashboard, setSession } from "@/lib/auth";

export function LoginForm() {
  const [error, setError] = useState("");

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const username = String(fd.get("username") ?? "").trim();
    const password = String(fd.get("password") ?? "").trim();
    const accountTypeRaw = String(fd.get("accountType") ?? "consumer");

    if (!username || !password) {
      setError("Please enter a username and password.");
      return;
    }

    const accountType = accountTypeRaw === "business" ? "business" : "consumer";
    setError("");
    setSession({ username, accountType });
    navigateToDashboard(accountType);
  }

  return (
    <>
      {error ? <div className="login-error">{error}</div> : null}
      <form className="form-stack" method="post" onSubmit={onSubmit}>
        <div>
          <label className="field-label" htmlFor="username">
            Username
          </label>
          <input
            className="input"
            style={{ width: "100%" }}
            type="text"
            id="username"
            name="username"
            autoComplete="username"
          />
        </div>
        <div>
          <label className="field-label" htmlFor="password">
            Password
          </label>
          <input
            className="input"
            style={{ width: "100%" }}
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
          />
        </div>
        <div>
          <span className="field-label">Account type</span>
          <div className="role-grid">
            <label className="role-option">
              <input type="radio" name="accountType" value="business" />
              <span>Business</span>
            </label>
            <label className="role-option">
              <input type="radio" name="accountType" value="consumer" defaultChecked />
              <span>Consumer</span>
            </label>
          </div>
        </div>
        <button className="btn btn-primary btn-block" type="submit">
          Continue
        </button>
      </form>
    </>
  );
}
