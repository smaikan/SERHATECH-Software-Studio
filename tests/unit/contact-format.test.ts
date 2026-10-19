import { describe, expect, it } from "vitest";
import { isEmail, normaliseEmail } from "../../src/lib/contact-format";
import {
  formatNational,
  isPhone,
  phoneForPeople,
  splitInternational,
  toE164,
} from "../../src/lib/phone";
import { phoneCountries } from "../../src/lib/phone-countries";
import { createFieldSchemas } from "../../src/lib/contact-schema";

describe("phone rules", () => {
  it("groups national numbers the way the country reads them", () => {
    expect(formatNational("05321234567", "TR")).toBe("0532 123 45 67");
    expect(formatNational("5321234567", "TR")).toBe("532 123 45 67");
    expect(formatNational("2025550123", "US")).toBe("(202) 555-0123");
    expect(formatNational("", "TR")).toBe("");
  });
  it("builds E.164 from the country and the national digits", () => {
    expect(toE164("0532 123 45 67", "TR")).toBe("+905321234567");
    expect(toE164("532 123 45 67", "TR")).toBe("+905321234567");
    expect(toE164("020 7946 0958", "GB")).toBe("+442079460958");
  });
  it("splits a pasted international number into country and digits", () => {
    expect(splitInternational("+90 532 123 45 67")).toEqual({ country: "TR", national: "5321234567" });
    expect(splitInternational("0049 30 123456")).toEqual({ country: "DE", national: "30123456" });
    expect(splitInternational("532 123")).toBeNull();
  });
  it("accepts valid numbers and stores them the way they are read", () => {
    expect(isPhone("+905321234567")).toBe(true);
    expect(isPhone("+90532123")).toBe(false);
    expect(isPhone("05321234567")).toBe(false);
    expect(phoneForPeople("+905321234567")).toBe("+90 532 123 45 67");
    expect(createFieldSchemas("tr").phone.parse("+905321234567")).toBe("+90 532 123 45 67");
    expect(createFieldSchemas("tr").phone.parse("")).toBe("");
  });
});

describe("phone country list", () => {
  const list = phoneCountries("tr");
  it("starts with Türkiye and names countries in the page's language", () => {
    expect(list[0]).toMatchObject({ code: "TR", dial: "90", name: "Türkiye", digits: 10, prefix: "0" });
    expect(phoneCountries("en").find((c) => c.code === "DE")?.name).toBe("Germany");
  });
  it("limits digits to mobile and landline lengths", () => {
    const by = (code: string) => list.find((c) => c.code === code)!;
    expect(by("US").digits).toBe(10);
    expect(by("AZ").digits).toBe(9);
    expect(by("DE").digits).toBe(15);
  });
});

describe("email format", () => {
  it("accepts ordinary addresses", () => {
    for (const value of ["ad@sirket.com", "ad.soyad+teklif@alt.sirket.com.tr", "a_b-c@x-y.io"])
      expect(isEmail(value), value).toBe(true);
  });
  it("rejects addresses that cannot be delivered", () => {
    for (const value of ["ad", "ad@", "@sirket.com", "ad@sirket", "ad@sirket.c", "ad@sirket..com", "ad.@sirket.com", "ad@sirket-.com", "ayşe@sirket.com", "ad@sirket.123"])
      expect(isEmail(value), value).toBe(false);
  });
  it("lower-cases only the domain", () => {
    expect(normaliseEmail("  Ad.Soyad@Sirket.COM ")).toBe("Ad.Soyad@sirket.com");
    expect(createFieldSchemas("tr").email.parse("Ad@Sirket.Com")).toBe("Ad@sirket.com");
  });
  it("asks for the address before judging its format", () => {
    const result = createFieldSchemas("tr").email.safeParse("");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toBe("E-posta adresinizi yazın.");
  });
});
