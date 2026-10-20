# İletişim formunu açma

Form hazır olsa bile `CONTACT_FORM_ENABLED=false` varsayılanıyla gönderim kapalıdır.
Sunucuda mevcut `serhatech` PM2 süreci ve `/opt/serhatech/.env.local` kullanılır;
3010 portu yalnızca loopback üzerinde dinlemelidir. Gizli değerler Git'e veya sohbetlere yazılmaz.

Canlı form 20 Ekim 2026'da gerçek gönderim ve Gmail gelen kutusu kontrolünden sonra
`CONTACT_FORM_ENABLED=true` ile açıldı. Etkin ortamda bağlantı uyarısı görünmez.
DMARC kullanıcı tercihiyle eklenmedi; gönderimin açılması için zorunlu değildir.

1. Resend'de `notify.serha.tech` gönderim alanını doğrula. Panelde verilen SPF ve
   DKIM kayıtlarını Cloudflare'a ekle; kök alanın MX kayıtlarını ve mevcut e-posta
   yönlendirmesini koru. Gelen e-posta özelliğini açma. DMARC ayrıca önerilir;
   mevcut sıkı politikayı gevşetme. DMARC eksikliği formun açılmasını engellemez.
2. Bu alana gönderimle sınırlandırılmış `RESEND_API_KEY` ve Avrupa bölgesindeki,
   yalnızca forma ayrılmış Upstash veritabanının `UPSTASH_REDIS_REST_URL` ve
   `UPSTASH_REDIS_REST_TOKEN` değerlerini `.env.local` içine gir. `RATE_LIMIT_SECRET`
   en az 32 karakter güvenli rastgele değer olmalı (`openssl rand -hex 32`).
3. Gönderen `SERHATECH Form <form@notify.serha.tech>`, alıcı
   `serhatvader@gmail.com`, origin `https://serha.tech`, güvenilir başlık `X-Real-IP`.
   `node --env-file=.env.local scripts/check-contact.mjs` ile biçimi kontrol et.
   Kontrol anahtarı, DNS'i, servis erişimini veya gelen kutusuna teslimatı doğrulamaz.
4. Caddy'de yalnızca bu sitenin blokları için `deploy/Caddyfile.serha.tech` içeriğini
   kullan. `remote_ip` eşleşmesi doğrudan TCP eşini kontrol eder. Yalnızca Cloudflare
   aralıklarından gelen bağlantılardaki `CF-Connecting-IP` aktarılır; diğer bağlantılarda
   başlık gerçek eş IP'siyle değiştirilir. Cloudflare'ın Pseudo IPv4 ayarı özgün IPv6
   ziyaretçi kimliğini korumalı; başlıkların üzerine yazma modunu kullanma. IP aralıkları
   değişirse resmi listelerden bu siteye ait eşleşmeyi güncelle.

```sh
caddy validate --config /etc/caddy/Caddyfile
systemctl reload caddy
ss -ltnp 'sport = :3010'
```

5. Kod doğrulaması için `pnpm test`, `pnpm lint`, `pnpm typecheck`,
   `NEXT_DIST_DIR=.next-e2e pnpm build` ve
   `pnpm test:e2e tests/e2e/contact-delivery.spec.ts --project=chrome` çalıştır.
   Testler gerçek e-posta göndermez.
6. Sunucudaki mevcut sürüm `.next-contact` kullanır. Sonraki dağıtımlarda çalışan
   build dizininin üzerine yazma; yeni sürümü farklı bir dizinde
   `NEXT_DIST_DIR=<yeni-build-dizini> pnpm build` ile hazırla ve
   `NEXT_DIST_DIR` değerini mevcut güvenli ortam kaynağında o dizine geçir.
   `.env.local` içinde `CONTACT_FORM_ENABLED=true` yaptıktan sonra
   `pm2 restart serhatech --update-env` çalıştır. PM2'de eski contact
   değişkenleri ayrıca tanımlıysa bunlar `.env.local` değerlerinin önüne geçer; aynı
   mevcut güvenli ortam kaynağından güncellenmelidir.
7. Türkçe/İngilizce, mobil/masaüstü formdan kontrollü test gönder. Gmail gelen kutusu
   ve spam klasörünü kontrol et. Konu, tüm alanlar, geri arama ve Yanıtla adresini
   doğrula. Gmail'in orijinal ileti görünümünde SPF/DKIM/DMARC sonuçlarını kontrol et.
   Resend kabul kaydı tek başına teslimat kanıtı değildir.

Sorunda `CONTACT_FORM_ENABLED=false` yapıp `pm2 restart serhatech --update-env`
çalıştır. Değişken sunucuda çalışma anında okunur; kapatmak için yeni build gerekmez.
Doğrudan `iletisim@serha.tech` bağlantısı kullanılabilir.

Hız sınırı 10 dakikada ziyaretçi başına 5, toplam 50 kabul edilen denemedir; Redis
kesintisinde gönderim yapılmaz. Yeniden denemeler de sınırdan düşer. Aynı içerik ve
gönderim kimliği, Resend'in 24 saatlik tekrar önleme süresinde tek gönderime karşılık
gelir; sayfa yenilemek veya yeniden açmak yeni kimlik üretir. İçerik değişince kimlik
yenilenir. Zaman aşımı veya belirsiz sağlayıcı yanıtında form korunur, sonuç
doğrulanamadı olarak görünür. Ziyaretçiye otomatik e-posta gönderilmez.

Uygulama günlükleri yalnızca işlem kimliği, aşama, HTTP durum kodu ve kabul edilen
gönderimlerde Resend mesaj kimliğini içerir. Mesajlar ve ham IP'ler kaydedilmez.
Teslimat, bounce ve kota Resend panelinden izlenir; otomatik ücretli plana geçiş yoktur.
Sağlayıcı bölgeleri ve saklama koşulları netleşince gizlilik/KVKK metinlerini buna
göre düzenle; `LEGAL_CONTENT_APPROVED` kendiliğinden açılmaz.

Kaynaklar: [Resend tekrar önleme](https://resend.com/docs/dashboard/emails/idempotency-keys),
[Caddy remote_ip](https://caddyserver.com/docs/caddyfile/matchers#remote-ip),
[Cloudflare IPv4](https://www.cloudflare.com/ips-v4/),
[Cloudflare IPv6](https://www.cloudflare.com/ips-v6/).
