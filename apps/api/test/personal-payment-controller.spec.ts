import { describe, expect, it, vi } from "vitest";
import { PersonalPaymentController } from "../src/personal-payments/personal-payment.controller.js";

describe("PersonalPaymentController safe browser return", () => {
  it("redirects a successful callback with only the safe state and order id", async () => {
    const payments = {
      callback: vi.fn().mockResolvedValue({
        status: "PAID",
        orderId: "624369b8-361b-42db-a44f-a6dddb85df31",
      }),
    };
    const redirect = vi.fn();
    const controller = new PersonalPaymentController({} as never, payments as never);

    await controller.callback(
      { redirect },
      "provider-authority-must-not-leak",
      "OK",
    );

    expect(redirect).toHaveBeenCalledOnce();
    const [status, location] = redirect.mock.calls[0] as [number, string];
    expect(status).toBe(302);
    const url = new URL(location);
    expect(url.pathname).toBe("/personal/services");
    expect(url.searchParams.get("payment")).toBe("paid");
    expect(url.searchParams.get("orderId")).toBe(
      "624369b8-361b-42db-a44f-a6dddb85df31",
    );
    expect(location).not.toContain("provider-authority-must-not-leak");
    expect(url.searchParams.has("Authority")).toBe(false);
  });

  it("turns provider and verification failures into a generic safe return", async () => {
    const payments = {
      callback: vi.fn().mockRejectedValue(new Error("raw provider failure")),
    };
    const redirect = vi.fn();
    const controller = new PersonalPaymentController({} as never, payments as never);

    await controller.callback(
      { redirect },
      "provider-authority-must-not-leak",
      "OK",
    );

    const [, location] = redirect.mock.calls[0] as [number, string];
    const url = new URL(location);
    expect(url.searchParams.get("payment")).toBe("failed");
    expect(url.searchParams.has("orderId")).toBe(false);
    expect(location).not.toMatch(/authority|provider|failure/i);
  });
});
