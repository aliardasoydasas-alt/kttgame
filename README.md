# Kültür ve Turizm Topluluğu Stand Yarışma Uygulaması

Windows masaüstünde çalışmak üzere hazırlanmış, offline kullanılabilen Electron + React + TypeScript tabanlı bir stand/kiosk yarışma uygulamasıdır.

## Özellikler

- 90 saniyelik görsel turizm bilgi yarışması
- Yarışmacı adı + isteğe bağlı kamera fotoğrafı
- 110 adet yerel görsel soru
- Rastgele ama tekrar etmeyen soru sırası
- Doğru/yanlış ses efektleri ve çark sesleri
- 10 ve üzeri doğru için ödül çarkı
- 10 altı doğru için ceza çarkı
- Yerel lider tablosu
- Basit şifreli yönetici paneli
- Katılımcı düzenleme, silme, sıfırlama
- Soru ekleme, düzenleme, silme
- JSON/CSV dışa aktarma
- JSON içe aktarma
- Fullscreen kiosk hissi
- ESC ile tam ekrandan çıkış
- Windows `.exe` installer üretimi
- Kurulum sırasında masaüstü kısayolu oluşturma

## Teknoloji

- Electron
- React
- TypeScript
- Vite
- Zustand
- electron-builder

## Proje Yapısı

```text
electron/               Electron main process, preload ve local veri katmanı
electron/generated/     Üretilmiş soru bankası
public/questions/       110 yerel placeholder görsel
public/sounds/          Yerel ses efektleri
public/ui/              Fallback UI görselleri
scripts/                Soru ve asset üretim scripti
src/                    React arayüzü
release/                Üretilmiş Windows çıktıları
```

## Geliştirme Ortamı

Gerekli araçlar:

- Node.js 24+

Kurulum:

```bash
npm install
```

Geliştirme modu:

```bash
npm run dev
```

Bu komut:

- Vite renderer sunucusunu başlatır
- Electron main sürecini watch modda derler
- Electron penceresini açar

## Build Alma

Önce normal production build:

```bash
npm run build
```

Windows installer ve unpacked çıktı:

```bash
npm run dist
```

Üretilen dosyalar:

- Installer: [release/Kultur ve Turizm Stand Yarismasi-Setup-1.0.0.exe](C:\Users\makina1\Documents\Codex\2026-04-30\windows-masa-st-nde-al-acak\release\Kultur%20ve%20Turizm%20Stand%20Yarismasi-Setup-1.0.0.exe)
- Unpacked uygulama: [release/win-unpacked/Kultur ve Turizm Stand Yarismasi.exe](C:\Users\makina1\Documents\Codex\2026-04-30\windows-masa-st-nde-al-acak\release\win-unpacked\Kultur%20ve%20Turizm%20Stand%20Yarismasi.exe)

Not:

- NSIS installer masaüstü kısayolu oluşturacak şekilde yapılandırılmıştır.
- Bu makinede `electron-builder` symlink yetki kısıtı nedeniyle `win.signAndEditExecutable=false` ile build alındı. Bu yüzden uygulama exe ikonunda varsayılan Electron ikonu görülebilir. İşlevi etkilemez.

## Offline Veri Saklama

Uygulama tüm veriyi local JSON dosyasında saklar.

Windows kullanıcı verisi konumu:

```text
%APPDATA%/kultur-turizm-stand-yarismasi/quiz-data.json
```

Kaydedilen alanlar:

- yarışmacı id
- ad
- fotoğraf base64 verisi
- doğru sayısı
- yanlış sayısı
- toplam cevaplanan
- başarı oranı
- sorulan soru id listesi
- ödül/ceza sonucu
- tarih/saat

## Varsayılan Yönetici Bilgisi

- Şifre: `1234`

## Görselleri Değiştirme

Şu anda sorular için yerel placeholder SVG dosyaları kullanılır. Gerçek görsellerle değiştirmek için:

1. `public/questions/` içindeki ilgili dosyayı değiştirin.
2. Gerekirse soru görsel yolunu yönetici panelinden veya soru bankasından güncelleyin.

Her soru şu yapıyı kullanır:

```ts
{
  id,
  image,
  questionText,
  options,
  correctAnswer,
  city,
  country,
  difficulty
}
```

## Asset Üretimi

Soru bankası ve placeholder varlıkları yeniden üretmek için:

```bash
npm run generate:assets
```

Bu komut:

- `electron/generated/question-bank.ts`
- `public/questions/*.svg`
- `public/sounds/*.wav`
- `public/ui/image-fallback.svg`

dosyalarını üretir/günceller.

## Doğrulama

Tamamlanan kontroller:

- `npm run typecheck`
- `npm run build`
- `npm run dist`

Ek olarak tarayıcı fallback katmanında şu akış yerel olarak doğrulandı:

- ana sayfa açılışı
- kayıt ekranına geçiş
- yarışmacı adı girip yarışmayı başlatma
- doğru cevap sonrası otomatik sıradaki soruya geçiş

## İyileştirme Fikirleri

- Gerçek fotoğraf arşivi ile placeholder görselleri değiştirme
- Yönetici şifresini değiştirme ekranı ekleme
- Çoklu etkinlik profilleri
- Ödül stoğu takibi
- Ayrı istatistik rapor ekranı
