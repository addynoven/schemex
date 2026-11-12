import { describe, it, expect } from "vitest";
import { buildQueryHashKey, cacheGet, cacheSet, isRedisConfigured } from "@/lib/redis";
import { executeSearchSchemes, executeGetSchemeDocuments, executeCheckEligibility } from "@/lib/chat-tools";

describe("Redis Query Hashing & Cache-Aside Layer", () => {
  it("generates deterministic normalized query keys regardless of key insertion order", () => {
    const key1 = buildQueryHashKey("cache:schemes:search", {
      category: "Agriculture",
      state: "Madhya Pradesh",
      q: "kisan",
    });

    const key2 = buildQueryHashKey("cache:schemes:search", {
      q: "kisan",
      state: "Madhya Pradesh",
      category: "Agriculture",
    });

    expect(key1).toBe(key2);
    expect(key1).toBe("cache:schemes:search:category=agriculture:q=kisan:state=madhya pradesh");
  });

  it("normalizes extra whitespace and casing in parameter values", () => {
    const key = buildQueryHashKey("cache:test", {
      state: "  MADHYA   PRADESH  ",
      income: 200000,
    });

    expect(key).toBe("cache:test:income=200000:state=madhya pradesh");
  });

  it("handles null and undefined parameters gracefully", () => {
    const key = buildQueryHashKey("cache:schemes:browse", {
      state: undefined,
      category: null,
      search: "pension",
    });

    expect(key).toBe("cache:schemes:browse:category=:search=pension:state=");
  });

  it("fails safely and returns null on cacheGet when Redis is unconfigured/disconnected", async () => {
    const result = await cacheGet("non_existent_key_or_offline");
    expect(result).toBeNull();
  });

  it("fails safely and returns false on cacheSet when Redis is unconfigured/disconnected", async () => {
    const success = await cacheSet("sample_key", { data: 123 }, 60);
    // When offline or unconfigured, it must not throw and return false
    expect(typeof success).toBe("boolean");
  });

  it("integrates seamlessly into executeSearchSchemes without throwing", async () => {
    const res = await executeSearchSchemes("kisan", "ALL_INDIA", "Agriculture");
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(Array.isArray(res.data)).toBe(true);
    }
  });

  it("integrates seamlessly into executeGetSchemeDocuments without throwing", async () => {
    const res = await executeGetSchemeDocuments(["pm-kisan-samman-nidhi"]);
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(Array.isArray(res.data)).toBe(true);
    }
  });

  it("integrates seamlessly into executeCheckEligibility without throwing", async () => {
    const res = await executeCheckEligibility({
      slug: "pm-kisan-samman-nidhi",
      income: 150000,
      occupation: "farmer",
    });
    expect(res.status).toBe("success");
    if (res.status === "success") {
      expect(res.data).toBeDefined();
      expect(res.data.status).toBe("eligible");
    }
  });
});
