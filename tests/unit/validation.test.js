const { validateUser } = require("../../src/utils/validation/user.validator");

describe("validateUser", () => {
  it("accepts a valid student registration payload", () => {
    const result = validateUser({
      studentId: "S1001",
      email: "student@campus.edu",
      password: "secure123",
      fullName: "Alice Student",
      role: "student",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a student without a studentId", () => {
    const result = validateUser({
      email: "student@campus.edu",
      password: "secure123",
      fullName: "Alice Student",
      role: "student",
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/student/i);
  });

  it("rejects a password shorter than 6 characters", () => {
    const result = validateUser({
      studentId: "S1001",
      email: "student@campus.edu",
      password: "123",
      fullName: "Alice Student",
      role: "student",
    });

    expect(result.success).toBe(false);
    expect(result.message).toMatch(/password/i);
  });
});
