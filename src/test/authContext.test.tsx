import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { AuthProvider, useAuth } from "@/context/AuthContext";

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe("AuthProvider", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("prevents admin login with unknown email", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await expect(
      act(async () => {
        return result.current.loginWithCredentials({
          email: "random@citizen.gov",
          password: "wrongpass",
          role: "admin",
        });
      })
    ).rejects.toThrowError(/not registered as an admin/i);
    expect(result.current.isAuthenticated).toBe(false);
  });

  it("registers and logs in a public user", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.registerPublicUser({ email: "citizen@example.com", password: "publicpass" });
    });

    await act(async () => {
      const role = await result.current.loginWithCredentials({
        email: "citizen@example.com",
        password: "publicpass",
        role: "public",
      });
      expect(role).toBe("public");
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.userEmail).toBe("citizen@example.com");
  });

  it("rejects login when role does not match registered email", async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await act(async () => {
      await result.current.registerPublicUser({ email: "citizen@rolecheck.com", password: "publicpass" });
    });

    await expect(
      act(async () => {
        return result.current.loginWithCredentials({
          email: "citizen@rolecheck.com",
          password: "publicpass",
          role: "admin",
        });
      })
    ).rejects.toThrowError(/not registered as an admin/i);
  });
});
