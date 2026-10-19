import { text, type Locale } from "@/i18n/routing";
import { z } from "zod";
import { isEmail, normaliseEmail } from "./contact-format";
import { isPhone, phoneForPeople } from "./phone";

export const timelines = ["hemen", "1-3-ay", "belli-degil"] as const;

// alan kuralları ayrı duruyor, form ziyaretçi alandan çıkınca o alanı tek başına
// kontrol edebilsin diye.
export const createFieldSchemas = (locale: Locale) => {
  return {
    email: z
      .string()
      .trim()
      .min(1, text(locale, "E-posta adresinizi yazın.", "Enter your email address."))
      .refine(
        isEmail,
        text(
          locale,
          "E-posta adresini ad@sirket.com biçiminde yazın.",
          "Enter the email address as name@company.com.",
        ),
      )
      .transform(normaliseEmail),
    // form numarayı E.164 olarak gönderiyor (+905321234567), seçilen ülke ve ulusal
    // hanelerden oluşturuluyor.
    phone: z
      .string()
      .trim()
      .max(20, text(locale, "Telefon numarası çok uzun.", "The phone number is too long."))
      .refine(
        (value) => !value || isPhone(value),
        text(
          locale,
          "Numara seçilen ülke için eksik ya da hatalı görünüyor.",
          "This number looks incomplete or wrong for the selected country.",
        ),
      )
      // okunduğu gibi saklanıyor: +90 532 123 45 67.
      .transform((value) => (value ? phoneForPeople(value) : ""))
      .optional()
      .default(""),
  };
};

export const createContactSchema = (locale: Locale) => {
  const fields = createFieldSchemas(locale);
  return z
    .object({
      name: z
        .string()
        .trim()
        .min(2, text(locale, "Adınızı ve soyadınızı yazın.", "Enter your full name."))
        .max(100, text(locale, "En fazla 100 karakter kullanın.", "Use no more than 100 characters.")),
      company: z
        .string()
        .trim()
        .max(150, text(locale, "En fazla 150 karakter kullanın.", "Use no more than 150 characters."))
        .optional()
        .default(""),
      email: fields.email,
      phone: fields.phone,
      callback: z
        .preprocess((value) => value === true || value === "on" || value === "true", z.boolean())
        .default(false),
      // serbest metin: ziyaretçi ne konuda yardım istiyorsa kendi cümleleriyle.
      service: z
        .string()
        .trim()
        .min(2, text(locale, "Ne konuda yardım istediğinizi yazın.", "Describe what you need help with."))
        .max(120, text(locale, "En fazla 120 karakter kullanın.", "Use no more than 120 characters.")),
      message: z
        .string()
        .trim()
        .min(
          20,
          text(
            locale,
            "Projenizi en az 20 karakterle anlatın.",
            "Describe your project in at least 20 characters.",
          ),
        )
        .max(5000, text(locale, "En fazla 5000 karakter kullanın.", "Use no more than 5000 characters.")),
      timeline: z.enum(["", ...timelines]).optional().default(""),
      website: z.string().max(200).optional().default(""),
      startedAt: z.number().finite(),
      submissionId: z.uuid(),
    })
    .superRefine((data, ctx) => {
      if (data.callback && !data.phone)
        ctx.addIssue({
          code: "custom",
          path: ["phone"],
          message: text(
            locale,
            "Sizi arayabilmem için telefon numaranızı yazın.",
            "Add your phone number so you can be called back.",
          ),
        });
    });
};

export const contactSchema = createContactSchema("tr");
export type ContactPayload = z.infer<typeof contactSchema>;
export type ContactFieldErrors = Partial<Record<keyof ContactPayload, string[]>>;
