<div align="center">

# gkatar

**Windows için terminal tabanlı sistem yönetim ve geliştirici araç kutusu**

[![npm version](https://img.shields.io/npm/v/gkatar?style=flat-square&color=00d4ff)](https://www.npmjs.com/package/gkatar)
[![license](https://img.shields.io/badge/license-MIT-purple?style=flat-square)](LICENSE)
[![platform](https://img.shields.io/badge/platform-Windows-0078D6?style=flat-square&logo=windows)](https://github.com/gokhankatar/gkatar)
[![node](https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square&logo=node.js)](https://nodejs.org)

*Türkçe & İngilizce komut desteği · Renkli terminal çıktısı · PowerShell entegrasyonu*

[Özellikler](#-özellikler) · [Kurulum](#-kurulum) · [Komutlar](#-komutlar) · [Örnekler](#-örnekler) · [Geliştirme](#-geliştirme)

</div>

---

## 🎯 Nedir?

**gkatar**, Windows PowerShell ve terminal üzerinde çalışan, sistem yönetimi ve geliştirici işlerini tek bir CLI'da toplayan araç kutusudur.

Disk temizliğinden port yönetimine, winget paket işlemlerinden Docker temizliğine kadar günlük ihtiyaçlarını hızlıca halledebilirsin — **Türkçe komutlarla**.

```
gkatar temizle gecici
gkatar bilgi
gkatar port kapat 3000
gkatar islem ara chrome
```

---

## ✨ Özellikler

| | |
|---|---|
| 🇹🇷 **Türkçe komutlar** | `temizle`, `bilgi`, `islem`, `portlar`, `guncelle` ve daha fazlası |
| 🎨 **Renkli çıktı** | Gradient banner, boxen kutular, cli-table3 tablolar |
| ⏳ **Animasyonlu loader** | ora spinner ile işlem takibi |
| 🪟 **Windows native** | PowerShell, WMI, winget entegrasyonu |
| 👨‍💻 **Dev araçları** | npm, pnpm, bun cache + Docker yönetimi |
| 📜 **Log sistemi** | `~/.gkatar/gkatar.log` dosyasına otomatik kayıt |

---

## 📦 Kurulum

### npm ile global kurulum

```powershell
npm install -g gkatar
```

### Kaynaktan kurulum

```powershell
git clone https://github.com/gokhankatar/gkatar.git
cd gkatar
npm install
npm run build
npm link
```

### Gereksinimler

- Windows 10 / 11
- Node.js 18+
- PowerShell 5.1+
- winget *(paket yönetimi komutları için)*

---

## 🚀 Hızlı Başlangıç

```powershell
# Yardım menüsü (gradient banner + tüm komutlar)
gkatar yardim

# Sistem bilgisi
gkatar bilgi

# Temp dosyalarını temizle
gkatar temizle gecici

# 3000 portunu kullanan işlemi kapat
gkatar port kapat 3000

# Versiyon
gkatar surum
```

---

## 📋 Komutlar

### 🧹 Temizlik

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar temizle` | `gkatar clean` | Tam sistem temizliği |
| `gkatar temizle gecici` | `gkatar clean temp` | Sadece temp dosyaları |
| `gkatar temizle onbellek` | `gkatar clean cache` | Cache temizliği |
| `gkatar temizle onyukleme` | `gkatar clean prefetch` | Prefetch temizliği |
| `gkatar temizle geri-donusum` | `gkatar clean recycle` | Geri dönüşüm kutusu |
| `gkatar temizle dns` | `gkatar clean dns` | DNS önbelleği |
| `gkatar analiz` | `gkatar analyze` | Temizlenebilir alan analizi |
| `gkatar rapor` | `gkatar report` | Disk ve sistem raporu |

### 💻 Sistem Bilgileri

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar bilgi` | `gkatar info` | Bilgisayar bilgileri |
| `gkatar disk` | `gkatar disk` | Disk bilgileri |
| `gkatar bellek` | `gkatar ram` | RAM kullanımı |
| `gkatar islemci` | `gkatar cpu` | CPU bilgisi |
| `gkatar ekrankarti` | `gkatar gpu` | GPU bilgisi |
| `gkatar donanim` | `gkatar hardware` | Donanım özeti |
| `gkatar calisma-suresi` | `gkatar uptime` | Çalışma süresi |

### ⚙️ İşlem & Port

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar islem` | `gkatar process` | Çalışan işlemler |
| `gkatar islem ara chrome` | `gkatar process search chrome` | İşlem ara |
| `gkatar islem kapat chrome` | `gkatar process kill chrome` | İşlem kapat |
| `gkatar portlar` | `gkatar ports` | Açık portları listele |
| `gkatar port 3000` | `gkatar port 3000` | Port kontrol |
| `gkatar port kapat 3000` | `gkatar port kill 3000` | Portu kullanan işlemi kapat |

### 🌐 Ağ

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar ag` | `gkatar network` | Ağ adaptörleri |
| `gkatar ip` | `gkatar ip` | IP adresi |
| `gkatar dns` | `gkatar dns` | DNS sunucuları |
| `gkatar ping google.com` | `gkatar ping google.com` | Ping testi |

### 📦 Winget

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar guncelle` | `gkatar update` | Tüm paketleri güncelle |
| `gkatar ara vscode` | `gkatar search vscode` | Paket ara |
| `gkatar yukle vscode` | `gkatar install vscode` | Paket yükle |
| `gkatar kaldir vscode` | `gkatar uninstall vscode` | Paket kaldır |
| `gkatar yukselt vscode` | `gkatar upgrade vscode` | Paket güncelle |

### 🚀 Başlangıç Programları

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar baslangic` | `gkatar startup` | Başlangıç uygulamaları |
| `gkatar baslangic kapat discord` | `gkatar startup disable discord` | Başlangıçtan kapat |
| `gkatar baslangic ac discord -c "yol"` | `gkatar startup enable discord -c "yol"` | Başlangıca ekle |

### 📁 Dosya Araçları

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar buyuk` | `gkatar largest` | En büyük dosyalar |
| `gkatar bul "*.log"` | `gkatar find "*.log"` | Dosya ara |
| `gkatar boyut C:\Users` | `gkatar size C:\Users` | Klasör boyutu |
| `gkatar agac C:\Projects` | `gkatar tree C:\Projects` | Klasör ağacı |

### 📜 Log & Servis

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar loglar` | `gkatar logs` | gkatar logları |
| `gkatar loglar temizle` | `gkatar logs clear` | Logları temizle |
| `gkatar olaylar` | `gkatar events` | Windows event log |
| `gkatar servisler` | `gkatar services` | Servisleri listele |
| `gkatar servis baslat spooler` | `gkatar service start spooler` | Servis başlat |
| `gkatar servis durdur spooler` | `gkatar service stop spooler` | Servis durdur |
| `gkatar servis yeniden spooler` | `gkatar service restart spooler` | Servis yeniden başlat |

### 🔐 Güvenlik

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar koruma` | `gkatar defender` | Windows Defender |
| `gkatar guvenlikduvari` | `gkatar firewall` | Firewall durumu |
| `gkatar ortam` | `gkatar env` | Ortam değişkenleri |
| `gkatar yol` | `gkatar path` | PATH değişkeni |

### 👨‍💻 Geliştirici Araçları

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar npm temizle` | `gkatar npm clean` | npm cache temizle |
| `gkatar pnpm temizle` | `gkatar pnpm clean` | pnpm cache temizle |
| `gkatar bun temizle` | `gkatar bun clean` | bun cache temizle |
| `gkatar docker` | `gkatar docker` | Docker bilgisi |
| `gkatar docker temizle` | `gkatar docker prune` | Docker temizliği |

### 🔧 Yardımcı Araçlar

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar uuid` | `gkatar uuid` | UUID üret |
| `gkatar sifre 32` | `gkatar password 32` | Güvenli şifre üret |
| `gkatar hash sha256 dosya.zip` | `gkatar hash sha256 dosya.zip` | Dosya hash hesapla |
| `gkatar qr "https://github.com"` | `gkatar qr "https://github.com"` | QR kod oluştur |

### 📋 Genel

| Türkçe | İngilizce | Açıklama |
|--------|-----------|----------|
| `gkatar yardim` | `gkatar help` | Yardım menüsü |
| `gkatar surum` | `gkatar version` | Versiyon bilgisi |

---

## 💡 Örnekler

```powershell
# Disk analizi yap, sonra temp temizle
gkatar analiz
gkatar temizle gecici

# Port 3000 meşgul mü kontrol et, meşgulse kapat
gkatar port 3000
gkatar port kapat 3000

# Chrome işlemlerini bul ve kapat
gkatar islem ara chrome
gkatar islem kapat chrome

# Tüm winget paketlerini güncelle
gkatar guncelle

# npm ve docker temizliği
gkatar npm temizle
gkatar docker temizle

# Güvenli şifre ve UUID üret
gkatar sifre 24
gkatar uuid
```

---

## 🛠️ Geliştirme

```powershell
git clone https://github.com/gokhankatar/gkatar.git
cd gkatar
npm install
npm run dev      # TypeScript watch mode
npm run build    # Derleme
```

### Proje yapısı

```
gkatar/
├── src/
│   ├── index.ts           # CLI giriş noktası
│   ├── commands/          # Komut modülleri
│   └── utils/
│       ├── aliases.ts     # Türkçe komut eşlemesi
│       ├── output.ts      # Renkli çıktı & tablolar
│       ├── spinner.ts     # Loader animasyonları
│       └── exec.ts        # PowerShell çalıştırıcı
├── package.json
└── README.md
```

---

## ⚠️ Notlar

- Bazı komutlar **yönetici yetkisi** gerektirebilir (`servis`, `prefetch`, `olaylar` vb.)
- `winget` komutları için Windows Package Manager kurulu olmalıdır
- Loglar `%USERPROFILE%\.gkatar\gkatar.log` dosyasına yazılır
- gkatar yalnızca **Windows** üzerinde çalışır

---

## 📄 Lisans

[MIT](LICENSE) © [Gökhan Katar](https://github.com/gokhankatar)

---

<div align="center">

**gkatar** ile Windows terminalini güçlendir 🚀

⭐ Beğendiysen yıldız vermeyi unutma!

</div>
