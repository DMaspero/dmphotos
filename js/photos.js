const CATEGORIES = ["travel", "landscape", "animals", "night", "urban", "event", "macro"];
const PHOTOS = [
  {
    "file": "01-11-2023_001.jpg",
    "src": "images/web/01-11-2023_001.jpg",
    "srcWebp": "images/web/01-11-2023_001.webp",
    "thumb": "images/thumbs/01-11-2023_001.jpg",
    "thumbWebp": "images/thumbs/01-11-2023_001.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "mountains",
      "valley",
      "shadow",
      "barcelona",
      "spain"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF-S18-150mm F3.5-6.3 IS STM",
      "focal": "18mm",
      "aperture": "f/5.0",
      "shutter": "1/125s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "09072022-IMG_0051.jpg",
    "src": "images/web/09072022-IMG_0051.jpg",
    "srcWebp": "images/web/09072022-IMG_0051.webp",
    "thumb": "images/thumbs/09072022-IMG_0051.jpg",
    "thumbWebp": "images/thumbs/09072022-IMG_0051.webp",
    "w": 2048,
    "h": 1150,
    "category": "landscape",
    "tags": [
      "sea",
      "costa brava"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "9mm",
      "aperture": "f/4.0",
      "shutter": "1/500s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "13032022-13032022-IMG_0350.jpg",
    "src": "images/web/13032022-13032022-IMG_0350.jpg",
    "srcWebp": "images/web/13032022-13032022-IMG_0350.webp",
    "thumb": "images/thumbs/13032022-13032022-IMG_0350.jpg",
    "thumbWebp": "images/thumbs/13032022-13032022-IMG_0350.webp",
    "w": 1920,
    "h": 1078,
    "category": "landscape",
    "tags": [
      "sea",
      "storm",
      "cloudy"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "9mm",
      "aperture": "f/10.0",
      "shutter": "1/1000s",
      "iso": "ISO 500"
    }
  },
  {
    "file": "16-03-2024_001-3.jpg",
    "src": "images/web/16-03-2024_001-3.jpg",
    "srcWebp": "images/web/16-03-2024_001-3.webp",
    "thumb": "images/thumbs/16-03-2024_001-3.jpg",
    "thumbWebp": "images/thumbs/16-03-2024_001-3.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "sea",
      "costa brava",
      "rocks"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF16mm F2.8 STM",
      "focal": "16mm",
      "aperture": "f/7.1",
      "shutter": "1/250s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "16-03-2024_013.jpg",
    "src": "images/web/16-03-2024_013.jpg",
    "srcWebp": "images/web/16-03-2024_013.webp",
    "thumb": "images/thumbs/16-03-2024_013.jpg",
    "thumbWebp": "images/thumbs/16-03-2024_013.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "sea",
      "costa brava",
      "rocks"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF-S18-150mm F3.5-6.3 IS STM",
      "focal": "57mm",
      "aperture": "f/5.6",
      "shutter": "1/1000s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "16-03-2024_058.jpg",
    "src": "images/web/16-03-2024_058.jpg",
    "srcWebp": "images/web/16-03-2024_058.webp",
    "thumb": "images/thumbs/16-03-2024_058.jpg",
    "thumbWebp": "images/thumbs/16-03-2024_058.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "sea",
      "costa brava",
      "tree"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF-S18-150mm F3.5-6.3 IS STM",
      "focal": "64mm",
      "aperture": "f/6.3",
      "shutter": "1/500s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "16082021_1054.jpg",
    "src": "images/web/16082021_1054.jpg",
    "srcWebp": "images/web/16082021_1054.webp",
    "thumb": "images/thumbs/16082021_1054.jpg",
    "thumbWebp": "images/thumbs/16082021_1054.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "croatia",
      "plitvice lakes",
      "lakes"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "9mm",
      "aperture": "f/4.0",
      "shutter": "1/1000s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "16082021_1113.jpg",
    "src": "images/web/16082021_1113.jpg",
    "srcWebp": "images/web/16082021_1113.webp",
    "thumb": "images/thumbs/16082021_1113.jpg",
    "thumbWebp": "images/thumbs/16082021_1113.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "croatia",
      "plitvice lakes",
      "waterfall"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "9mm",
      "aperture": "f/11.0",
      "shutter": "1/15s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "17082021_1054.jpg",
    "src": "images/web/17082021_1054.jpg",
    "srcWebp": "images/web/17082021_1054.webp",
    "thumb": "images/thumbs/17082021_1054.jpg",
    "thumbWebp": "images/thumbs/17082021_1054.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "croatia",
      "plitvice lakes",
      "waterfall"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "25mm",
      "aperture": "f/2.8",
      "shutter": "1/1250s",
      "iso": "ISO 2000"
    }
  },
  {
    "file": "17082021_1115.jpg",
    "src": "images/web/17082021_1115.jpg",
    "srcWebp": "images/web/17082021_1115.webp",
    "thumb": "images/thumbs/17082021_1115.jpg",
    "thumbWebp": "images/thumbs/17082021_1115.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "croatia",
      "plitvice lakes",
      "waterfall"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "10mm",
      "aperture": "f/7.1",
      "shutter": "2s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "17082021_1227.jpg",
    "src": "images/web/17082021_1227.jpg",
    "srcWebp": "images/web/17082021_1227.webp",
    "thumb": "images/thumbs/17082021_1227.jpg",
    "thumbWebp": "images/thumbs/17082021_1227.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "croatia",
      "plitvice lakes",
      "lakes"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "9mm",
      "aperture": "f/4.0",
      "shutter": "1/400s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "17082021_1516.jpg",
    "src": "images/web/17082021_1516.jpg",
    "srcWebp": "images/web/17082021_1516.webp",
    "thumb": "images/thumbs/17082021_1516.jpg",
    "thumbWebp": "images/thumbs/17082021_1516.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "croatia",
      "plitvice lakes",
      "lakes"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "9mm",
      "aperture": "f/4.0",
      "shutter": "1/100s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "19-11-2023_001-2.jpg",
    "src": "images/web/19-11-2023_001-2.jpg",
    "srcWebp": "images/web/19-11-2023_001-2.webp",
    "thumb": "images/thumbs/19-11-2023_001-2.jpg",
    "thumbWebp": "images/thumbs/19-11-2023_001-2.webp",
    "w": 2048,
    "h": 1152,
    "category": "urban",
    "tags": [
      "badalona",
      "tres torres",
      "spain"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF-S18-150mm F3.5-6.3 IS STM",
      "focal": "35mm",
      "aperture": "f/8.0",
      "shutter": "1/400s",
      "iso": "ISO 160"
    }
  },
  {
    "file": "20240729-IMG_6573.jpg",
    "src": "images/web/20240729-IMG_6573.jpg",
    "srcWebp": "images/web/20240729-IMG_6573.webp",
    "thumb": "images/thumbs/20240729-IMG_6573.jpg",
    "thumbWebp": "images/thumbs/20240729-IMG_6573.webp",
    "w": 2048,
    "h": 1365,
    "category": "landscape",
    "tags": [
      "sea",
      "portugal"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF-S18-150mm F3.5-6.3 IS STM",
      "focal": "70mm",
      "aperture": "f/6.3",
      "shutter": "1/500s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "20240801-IMG_6917-Enhanced-NR.jpg",
    "src": "images/web/20240801-IMG_6917-Enhanced-NR.jpg",
    "srcWebp": "images/web/20240801-IMG_6917-Enhanced-NR.webp",
    "thumb": "images/thumbs/20240801-IMG_6917-Enhanced-NR.jpg",
    "thumbWebp": "images/thumbs/20240801-IMG_6917-Enhanced-NR.webp",
    "w": 2048,
    "h": 1152,
    "category": "animals",
    "tags": [
      "wildlife",
      "dolphin",
      "portugal"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "123mm",
      "aperture": "f/7.1",
      "shutter": "1/2000s",
      "iso": "ISO 320"
    }
  },
  {
    "file": "20240802-IMG_7594.jpg",
    "src": "images/web/20240802-IMG_7594.jpg",
    "srcWebp": "images/web/20240802-IMG_7594.webp",
    "thumb": "images/thumbs/20240802-IMG_7594.jpg",
    "thumbWebp": "images/thumbs/20240802-IMG_7594.webp",
    "w": 2048,
    "h": 1367,
    "category": "night",
    "tags": [
      "sea",
      "portugal",
      "sunset",
      "shadow"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "100mm",
      "aperture": "f/8.0",
      "shutter": "1/400s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "20240804-IMG_7776.jpg",
    "src": "images/web/20240804-IMG_7776.jpg",
    "srcWebp": "images/web/20240804-IMG_7776.webp",
    "thumb": "images/thumbs/20240804-IMG_7776.jpg",
    "thumbWebp": "images/thumbs/20240804-IMG_7776.webp",
    "w": 2048,
    "h": 1365,
    "category": "animals",
    "tags": [
      "portugal"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "100mm",
      "aperture": "f/8.0",
      "shutter": "1/1000s",
      "iso": "ISO 200"
    }
  },
  {
    "file": "20240804-IMG_7805.jpg",
    "src": "images/web/20240804-IMG_7805.jpg",
    "srcWebp": "images/web/20240804-IMG_7805.webp",
    "thumb": "images/thumbs/20240804-IMG_7805.jpg",
    "thumbWebp": "images/thumbs/20240804-IMG_7805.webp",
    "w": 2048,
    "h": 1198,
    "category": "landscape",
    "tags": [
      "rocks",
      "sea",
      "portugal"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "259mm",
      "aperture": "f/7.1",
      "shutter": "1/800s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "20240916-IMG_9604-Enhanced-NR.jpg",
    "src": "images/web/20240916-IMG_9604-Enhanced-NR.jpg",
    "srcWebp": "images/web/20240916-IMG_9604-Enhanced-NR.webp",
    "thumb": "images/thumbs/20240916-IMG_9604-Enhanced-NR.jpg",
    "thumbWebp": "images/thumbs/20240916-IMG_9604-Enhanced-NR.webp",
    "w": 2048,
    "h": 1152,
    "category": "event",
    "tags": [
      "sea",
      "barcelona",
      "2025",
      "american cup"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "400mm",
      "aperture": "f/8.0",
      "shutter": "1/640s",
      "iso": "ISO 160"
    }
  },
  {
    "file": "20250119-_B0A2112.jpg",
    "src": "images/web/20250119-_B0A2112.jpg",
    "srcWebp": "images/web/20250119-_B0A2112.webp",
    "thumb": "images/thumbs/20250119-_B0A2112.jpg",
    "thumbWebp": "images/thumbs/20250119-_B0A2112.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "montserrat",
      "barcelona",
      "trekking"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "105mm",
      "aperture": "f/8.0",
      "shutter": "1/320s",
      "iso": "ISO 160"
    }
  },
  {
    "file": "20250215-_6M22912-Edit.jpg",
    "src": "images/web/20250215-_6M22912-Edit.jpg",
    "srcWebp": "images/web/20250215-_6M22912-Edit.webp",
    "thumb": "images/thumbs/20250215-_6M22912-Edit.jpg",
    "thumbWebp": "images/thumbs/20250215-_6M22912-Edit.webp",
    "w": 2048,
    "h": 1152,
    "category": "animals",
    "tags": [
      "zoo",
      "barcelona",
      "flamingo",
      "bird"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "105mm",
      "aperture": "f/4.0",
      "shutter": "1/1600s",
      "iso": "ISO 640"
    }
  },
  {
    "file": "20250326-_6M24742-2.jpg",
    "src": "images/web/20250326-_6M24742-2.jpg",
    "srcWebp": "images/web/20250326-_6M24742-2.webp",
    "thumb": "images/thumbs/20250326-_6M24742-2.jpg",
    "thumbWebp": "images/thumbs/20250326-_6M24742-2.webp",
    "w": 2048,
    "h": 1152,
    "category": "animals",
    "tags": [
      "zoo",
      "barcelona",
      "flamingo",
      "bird"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "400mm",
      "aperture": "f/10.0",
      "shutter": "1/640s",
      "iso": "ISO 800"
    }
  },
  {
    "file": "20250428-_6M26105-6.jpg",
    "src": "images/web/20250428-_6M26105-6.jpg",
    "srcWebp": "images/web/20250428-_6M26105-6.webp",
    "thumb": "images/thumbs/20250428-_6M26105-6.jpg",
    "thumbWebp": "images/thumbs/20250428-_6M26105-6.webp",
    "w": 2048,
    "h": 1152,
    "category": "travel",
    "tags": [
      "seul",
      "royal palace",
      "lake"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "58mm",
      "aperture": "f/4.0",
      "shutter": "1/640s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "20250428-_6M26156-Pano-2.jpg",
    "src": "images/web/20250428-_6M26156-Pano-2.jpg",
    "srcWebp": "images/web/20250428-_6M26156-Pano-2.webp",
    "thumb": "images/thumbs/20250428-_6M26156-Pano-2.jpg",
    "thumbWebp": "images/thumbs/20250428-_6M26156-Pano-2.webp",
    "w": 2048,
    "h": 915,
    "category": "travel",
    "tags": [
      "seul",
      "royal palace",
      "lake"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "35mm",
      "aperture": "f/9.0",
      "shutter": "1/160s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "20250609-_6M26365-2.jpg",
    "src": "images/web/20250609-_6M26365-2.jpg",
    "srcWebp": "images/web/20250609-_6M26365-2.webp",
    "thumb": "images/thumbs/20250609-_6M26365-2.jpg",
    "thumbWebp": "images/thumbs/20250609-_6M26365-2.webp",
    "w": 2048,
    "h": 1365,
    "category": "animals",
    "tags": [
      "zoo",
      "barcelona",
      "flamingo",
      "bird"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "400mm",
      "aperture": "f/8.0",
      "shutter": "1/1250s",
      "iso": "ISO 2500"
    }
  },
  {
    "file": "20250609-_6M26551.jpg",
    "src": "images/web/20250609-_6M26551.jpg",
    "srcWebp": "images/web/20250609-_6M26551.webp",
    "thumb": "images/thumbs/20250609-_6M26551.jpg",
    "thumbWebp": "images/thumbs/20250609-_6M26551.webp",
    "w": 2048,
    "h": 1365,
    "category": "animals",
    "tags": [
      "zoo",
      "barcelona",
      "fun"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "400mm",
      "aperture": "f/10.0",
      "shutter": "1/400s",
      "iso": "ISO 6400"
    }
  },
  {
    "file": "20250609-_6M26655-2.jpg",
    "src": "images/web/20250609-_6M26655-2.jpg",
    "srcWebp": "images/web/20250609-_6M26655-2.webp",
    "thumb": "images/thumbs/20250609-_6M26655-2.jpg",
    "thumbWebp": "images/thumbs/20250609-_6M26655-2.webp",
    "w": 2048,
    "h": 1365,
    "category": "animals",
    "tags": [
      "zoo",
      "barcelona"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "400mm",
      "aperture": "f/8.0",
      "shutter": "1/1000s",
      "iso": "ISO 4000"
    }
  },
  {
    "file": "20250804-_6M27081.jpg",
    "src": "images/web/20250804-_6M27081.jpg",
    "srcWebp": "images/web/20250804-_6M27081.webp",
    "thumb": "images/thumbs/20250804-_6M27081.jpg",
    "thumbWebp": "images/thumbs/20250804-_6M27081.webp",
    "w": 2048,
    "h": 1365,
    "category": "landscape",
    "tags": [
      "donostia",
      "basque country",
      "spain"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "105mm",
      "aperture": "f/9.0",
      "shutter": "1/640s",
      "iso": "ISO 200"
    }
  },
  {
    "file": "20250811-_6M28805.jpg",
    "src": "images/web/20250811-_6M28805.jpg",
    "srcWebp": "images/web/20250811-_6M28805.webp",
    "thumb": "images/thumbs/20250811-_6M28805.jpg",
    "thumbWebp": "images/thumbs/20250811-_6M28805.webp",
    "w": 2048,
    "h": 1365,
    "category": "landscape",
    "tags": [
      "portugal",
      "picos d'europa",
      "covadonga's lake",
      "lakes",
      "cow"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "24mm",
      "aperture": "f/6.3",
      "shutter": "1/800s",
      "iso": "ISO 200"
    }
  },
  {
    "file": "20250824-_6M21691.jpg",
    "src": "images/web/20250824-_6M21691.jpg",
    "srcWebp": "images/web/20250824-_6M21691.webp",
    "thumb": "images/thumbs/20250824-_6M21691.jpg",
    "thumbWebp": "images/thumbs/20250824-_6M21691.webp",
    "w": 2048,
    "h": 1365,
    "category": "animals",
    "tags": [
      "wildlife",
      "frog",
      "cataluña"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "105mm",
      "aperture": "f/4.0",
      "shutter": "1/320s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "20260105-_6M23363.jpg",
    "src": "images/web/20260105-_6M23363.jpg",
    "srcWebp": "images/web/20260105-_6M23363.webp",
    "thumb": "images/thumbs/20260105-_6M23363.jpg",
    "thumbWebp": "images/thumbs/20260105-_6M23363.webp",
    "w": 2048,
    "h": 1280,
    "category": "landscape",
    "tags": [
      "sea",
      "rocks",
      "storm",
      "wind",
      "minorca",
      "spain"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "248mm",
      "aperture": "f/8.0",
      "shutter": "1/1250s",
      "iso": "ISO 800"
    }
  },
  {
    "file": "20260221-_6M24624.jpg",
    "src": "images/web/20260221-_6M24624.jpg",
    "srcWebp": "images/web/20260221-_6M24624.webp",
    "thumb": "images/thumbs/20260221-_6M24624.jpg",
    "thumbWebp": "images/thumbs/20260221-_6M24624.webp",
    "w": 2048,
    "h": 1365,
    "category": "animals",
    "tags": [
      "zoo",
      "barcelona"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "400mm",
      "aperture": "f/8.0",
      "shutter": "1/1250s",
      "iso": "ISO 4000"
    }
  },
  {
    "file": "20260502-_6M27702.jpg",
    "src": "images/web/20260502-_6M27702.jpg",
    "srcWebp": "images/web/20260502-_6M27702.webp",
    "thumb": "images/thumbs/20260502-_6M27702.jpg",
    "thumbWebp": "images/thumbs/20260502-_6M27702.webp",
    "w": 2048,
    "h": 1365,
    "category": "animals",
    "tags": [
      "delta ebro",
      "bird",
      "cataluña"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "400mm",
      "aperture": "f/8.0",
      "shutter": "1/2000s",
      "iso": "ISO 320"
    }
  },
  {
    "file": "20260502-_6M28183.jpg",
    "src": "images/web/20260502-_6M28183.jpg",
    "srcWebp": "images/web/20260502-_6M28183.webp",
    "thumb": "images/thumbs/20260502-_6M28183.jpg",
    "thumbWebp": "images/thumbs/20260502-_6M28183.webp",
    "w": 2048,
    "h": 1365,
    "category": "animals",
    "tags": [
      "delta ebro",
      "bird",
      "cataluña"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100-400mm F5.6-8 IS USM",
      "focal": "400mm",
      "aperture": "f/9.0",
      "shutter": "1/2500s",
      "iso": "ISO 1250"
    }
  },
  {
    "file": "20260704-_6M28630.jpg",
    "src": "images/web/20260704-_6M28630.jpg",
    "srcWebp": "images/web/20260704-_6M28630.webp",
    "thumb": "images/thumbs/20260704-_6M28630.jpg",
    "thumbWebp": "images/thumbs/20260704-_6M28630.webp",
    "w": 2048,
    "h": 1365,
    "category": "animals",
    "tags": [
      "insect"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "105mm",
      "aperture": "f/4.5",
      "shutter": "1/1000s",
      "iso": "ISO 160"
    }
  },
  {
    "file": "20260816-_6M29613.jpg",
    "src": "images/web/20260816-_6M29613.jpg",
    "srcWebp": "images/web/20260816-_6M29613.webp",
    "thumb": "images/thumbs/20260816-_6M29613.jpg",
    "thumbWebp": "images/thumbs/20260816-_6M29613.webp",
    "w": 2048,
    "h": 1365,
    "category": "macro",
    "tags": [
      "insect"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100mm F2.8 L MACRO IS USM",
      "focal": "100mm",
      "aperture": "f/14.0",
      "shutter": "1/200s",
      "iso": "ISO 3200"
    }
  },
  {
    "file": "20260818-_6M20647.jpg",
    "src": "images/web/20260818-_6M20647.jpg",
    "srcWebp": "images/web/20260818-_6M20647.webp",
    "thumb": "images/thumbs/20260818-_6M20647.jpg",
    "thumbWebp": "images/thumbs/20260818-_6M20647.webp",
    "w": 2048,
    "h": 1365,
    "category": "landscape",
    "tags": [
      "cow"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100mm F2.8 L MACRO IS USM",
      "focal": "100mm",
      "aperture": "f/8.0",
      "shutter": "1/640s",
      "iso": "ISO 200"
    }
  },
  {
    "file": "20260818-_6M20668.jpg",
    "src": "images/web/20260818-_6M20668.jpg",
    "srcWebp": "images/web/20260818-_6M20668.webp",
    "thumb": "images/thumbs/20260818-_6M20668.jpg",
    "thumbWebp": "images/thumbs/20260818-_6M20668.webp",
    "w": 2048,
    "h": 1365,
    "category": "macro",
    "tags": [
      "flower",
      "insect"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100mm F2.8 L MACRO IS USM",
      "focal": "100mm",
      "aperture": "f/13.0",
      "shutter": "1/250s",
      "iso": "ISO 5000"
    }
  },
  {
    "file": "20260818-_6M20684.jpg",
    "src": "images/web/20260818-_6M20684.jpg",
    "srcWebp": "images/web/20260818-_6M20684.webp",
    "thumb": "images/thumbs/20260818-_6M20684.jpg",
    "thumbWebp": "images/thumbs/20260818-_6M20684.webp",
    "w": 2048,
    "h": 1365,
    "category": "macro",
    "tags": [
      "flower"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100mm F2.8 L MACRO IS USM",
      "focal": "100mm",
      "aperture": "f/16.0",
      "shutter": "1/160s",
      "iso": "ISO 3200"
    }
  },
  {
    "file": "20260822-_6M21055-2.jpg",
    "src": "images/web/20260822-_6M21055-2.jpg",
    "srcWebp": "images/web/20260822-_6M21055-2.webp",
    "thumb": "images/thumbs/20260822-_6M21055-2.jpg",
    "thumbWebp": "images/thumbs/20260822-_6M21055-2.webp",
    "w": 2048,
    "h": 1365,
    "category": "macro",
    "tags": [
      "flower",
      "insect"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100mm F2.8 L MACRO IS USM",
      "focal": "100mm",
      "aperture": "f/20.0",
      "shutter": "1/400s",
      "iso": "ISO 6400"
    }
  },
  {
    "file": "20260822-_6M21087-2.jpg",
    "src": "images/web/20260822-_6M21087-2.jpg",
    "srcWebp": "images/web/20260822-_6M21087-2.webp",
    "thumb": "images/thumbs/20260822-_6M21087-2.jpg",
    "thumbWebp": "images/thumbs/20260822-_6M21087-2.webp",
    "w": 2048,
    "h": 1365,
    "category": "macro",
    "tags": [
      "flower",
      "insect"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100mm F2.8 L MACRO IS USM",
      "focal": "100mm",
      "aperture": "f/11.0",
      "shutter": "1/500s",
      "iso": "ISO 1250"
    }
  },
  {
    "file": "20260822-_6M21240.jpg",
    "src": "images/web/20260822-_6M21240.jpg",
    "srcWebp": "images/web/20260822-_6M21240.webp",
    "thumb": "images/thumbs/20260822-_6M21240.jpg",
    "thumbWebp": "images/thumbs/20260822-_6M21240.webp",
    "w": 2048,
    "h": 1365,
    "category": "travel",
    "tags": [
      "dam",
      "mountain",
      "ruins"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "50mm",
      "aperture": "f/5.6",
      "shutter": "1/640s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "20260823-DC__6M21424.jpg",
    "src": "images/web/20260823-DC__6M21424.jpg",
    "srcWebp": "images/web/20260823-DC__6M21424.webp",
    "thumb": "images/thumbs/20260823-DC__6M21424.jpg",
    "thumbWebp": "images/thumbs/20260823-DC__6M21424.webp",
    "w": 2048,
    "h": 1365,
    "category": "macro",
    "tags": [
      "mushroom"
    ],
    "featured": true,
    "exif": null
  },
  {
    "file": "20260824-_6M21882.jpg",
    "src": "images/web/20260824-_6M21882.jpg",
    "srcWebp": "images/web/20260824-_6M21882.webp",
    "thumb": "images/thumbs/20260824-_6M21882.jpg",
    "thumbWebp": "images/thumbs/20260824-_6M21882.webp",
    "w": 2048,
    "h": 1365,
    "category": "landscape",
    "tags": [
      "shadow",
      "mountain"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "35mm",
      "aperture": "f/6.3",
      "shutter": "1/640s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "20260824-_6M21892.jpg",
    "src": "images/web/20260824-_6M21892.jpg",
    "srcWebp": "images/web/20260824-_6M21892.webp",
    "thumb": "images/thumbs/20260824-_6M21892.jpg",
    "thumbWebp": "images/thumbs/20260824-_6M21892.webp",
    "w": 2048,
    "h": 1365,
    "category": "landscape",
    "tags": [
      "mountain",
      "lake"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "30mm",
      "aperture": "f/7.1",
      "shutter": "1/640s",
      "iso": "ISO 250"
    }
  },
  {
    "file": "20260827-_6M22045-HDR.jpg",
    "src": "images/web/20260827-_6M22045-HDR.jpg",
    "srcWebp": "images/web/20260827-_6M22045-HDR.webp",
    "thumb": "images/thumbs/20260827-_6M22045-HDR.jpg",
    "thumbWebp": "images/thumbs/20260827-_6M22045-HDR.webp",
    "w": 2048,
    "h": 1365,
    "category": "landscape",
    "tags": [
      "dawn",
      "mountain",
      "cloud"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "26mm",
      "aperture": "f/7.1",
      "shutter": "1/15s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "20260827-_6M22091.jpg",
    "src": "images/web/20260827-_6M22091.jpg",
    "srcWebp": "images/web/20260827-_6M22091.webp",
    "thumb": "images/thumbs/20260827-_6M22091.jpg",
    "thumbWebp": "images/thumbs/20260827-_6M22091.webp",
    "w": 2048,
    "h": 1365,
    "category": "macro",
    "tags": [
      "insect"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100mm F2.8 L MACRO IS USM",
      "focal": "100mm",
      "aperture": "f/16.0",
      "shutter": "1/160s",
      "iso": "ISO 20000"
    }
  },
  {
    "file": "20260830-_6M22451.jpg",
    "src": "images/web/20260830-_6M22451.jpg",
    "srcWebp": "images/web/20260830-_6M22451.webp",
    "thumb": "images/thumbs/20260830-_6M22451.jpg",
    "thumbWebp": "images/thumbs/20260830-_6M22451.webp",
    "w": 2048,
    "h": 1365,
    "category": "travel",
    "tags": [
      "france",
      "color",
      "see"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "31mm",
      "aperture": "f/7.1",
      "shutter": "1/800s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "30-12-2023_001-2.jpg",
    "src": "images/web/30-12-2023_001-2.jpg",
    "srcWebp": "images/web/30-12-2023_001-2.webp",
    "thumb": "images/thumbs/30-12-2023_001-2.jpg",
    "thumbWebp": "images/thumbs/30-12-2023_001-2.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "slovenia",
      "lake",
      "sunset"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF-S18-150mm F3.5-6.3 IS STM",
      "focal": "18mm",
      "aperture": "f/8.0",
      "shutter": "1/25s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "30-12-2023_001-3-denoise-sharpen.jpeg",
    "src": "images/web/30-12-2023_001-3-denoise-sharpen.jpeg",
    "srcWebp": "images/web/30-12-2023_001-3-denoise-sharpen.webp",
    "thumb": "images/thumbs/30-12-2023_001-3-denoise-sharpen.jpeg",
    "thumbWebp": "images/thumbs/30-12-2023_001-3-denoise-sharpen.webp",
    "w": 2048,
    "h": 1152,
    "category": "travel",
    "tags": [
      "slovenia",
      "lake"
    ],
    "featured": true,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF-S18-150mm F3.5-6.3 IS STM",
      "focal": "150mm",
      "aperture": "f/7.1",
      "shutter": "1/640s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "CANON_20230802_2.jpg",
    "src": "images/web/CANON_20230802_2.jpg",
    "srcWebp": "images/web/CANON_20230802_2.webp",
    "thumb": "images/thumbs/CANON_20230802_2.jpg",
    "thumbWebp": "images/thumbs/CANON_20230802_2.webp",
    "w": 2048,
    "h": 1152,
    "category": "travel",
    "tags": [
      "sea",
      "beach",
      "normady",
      "blue"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "20mm",
      "aperture": "f/4.0",
      "shutter": "1/1250s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "CANON_20231008_1-denoise.jpeg",
    "src": "images/web/CANON_20231008_1-denoise.jpeg",
    "srcWebp": "images/web/CANON_20231008_1-denoise.webp",
    "thumb": "images/thumbs/CANON_20231008_1-denoise.jpeg",
    "thumbWebp": "images/thumbs/CANON_20231008_1-denoise.webp",
    "w": 2048,
    "h": 1152,
    "category": "night",
    "tags": [
      "cataluña",
      "barcelona",
      "spain",
      "traffic",
      "light"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R10",
      "lens": "RF-S18-150mm F3.5-6.3 IS STM",
      "focal": "18mm",
      "aperture": "f/11.0",
      "shutter": "1/2s",
      "iso": "ISO 100"
    }
  },
  {
    "file": "IMG_0019.jpg",
    "src": "images/web/IMG_0019.jpg",
    "srcWebp": "images/web/IMG_0019.webp",
    "thumb": "images/thumbs/IMG_0019.jpg",
    "thumbWebp": "images/thumbs/IMG_0019.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "cloud"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "9mm",
      "aperture": "f/4.0",
      "shutter": "1/1250s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "IMG_0030.jpg",
    "src": "images/web/IMG_0030.jpg",
    "srcWebp": "images/web/IMG_0030.webp",
    "thumb": "images/thumbs/IMG_0030.jpg",
    "thumbWebp": "images/thumbs/IMG_0030.webp",
    "w": 2048,
    "h": 1152,
    "category": "landscape",
    "tags": [
      "liguria",
      "baia del silenzio",
      "sea",
      "italy"
    ],
    "featured": false,
    "exif": {
      "camera": "PowerShot G7 X Mark II",
      "lens": "8.8-36.8 mm",
      "focal": "9mm",
      "aperture": "f/11.0",
      "shutter": "1/10s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "IMG_6506-sharpen-denoise.jpg",
    "src": "images/web/IMG_6506-sharpen-denoise.jpg",
    "srcWebp": "images/web/IMG_6506-sharpen-denoise.webp",
    "thumb": "images/thumbs/IMG_6506-sharpen-denoise.jpg",
    "thumbWebp": "images/thumbs/IMG_6506-sharpen-denoise.webp",
    "w": 2048,
    "h": 1300,
    "category": "animals",
    "tags": [
      "fun",
      "portugal"
    ],
    "featured": false,
    "exif": {
      "lens": "RF-S18-150mm F3.5-6.3 IS STM"
    }
  },
  {
    "file": "R6MII_04Aug25_001-3.jpg",
    "src": "images/web/R6MII_04Aug25_001-3.jpg",
    "srcWebp": "images/web/R6MII_04Aug25_001-3.webp",
    "thumb": "images/thumbs/R6MII_04Aug25_001-3.jpg",
    "thumbWebp": "images/thumbs/R6MII_04Aug25_001-3.webp",
    "w": 2048,
    "h": 1365,
    "category": "landscape",
    "tags": [
      "donostia",
      "basque country",
      "spain"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF24-105mm F4 L IS USM",
      "focal": "56mm",
      "aperture": "f/9.0",
      "shutter": "1/400s",
      "iso": "ISO 125"
    }
  },
  {
    "file": "R6MII_18Aug26_001-2.jpg",
    "src": "images/web/R6MII_18Aug26_001-2.jpg",
    "srcWebp": "images/web/R6MII_18Aug26_001-2.webp",
    "thumb": "images/thumbs/R6MII_18Aug26_001-2.jpg",
    "thumbWebp": "images/thumbs/R6MII_18Aug26_001-2.webp",
    "w": 2048,
    "h": 1365,
    "category": "macro",
    "tags": [
      "insect"
    ],
    "featured": false,
    "exif": {
      "camera": "EOS R6m2",
      "lens": "RF100mm F2.8 L MACRO IS USM",
      "focal": "100mm",
      "aperture": "f/11.0",
      "shutter": "1/400s",
      "iso": "ISO 1600"
    }
  }
];
