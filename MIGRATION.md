# Kalkan Property yenileme ve geçiş planı

## Hedef ve mevcut durum

Yeni arayüz Mavi Real Estate’in İngilizce satış portföyünü, mevcut marka işaretini ve ilan referanslarını korur. Prototip 12 örnek ilan, ana sayfa, satış kataloğu, 4 kategori, 3 bölge, bölge dizini ve iletişim ekranı içerir. Arama, bütçe filtresi, fiyat sıralaması, yerel favoriler, galeri ve ilan referansı içeren WhatsApp bağlantısı çalışır. Hakkımızda, hizmetler ve alıcı rehberi mevcut siteye bağlanır. Demo fiyatları ve durumları sitenin inceleme anındaki verileridir.

Canlı sitemap 316 benzersiz adres listeliyor. `migration/legacy-urls.csv` bu envanteri ve ilk geçiş kararını içerir. 52 kök URL için aynı son parçaya sahip bir `/properties/` veya `/locations/` adresi bulundu. Aynı slug, aynı içerik anlamına gelmediği için HTTP kodu ve içerik eşlemesi ayrı yapılmalıdır.

| Örnek | Canlı sitede gözlenen durum | Geçiş kararı |
| --- | --- | --- |
| `/villas`, `/kalamar`, `/locations/kalkan` | HTTP 200 içinde uygulamanın 404 ekranı | Gerçek karşılık doğrulanırsa doğrudan 301, karşılık yoksa gerçek 404 veya 410 |
| `/properties/villas`, `/locations/kalamar`, `/kalkan` | HTTP 200 ve katalog bileşeni | Mevcut sayfa ve amacını koru. Alternatif adresleri içerik eşleşmesine göre değerlendir |
| `/property-for-sale`, `/properties` | İkisi de HTTP 200 ve katalog bileşeni | İçerik, sorgu ve backlink verisine göre ayrı sayfa veya 301 kararı ver |
| `/`, `/properties`, `/contact-us` ve incelenen kategori/bölge örnekleri | Örnek HTML’de canonical görülmedi. OG görseli boş | Sayfa başına canonical ve geçerli OG görseli üret |
| `/robots.txt` | Taramaya izin veriyor. Sitemap bildirimi yok | Canlı sürümde sitemap index adresini ekle |

Kaynaklar

- [Canlı sitemap](https://www.kalkanproperty.com/sitemap.xml)
- [Canlı robots.txt](https://www.kalkanproperty.com/robots.txt)
- [Google site geçişleri](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)

## 1. URL ve veri eşlemesi

1. XML envanterini Search Console açılış sayfaları, organik trafik verisi, backlink hedefleri, mevcut veritabanı ve gerçek tarama sonuçlarıyla birleştir. Başlangıç tablosu 316 sitemap kaydını kapsıyor. Search Console, özel yönetim paneli ve sunucu kayıtları kapsam dışı kaldı.
2. İlanlarda gerçek URL’yi, büyük/küçük harf ve slug yazımını, referans kodunu, durumu, fiyat ve para birimini, fotoğraf sırasını ve yayın tarihlerini taşı. Medya URL’leri için aynı korumayı uygula veya bire bir eşle. Kategori, içerik, rehber ve bölge ilişkilerini koru.
3. Her URL’yi HTTP kodu, etkili URL, görünür sayfa türü, canonical, index durumu ve yeni hedefle kaydet. Korunan adrese 200 ve kendine işaret eden canonical ver. Zorunlu değişiklikte bire bir sunucu 301 kullan. Tek sıçrama hedefle, tüm eski adresleri ana sayfaya gönderme.
4. Satılmış ilan durumunu veri modelinde sakla. Arama değeri ve güncel bilgi varsa sayfayı açıkça satılmış olarak tut, uygun alternatifler göster ve aktif teklif şemasını kaldır. Satılmış sayfanın canonical ve sitemap kararını indeksleme politikasına göre ver.
5. Yayından önce 316 URL’nin tamamını ve envantere eklenenleri tekrar tara. İç 404, soft 404, yönlendirme zinciri, canonical çakışması ve organik trafik taşıyan kayıp URL kalmadığını kontrol et.

## 2. Uygulama mimarisi

İlk aşamada mevcut Laravel/Inertia rotalarını ve admin veri modelini doğrula. Canlı HTML’de Inertia sayfa verisi ve uygulama rotaları gözleniyor. Üretim koduna erişim doğrulandığında yeni React/Astryx katmanını bu veri modeline bağla, URL sözleşmesini koru ve herkese açık sayfaların ilk HTML yanıtında içeriği sunmak için SSR kullan. Prototip aynı prensibi derleme aşamasında HTML üreterek gösteriyor.

| Katman | Üretim tasarımı |
| --- | --- |
| Kamuya açık sayfalar | Ana sayfa, portföy, kategori/bölge açılış sayfaları, ilan, alıcı rehberi, hakkımızda, hizmetler, iletişim |
| İlan modeli | Kalıcı kimlik ve referans, yönlendirmeli slug geçmişi, metin, fiyat/para birimi, durum, tip, konum, galeri ve SEO alanları |
| Filtreler | Konum, tip, fiyat, oda ve durum. Sunucuda sayfalama ve sıralama. Sadece değerli ve editoryal içerikli filtre kombinasyonlarına kalıcı açılış sayfası |
| Yönetim | Mevcut ilan ve içerik yönetimini koru. Yayın, satış durumu, görsel sırası, alt metin, meta önizleme ve değişiklik geçmişi |
| İletişim | İlan referansı ile WhatsApp, telefon ve e-posta. Üretim formu eklenirse CRM veya panelde kaynak sayfa ve temas kaydı |

## 3. SEO ve sosyal paylaşım

- İlk HTML yanıtında benzersiz title, açıklama, tek ana başlık, canonical, iç linkler ve JSON-LD. İlan ve rehber metni HTML içinde bulunur.
- `/sitemap.xml` indexi altında sayfa, ilan ve bölge kümeleri. Canlı üretici yalnızca 200 dönen, indekslenebilir canonical URL’leri listeler. `lastmod`, içerik gerçekten değiştiğinde güncellenir. Demo XML örneği 23 prototip sayfasını kapsar.
- Ana sayfa ve iletişimde `RealEstateAgent`, ana sayfada `WebSite`, kategori ve bölgelerde `CollectionPage` ve `ItemList`, alt sayfalarda `BreadcrumbList`, ilanlarda `RealEstateListing` ve uygun aktif ilanlarda `Offer`. Fiyat, para birimi ve durum görünür sayfa verisiyle eşleşir. Yapılandırılmış veri arama görünümü garantisi vermez.
- OG ve X paylaşım etiketlerinde URL, başlık, açıklama ve mutlak görsel URL’si. Üretimde ilan başına 1200 × 630 paylaşım görseli ve site geneli yedek görsel üret. Canlı ortamda görsel ve HTML HTTP yanıtlarını test et.
- Parametre filtrelerini temiz kanonik sayfalardan ayır. Sıralama ve takip parametrelerinde içeriğin eşdeğerliğine göre canonical kullan. Filtre tarama stratejisini URL envanterine göre belirle, sayfalama linklerini HTML içinde erişilebilir tut.
- Yeni dil açılırsa yalnızca gerçekten çevrilmiş eşdeğer sayfalara karşılıklı `hreflang` ekle. Mevcut İngilizce adresler korunur.
- Mobilde hero için boyutlandırılmış WebP/AVIF ve öncelikli yükleme kullan. Fotoğraf listesinde responsive görseller ve lazy loading. Yayından önce ana sayfa, kategori ve ilan şablonlarında LCP, INP ve CLS ölç.

Kaynaklar

- [Google canonical rehberi](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google sitemap rehberi](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Schema.org RealEstateListing](https://schema.org/RealEstateListing)
- [Open Graph Protocol](https://ogp.me/)

## 4. GEO ve yerel bulunabilirlik

İlanı anlamak için tip, durum, GBP fiyatı, ilan referansı, konum ve temel özellikleri metin olarak ver. Mahalle bilgisini kategori etiketlerinden ayır. Doğrulanmış bilgileri kullan. Bölge rehberlerinde her sayfa için açık bir bölge özeti, yerel ekibin inceleme tarihi, özgün fotoğraflar ve o bölgedeki ilgili ilanlar yer alsın. Ofis adı, adres ve telefonun web sitesiyle Google Business Profile kaydında aynı yazıldığını doğrula. Mevcut alıcı rehberini ilanlara, bölgelere ve iletişim sayfasına bağla.

Google AI Overviews ve AI Mode için indekslenebilir, snippet göstermeye uygun ve yararlı içerik temel gereksinimdir. İçerik ve yapılandırılmış veri birbiriyle tutarlı olmalıdır.

- [Google AI özellikleri ve web siteniz](https://developers.google.com/search/docs/appearance/ai-features)

## 5. Yayın sırası

1. Arayüzü onayla, mevcut repo ve veri yedeğini al, rotaları envanterle karşılaştır.
2. SSR, ilan yönetimi ve yönlendirme eşlemelerini test ortamında tamamla.
3. Tam taramayı, XML, JSON-LD, OG, mobil performans ve iletişim akışını doğrula.
4. Canlıya geçerken üretim robots/canonical ayarlarını kontrol et, sitemap indexi Search Console’a gönder ve örnek URL’leri denetle.
5. İlk haftalarda eski ve yeni URL’lerin 404/soft 404, index, organik açılış ve talep verisini haftalık karşılaştır. Sorunlu eşlemeleri düzelt, değişiklikleri kayıt altında tut.

## Prototipi çalıştırma

Node.js 22.12+ ile `npm ci`, ardından `npm run dev`. Statik ve ilk yanıtta HTML içeren çıktı için `npm run build`, test için `npx vite preview`. Önizleme tüm sayfalarda `noindex` içerir. Üretim sitemap örnekleri `migration/sitemap-example/` içinde tutulur. Bu dosyalar tam canlı katalog ve kesin URL eşlemeleri tamamlandıktan sonra üretim verisinden yeniden oluşturulmalıdır.
