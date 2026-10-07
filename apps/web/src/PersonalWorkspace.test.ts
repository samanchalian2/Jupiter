import { describe, expect, it } from "vitest";
import { personalSupportCaseLabels } from "./PersonalWorkspace";

describe("personal workspace support status labels", () => {
  it("covers every canonical Personal Support lifecycle status in Persian", () => {
    expect(personalSupportCaseLabels).toEqual({
      QUEUED: "در صف",
      ACCEPTED: "پذیرفته‌شده",
      IN_PROGRESS: "در حال رسیدگی",
      WAITING_FOR_USER: "منتظر پاسخ شما",
      COMPLETED: "تکمیل‌شده",
      CANCELLED: "لغوشده",
      REJECTED: "ردشده",
      REVOKED: "متوقف‌شده",
    });
  });
});
