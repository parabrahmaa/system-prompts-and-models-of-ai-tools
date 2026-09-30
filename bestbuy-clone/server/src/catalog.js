// Seed catalog. Prices are in dollars here and converted to cents when seeded.
// Each line expands into one or more products (e.g. one TV line -> several screen sizes).

export const CATEGORIES = [
  { slug: 'tvs', name: 'TVs & Projectors', icon: 'tv' },
  { slug: 'laptops', name: 'Laptops & Computers', icon: 'laptop' },
  { slug: 'phones', name: 'Cell Phones', icon: 'phone' },
  { slug: 'audio', name: 'Headphones & Audio', icon: 'headphones' },
  { slug: 'gaming', name: 'Video Games', icon: 'gamepad' },
  { slug: 'appliances', name: 'Appliances', icon: 'fridge' },
  { slug: 'cameras', name: 'Cameras & Camcorders', icon: 'camera' },
  { slug: 'smart-home', name: 'Smart Home', icon: 'speaker' },
  { slug: 'tablets', name: 'Tablets & E-Readers', icon: 'tablet' },
  { slug: 'wearables', name: 'Wearable Technology', icon: 'watch' },
];

const tvLines = [
  { brand: 'Samsung', line: 'Class QN90F Neo QLED 4K Mini-LED Smart Tizen TV', model: 'QN{s}QN90F', panel: 'Neo QLED', refresh: '144Hz', hdr: 'HDR10+', base: 1199, per: 38 },
  { brand: 'LG', line: 'Class C5 Series OLED evo 4K UHD Smart webOS TV', model: 'OLED{s}C5PUA', panel: 'OLED', refresh: '144Hz', hdr: 'Dolby Vision', base: 1299, per: 42 },
  { brand: 'Sony', line: 'Class BRAVIA 7 Mini LED QLED 4K Google TV', model: 'K{s}XR70', panel: 'Mini-LED', refresh: '120Hz', hdr: 'Dolby Vision', base: 1099, per: 36 },
  { brand: 'TCL', line: 'Class QM7 Series 4K QD-Mini LED Google TV', model: '{s}QM751G', panel: 'QD-Mini LED', refresh: '144Hz', hdr: 'Dolby Vision', base: 499, per: 18 },
  { brand: 'Insignia', line: 'Class F30 Series LED 4K UHD Smart Fire TV', model: 'NS-{s}F301NA25', panel: 'LED', refresh: '60Hz', hdr: 'HDR10', base: 179, per: 7 },
  { brand: 'Hisense', line: 'Class U8 Series Mini-LED QLED 4K Google TV', model: '{s}U8N', panel: 'Mini-LED QLED', refresh: '144Hz', hdr: 'Dolby Vision', base: 649, per: 22 },
];

function tvProducts() {
  const out = [];
  for (const l of tvLines) {
    for (const size of [55, 65, 75]) {
      const regular = Math.round(l.base + (size - 55) * l.per);
      out.push({
        category: 'tvs',
        brand: l.brand,
        name: `${l.brand} - ${size}" ${l.line}`,
        model: l.model.replace('{s}', size),
        regular,
        highlights: [`${l.panel} display technology`, `${l.refresh} native refresh rate`, `${l.hdr} support`, 'Built-in voice assistant'],
        description: `Experience stunning picture quality with the ${l.brand} ${size}" ${l.panel} TV. Deep contrast, vivid color and ${l.refresh} motion make movies, sports and gaming look incredible.`,
        specs: {
          Display: { 'Screen Size': `${size} inches`, 'Screen Size Class': `${size} inches`, 'Display Type': l.panel, Resolution: '4K (2160p)', 'Refresh Rate': l.refresh, 'High Dynamic Range Format': l.hdr },
          Connectivity: { 'Number of HDMI Inputs': '4', 'Number of USB Port(s)': '2', 'Wireless Connectivity': 'Wi-Fi, Bluetooth' },
          General: { Brand: l.brand, 'Model Number': l.model.replace('{s}', size), 'Smart Platform': l.line.split(' ').slice(-2).join(' ') },
        },
      });
    }
  }
  return out;
}

const laptopLines = [
  ['Apple', 'MacBook Air 13-inch Laptop - M4 chip', 'MW123LL/A', 999, { CPU: 'Apple M4', RAM: '16GB', Storage: '256GB SSD', Screen: '13.6 inches', OS: 'macOS' }],
  ['Apple', 'MacBook Pro 14-inch Laptop - M4 Pro chip', 'MX2H3LL/A', 1999, { CPU: 'Apple M4 Pro', RAM: '24GB', Storage: '512GB SSD', Screen: '14.2 inches', OS: 'macOS' }],
  ['HP', 'OmniBook 5 16" 2K OLED Laptop - Snapdragon X Plus', '16-AF0013DX', 849, { CPU: 'Snapdragon X Plus', RAM: '16GB', Storage: '1TB SSD', Screen: '16 inches', OS: 'Windows 11 Home' }],
  ['Dell', 'XPS 13 13.4" Laptop - Intel Core Ultra 7', 'XPS9350-7160SLV', 1299, { CPU: 'Intel Core Ultra 7 258V', RAM: '32GB', Storage: '1TB SSD', Screen: '13.4 inches', OS: 'Windows 11 Home' }],
  ['Lenovo', 'Legion 5i 16" Gaming Laptop - Intel Core i9 - NVIDIA GeForce RTX 5070', '83DG0001US', 1599, { CPU: 'Intel Core i9-14900HX', RAM: '32GB', Storage: '1TB SSD', Screen: '16 inches', OS: 'Windows 11 Home', GPU: 'NVIDIA GeForce RTX 5070' }],
  ['ASUS', 'ROG Zephyrus G14 14" OLED Gaming Laptop - AMD Ryzen 9', 'GA403UV-G14', 1799, { CPU: 'AMD Ryzen 9 8945HS', RAM: '32GB', Storage: '1TB SSD', Screen: '14 inches', OS: 'Windows 11 Home', GPU: 'NVIDIA GeForce RTX 4070' }],
  ['Microsoft', 'Surface Laptop 13.8" Copilot+ PC - Snapdragon X Elite', 'ZGP-00001', 1399, { CPU: 'Snapdragon X Elite', RAM: '16GB', Storage: '512GB SSD', Screen: '13.8 inches', OS: 'Windows 11 Home' }],
  ['Acer', 'Aspire 3 15.6" Full HD Laptop - AMD Ryzen 5', 'A315-24P-R7VH', 449, { CPU: 'AMD Ryzen 5 7520U', RAM: '8GB', Storage: '512GB SSD', Screen: '15.6 inches', OS: 'Windows 11 Home' }],
  ['HP', 'Victus 15.6" Gaming Laptop - AMD Ryzen 7 - NVIDIA GeForce RTX 4050', '15-FB2063DX', 899, { CPU: 'AMD Ryzen 7 7445HS', RAM: '16GB', Storage: '512GB SSD', Screen: '15.6 inches', OS: 'Windows 11 Home', GPU: 'NVIDIA GeForce RTX 4050' }],
  ['Apple', 'Mac mini Desktop - M4 chip', 'MU9D3LL/A', 599, { CPU: 'Apple M4', RAM: '16GB', Storage: '256GB SSD', OS: 'macOS' }],
];

function laptopProducts() {
  return laptopLines.map(([brand, line, model, regular, s]) => ({
    category: 'laptops',
    brand,
    name: `${brand} - ${line}`,
    model,
    regular,
    highlights: [`${s.CPU} processor`, `${s.RAM} system memory`, `${s.Storage} storage`, s.GPU ? `${s.GPU} graphics` : 'All-day battery life'],
    description: `Power through work and play with the ${brand} ${line}. Featuring the ${s.CPU} with ${s.RAM} of memory and a fast ${s.Storage}.`,
    specs: {
      Processor: { 'Processor Model': s.CPU, 'Graphics': s.GPU || 'Integrated' },
      Memory: { 'System Memory (RAM)': s.RAM, 'Total Storage Capacity': s.Storage },
      Display: s.Screen ? { 'Screen Size': s.Screen } : { 'Screen Size': 'None (desktop)' },
      General: { Brand: brand, 'Model Number': model, 'Operating System': s.OS },
    },
  }));
}

const phoneLines = [
  ['Apple', 'iPhone 17 Pro 256GB (Unlocked)', 'MG8A4LL/A', 1099, '6.3 inches', '256GB', 'A19 Pro'],
  ['Apple', 'iPhone 17 128GB (Unlocked)', 'MG6K4LL/A', 799, '6.3 inches', '128GB', 'A19'],
  ['Samsung', 'Galaxy S25 Ultra 512GB (Unlocked)', 'SM-S938UZKFXAA', 1419, '6.9 inches', '512GB', 'Snapdragon 8 Elite'],
  ['Samsung', 'Galaxy Z Flip7 256GB (Unlocked)', 'SM-F766UZKAXAA', 1099, '6.9 inches', '256GB', 'Exynos 2500'],
  ['Google', 'Pixel 10 Pro 256GB (Unlocked)', 'GA06543-US', 1099, '6.3 inches', '256GB', 'Google Tensor G5'],
  ['Google', 'Pixel 9a 128GB (Unlocked)', 'GA05756-US', 499, '6.3 inches', '128GB', 'Google Tensor G4'],
  ['Motorola', 'moto g power 5G 2025 128GB (Unlocked)', 'PB3S0000US', 299, '6.8 inches', '128GB', 'MediaTek Dimensity 6300'],
];

function phoneProducts() {
  return phoneLines.map(([brand, line, model, regular, screen, storage, chip]) => ({
    category: 'phones',
    brand,
    name: `${brand} - ${line}`,
    model,
    regular,
    highlights: [`${screen} display`, `${storage} storage`, `${chip} chip`, '5G connectivity'],
    description: `Stay connected with the ${brand} ${line}. A gorgeous ${screen} display, the ${chip} chip, and a pro-grade camera system.`,
    specs: {
      Display: { 'Screen Size': screen },
      Performance: { Processor: chip, 'Storage Capacity': storage },
      Connectivity: { 'Network Generation': '5G', 'Carrier': 'Unlocked' },
      General: { Brand: brand, 'Model Number': model },
    },
  }));
}

const audioLines = [
  ['Sony', 'WH-1000XM6 Wireless Noise Canceling Over-the-Ear Headphones', 'WH1000XM6/B', 449, 'Over-the-Ear', '30 hours'],
  ['Apple', 'AirPods Pro 3 Wireless Active Noise Cancelling Earbuds', 'MFHP4AM/A', 249, 'In-Ear', '8 hours'],
  ['Bose', 'QuietComfort Ultra Wireless Noise Cancelling Headphones', '880066-0100', 429, 'Over-the-Ear', '24 hours'],
  ['Beats', 'Studio Pro Wireless Noise Cancelling Over-the-Ear Headphones', 'MQTP3LL/A', 349, 'Over-the-Ear', '40 hours'],
  ['JBL', 'Flip 7 Portable Waterproof Bluetooth Speaker', 'JBLFLIP7BLKAM', 149, 'Portable Speaker', '14 hours'],
  ['Sonos', 'Arc Ultra Soundbar with Dolby Atmos', 'ARCULUS1BLK', 999, 'Soundbar', 'N/A'],
  ['Samsung', 'Galaxy Buds3 Pro Wireless Earbuds', 'SM-R630NZAAXAR', 249, 'In-Ear', '6 hours'],
  ['Bose', 'SoundLink Max Portable Bluetooth Speaker', '883848-0100', 399, 'Portable Speaker', '20 hours'],
];

function audioProducts() {
  return audioLines.map(([brand, line, model, regular, type, battery]) => ({
    category: 'audio',
    brand,
    name: `${brand} - ${line}`,
    model,
    regular,
    highlights: [`${type} design`, battery === 'N/A' ? 'Dolby Atmos surround' : `Up to ${battery} battery life`, 'Bluetooth wireless', 'Rich, immersive sound'],
    description: `Hear every detail with the ${brand} ${line}.`,
    specs: {
      Audio: { 'Headphone Fit / Type': type, 'Noise Canceling': /Noise/.test(line) ? 'Yes' : 'No' },
      Power: { 'Maximum Battery Life': battery },
      General: { Brand: brand, 'Model Number': model, Connectivity: 'Bluetooth' },
    },
  }));
}

const gamingLines = [
  ['Sony', 'PlayStation 5 Pro Console', 'CFI-7000', 749, 'Console'],
  ['Sony', 'PlayStation 5 Slim Console - Digital Edition', 'CFI-2000B', 449, 'Console'],
  ['Microsoft', 'Xbox Series X 1TB Console', 'RRT-00001', 599, 'Console'],
  ['Nintendo', 'Switch 2 System', 'BEEHSKAAA', 449, 'Console'],
  ['Nintendo', 'Mario Kart World - Nintendo Switch 2', 'HACPAAAAB', 79, 'Game'],
  ['Sony', 'DualSense Wireless Controller for PS5 - Midnight Black', '1000026775', 74, 'Controller'],
  ['Microsoft', 'Xbox Wireless Controller - Carbon Black', 'QAT-00001', 64, 'Controller'],
  ['Meta', 'Quest 3 512GB Mixed Reality Headset', '899-00581-02', 499, 'VR Headset'],
];

function gamingProducts() {
  return gamingLines.map(([brand, line, model, regular, type]) => ({
    category: 'gaming',
    brand,
    name: `${brand} - ${line}`,
    model,
    regular,
    highlights: [`${type}`, 'Next-gen performance', 'Immersive gameplay', 'Online multiplayer ready'],
    description: `Level up your game with the ${brand} ${line}.`,
    specs: { General: { Brand: brand, 'Model Number': model, 'Product Type': type } },
  }));
}

const applianceLines = [
  ['Samsung', 'Bespoke 30 cu. ft. 4-Door French Door Refrigerator with Family Hub', 'RF30BB6900QL', 3299, 'Refrigerator'],
  ['LG', '27 cu. ft. French Door Smart Refrigerator with Craft Ice', 'LRFXS2503S', 2499, 'Refrigerator'],
  ['Whirlpool', '4.5 Cu. Ft. Top Load Washer with 2-in-1 Removable Agitator', 'WTW5057LW', 749, 'Washer'],
  ['LG', '7.4 Cu. Ft. Smart Electric Dryer with TurboSteam', 'DLEX4000B', 1099, 'Dryer'],
  ['Bosch', '800 Series Top Control Built-In Dishwasher with CrystalDry', 'SHP78CM5N', 1349, 'Dishwasher'],
  ['Ninja', 'Foodi 8-in-1 6.5-Quart Pressure Cooker & Air Fryer', 'OS301', 199, 'Small Appliance'],
  ['Dyson', 'V15 Detect Cordless Vacuum', '447922-01', 749, 'Vacuum'],
  ['GE Profile', '30" Smart Slide-In Electric Induction Range with Air Fry', 'PHS930YPFS', 2899, 'Range'],
];

function applianceProducts() {
  return applianceLines.map(([brand, line, model, regular, type]) => ({
    category: 'appliances',
    brand,
    name: `${brand} - ${line}`,
    model,
    regular,
    highlights: [type, 'ENERGY STAR® efficiency', 'Smart features', 'Free haul-away available'],
    description: `Upgrade your home with the ${brand} ${line}.`,
    specs: { General: { Brand: brand, 'Model Number': model, 'Product Type': type }, Warranty: { 'Manufacturer Warranty': '1 year parts & labor' } },
  }));
}

const cameraLines = [
  ['Canon', 'EOS R6 Mark II Mirrorless Camera with RF 24-105mm f/4L Lens', '5666C012', 3099, '24.2MP'],
  ['Sony', 'Alpha 7 IV Full-frame Mirrorless Camera (Body Only)', 'ILCE7M4/B', 2499, '33MP'],
  ['Nikon', 'Z 6III Mirrorless Camera with NIKKOR Z 24-70mm f/4 S Lens', '1810', 3099, '24.5MP'],
  ['GoPro', 'HERO13 Black Action Camera', 'CHDHX-131-TH', 399, '27MP'],
  ['DJI', 'Osmo Pocket 3 Creator Combo', 'CP.OS.00000302.01', 669, '9.4MP'],
  ['Fujifilm', 'X100VI Digital Camera - Silver', '16821792', 1599, '40.2MP'],
];

function cameraProducts() {
  return cameraLines.map(([brand, line, model, regular, mp]) => ({
    category: 'cameras',
    brand,
    name: `${brand} - ${line}`,
    model,
    regular,
    highlights: [`${mp} sensor`, '4K video recording', 'Image stabilization', 'Wi-Fi & Bluetooth'],
    description: `Capture every moment with the ${brand} ${line}.`,
    specs: { Image: { 'Effective Megapixels': mp, 'Video Resolution': '4K' }, General: { Brand: brand, 'Model Number': model } },
  }));
}

const smartHomeLines = [
  ['Amazon', 'Echo Dot (5th Gen) Smart Speaker with Alexa', 'B09B8V1LZ3', 49, 'Smart Speaker'],
  ['Google', 'Nest Hub (2nd Gen) 7" Smart Display', 'GA01331-US', 99, 'Smart Display'],
  ['Ring', 'Battery Video Doorbell Pro', 'B0BZWQS3J1', 229, 'Video Doorbell'],
  ['Google', 'Nest Learning Thermostat (4th Gen)', 'GA05213-US', 279, 'Thermostat'],
  ['Arlo', 'Pro 5S 2K Wireless Security Camera (3-pack)', 'VMC4360P', 449, 'Security Camera'],
  ['Philips Hue', 'White and Color Ambiance A19 Starter Kit (3 bulbs + Bridge)', '563049', 199, 'Smart Lighting'],
];

function smartHomeProducts() {
  return smartHomeLines.map(([brand, line, model, regular, type]) => ({
    category: 'smart-home',
    brand,
    name: `${brand} - ${line}`,
    model,
    regular,
    highlights: [type, 'Works with Alexa & Google Assistant', 'Easy app setup', 'Voice control'],
    description: `Make your home smarter with the ${brand} ${line}.`,
    specs: { General: { Brand: brand, 'Model Number': model, 'Product Type': type }, Connectivity: { 'Wireless Connectivity': 'Wi-Fi' } },
  }));
}

const tabletLines = [
  ['Apple', 'iPad Pro 11-inch (M5) Wi-Fi 256GB', 'MVV83LL/A', 999, '11 inches', '256GB'],
  ['Apple', 'iPad Air 13-inch (M3) Wi-Fi 128GB', 'MC9P4LL/A', 799, '13 inches', '128GB'],
  ['Apple', 'iPad (A16) 11-inch Wi-Fi 128GB', 'MD4A4LL/A', 349, '11 inches', '128GB'],
  ['Samsung', 'Galaxy Tab S10 FE 10.9" 128GB Wi-Fi', 'SM-X520NZAAXAR', 499, '10.9 inches', '128GB'],
  ['Amazon', 'Kindle Paperwhite 16GB (2024)', 'B0CFPJYX7P', 159, '7 inches', '16GB'],
  ['Microsoft', 'Surface Pro 13" Copilot+ PC - Snapdragon X Plus 512GB', 'ZIA-00001', 1199, '13 inches', '512GB'],
];

function tabletProducts() {
  return tabletLines.map(([brand, line, model, regular, screen, storage]) => ({
    category: 'tablets',
    brand,
    name: `${brand} - ${line}`,
    model,
    regular,
    highlights: [`${screen} display`, `${storage} storage`, 'All-day battery life', 'Lightweight design'],
    description: `Create, stream and read anywhere with the ${brand} ${line}.`,
    specs: { Display: { 'Screen Size': screen }, Storage: { 'Storage Capacity': storage }, General: { Brand: brand, 'Model Number': model } },
  }));
}

const wearableLines = [
  ['Apple', 'Apple Watch Series 11 (GPS) 46mm Aluminum Case with Sport Band', 'MXLJ3LL/A', 429, 'Smartwatch'],
  ['Apple', 'Apple Watch Ultra 3 (GPS + Cellular) 49mm Titanium Case', 'MX4L3LL/A', 799, 'Smartwatch'],
  ['Samsung', 'Galaxy Watch8 Classic 46mm Smartwatch', 'SM-L505UZKAXAA', 499, 'Smartwatch'],
  ['Garmin', 'Forerunner 965 GPS Running Smartwatch', '010-02809-00', 599, 'Fitness Watch'],
  ['Fitbit', 'Charge 6 Fitness Tracker', 'GA05183-US', 159, 'Fitness Tracker'],
  ['Meta', 'Ray-Ban Meta Wayfarer Smart Glasses', 'RW4006', 299, 'Smart Glasses'],
];

function wearableProducts() {
  return wearableLines.map(([brand, line, model, regular, type]) => ({
    category: 'wearables',
    brand,
    name: `${brand} - ${line}`,
    model,
    regular,
    highlights: [type, 'Heart rate & sleep tracking', 'Water resistant', 'Smartphone notifications'],
    description: `Track your health and stay connected with the ${brand} ${line}.`,
    specs: { General: { Brand: brand, 'Model Number': model, 'Product Type': type } },
  }));
}

export function buildCatalog() {
  return [
    ...tvProducts(),
    ...laptopProducts(),
    ...phoneProducts(),
    ...audioProducts(),
    ...gamingProducts(),
    ...applianceProducts(),
    ...cameraProducts(),
    ...smartHomeProducts(),
    ...tabletProducts(),
    ...wearableProducts(),
  ];
}

export const STORES = [
  { name: 'Richfield', address: '1000 W 78th St', city: 'Richfield', state: 'MN', zip: '55423', phone: '(612) 861-1000', lat: 44.862, lng: -93.293 },
  { name: 'Union Square', address: '52 E 14th St', city: 'New York', state: 'NY', zip: '10003', phone: '(212) 466-4789', lat: 40.735, lng: -73.991 },
  { name: 'Chicago Loop', address: '1000 W North Ave', city: 'Chicago', state: 'IL', zip: '60642', phone: '(312) 988-4067', lat: 41.911, lng: -87.653 },
  { name: 'Santa Monica', address: '1319 3rd St Promenade', city: 'Santa Monica', state: 'CA', zip: '90401', phone: '(310) 260-1040', lat: 34.017, lng: -118.496 },
  { name: 'Dallas Central', address: '5409 Belt Line Rd', city: 'Dallas', state: 'TX', zip: '75254', phone: '(972) 233-2400', lat: 32.953, lng: -96.823 },
  { name: 'Seattle Northgate', address: '401 NE Northgate Way', city: 'Seattle', state: 'WA', zip: '98125', phone: '(206) 367-2340', lat: 47.706, lng: -122.325 },
  { name: 'Atlanta Buckhead', address: '2625 Piedmont Rd NE', city: 'Atlanta', state: 'GA', zip: '30324', phone: '(404) 237-0303', lat: 33.824, lng: -84.366 },
  { name: 'Miami Dadeland', address: '8300 S Dixie Hwy', city: 'Miami', state: 'FL', zip: '33143', phone: '(305) 668-5200', lat: 25.692, lng: -80.311 },
  { name: 'Denver Cherry Creek', address: '3000 E 1st Ave', city: 'Denver', state: 'CO', zip: '80206', phone: '(303) 388-1200', lat: 39.718, lng: -104.953 },
  { name: 'Boston Fenway', address: '1400 Boylston St', city: 'Boston', state: 'MA', zip: '02215', phone: '(617) 424-7900', lat: 42.345, lng: -71.098 },
];

export const REVIEW_SNIPPETS = [
  [5, 'Absolutely love it', 'Exceeded my expectations. Setup was quick and it works flawlessly.'],
  [5, 'Best purchase this year', 'Great quality and the price during the sale was unbeatable.'],
  [4, 'Very good, minor nitpicks', 'Performs great overall. A couple of small software quirks but nothing major.'],
  [4, 'Solid value', 'Does everything I need. Would recommend to friends and family.'],
  [3, 'It is okay', 'Works as described but I expected a little more for the price.'],
  [5, 'Wow', 'The quality is outstanding. The store associate helped me pick the right one.'],
  [2, 'Had some issues', 'Had to exchange the first unit, the replacement works fine though.'],
  [4, 'Happy with it', 'Fast shipping and it arrived well packaged. Performance is great.'],
];

export const REVIEWER_NAMES = ['TechFan22', 'JMiller', 'SarahK', 'Gadgeteer', 'DadOf3', 'MovieBuff', 'GamerGirl', 'Chris P.', 'HomeChef', 'Ana R.'];
