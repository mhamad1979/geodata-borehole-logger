import { describe, it, expect } from "vitest";
import { validatePassword } from "@/lib/auth/validators";

describe("validatePassword", () => {
  it("accepts a valid password with all requirements met", () => {
    const result = validatePassword("Abcdef1x");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("rejects a password shorter than 8 characters", () => {
    const result = validatePassword("Ab1cdef");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Password must be at least 8 characters long"
    );
  });

  it("rejects a password without an uppercase letter", () => {
    const result = validatePassword("abcdef1x");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one uppercase letter"
    );
  });

  it("rejects a password without a lowercase letter", () => {
    const result = validatePassword("ABCDEF1X");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one lowercase letter"
    );
  });

  it("rejects a password without a digit", () => {
    const result = validatePassword("Abcdefgh");
    expect(result.valid).toBe(false);
    expect(result.errors).toContain(
      "Password must contain at least one digit"
    );
  });

  it("returns multiple errors for a password violating multiple rules", () => {
    const result = validatePassword("abc");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);
  });

  it("accepts a long password meeting all criteria", () => {
    const result = validatePassword("MyStr0ngP@ssword123");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it("accepts exactly 8 characters meeting all criteria", () => {
    const result = validatePassword("Aa1bbbbb");
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});
