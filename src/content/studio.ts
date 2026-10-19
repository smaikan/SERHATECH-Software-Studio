export type Service = {
  slug: string;
  title: string;
  short: string;
  description: string;
  // ana sayfada gösterilen sade kazanımlar, teknoloji adı yok.
  gains: string[];
  // hologramda modülün yanında görünen kısa etiket.
  benefit: string;
  problem: string;
  solution: string;
  scope: string[];
  // teknolojiler sadece hizmet detay sayfasının en altında listeleniyor.
  stack: string[];
  scenario: string;
  node: string;
};

export const services: Service[] = [
  {
    slug: "ozel-web-uygulamalari",
    title: "Özel web uygulamaları",
    short: "İşinize göre şekillenen uygulamalar.",
    description:
      "Ekibinizin her gün kullandığı yönetim panelleri, müşteri portalları ve iş uygulamaları; web'de ve gerektiğinde mobilde.",
    gains: [
      "Dağınık tablolar yerine tek bir çalışma ekranı",
      "Ekibinizin iş yapış biçimine uyan akışlar",
      "Bilgisayarda ve telefonda rahat kullanım",
    ],
    benefit: "Paneller ve iş uygulamaları",
    problem:
      "İş büyüdükçe hazır araçlar yetersiz kalır. Aynı bilgi farklı yerlerde tutulur, takip zorlaşır.",
    solution:
      "Uygulama, ekibin gerçek çalışma biçimi incelenerek kurgulanır. Gerekli işlemler tek bir yerde toplanır; arayüz sade ve öğrenmesi kolay tutulur. Gerektiğinde aynı sistem mobil uygulamayla da kullanılabilir.",
    scope: [
      "İhtiyaç analizi ve ekran akışlarının planlanması",
      "Yönetim panelleri ve kullanıcı yetkileri",
      "Bilgisayar, tablet ve telefona uygun arayüzler",
      "Mevcut sistemlerle bağlantı ve test",
    ],
    stack: ["Next.js", "React", "TypeScript", "ASP.NET Core"],
    scenario:
      "Siparişlerin, stok durumunun ve ekip görevlerinin tek bir panelden izlenmesi.",
    node: "Uygulama",
  },
  {
    slug: "backend-api-gelistirme",
    title: "Sistem entegrasyonları",
    short: "Kullandığınız araçlar birbiriyle konuşsun.",
    description:
      "Muhasebe, e-ticaret, müşteri yönetimi ve iç araçlar arasında düzenli veri akışı; tekrar eden veri girişinin sonu.",
    gains: [
      "Bilgi bir kez girilir, her yerde güncel kalır",
      "Elle aktarımdan kaynaklanan hatalar azalır",
      "Kimin neye erişebildiği kontrol altında",
    ],
    benefit: "Sistemler arası bağlantı",
    problem:
      "Farklı sistemler aynı bilgiyi ayrı ayrı tuttuğunda veri elle taşınır; hata ve gecikme kaçınılmaz hâle gelir.",
    solution:
      "Sistemler arasında güvenli bağlantılar kurulur. Hangi bilginin nereden geldiği, nerede güncellendiği ve kimin erişebileceği açıkça tanımlanır.",
    scope: [
      "Mevcut sistemlerin ve veri akışının incelenmesi",
      "Sistemler arası bağlantıların kurulması",
      "Yetkilendirme ve erişim kontrolü",
      "Hata durumlarının izlenmesi ve test",
    ],
    stack: ["C#", "ASP.NET Core", "EF Core", "SQL Server", "REST API"],
    scenario:
      "Web sitesi, mobil uygulama ve iç panelin aynı ürün ve müşteri bilgisini güvenle kullanması.",
    node: "Entegrasyon",
  },
  {
    slug: "e-ticaret-sistemleri",
    title: "E-ticaret sistemleri",
    short: "Mağazadan operasyonun tamamına.",
    description:
      "Shopify ve PrestaShop mağazaları, platform geçişleri ve mağazayı iş süreçlerine bağlayan çözümler.",
    gains: [
      "Ürün ve varyantların düzenli yönetimi",
      "Platform değişikliğinde kayıpsız geçiş",
      "Sipariş ve stok süreçlerinin sadeleşmesi",
    ],
    benefit: "Mağaza ve operasyon",
    problem:
      "Platform değişikliklerinde ürün ilişkileri bozulabilir; günlük operasyon birkaç sistem arasında elle yürütülebilir.",
    solution:
      "Mağaza ve arkasındaki işleyiş birlikte ele alınır. Aktarım kuralları önceden belirlenir, test edilir ve kontrollü biçimde uygulanır.",
    scope: [
      "Mağaza kurulumu ve özelleştirme",
      "Platformlar arası ürün ve veri aktarımı",
      "Stok, sipariş ve ürün süreçlerinin bağlanması",
      "Aktarım sonrası kontrol ve doğrulama",
    ],
    stack: ["Shopify", "PrestaShop", "Next.js", "Python", "SQL"],
    scenario:
      "Bir mağazanın ürünleri, varyantları ve ilişkili ürünleriyle birlikte yeni bir platforma kayıpsız taşınması.",
    node: "E-ticaret",
  },
  {
    slug: "is-sureci-otomasyonu",
    title: "İş süreci otomasyonu",
    short: "Tekrar eden işlere daha az zaman.",
    description:
      "Her hafta elle yapılan raporlama, veri aktarımı ve kontrol işlerinin kendiliğinden ve kontrollü yürümesi.",
    gains: [
      "Ekibe her hafta zaman kazandırır",
      "Elle yapılan işlerde hata payı düşer",
      "Her adım kayıt altında ve izlenebilir",
    ],
    benefit: "Tekrar eden işler",
    problem:
      "Tablolar, e-postalar ve paneller arasında yapılan tekrar işler zaman alır ve hataya açıktır.",
    solution:
      "Önce mevcut iş akışı adım adım çıkarılır. Ardından otomatikleşmeye uygun adımlar kontrollü ve izlenebilir şekilde devreye alınır.",
    scope: [
      "Mevcut iş akışının çıkarılması",
      "Raporlama ve veri aktarımının otomatikleştirilmesi",
      "Bildirim ve onay adımları",
      "Kayıt, izleme ve hata bildirimi",
    ],
    stack: ["Python", "REST API", "SQL", "Excel"],
    scenario:
      "Farklı kaynaklardan gelen sipariş bilgilerinin her sabah tek bir rapor hâlinde hazırlanması.",
    node: "Otomasyon",
  },
  {
    slug: "sistem-ve-altyapi",
    title: "Kurulum ve yayın",
    short: "Uygulamanız güvenle yayında.",
    description:
      "Uygulamanın sunucuya kurulması, alan adı ve güvenlik ayarları, yedekleme ve sorunsuz güncelleme düzeni.",
    gains: [
      "Güvenli ve hızlı yayın",
      "Düzenli yedekleme",
      "Güncellemelerde kesinti riskinin azalması",
    ],
    benefit: "Sunucu ve yayın",
    problem:
      "Bir uygulamanın yazılması kadar güvenli ve kesintisiz çalışması da önemlidir. Yapılandırması belirsiz bir sunucu zamanla sorun çıkarır.",
    solution:
      "Yayın ortamı uygulamanın ihtiyacına göre planlanır. Kurulum, güvenlik, yedekleme ve güncelleme adımları belgelenerek teslim edilir.",
    scope: [
      "Sunucu ve alan adı yapılandırması",
      "Güvenli bağlantı ve erişim ayarları",
      "Yedekleme ve güncelleme düzeni",
      "Kullanım ve bakım notları",
    ],
    stack: ["Linux", "Docker", "Caddy", "Cloudflare"],
    scenario:
      "Yeni bir iş uygulamasının şirketin alan adı altında güvenle yayına alınması.",
    node: "Altyapı",
  },
  {
    slug: "yapay-zeka-entegrasyonlari",
    title: "Yapay zekâ entegrasyonları",
    short: "Gerçek ihtiyaca uygun akıllı özellikler.",
    description:
      "Metin özetleme, sınıflandırma ve içerik desteği gibi yapay zekâ özelliklerinin mevcut uygulamalara eklenmesi.",
    gains: [
      "Zaman alan metin işlerinin hızlanması",
      "Mevcut sistemle uyumlu kullanım",
      "Sonuçların denetlenebilir olması",
    ],
    benefit: "Akıllı özellikler",
    problem:
      "Yapay zekâ her işe uymaz. Yanlış yerde kullanıldığında maliyet ve belirsizlik getirir.",
    solution:
      "Önce yapay zekânın gerçekten fayda sağlayacağı noktalar belirlenir. Özellik, mevcut uygulamanın bir parçası olarak ölçülü ve denetlenebilir şekilde eklenir.",
    scope: [
      "Uygun kullanım alanlarının belirlenmesi",
      "Mevcut uygulamaya yapay zekâ özelliği eklenmesi",
      "Özetleme, sınıflandırma ve içerik desteği",
      "Çıktıların denetlenmesi ve maliyet kontrolü",
    ],
    stack: ["LLM API", "ASP.NET Core", "React", "Python"],
    scenario:
      "Gelen müşteri taleplerinin otomatik olarak sınıflandırılıp doğru kişiye iletilmesi.",
    node: "Yapay zekâ",
  },
];

export type Project = {
  slug: string;
  name: string;
  category: string;
  kind: string;
  description: string;
  problem: string;
  solution: string;
  approach: string;
  challenge: string;
  result: string;
  stack: string[];
  image: null | { src: string; alt: string };
  github: string | null;
  demo: string | null;
};

export const projects: Project[] = [
  {
    slug: "eleven-accessory",
    name: "Eleven Accessory",
    category: "E-ticaret uygulaması",
    kind: "Ürün projesi",
    description:
      "Mağaza vitrini, ürün yönetimi ve sipariş altyapısını bir arada sunan e-ticaret uygulaması.",
    problem:
      "Müşterinin gördüğü mağaza ile ürün, sipariş ve bildirim süreçlerini yöneten arka planın birlikte tasarlanması gerekiyordu.",
    solution:
      "Mağaza ve yönetim tarafı aynı sistemin parçaları olarak kurgulandı. Ödeme (test ortamında) ve e-posta bildirimleri sipariş akışına bağlandı.",
    approach:
      "Mağaza, iş kuralları ve veriler ayrı sorumluluklarda ele alındı. Servisler birlikte ve tutarlı çalışacak şekilde paketlendi.",
    challenge:
      "Ürün bilgisi, yönetim işlemleri, ödeme ve e-posta akışlarının birbiriyle tutarlı çalışmasını sağlamak.",
    result:
      "Mağaza arayüzü, yönetim özellikleri, test ödeme ve e-posta bildirimlerini içeren çalışan bir uygulama. Satış veya müşteri sayısı paylaşılmaz.",
    stack: ["Next.js", "React", "ASP.NET Core", "SQL Server", "Docker"],
    image: null,
    github: null,
    demo: null,
  },
  {
    slug: "nemora-diary",
    name: "Nemora Diary",
    category: "Yapay zekâ destekli uygulama",
    kind: "Ürün projesi",
    description:
      "Günlük tutma deneyimini yapay zekâ destekli özelliklerle birleştiren uygulama.",
    problem:
      "Kullanıcı deneyimini bozmadan, yapay zekâ özelliklerinin uygulamanın doğal bir parçası olması gerekiyordu.",
    solution:
      "Uygulamanın temel akışı ile yapay zekâ servisi ayrı tutuldu; yapay zekâ özelliği, kullanıcının günlük deneyimini destekleyen bir katman olarak eklendi.",
    approach:
      "Uygulama mantığı ve dış servis bağlantıları ayrı sorumluluklarda ele alındı; servis yanıt vermediğinde de uygulama çalışmaya devam edecek şekilde kurgulandı.",
    challenge:
      "Temel akışı dış servis yanıtlarından bağımsız tutmak ve bağlantı sınırlarını net çizmek.",
    result:
      "Arayüz, uygulama altyapısı ve yapay zekâ bağlantısını bir arada içeren çalışan bir uygulama. Kullanıcı sayısı veya etki iddiası içermez.",
    stack: [".NET", "React", "LLM API"],
    image: null,
    github: null,
    demo: null,
  },
  {
    slug: "meta-analiz-paneli",
    name: "Meta Analiz Paneli",
    category: "Veri ve analiz paneli",
    kind: "Ürün projesi",
    description:
      "Reklam, ürün ve marka verilerini filtrelenebilir ve okunabilir ekranlarda sunan analiz paneli.",
    problem:
      "Farklı kaynaklardan gelen reklam, ürün ve marka verilerinin hızlıca karşılaştırılabilmesi gerekiyordu.",
    solution:
      "Verilerin filtrelenip karşılaştırılabildiği, inceleme ihtiyaçlarına göre düzenlenmiş analiz ekranları geliştirildi.",
    approach:
      "Okunabilirlik ve hızlı filtreleme temel alındı; her ekran belirli bir inceleme sorusuna cevap verecek şekilde düzenlendi.",
    challenge:
      "Farklı veri alanlarını, karşılaştırma ve filtrelemeye uygun tutarlı bir arayüzde sunmak.",
    result:
      "Veri gösterimi ve filtreleme akışlarını içeren çalışan bir analiz paneli. Meta ile resmî bir ortaklık ya da performans iddiası içermez.",
    stack: ["Next.js", "React", "TypeScript"],
    image: null,
    github: null,
    demo: null,
  },
];

export const processSteps = [
  {
    title: "Keşif görüşmesi",
    detail:
      "İşletmenin bugünkü işleyişi, kullanılan araçlar ve çözülmesi gereken sorun konuşulur.",
  },
  {
    title: "İhtiyaç analizi",
    detail:
      "Kullanıcılar, bilgi akışı ve sınırlar netleştirilir; gerçek ihtiyaç ile ertelenebilecek olan ayrılır.",
  },
  {
    title: "Kapsam ve teklif",
    detail:
      "Teslim edilecekler, kapsam dışı konular ve takvim yazılı hâle getirilir.",
  },
  {
    title: "Planlama",
    detail:
      "Sistemin yapısı, bağlantıları ve geliştirme adımları ihtiyaca göre planlanır.",
  },
  {
    title: "Geliştirme",
    detail:
      "Çalışan parçalarla ilerlenir; belirlenen aşamalarda ilerleme paylaşılır ve geri bildirim alınır.",
  },
  {
    title: "Test ve değerlendirme",
    detail:
      "İşlevler, hata durumları ve cihaz uyumu gerçek kullanım senaryolarıyla denenir.",
  },
  {
    title: "Yayın ve teslim",
    detail:
      "Yayın ortamı hazırlanır, uygulama yayına alınır ve kullanım notlarıyla teslim edilir.",
  },
  {
    title: "Destek ve devam",
    detail:
      "Bakım, destek ve yeni geliştirmeler ayrı bir anlaşmayla, ihtiyaca göre planlanır.",
  },
];
