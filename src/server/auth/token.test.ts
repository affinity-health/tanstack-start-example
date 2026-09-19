import { expect, test } from "bun:test";
import { newVisitor, signVisitor, verifyVisitor, sessionCookie } from "./token";
const secret = "synthetic-unit-test-secret-with-32-characters";

test("signed anonymous sessions reject tampering, expiry, and another signing key", async () => {
  const visitor = newVisitor();
  const token = await signVisitor(visitor, secret);
  expect(await verifyVisitor(token, secret)).toEqual(visitor);
  expect(await verifyVisitor(token, secret, visitor.expires)).toBeNull();
  expect(await verifyVisitor(token, secret + "-rotated")).toBeNull();
  expect(await verifyVisitor(token.replace(visitor.id, crypto.randomUUID()), secret)).toBeNull();
  expect(await verifyVisitor(token + ".extra", secret)).toBeNull();
  expect(await verifyVisitor("invalid", secret)).toBeNull();
});

test("visitors get independent IDs and HTTPS cookies are host-only, HttpOnly, and strict", async () => {
  expect(newVisitor().id).not.toBe(newVisitor().id);
  const cookie = sessionCookie(new Request("https://demo-emr.joinaffinityai.com"), "test");
  expect(cookie).toContain("__Host-demo-session=");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Strict");
  expect(cookie).toContain("Secure");
  expect(cookie).not.toContain("Domain=");
});
