# src/fonts/archivo/archivo-latin-tr.woff2'yi Archivo[wdth,wght].ttf'den üretiyor
# (google/fonts, ofl/archivo, v2.001; OFL 1.1, src/fonts/archivo/OFL.txt'ye bak).
#   pip install fonttools brotli
#   python scripts/subset-archivo.py "Archivo[wdth,wght].ttf" src/fonts/archivo/archivo-latin-tr.woff2
# sadece glifler kırpılıyor, iki eksen de tam aralığını koruyor. eksenleri daraltmak
# (wght 400-700, wdth 100-125) ~33 KB daha kazandırıyor ama bazı glif kenarlarını
# pikselin altında kaydırıyor. metinlerde yeni karakterler kullanılmaya başlarsa
# buradaki UNICODES'u genişlet.
import sys
from fontTools.ttLib import TTFont
from fontTools import subset

src, out = sys.argv[1], sys.argv[2]
# google'ın "latin" aralığı + latin-ext'teki türkçe harfler (Ğ/ğ, İ, Ş/ş).
UNICODES = ("U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,"
            "U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD,"
            "U+011E-011F,U+0130,U+015E-015F")

opts = subset.Options()
# google'ın archivo için sunduğu layout özelliklerinin aynısı.
opts.layout_features = ["ccmp", "dnom", "frac", "liga", "locl", "numr", "pnum", "rvrn", "tnum", "kern", "mark", "mkmk"]
opts.hinting = False
opts.drop_tables += ["DSIG"]
opts.name_IDs = ["*"]
opts.name_languages = ["*"]
opts.notdef_outline = True
opts.flavor = "woff2"

font = TTFont(src)
sub = subset.Subsetter(opts)
sub.populate(unicodes=subset.parse_unicodes(UNICODES))
sub.subset(font)
subset.save_font(font, out, opts)

f = TTFont(out)
print(out, "glyphs", len(f.getGlyphOrder()),
      "axes", [(a.axisTag, a.minValue, a.defaultValue, a.maxValue) for a in f["fvar"].axes])
