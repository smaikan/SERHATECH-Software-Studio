"""design/brand'deki ana dosyalardan web boyutunda logoları ve faviconları üretiyor.

    python scripts/build-brand.py

logo_dark.png açık yüzeylerde (gündüz navbar, favicon), logo_light.png koyu yüzeylerde
(bay navbar, mobil menü, footer). çıktılar public/brand ve public/ klasörüne gidiyor
(favicon.ico, apple-touch-icon.png).
"""

from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SOURCE = ROOT / "design" / "brand"
PUBLIC = ROOT / "public"
BRAND = PUBLIC / "brand"

# navbar ve footer'daki işaretin ekrandaki boyutu, css pikseli.
LOGO_PX = 36


def squared(image: Image.Image, threshold: int, pad: float) -> Image.Image:
    """görünen glife göre kırpıyor (soluk parlamayı saymadan) ve bir karenin ortasına koyuyor."""
    alpha = image.getchannel("A").point(lambda v: 255 if v > threshold else 0)
    box = alpha.getbbox()
    if box is None:
        raise SystemExit("logo has no visible pixels")
    glyph = image.crop(box)
    side = round(max(glyph.size) * (1 + pad * 2))
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    canvas.alpha_composite(glyph, ((side - glyph.width) // 2, (side - glyph.height) // 2))
    return canvas


def resized(image: Image.Image, size: int, sharpen: bool = False) -> Image.Image:
    out = image.resize((size, size), Image.Resampling.LANCZOS)
    if sharpen:
        out = out.filter(ImageFilter.UnsharpMask(radius=0.6, percent=60, threshold=1))
    return out


def palette(image: Image.Image) -> Image.Image:
    """alfa kanallı 256 renkli png: boyutun küçük bir kısmı, ikon boyutlarında renk
bantlanması görünmüyor."""
    return image.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.FLOYDSTEINBERG)


def on_background(image: Image.Image, size: int, colour: tuple[int, int, int], inset: float) -> Image.Image:
    canvas = Image.new("RGBA", (size, size), colour + (255,))
    inner = round(size * (1 - inset * 2))
    glyph = resized(image, inner)
    canvas.alpha_composite(glyph, ((size - inner) // 2, (size - inner) // 2))
    return canvas.convert("RGB")


def main() -> None:
    BRAND.mkdir(parents=True, exist_ok=True)
    dark = Image.open(SOURCE / "logo_dark.png").convert("RGBA")
    light = Image.open(SOURCE / "logo_light.png").convert("RGBA")

    # navbar / footer işaretleri: glifin etrafında biraz parlama bırakılıyor.
    for name, image in (("logo-dark", dark), ("logo-light", light)):
        mark = squared(image, threshold=24, pad=0.02)
        for scale in (1, 2, 3):
            px = LOGO_PX * scale
            resized(mark, px, sharpen=scale == 1).save(
                BRAND / f"{name}-{px}.webp", "WEBP", quality=88, method=6
            )

    # faviconlar: sıkı kırpma, glif küçük sekme ikonunu doldursun diye.
    icon = squared(dark, threshold=60, pad=0.0)
    resized(icon, 48).save(PUBLIC / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    for px in (192, 512):
        palette(resized(icon, px)).save(BRAND / f"icon-{px}.png", optimize=True)
    # ios şeffaflığı umursamıyor, o yüzden ana ekran ikonuna gündüz zemin rengini veriyoruz.
    on_background(icon, 180, (238, 241, 244), inset=0.1).save(
        PUBLIC / "apple-touch-icon.png", optimize=True
    )

    for path in sorted([*BRAND.iterdir(), PUBLIC / "favicon.ico", PUBLIC / "apple-touch-icon.png"]):
        print(f"{path.relative_to(ROOT)}  {path.stat().st_size / 1024:.1f} KB")


if __name__ == "__main__":
    main()
