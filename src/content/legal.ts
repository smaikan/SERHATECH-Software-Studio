import { site } from "@/config/site";
import type { Locale } from "@/i18n/routing";

type LegalSection = {
  id: string;
  title: string;
  paragraphs?: readonly string[];
  items?: readonly string[];
};
type LegalPage = {
  title: string;
  description: string;
  scope: string;
  sections: readonly LegalSection[];
};

// Confirmed by the owner: the controller is a person operating under this brand,
// not a separate legal entity inferred from COMPANY_LEGAL_NAME.
const controller = `${site.founder} (SERHATECH)`;

export const legalContent: Record<Locale, Record<"privacy" | "kvkk", LegalPage>> = {
  tr: {
    privacy: {
      title: "Gizlilik politikası.",
      description: "Hangi bilgileri paylaştığınız, bu bilgilerin nasıl kullanıldığı ve gizlilik tercihleriniz hakkında açık bilgiler.",
      scope: `Bu politika, ${site.domain} web sitesini ziyaret ettiğinizde ve SERHATECH ile iletişim kurduğunuzda uygulanan süreçleri açıklar. Müşteriler için geliştirilen yazılımların veri işleme süreçleri, ilgili proje ve sözleşmelerde ayrıca ele alınır.`,
      sections: [
        {
          id: "operator", title: "Site sahibi ve kapsam",
          paragraphs: [`Web sitesi ${controller} tarafından yürütülür. Gizlilik sorularınız ve kişisel verilerinize ilişkin talepleriniz için ${site.email} adresini kullanabilirsiniz. İşleme amaçları, hukuki sebepler ve Kanun kapsamındaki haklarınız ayrıca KVKK aydınlatma metninde açıklanır.`],
        },
        {
          id: "information", title: "Toplanan bilgiler",
          items: [
            "İletişim formunda ad soyad, e-posta adresi, yardım istediğiniz konu ve mesaj zorunludur. Şirket veya marka adı, telefon numarası, başlangıç zamanı ve geri arama tercihi isteğe bağlıdır. Geri arama isterseniz telefon numarası gereklidir.",
            "Doğrudan e-posta gönderdiğinizde e-posta adresiniz, iletiniz ve kendi tercihinizle paylaştığınız diğer bilgiler alınır. E-posta bağlantısı cihazınızdaki e-posta uygulamasını açar.",
            "Form güvenliği için gönderim zamanı, gönderime özgü bir kimlik ve otomatik gönderim kontrolleri kullanılır. İstek sırasında IP adresi işlenir; gönderim sınırlandırma sistemine ham IP yerine gizli anahtarla üretilmiş bir özet aktarılır. Bu özet anonim veri olarak değerlendirilmez.",
            "Web isteğinin sunulması sırasında barındırma altyapısı IP adresi ve istek bilgileri gibi teknik verileri işler. Altyapı günlüklerinin kapsamı ve saklama süresi sağlayıcının yapılandırmasına bağlıdır.",
          ],
          paragraphs: ["Lütfen mesajınıza kimlik belgesi, ödeme kartı bilgisi, parola, sağlık bilgisi veya talebiniz için gerekli olmayan başka kişisel veriler eklemeyin. Form, bu tür bilgileri toplamak için tasarlanmamıştır."],
        },
        {
          id: "purposes", title: "Bilgilerinizin kullanımı",
          paragraphs: ["Paylaştığınız bilgiler talebinizi anlamak, proje kapsamını değerlendirmek, teklif veya çalışma koşulları hakkında yazışmak ve size yanıt vermek için kullanılır. Telefon numarası geri arama talebini yerine getirmek içindir; numara bırakmanız reklam araması izni anlamına gelmez.", "Teknik kontroller spam, kötüye kullanım ve aşırı gönderimleri sınırlandırır. İletişim formunu kullanmanız sizi bir pazarlama listesine kaydetmez. Sitede reklam hedefleme veya ziyaretçi profili oluşturma özelliği bulunmaz."],
        },
        {
          id: "providers", title: "E-posta ve altyapı hizmetleri",
          items: [
            "Resend: formdaki iletişim ve talep bilgilerini e-posta olarak SERHATECH’in gelen kutusuna iletir. Yanıt adresi olarak sizin e-posta adresiniz kullanılır.",
            "Upstash Redis: kötüye kullanımı önlemek için anahtarlı IP özetiyle ilişkili gönderim sayacını ve toplam gönderim sayacını tutar. Formdaki ad, e-posta, telefon ve mesaj bu sayaç sistemine kaydedilmez.",
            "Barındırma ve e-posta kutusu altyapısı: siteyi sunmak ve yazışmaları almak için gerekli teknik işlemleri gerçekleştirir. Uygulamada mesajları saklayan ayrı bir müşteri veya mesaj veritabanı bulunmaz; iletilerin e-posta kutusunda ve hizmet sağlayıcı sistemlerinde kopyaları bulunabilir.",
          ],
          paragraphs: ["Resend ve Upstash gibi yurt dışı hizmet sağlayıcılarının kullanımı, verilerin Türkiye dışında işlenmesini gündeme getirebilir. Aktarımın kapsamı ve hukuki koşulları KVKK aydınlatma metninde ele alınır. Harici bağlantılarla açtığınız siteler ve kullandığınız e-posta uygulaması kendi gizlilik koşullarına tabidir."],
        },
        {
          id: "storage", title: "Çerezler ve tarayıcı tercihleri",
          paragraphs: ["Mevcut site uygulamasında analiz veya reklam çerezi, üçüncü taraf ziyaretçi izleyicisi ve kullanıcı hesabı bulunmaz. Barındırma altyapısındaki teknik işlemler sağlayıcının yapılandırmasına bağlıdır.", "Alt bilgideki “Hareketi azalt” tercihini seçerseniz bu tercih cihazınızın yerel depolama alanına kaydedilir. Bu kayıt bir form mesajı veya reklam kimliği içermez ve sunucuya gönderilmez. Tercihi kapattığınızda veya site verilerini tarayıcınızdan temizlediğinizde kaldırılır; kendiliğinden sona eren bir süresi yoktur."],
        },
        {
          id: "retention", title: "Saklama ve güvenlik",
          paragraphs: ["Gönderim sınırı sayaçları, ilgili sayacın oluşturulmasından 10 dakika sonra sona erer. Bu süre yalnızca sayaçlar içindir; gönderdiğiniz e-postanın veya hizmet sağlayıcı kayıtlarının silinme süresi değildir.", "Yazışmaların saklanmasında talebin değerlendirilmesi, devam eden çalışma ilişkisi ve somut bir hukuki saklama veya hak koruma gerekliliği esas alınır. İşleme sebebi sona eren veriler silinmeli, yok edilmeli veya uygun olduğunda anonimleştirilmelidir. Mevcut uygulama, e-posta kutusu veya sağlayıcı kopyaları için otomatik ve sabit süreli bir silme mekanizması içermez; belirli bir kayıt hakkında bilgi veya silme talebinde bulunabilirsiniz.", "Formda sunucu tarafı doğrulama, istek boyutu ve kaynak kontrolü, otomatik gönderim kontrolleri ve gönderim sınırı uygulanır. E-posta hizmeti anahtarları tarayıcınıza gönderilmez. Bu tedbirler mutlak güvenlik veya hatasız iletim garantisi oluşturmaz."],
        },
        {
          id: "contact", title: "Haklarınız, iletişim ve güncellemeler",
          paragraphs: ["Kişisel verileriniz hakkında bilgi almak, düzeltme veya silme istemek ve diğer haklarınızı kullanmak için aşağıdaki adresten iletişime geçebilirsiniz. Resmî başvuru yöntemi ve yanıt süreleri KVKK aydınlatma metninde yer alır.", "Veri işleme süreçleri değiştiğinde bu politika güncellenir ve güncelleme tarihi sayfanın başında gösterilir. Politikanın yayımlanması veya siteyi ziyaret etmeniz tek başına açık rıza anlamına gelmez."],
        },
      ],
    },
    kvkk: {
      title: "KVKK aydınlatma metni.",
      description: "Web sitesi ziyaretçileri ve iletişim talebinde bulunan kişiler için kişisel verilerin işlenmesine ilişkin aydınlatma.",
      scope: "Bu metin, 6698 sayılı Kişisel Verilerin Korunması Kanunu’nun 10. maddesi kapsamında web sitesi ve iletişim kanalları üzerinden yürütülen işlemler hakkında bilgi verir. Bir açık rıza metni değildir ve form gönderimini pazarlama iznine dönüştürmez.",
      sections: [
        {
          id: "controller", title: "Veri sorumlusu",
          paragraphs: [`Veri sorumlusu ${controller}’dir. SERHATECH, bu web sitesinde kullanılan stüdyo markasıdır. Web sitesi: ${site.domain}. Kişisel verilere ilişkin iletişim ve başvuru adresi: ${site.email}.`],
        },
        {
          id: "collection", title: "Veri kategorileri ve toplama yöntemi",
          paragraphs: ["Veriler, web sitesini ziyaret etmeniz, iletişim formunu göndermeniz veya e-posta ile yazışmanız sırasında elektronik ortamda; kısmen veya tamamen otomatik yollarla ve yazışma kayıtlarının incelenmesi yoluyla toplanır."],
          items: [
            "Kimlik ve iletişim: ad soyad, e-posta adresi; tercihinize bağlı telefon numarası ve şirket veya marka adı.",
            "Talep içeriği: yardım istediğiniz konu, mesaj, isteğe bağlı başlangıç zamanı, geri arama tercihi ve sonrasındaki yazışmalar.",
            "İşlem güvenliği: isteğin IP adresi, bundan üretilen anahtarlı özet, gönderim zamanı ve kimliği, gönderim sayıları ile otomatik gönderim kontrolü bilgileri.",
            "Tercih bilgisi: yalnızca seçmeniz hâlinde cihazda tutulan hareketi azaltma ayarı. Bu tercih sunucuya aktarılmaz.",
          ],
        },
        {
          id: "basis", title: "İşleme amaçları ve hukuki sebepler",
          items: [
            "Proje ve teklif taleplerinin değerlendirilmesi, kapsam ve çalışma koşullarının görüşülmesi: kurulması veya ifası düşünülen sözleşmeyle doğrudan ilgili ve gerekli olan veriler için Kanun m. 5/2(c). İletişim bilgileri, talep içeriği ve varsa şirket bilgisi bu kapsamda değerlendirilir.",
            "Genel sorulara yanıt verilmesi ve istenen geri aramanın yapılması: iletişimi yürütmeye yönelik meşru menfaat kapsamında, temel hak ve özgürlüklerinize zarar vermemek kaydıyla Kanun m. 5/2(f). Telefon yalnızca isteğe bağlı geri arama amacıyla kullanılır.",
            "Spam ve kötüye kullanımın önlenmesi, hizmetin güvenli ve erişilebilir tutulması: ölçülü işlem güvenliği verileri için Kanun m. 5/2(f) kapsamında meşru menfaat.",
            "Bir uyuşmazlıkta gerekli yazışmaların korunması: yalnızca somut bir hakkın kurulması, kullanılması veya korunması için zorunlu olduğu ölçüde Kanun m. 5/2(e). Yetkili makamın hukuken geçerli bilgi talebi varsa ilgili hukuki yükümlülüğün yerine getirilmesi için Kanun m. 5/2(ç).",
          ],
          paragraphs: ["Zorunlu alanlar olmadan form üzerinden talep iletilemez; bunun yerine doğrudan e-posta kullanabilirsiniz. İsteğe bağlı alanları doldurmamak formu kullanmanıza engel olmaz. Gereksiz üçüncü kişi verileri ve özel nitelikli kişisel veriler paylaşmamanız beklenir. İletişim bilgileri reklam listesi oluşturmak için toplanmaz."],
        },
        {
          id: "recipients", title: "Alıcılar ve aktarım amaçları",
          items: [
            "Resend, e-posta iletimi için formda gönderdiğiniz bilgileri işler ve mesajı SERHATECH’in e-posta kutusuna iletir.",
            "Upstash Redis, gönderim sınırlandırması için ham IP yerine anahtarlı özet ve sayaç değerlerini işler; mesaj içeriği ve formdaki iletişim bilgileri bu sisteme aktarılmaz.",
            "Site barındırma ve gelen e-posta altyapısı sağlayıcıları, kendi hizmetlerini sunmak için gerekli istek veya yazışma verilerini işler.",
            "Yetkili kamu kurumları ve yargı mercilerine, hukuken geçerli bir talep veya yükümlülük olduğunda yalnızca gerekli bilgiler aktarılabilir.",
          ],
        },
        {
          id: "international", title: "Yurt dışı hizmet sağlayıcıları",
          paragraphs: ["Resend ve Upstash’ın kullanıldığı e-posta iletimi ve güvenlik süreçleri, kişisel verilerin yurt dışında işlenmesini veya yurt dışından erişilmesini içerebilir. Kullanılan hizmetin veri bölgesi, alt hizmet sağlayıcıları ve e-posta kutusu altyapısı aktarımın kapsamını etkiler.", "Yurt dışı aktarım için Kanun’un 9. maddesindeki koşulların ayrıca sağlanması gerekir. Bu metin, sağlayıcılarla Kurulun standart sözleşmesinin imzalandığı, bildirim yapıldığı veya belirli bir aktarım güvencesinin mevcut olduğu yönünde bir beyan içermez. Formu göndermek tek başına yurt dışı aktarım için açık rıza sayılmaz. İlgili aktarımın alıcıları ve uygulanan güvenceler hakkında aşağıdaki iletişim adresinden bilgi isteyebilirsiniz."],
        },
        {
          id: "retention", title: "Saklama esasları",
          paragraphs: ["Upstash gönderim sayaçları, oluşturuldukları andan itibaren 10 dakikalık süreyle tutulur. Anahtarlı IP özetiyle ilişkili sayaç da bu süreye tabidir. Ham IP’nin bu sayaç sistemine kaydedilmemesi, barındırma altyapısında hiçbir erişim kaydı oluşmadığı anlamına gelmez.", "Talep ve yazışmalar için saklama ölçütü; talebin sonuçlandırılması, varsa çalışma ilişkisinin yürütülmesi ve zorunlu hukuki yükümlülük veya somut hak koruma ihtiyacıdır. Tüm mesajlar için geçerli tek bir otomatik silme süresi tanımlanmamıştır. İşleme şartları ortadan kalktığında silme, yok etme veya anonimleştirme uygulanması gerekir; belirli kaydınızın durumu için başvurabilirsiniz."],
        },
        {
          id: "rights", title: "Kanun’un 11. maddesi kapsamındaki haklarınız",
          items: [
            "Verilerinizin işlenip işlenmediğini öğrenme; işlenmişse buna ilişkin bilgi isteme.",
            "İşleme amacını ve verilerin bu amaca uygun kullanılıp kullanılmadığını öğrenme; yurt içindeki veya yurt dışındaki alıcıları bilme.",
            "Eksik ya da yanlış verilerin düzeltilmesini isteme.",
            "Kanun’un 7. maddesindeki koşullar oluştuğunda silme veya yok etme isteme; düzeltme ve silme işlemlerinin verilerin aktarıldığı üçüncü kişilere bildirilmesini talep etme.",
            "Sadece otomatik analiz sonucunda aleyhinize bir sonuç oluşmasına itiraz etme; hukuka aykırı işleme nedeniyle zarar doğmuşsa giderilmesini talep etme.",
          ],
        },
        {
          id: "contact", title: "Başvuru ve yanıt süreci",
          paragraphs: [
            `Daha önce tarafımıza bildirdiğiniz ve yazışma kayıtlarımızda bulunan e-posta adresinizden ${site.email} adresine, konusu “KVKK Başvurusu” olan bir ileti gönderebilirsiniz. Bu adres sıradan bir e-posta adresidir; KEP adresi değildir. Kanun ve Başvuru Tebliği’nde öngörülen diğer başvuru yöntemlerine ilişkin haklarınız saklıdır.`,
            "Başvurunuzda ad soyadınızı, açık talebinizi ve Tebliğ’in gerektirdiği kimlik ve tebligat bilgilerini belirtin; yazılı başvuruda imza gerekir. Tebliğ’deki zorunlu unsurlar ve yöntemler için aşağıdaki resmî başvuru açıklamasını inceleyebilirsiniz. Talebinizle ilgisiz veri veya kimlik belgesi kopyası göndermeyin. Kimlik doğrulaması gerektiğinde talebin niteliğine uygun ve ölçülü bilgi istenebilir.",
            "Usulüne uygun başvurular mümkün olan en kısa sürede ve en geç 30 gün içinde yanıtlanır. Başvuru kural olarak ücretsizdir; ayrıca maliyet doğarsa yalnızca Kurulun belirlediği tarifeye göre ücret alınabilir. Yanıtın yetersiz olması, ret veya süresinde yanıt verilmemesi durumunda Kanun’un 14. maddesindeki koşul ve sürelerle Kurula şikâyet hakkınız bulunur.",
          ],
        },
      ],
    },
  },
  en: {
    privacy: {
      title: "Privacy policy.",
      description: "Clear information about what you share, how it is used and the privacy choices available to you.",
      scope: `This policy covers visits to ${site.domain} and communications with SERHATECH. Processing carried out by software developed for clients is addressed separately in the relevant project documentation and agreements.`,
      sections: [
        {
          id: "operator", title: "Website operator and scope",
          paragraphs: [`The website is operated by ${controller}. For privacy questions or requests concerning your personal data, contact ${site.email}. The purposes, legal bases and rights under Turkish data protection law are explained in the separate data protection notice.`],
        },
        {
          id: "information", title: "Information collected",
          items: [
            "The contact form requires your name, email address, enquiry subject and message. Company or brand name, phone number, preferred start time and a call-back request are optional. A phone number is required if you request a call back.",
            "If you email directly, your email address, message and other information you choose to include are received. Email links open the email application on your device.",
            "Form security uses submission timing, a submission identifier and automated-submission checks. The IP address is processed during the request; the rate-limiting service receives a keyed hash rather than the raw IP. This hash is not treated as anonymous data.",
            "The hosting infrastructure processes technical information such as IP addresses and request details to serve the website. The scope and retention of infrastructure logs depend on the provider’s configuration.",
          ],
          paragraphs: ["Please do not include identity documents, payment card details, passwords, health information or other personal data that are unnecessary for your enquiry. The form is not designed to collect this information."],
        },
        {
          id: "purposes", title: "How information is used",
          paragraphs: ["The information you share is used to understand your enquiry, assess the project scope, discuss a proposal or working arrangements, and reply. A phone number is used to fulfil a requested call back; providing it does not authorise advertising calls.", "Technical checks limit spam, abuse and excessive submissions. Using the contact form does not subscribe you to marketing. The website has no advertising-targeting or visitor-profiling feature."],
        },
        {
          id: "providers", title: "Email and infrastructure services",
          items: [
            "Resend delivers the contact and enquiry details from your form to SERHATECH’s inbox by email. Your email address is used as the reply-to address.",
            "Upstash Redis holds a submission counter associated with a keyed IP hash and an overall submission counter to prevent abuse. Your name, email address, phone number and message are not stored in this counter system.",
            "Hosting and mailbox infrastructure carry out the technical processing needed to serve the website and receive correspondence. The application has no separate customer or message database; copies may exist in the mailbox and service-provider systems.",
          ],
          paragraphs: ["Using overseas providers such as Resend and Upstash may involve processing outside Türkiye. The scope and legal conditions of transfers are addressed in the data protection notice. External websites and the email application you use have their own privacy terms."],
        },
        {
          id: "storage", title: "Cookies and browser preferences",
          paragraphs: ["The current website application has no analytics or advertising cookies, third-party visitor trackers or user accounts. Technical processing by the hosting infrastructure depends on the provider’s configuration.", "If you select “Reduce motion” in the footer, the preference is saved in local storage on your device. It contains no form message or advertising identifier and is not sent to the server. It is removed when you turn the preference off or clear the site’s browser data; it has no automatic expiry."],
        },
        {
          id: "retention", title: "Retention and security",
          paragraphs: ["Submission counters expire 10 minutes after the relevant counter is created. This applies only to the counters, not to deletion of your email or service-provider records.", "Retention of correspondence depends on handling the enquiry, any ongoing working relationship, and a specific legal retention or legal-claims requirement. Data whose processing basis has ended must be erased, destroyed or, where appropriate, anonymised. The current application does not implement automatic deletion after a fixed period for mailbox or provider copies; you can request information or erasure concerning a specific record.", "The form uses server-side validation, request size and origin checks, automated-submission checks and rate limiting. Email service credentials are not sent to your browser. These measures do not constitute a guarantee of absolute security or error-free delivery."],
        },
        {
          id: "contact", title: "Your rights, contact and updates",
          paragraphs: ["Contact the address below to ask about your data, request correction or erasure, or exercise your other rights. Formal request methods and response deadlines are explained in the data protection notice.", "This policy is updated when processing arrangements change; its revision date appears at the top. Publishing this policy or visiting the website does not by itself constitute explicit consent."],
        },
      ],
    },
    kvkk: {
      title: "Data protection notice.",
      description: "Information on personal data processing for website visitors and people contacting SERHATECH.",
      scope: "This notice explains processing through the website and contact channels under Article 10 of Türkiye’s Personal Data Protection Law No. 6698 (KVKK). It is not an explicit-consent statement and does not turn a contact enquiry into marketing permission.",
      sections: [
        {
          id: "controller", title: "Data controller",
          paragraphs: [`The data controller is ${controller}. SERHATECH is the studio brand used on this website. Website: ${site.domain}. Contact and data subject request address: ${site.email}.`],
        },
        {
          id: "collection", title: "Data categories and collection methods",
          paragraphs: ["Data are collected electronically when you visit the website, submit the contact form or correspond by email, through partly or fully automated means and review of correspondence records."],
          items: [
            "Identity and contact: name and email address; optionally a phone number and company or brand name.",
            "Enquiry content: subject, message, optional start time, call-back preference and subsequent correspondence.",
            "Transaction security: request IP address, its keyed hash, submission time and identifier, submission counts and automated-submission check information.",
            "Preference: a reduced-motion setting stored on your device only if selected. This preference is not transmitted to the server.",
          ],
        },
        {
          id: "basis", title: "Purposes and legal bases",
          items: [
            "Assessing project and proposal enquiries and discussing scope and working terms: Article 5(2)(c), where processing is necessary and directly related to entering into or performing the contemplated contract. Relevant contact details, enquiry content and company information are assessed on that basis.",
            "Answering general questions and making a requested call back: the legitimate interest in handling communications under Article 5(2)(f), provided your fundamental rights and freedoms are not harmed. Phone numbers are used only for the optional call back.",
            "Preventing spam and abuse and keeping the service secure and available: proportionate security processing based on legitimate interests under Article 5(2)(f).",
            "Preserving necessary correspondence in a dispute: Article 5(2)(e), only as needed to establish, exercise or protect a specific right. A legally valid authority request is handled under Article 5(2)(ç) where necessary to comply with the relevant legal obligation.",
          ],
          paragraphs: ["The form cannot be submitted without its required fields; you may email directly instead. Optional fields are not required to use the form. Please do not share unnecessary third-party data or special categories of personal data. Contact information is not collected to create advertising lists."],
        },
        {
          id: "recipients", title: "Recipients and transfer purposes",
          items: [
            "Resend processes the submitted form details to deliver your enquiry to SERHATECH’s mailbox.",
            "Upstash Redis processes a keyed hash rather than the raw IP address, together with counters, for rate limiting. Message content and form contact details are not transferred to this system.",
            "Website hosting and incoming-email infrastructure providers process request or correspondence data necessary to provide their respective services.",
            "Authorised public bodies and courts may receive necessary information in response to a legally valid request or obligation.",
          ],
        },
        {
          id: "international", title: "Overseas service providers",
          paragraphs: ["Email delivery and security processes using Resend and Upstash may involve processing outside Türkiye or access from abroad. The configured data region, subprocessors and mailbox infrastructure affect the scope of any transfer.", "An international transfer must separately satisfy Article 9 of the Law. This notice does not assert that the Board’s standard contract has been signed, a notification has been made or a particular transfer safeguard is in place. Submitting the form does not by itself constitute explicit consent to an international transfer. You may request details of relevant recipients and safeguards using the contact address below."],
        },
        {
          id: "retention", title: "Retention criteria",
          paragraphs: ["Upstash submission counters are retained for 10 minutes from their creation, including the counter associated with the keyed IP hash. Not storing raw IP addresses in this counter system does not mean the hosting infrastructure creates no access logs.", "Enquiries and correspondence are retained by reference to resolving the enquiry, conducting any working relationship, and a necessary legal obligation or specific legal-claims need. No single automatic deletion period is configured for all messages. When the processing conditions end, erasure, destruction or anonymisation is required; you may enquire about the status of a particular record."],
        },
        {
          id: "rights", title: "Your rights under Article 11",
          items: [
            "Learn whether your personal data are processed and request information about that processing.",
            "Learn the purpose and whether use matches it, and identify recipients in Türkiye or abroad.",
            "Request correction of incomplete or inaccurate data.",
            "Request erasure or destruction when Article 7 conditions apply, and notification of correction or erasure to recipients of the data.",
            "Object to an adverse result produced solely by automated analysis, and seek compensation for damage caused by unlawful processing.",
          ],
        },
        {
          id: "contact", title: "Requests and responses",
          paragraphs: [
            `You may email ${site.email} with the subject “KVKK Request” from an email address you previously supplied and that appears in our correspondence records. This is an ordinary email address, not a registered electronic mail (KEP) address. Your rights to use other methods recognised by the Law and the Communiqué on Applications to Data Controllers remain unaffected.`,
            "Include your name, a clear request and the identity and service-address details required by the Communiqué; written applications require a signature. Consult the official procedural guidance linked below for mandatory information and methods. Do not send unrelated information or identity document copies. Where verification is needed, proportionate information appropriate to the request may be requested.",
            "Valid requests are answered as soon as possible and within 30 days at the latest. Requests are generally free; additional costs may be charged only according to the Board’s tariff. If a request is rejected, the response is insufficient or no response is received on time, you may complain to the Board subject to Article 14 conditions and deadlines.",
          ],
        },
      ],
    },
  },
};
