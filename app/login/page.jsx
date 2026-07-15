"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (result?.error) {
      setError("Email ou password incorrectos.");
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div style={{ maxWidth: "360px", margin: "5rem auto", padding: "0 1rem", fontFamily: "sans-serif" }}>
      <h1 style={{ marginBottom: "1.5rem" }}>Entrar</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Email
            <br />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "0.4rem", boxSizing: "border-box" }}
            />
          </label>
        </div>
        <div style={{ marginBottom: "1rem" }}>
          <label>
            Password
            <br />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "0.4rem", boxSizing: "border-box" }}
            />
          </label>
        </div>
        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}
        <button type="submit" disabled={loading} style={{ padding: "0.4rem 1.2rem" }}>
          {loading ? "A entrar…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}
