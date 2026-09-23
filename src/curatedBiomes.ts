import { ClimaticDataPoint } from './types';

export interface BiomePhoto {
  url: string;
  title: string;
  caption: string;
}

export interface CuratedBiomeEntry {
  id: string;
  canonicalName: string;
  aliases: string[];
  isIndiaLandscape: boolean;
  biomeType: string;
  visualMarkers: string[];
  geographicContext: string;
  environmentalStatus: string;
  climaticData: ClimaticDataPoint[];
  photos: BiomePhoto[];
}

export const CURATED_BIOMES: CuratedBiomeEntry[] = [
  {
    id: 'amazon',
    canonicalName: 'Amazon Rainforest',
    aliases: ['amazon', 'amazon rainforest', 'amazon forest', 'amazon basin', 'selva', 'rainforest', 'tropical rainforest'],
    isIndiaLandscape: false,
    biomeType: 'Tropical Moist Broadleaf Forest',
    visualMarkers: [
      'Multi-tiered emerald canopy with emergent kapok and Brazil nut trees',
      'Meandering, sediment-rich oxbow rivers and dark Igapó flooded forests',
      'Dense understory intertwined with lianas, philodendrons, and epiphytic orchids',
      'Perpetual morning transpiration mist and low-hanging cloud vapor'
    ],
    geographicContext: 'The Amazon basin spans approximately 6.7 million square kilometers across South America. Positioned across the equator, it maintains high ambient humidity (>80%) and experiences heavy equatorial convection rainfall with minimal annual temperature seasonality.',
    environmentalStatus: 'Vulnerable to accelerated deforestation from livestock ranching, soy agriculture, illegal logging, and climate change-induced drought cycles altering the South American monsoon system.',
    climaticData: [
      { month: 'Jan', tempLow: 23, tempHigh: 31, precipitation: 290 },
      { month: 'Feb', tempLow: 23, tempHigh: 31, precipitation: 310 },
      { month: 'Mar', tempLow: 23, tempHigh: 31, precipitation: 330 },
      { month: 'Apr', tempLow: 23, tempHigh: 31, precipitation: 300 },
      { month: 'May', tempLow: 23, tempHigh: 31, precipitation: 240 },
      { month: 'Jun', tempLow: 22, tempHigh: 31, precipitation: 140 },
      { month: 'Jul', tempLow: 22, tempHigh: 32, precipitation: 90 },
      { month: 'Aug', tempLow: 22, tempHigh: 33, precipitation: 80 },
      { month: 'Sep', tempLow: 23, tempHigh: 33, precipitation: 110 },
      { month: 'Oct', tempLow: 23, tempHigh: 33, precipitation: 170 },
      { month: 'Nov', tempLow: 23, tempHigh: 32, precipitation: 210 },
      { month: 'Dec', tempLow: 23, tempHigh: 31, precipitation: 270 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?auto=format&fit=crop&w=1600&q=80',
        title: 'Amazon River Basin & Forest Canopy',
        caption: 'Aerial perspective of the serpentine Amazon river winding through dense, unbroken tropical rainforest.'
      },
      {
        url: 'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?auto=format&fit=crop&w=1600&q=80',
        title: 'Amazon Understory & Emergent Canopy',
        caption: 'Dense equatorial vegetation featuring multi-layered canopy foliage, buttress roots, and giant epiphytes.'
      },
      {
        url: 'https://images.unsplash.com/photo-1618083707368-b3823daa2726?auto=format&fit=crop&w=1600&q=80',
        title: 'Flooded Forest (Igapó) Waterway',
        caption: 'Seasonal freshwater flooded riverbanks supporting rich aquatic ecosystems and submerged tree trunks.'
      },
      {
        url: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=1600&q=80',
        title: 'Atmospheric Mist Over Canopy',
        caption: 'Heavy humidity transpiring above the Amazon forest, driving regional precipitation cycles ("flying rivers").'
      }
    ]
  },
  {
    id: 'ladakh',
    canonicalName: 'Cold Desert of Ladakh',
    aliases: ['ladakh', 'cold desert', 'cold desert of ladakh', 'leh', 'nubra', 'zanskar', 'pangong', 'changthang', 'himalayan cold desert'],
    isIndiaLandscape: true,
    biomeType: 'High-Altitude Arid Cold Desert',
    visualMarkers: [
      'Stark, barren metamorphic mountain massifs with zero arboreal cover',
      'Pristine endorheic high-altitude saline lakes (Pangong Tso, Tso Moriri)',
      'Periglacial scree, moraine deposits, and wind-sculpted sand dunes in Nubra Valley',
      'Severe cryogenic rock fracturing and wide alluvial fans'
    ],
    geographicContext: 'Enclosed within the rain-shadow of the Greater Himalayas at elevations between 3,000m and 5,500m. Characterized by severe atmospheric thinning, intense UV radiation, extreme continental thermal swings, and less than 100mm annual precipitation.',
    environmentalStatus: 'Extremely vulnerable to glacial retreat, flash floods from glacial lake outburst (GLOFs), and soil degradation under unmanaged ecotourism.',
    climaticData: [
      { month: 'Jan', tempLow: -14, tempHigh: -2, precipitation: 10 },
      { month: 'Feb', tempLow: -11, tempHigh: 1, precipitation: 8 },
      { month: 'Mar', tempLow: -5, tempHigh: 6, precipitation: 11 },
      { month: 'Apr', tempLow: 0, tempHigh: 12, precipitation: 6 },
      { month: 'May', tempLow: 4, tempHigh: 16, precipitation: 7 },
      { month: 'Jun', tempLow: 8, tempHigh: 21, precipitation: 5 },
      { month: 'Jul', tempLow: 12, tempHigh: 25, precipitation: 15 },
      { month: 'Aug', tempLow: 11, tempHigh: 24, precipitation: 16 },
      { month: 'Sep', tempLow: 6, tempHigh: 20, precipitation: 10 },
      { month: 'Oct', tempLow: -1, tempHigh: 14, precipitation: 4 },
      { month: 'Nov', tempLow: -7, tempHigh: 7, precipitation: 3 },
      { month: 'Dec', tempLow: -12, tempHigh: 1, precipitation: 7 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1600&q=80',
        title: 'Pangong Tso & Trans-Himalayan Escarpment',
        caption: 'High-altitude endorheic saline lake at 4,225m altitude reflecting stark, barren metamorphic mountain ranges.'
      },
      {
        url: 'https://images.unsplash.com/photo-1581793745862-99fde7fa73d2?auto=format&fit=crop&w=1600&q=80',
        title: 'Nubra Valley Cold Desert Sand Dunes',
        caption: 'Wind-sculpted white sand dunes in Hunder situated between the Karakoram and Ladakh mountain ranges.'
      },
      {
        url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1600&q=80',
        title: 'Zanskar River Canyon & Arid Strata',
        caption: 'Deep glacial gorge carved into arid sedimentary layers with mineral-tinted rock formations.'
      },
      {
        url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80',
        title: 'Trans-Himalayan Pass & Barren Scree',
        caption: 'Permafrost scree slopes and cryogenic rock weathering above 4,800m altitude in Ladakh.'
      }
    ]
  },
  {
    id: 'sundarbans',
    canonicalName: 'Sundarbans Mangroves',
    aliases: ['sundarbans', 'sunderbans', 'sundarban', 'mangroves', 'mangrove forest', 'ganges delta', 'bengal delta', 'tidal delta'],
    isIndiaLandscape: true,
    biomeType: 'Tidal Halophytic Mangrove Estuary',
    visualMarkers: [
      'Dense stands of Heritiera fomes (Sundari) and Rhizophora with stilt roots',
      'Spike-like vertical pneumatophore breathing roots piercing intertidal muds',
      'Network of brackish tidal creeks, inlets, and mudflats submerged twice daily',
      'Alluvial silt deposits and estuarine tiger pugmark pathways'
    ],
    geographicContext: 'The largest contiguous mangrove ecosystem on Earth, located at the mouth of the Ganges, Brahmaputra, and Meghna delta. Subject to semidiurnal tidal flooding, dynamic salinity gradients, and seasonal tropical cyclone strikes.',
    environmentalStatus: 'Designated UNESCO World Heritage and Ramsar Wetland. Threatened by rising sea levels, coastal erosion, salinity intrusion, and frequent supercyclones.',
    climaticData: [
      { month: 'Jan', tempLow: 13, tempHigh: 26, precipitation: 12 },
      { month: 'Feb', tempLow: 16, tempHigh: 29, precipitation: 25 },
      { month: 'Mar', tempLow: 21, tempHigh: 33, precipitation: 35 },
      { month: 'Apr', tempLow: 25, tempHigh: 35, precipitation: 65 },
      { month: 'May', tempLow: 26, tempHigh: 35, precipitation: 145 },
      { month: 'Jun', tempLow: 27, tempHigh: 33, precipitation: 330 },
      { month: 'Jul', tempLow: 26, tempHigh: 32, precipitation: 410 },
      { month: 'Aug', tempLow: 26, tempHigh: 32, precipitation: 380 },
      { month: 'Sep', tempLow: 26, tempHigh: 32, precipitation: 300 },
      { month: 'Oct', tempLow: 23, tempHigh: 31, precipitation: 170 },
      { month: 'Nov', tempLow: 18, tempHigh: 29, precipitation: 40 },
      { month: 'Dec', tempLow: 13, tempHigh: 26, precipitation: 8 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1544979590-37e9b47eb705?auto=format&fit=crop&w=1600&q=80',
        title: 'Sundarbans Estuary & Tidal Channels',
        caption: 'Brackish distributary channels winding through dense Heritiera fomes (Sundari) mangrove belts.'
      },
      {
        url: 'https://images.unsplash.com/photo-1569429593410-b498b3fb3387?auto=format&fit=crop&w=1600&q=80',
        title: 'Pneumatophore Breathing Roots',
        caption: 'Vertical breathing root adaptations protruding from low-oxygen, tidal intertidal silt mudflats.'
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        title: 'Ganges-Brahmaputra Deltaic Coast',
        caption: 'Intertidal coastal zone buffering coastal communities from cyclone storm surges in the Bay of Bengal.'
      },
      {
        url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1600&q=80',
        title: 'Dense Halophytic Mangrove Wilderness',
        caption: 'Protected UNESCO World Heritage wetland providing critical habitat for Royal Bengal tigers and estuarine crocodiles.'
      }
    ]
  },
  {
    id: 'westernghats',
    canonicalName: 'Western Ghats Shola & Montane Forest',
    aliases: ['western ghats', 'maharashtra', 'maharashtra ghats', 'shola', 'shola forest', 'sahyadri', 'nilgiri', 'nilgiris', 'anamudi', 'munnar', 'wayanad', 'kudremukh', 'silent valley', 'agumbe'],
    isIndiaLandscape: true,
    biomeType: 'Tropical Montane Evergreen & Shola Grassland',
    visualMarkers: [
      'Mosaic of high-altitude rolling montane grasslands interspersed with stunted shola forest groves',
      'Lush moss-draped branches, ancient tree ferns, and endemic epiphytic balsam flora',
      'Spectacular stepped basalt escarpments of the Sahyadri mountain chain',
      'Perennial roaring waterfalls fed by torrential monsoonal downpours'
    ],
    geographicContext: 'Older than the Himalayas, the Sahyadri range acts as an orographic barrier capturing southwest monsoon winds. High elevations (1,500m to 2,695m at Anamudi) produce unique misty microclimates with phenomenal levels of biological endemism.',
    environmentalStatus: 'Global Biodiversity Hotspot and UNESCO World Heritage site. Threatened by tea/coffee monoculture plantation expansion, road construction, and invasive species.',
    climaticData: [
      { month: 'Jan', tempLow: 11, tempHigh: 22, precipitation: 15 },
      { month: 'Feb', tempLow: 12, tempHigh: 24, precipitation: 18 },
      { month: 'Mar', tempLow: 14, tempHigh: 26, precipitation: 35 },
      { month: 'Apr', tempLow: 16, tempHigh: 26, precipitation: 90 },
      { month: 'May', tempLow: 17, tempHigh: 25, precipitation: 170 },
      { month: 'Jun', tempLow: 16, tempHigh: 22, precipitation: 560 },
      { month: 'Jul', tempLow: 15, tempHigh: 21, precipitation: 720 },
      { month: 'Aug', tempLow: 15, tempHigh: 21, precipitation: 540 },
      { month: 'Sep', tempLow: 15, tempHigh: 22, precipitation: 260 },
      { month: 'Oct', tempLow: 15, tempHigh: 23, precipitation: 280 },
      { month: 'Nov', tempLow: 13, tempHigh: 22, precipitation: 140 },
      { month: 'Dec', tempLow: 11, tempHigh: 22, precipitation: 30 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1596176530529-78163a4f7af2?auto=format&fit=crop&w=1600&q=80',
        title: 'Western Ghats Misty Escarpment',
        caption: 'High-elevation mountain crests trapping moisture-laden southwest monsoon winds along the Sahyadri range.'
      },
      {
        url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=1600&q=80',
        title: 'Montane Shola Grasslands of Munnar',
        caption: 'Mosaic of high-altitude rolling grasslands separated by stunted evergreen forest patches in undulating valleys.'
      },
      {
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1600&q=80',
        title: 'Monsoon Waterfalls & Basalt Cliffs',
        caption: 'Perennial cascades rushing over ancient basalt terraces during peak monsoon precipitation.'
      },
      {
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
        title: 'Wet Evergreen Canopy & Epiphytic Growth',
        caption: 'Global biodiversity hotspot harboring immense endemic flora, amphibians, and ancient tree ferns.'
      }
    ]
  },
  {
    id: 'rannofkutch',
    canonicalName: 'Great Rann of Kutch',
    aliases: ['rann of kutch', 'great rann of kutch', 'little rann of kutch', 'kutch', 'white desert', 'white rann', 'dhordo', 'salt marsh', 'salt desert'],
    isIndiaLandscape: true,
    biomeType: 'Seasonal Saline Salt Marsh & Mudflat',
    visualMarkers: [
      'Blinding white polygonal crystallized sodium chloride crusts stretching to the horizon',
      'Mirage-like flat horizons with zero topographical relief',
      'Seasonal shallow saline brine pools hosting Greater and Lesser Flamingos',
      'Cracked dry alluvial clay mudflats (bets) supporting thorny scrub'
    ],
    geographicContext: 'Vast salt marsh in Gujarat covering ~7,500 sq km between the Gulf of Kutch and the Indus River mouth. Inundated with tidal seawater and monsoon runoff during July-September, transforming into a surreal dry salt plain from November to March.',
    environmentalStatus: 'Sensitive to upstream damming of freshwater rivers, industrial salt and potash extraction, and climate variability affecting flamingo nesting cycles.',
    climaticData: [
      { month: 'Jan', tempLow: 10, tempHigh: 27, precipitation: 2 },
      { month: 'Feb', tempLow: 13, tempHigh: 30, precipitation: 3 },
      { month: 'Mar', tempLow: 18, tempHigh: 36, precipitation: 2 },
      { month: 'Apr', tempLow: 23, tempHigh: 40, precipitation: 2 },
      { month: 'May', tempLow: 26, tempHigh: 42, precipitation: 6 },
      { month: 'Jun', tempLow: 28, tempHigh: 39, precipitation: 45 },
      { month: 'Jul', tempLow: 27, tempHigh: 35, precipitation: 140 },
      { month: 'Aug', tempLow: 26, tempHigh: 33, precipitation: 110 },
      { month: 'Sep', tempLow: 25, tempHigh: 35, precipitation: 50 },
      { month: 'Oct', tempLow: 22, tempHigh: 37, precipitation: 8 },
      { month: 'Nov', tempLow: 16, tempHigh: 33, precipitation: 3 },
      { month: 'Dec', tempLow: 11, tempHigh: 28, precipitation: 1 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
        title: 'White Salt Desert Horizon',
        caption: 'Vast, blinding expanse of crystallized salt pans formed as seawater evaporates after seasonal monsoonal inundation.'
      },
      {
        url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1600&q=80',
        title: 'Sunset over Crystalline Salt Flats',
        caption: 'Evening amber light reflecting off pristine polygonal salt crusts across the Dhordo salt plains.'
      },
      {
        url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?auto=format&fit=crop&w=1600&q=80',
        title: 'Saline Wetland & Flamingo Estuary',
        caption: 'Shallow brine pools supporting migratory Greater Flamingo colonies ("Flamingo City") during winter months.'
      },
      {
        url: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1600&q=80',
        title: 'Little Rann Cracked Clay Pan & Scrub',
        caption: 'Hyper-arid mudflat terrain fringed with thorny scrubland and sanctuary for the endangered Indian Wild Ass.'
      }
    ]
  },
  {
    id: 'thar',
    canonicalName: 'Thar Desert Dunes',
    aliases: ['thar', 'thar desert', 'great indian desert', 'jaisalmer', 'sam sand dunes', 'khuri', 'bikaner', 'rajasthan desert'],
    isIndiaLandscape: true,
    biomeType: 'Hot Subtropical Arid Sand Desert',
    visualMarkers: [
      'Shifting crescent barchan and longitudinal sand dunes up to 30 meters high',
      'Wind-etched ripple patterns across golden quartz sand surfaces',
      'Xerophytic scrub: Prosopis cineraria (Khejri tree), Capparis decidua (Ker), and Calligonum',
      'Hyper-arid rocky plains (hamadas) with gravel deflation pavements'
    ],
    geographicContext: 'Spanning Rajasthan and eastern Pakistan, bounded by the ancient Aravalli Range to the southeast and the Rann of Kutch to the south. Experiences severe summer temperatures (>45°C) and erratic annual rainfall (<250mm).',
    environmentalStatus: 'Habitat of the critically endangered Great Indian Bustard. Pressured by desertification, intensive borewell agriculture, and large-scale solar infrastructure.',
    climaticData: [
      { month: 'Jan', tempLow: 8, tempHigh: 24, precipitation: 5 },
      { month: 'Feb', tempLow: 11, tempHigh: 28, precipitation: 6 },
      { month: 'Mar', tempLow: 17, tempHigh: 34, precipitation: 5 },
      { month: 'Apr', tempLow: 23, tempHigh: 40, precipitation: 6 },
      { month: 'May', tempLow: 27, tempHigh: 43, precipitation: 12 },
      { month: 'Jun', tempLow: 29, tempHigh: 42, precipitation: 25 },
      { month: 'Jul', tempLow: 27, tempHigh: 38, precipitation: 75 },
      { month: 'Aug', tempLow: 26, tempHigh: 36, precipitation: 80 },
      { month: 'Sep', tempLow: 24, tempHigh: 36, precipitation: 28 },
      { month: 'Oct', tempLow: 19, tempHigh: 36, precipitation: 4 },
      { month: 'Nov', tempLow: 13, tempHigh: 30, precipitation: 3 },
      { month: 'Dec', tempLow: 9, tempHigh: 25, precipitation: 2 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1682687220063-4742bd7fd538?auto=format&fit=crop&w=1600&q=80',
        title: 'Sam Sand Dunes of Jaisalmer',
        caption: 'Classic active barchan and longitudinal sand dunes sculpted by prevailing southwesterly desert winds.'
      },
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
        title: 'Wind-Rippled Desert Crests',
        caption: 'Micro-relief ripple patterns etched across loose golden silica sand grains under arid sunlight.'
      },
      {
        url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80',
        title: 'Arid Desert Scrub & Khejri Trees',
        caption: 'Hard clay interdunal depression dotted with xerophytic Prosopis cineraria (Khejri) and Acacia bushes.'
      },
      {
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
        title: 'Thar Desert Twilight Horizon',
        caption: 'Expansive desert horizon displaying long shadows and atmospheric dust scattering over Rajasthan.'
      }
    ]
  },
  {
    id: 'spiti',
    canonicalName: 'Spiti Valley Cold Desert',
    aliases: ['spiti', 'spiti valley', 'kaza', 'pin valley', 'tabo', 'key monastery', 'trans-himalaya'],
    isIndiaLandscape: true,
    biomeType: 'High-Altitude Trans-Himalayan Cold Desert',
    visualMarkers: [
      'Deeply stratified geological shale and limestone canyon walls formed under the ancient Tethys Sea',
      'Glacially fed braided Spiti river channels carrying pale mineral silt',
      'Stark clay pinnacles, scree slopes, and ancient perched cliffside Buddhist monasteries',
      'Cold alpine steppe vegetation: wild thyme, Caragana scrub, and sea buckthorn along river beds'
    ],
    geographicContext: 'Located in Himachal Pradesh at altitudes between 3,800m and 4,500m. Completely isolated by heavy snow over Rohtang and Kunzum passes for nearly six months of the year.',
    environmentalStatus: 'Critical sanctuary for snow leopards, Himalayan ibex, and Tibetan wolves. Susceptible to flash floods, road landslides, and fragile alpine soil erosion.',
    climaticData: [
      { month: 'Jan', tempLow: -21, tempHigh: -7, precipitation: 25 },
      { month: 'Feb', tempLow: -18, tempHigh: -4, precipitation: 28 },
      { month: 'Mar', tempLow: -12, tempHigh: 2, precipitation: 30 },
      { month: 'Apr', tempLow: -5, tempHigh: 8, precipitation: 18 },
      { month: 'May', tempLow: 1, tempHigh: 14, precipitation: 15 },
      { month: 'Jun', tempLow: 5, tempHigh: 19, precipitation: 10 },
      { month: 'Jul', tempLow: 8, tempHigh: 22, precipitation: 14 },
      { month: 'Aug', tempLow: 7, tempHigh: 21, precipitation: 12 },
      { month: 'Sep', tempLow: 3, tempHigh: 17, precipitation: 8 },
      { month: 'Oct', tempLow: -4, tempHigh: 11, precipitation: 6 },
      { month: 'Nov', tempLow: -11, tempHigh: 4, precipitation: 8 },
      { month: 'Dec', tempLow: -17, tempHigh: -3, precipitation: 18 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80',
        title: 'Rugged Spiti Gorge & Trans-Himalayan Mountains',
        caption: 'Barren, stratified geological ridges carved by the glacial Spiti river in Himachal Pradesh.'
      },
      {
        url: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?auto=format&fit=crop&w=1600&q=80',
        title: 'Glacial Silt Riverbeds & Scree Slopes',
        caption: 'Braided river channels flowing through dramatic sedimentary shale cliffs and moraine gravels.'
      },
      {
        url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1600&q=80',
        title: 'High-Altitude Cold Steppe',
        caption: 'Stark rain-shadow terrain receiving less than 170mm precipitation annually, supporting rare snow leopard habitat.'
      }
    ]
  },
  {
    id: 'kaziranga',
    canonicalName: 'Kaziranga Alluvial Grasslands',
    aliases: ['kaziranga', 'kaziranga national park', 'brahmaputra floodplains', 'assam grasslands', 'terai grasslands', 'elephant grass'],
    isIndiaLandscape: true,
    biomeType: 'Alluvial Floodplain Grassland & Wetlands',
    visualMarkers: [
      'Dense towering elephant grass (Saccharum and Arundo) standing 4 to 6 meters tall',
      'Shallow oxbow lakes (beels) choked with water hyacinth and lotus blooms',
      'Semi-evergreen riparian forest galleries along river banks and high ridges (dandis)',
      'Rich alluvial silt deposited during regular monsoonal Brahmaputra overflow'
    ],
    geographicContext: 'Spanning the Brahmaputra floodplain in Assam. Annual monsoon flooding submerges up to 80% of the park, rejuvenating the fertile soil and maintaining tall grassland succession.',
    environmentalStatus: 'UNESCO World Heritage Site hosting two-thirds of the world Great One-Horned Rhinoceros population. Confronted with annual animal displacement during severe floods and national highway traffic mortality.',
    climaticData: [
      { month: 'Jan', tempLow: 10, tempHigh: 23, precipitation: 15 },
      { month: 'Feb', tempLow: 13, tempHigh: 26, precipitation: 30 },
      { month: 'Mar', tempLow: 17, tempHigh: 29, precipitation: 75 },
      { month: 'Apr', tempLow: 20, tempHigh: 30, precipitation: 190 },
      { month: 'May', tempLow: 23, tempHigh: 31, precipitation: 310 },
      { month: 'Jun', tempLow: 25, tempHigh: 32, precipitation: 450 },
      { month: 'Jul', tempLow: 26, tempHigh: 32, precipitation: 490 },
      { month: 'Aug', tempLow: 26, tempHigh: 33, precipitation: 410 },
      { month: 'Sep', tempLow: 24, tempHigh: 32, precipitation: 290 },
      { month: 'Oct', tempLow: 21, tempHigh: 30, precipitation: 140 },
      { month: 'Nov', tempLow: 16, tempHigh: 27, precipitation: 25 },
      { month: 'Dec', tempLow: 11, tempHigh: 24, precipitation: 10 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80',
        title: 'Kaziranga Tall Elephant Grass Savanna',
        caption: 'Dense stands of Saccharum and Phragmites grasses reaching heights over 4 meters along the Brahmaputra river.'
      },
      {
        url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80',
        title: 'Wetland Beels & Floodplain Marshes',
        caption: 'Oxbow lakes and marshy water bodies sustaining the world largest population of Great One-Horned Rhinoceroses.'
      }
    ]
  },
  {
    id: 'valleyofflowers',
    canonicalName: 'Valley of Flowers Alpine Meadows',
    aliases: ['valley of flowers', 'valley of flowers national park', 'bhyundar valley', 'chamoli', 'uttarakhand alpine', 'himalayan meadow'],
    isIndiaLandscape: true,
    biomeType: 'Alpine Tundra & Glacial Meadow',
    visualMarkers: [
      'Dense carpet of endemic alpine blooms: Himalayan blue poppy, Brahmakamal, anemones, and potentillas',
      'Pristine U-shaped glacial hanging valley framed by towering snow-capped Zanskar peaks',
      'Pushpawati river fed by melting cirque glaciers and moraine springs',
      'Sub-alpine birch (Bhojpatra) and rhododendron scrub at the timberline transition'
    ],
    geographicContext: 'Nested in Uttarakhand at an altitude between 3,350m and 3,650m in the Western Himalayas. Snowbound from November through May, exploding with hundreds of floral species during the mid-monsoon (July-September).',
    environmentalStatus: 'UNESCO World Heritage National Park. Strictly protected core zone with regulated walking-only access to prevent trampling of fragile alpine turf.',
    climaticData: [
      { month: 'Jan', tempLow: -16, tempHigh: -4, precipitation: 90 },
      { month: 'Feb', tempLow: -14, tempHigh: -2, precipitation: 95 },
      { month: 'Mar', tempLow: -9, tempHigh: 4, precipitation: 85 },
      { month: 'Apr', tempLow: -3, tempHigh: 9, precipitation: 60 },
      { month: 'May', tempLow: 2, tempHigh: 14, precipitation: 55 },
      { month: 'Jun', tempLow: 6, tempHigh: 17, precipitation: 130 },
      { month: 'Jul', tempLow: 9, tempHigh: 18, precipitation: 260 },
      { month: 'Aug', tempLow: 9, tempHigh: 18, precipitation: 240 },
      { month: 'Sep', tempLow: 6, tempHigh: 15, precipitation: 110 },
      { month: 'Oct', tempLow: -1, tempHigh: 10, precipitation: 35 },
      { month: 'Nov', tempLow: -8, tempHigh: 4, precipitation: 25 },
      { month: 'Dec', tempLow: -13, tempHigh: -1, precipitation: 50 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80',
        title: 'Bhyundar Valley Glacial Cirque',
        caption: 'U-shaped glacial hanging valley flanked by snow-capped Zanskar and Greater Himalayan peaks in Uttarakhand.'
      },
      {
        url: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80',
        title: 'Sub-Alpine Flowering Meadows',
        caption: 'Endemic high-altitude flora including Brahmakamal, blue poppies, and primulas blossoming across Pushpawati riverbanks.'
      }
    ]
  },
  {
    id: 'andaman',
    canonicalName: 'Andaman & Nicobar Coral Reef & Islands',
    aliases: ['andaman', 'andaman and nicobar', 'havelock', 'swaraj dweep', 'neil island', 'radhanagar', 'coral reef', 'tropical island'],
    isIndiaLandscape: true,
    biomeType: 'Tropical Coastal Littoral & Coral Reef',
    visualMarkers: [
      'Fringing and barrier coral reefs with high scleractinian diversity and turquoise lagoons',
      'White biogenic coral sands fringed by giant Dipterocarpus and evergreen littoral rainforests',
      'Tidal mangrove swamps dominated by Rhizophora and Avicennia along sheltered bays',
      'Steep volcanic and raised coral limestone island topography'
    ],
    geographicContext: 'Archipelago of over 500 islands located in the southeastern Bay of Bengal. True equatorial maritime climate with over 3,000mm annual rainfall driven by both the Southwest and Northeast monsoons.',
    environmentalStatus: 'Highly sensitive to ocean warming and coral bleaching events, tsunami risks, plastic marine debris, and coastal infrastructure pressure.',
    climaticData: [
      { month: 'Jan', tempLow: 23, tempHigh: 29, precipitation: 40 },
      { month: 'Feb', tempLow: 23, tempHigh: 30, precipitation: 20 },
      { month: 'Mar', tempLow: 24, tempHigh: 31, precipitation: 25 },
      { month: 'Apr', tempLow: 25, tempHigh: 32, precipitation: 65 },
      { month: 'May', tempLow: 25, tempHigh: 31, precipitation: 360 },
      { month: 'Jun', tempLow: 24, tempHigh: 30, precipitation: 480 },
      { month: 'Jul', tempLow: 24, tempHigh: 29, precipitation: 420 },
      { month: 'Aug', tempLow: 24, tempHigh: 29, precipitation: 410 },
      { month: 'Sep', tempLow: 24, tempHigh: 29, precipitation: 430 },
      { month: 'Oct', tempLow: 24, tempHigh: 30, precipitation: 320 },
      { month: 'Nov', tempLow: 24, tempHigh: 30, precipitation: 230 },
      { month: 'Dec', tempLow: 24, tempHigh: 29, precipitation: 140 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=1600&q=80',
        title: 'Fringing Coral Reef Marine Ecosystem',
        caption: 'Vibrant scleractinian hard coral colonies in clear, shallow waters of the Andaman Sea.'
      },
      {
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
        title: 'Tropical Beach & Littoral Forest',
        caption: 'White biogenic coral sand beach bordered by evergreen coastal Dipterocarpus rainforest.'
      }
    ]
  },
  {
    id: 'sahara',
    canonicalName: 'Sahara Desert',
    aliases: ['sahara', 'sahara desert', 'erg chebbi', 'erg chigaga', 'moroccan desert', 'african desert', 'hamada'],
    isIndiaLandscape: false,
    biomeType: 'Hyper-Arid Subtropical Desert & Erg',
    visualMarkers: [
      'Towering longitudinal and star sand dune seas (ergs) reaching over 150 meters',
      'Vast windswept rock plateaus (hamadas) and gravel reg plains',
      'Artesian groundwater oases surrounded by date palms (Phoenix dactylifera)',
      'Intense atmospheric haze from airborne mineral dust and extreme thermal thermals'
    ],
    geographicContext: 'The largest hot desert on Earth, spanning 9.2 million square kilometers across North Africa. Under the permanent descending limb of the Hadley Cell with negligible annual rainfall and ground temperatures exceeding 60°C.',
    environmentalStatus: 'Affected by expanding desertification at the Sahelian boundary, groundwater over-extraction, and climate-amplified temperature extremes.',
    climaticData: [
      { month: 'Jan', tempLow: 9, tempHigh: 21, precipitation: 3 },
      { month: 'Feb', tempLow: 11, tempHigh: 24, precipitation: 3 },
      { month: 'Mar', tempLow: 15, tempHigh: 28, precipitation: 2 },
      { month: 'Apr', tempLow: 19, tempHigh: 33, precipitation: 2 },
      { month: 'May', tempLow: 24, tempHigh: 38, precipitation: 2 },
      { month: 'Jun', tempLow: 28, tempHigh: 43, precipitation: 1 },
      { month: 'Jul', tempLow: 30, tempHigh: 45, precipitation: 1 },
      { month: 'Aug', tempLow: 29, tempHigh: 44, precipitation: 2 },
      { month: 'Sep', tempLow: 26, tempHigh: 39, precipitation: 3 },
      { month: 'Oct', tempLow: 20, tempHigh: 33, precipitation: 3 },
      { month: 'Nov', tempLow: 14, tempHigh: 26, precipitation: 3 },
      { month: 'Dec', tempLow: 10, tempHigh: 21, precipitation: 2 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1600&q=80',
        title: 'Towering Erg Sand Sea of the Sahara',
        caption: 'Massive orange barchan and star dunes spanning hundreds of kilometers across North Africa.'
      },
      {
        url: 'https://images.unsplash.com/photo-1539650116574-8efeb43e2750?auto=format&fit=crop&w=1600&q=80',
        title: 'Desert Oasis & Date Palm Groves',
        caption: 'Groundwater artesian well sustaining agriculture amid severe continental aridity and rocky hamadas.'
      }
    ]
  },
  {
    id: 'taiga',
    canonicalName: 'Taiga Boreal Forest',
    aliases: ['taiga', 'boreal forest', 'boreal', 'coniferous forest', 'siberian taiga', 'canadian boreal'],
    isIndiaLandscape: false,
    biomeType: 'Boreal Coniferous Forest',
    visualMarkers: [
      'Vast contiguous needleleaf evergreen spruce (Picea), fir (Abies), and pine (Pinus)',
      'Subarctic peat bogs, muskegs, and post-glacial kettle lakes',
      'Understory of acid-tolerant mosses, lichens, and dwarf bilberry shrubs',
      'Extensive continuous and discontinuous permafrost underlying shallow podzol soils'
    ],
    geographicContext: 'Circumpolar biome spanning Northern Eurasia and North America between 50°N and 70°N. Severe subarctic winters with temperatures down to -40°C, followed by brief, intensive summer growing seasons.',
    environmentalStatus: 'Rapidly warming at twice the global rate, leading to permafrost thaw, boreal wildfire outbreaks, and bark beetle infestations.',
    climaticData: [
      { month: 'Jan', tempLow: -22, tempHigh: -12, precipitation: 25 },
      { month: 'Feb', tempLow: -20, tempHigh: -9, precipitation: 20 },
      { month: 'Mar', tempLow: -14, tempHigh: -2, precipitation: 22 },
      { month: 'Apr', tempLow: -4, tempHigh: 6, precipitation: 28 },
      { month: 'May', tempLow: 3, tempHigh: 14, precipitation: 38 },
      { month: 'Jun', tempLow: 8, tempHigh: 20, precipitation: 55 },
      { month: 'Jul', tempLow: 11, tempHigh: 23, precipitation: 65 },
      { month: 'Aug', tempLow: 9, tempHigh: 20, precipitation: 60 },
      { month: 'Sep', tempLow: 4, tempHigh: 13, precipitation: 48 },
      { month: 'Oct', tempLow: -2, tempHigh: 4, precipitation: 42 },
      { month: 'Nov', tempLow: -11, tempHigh: -4, precipitation: 32 },
      { month: 'Dec', tempLow: -18, tempHigh: -9, precipitation: 28 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80',
        title: 'Boreal Conifer Expanse (Spruce & Pine)',
        caption: 'Vast subarctic biome dominated by evergreen needleleaf conifers adapted to severe subzero winters.'
      },
      {
        url: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1600&q=80',
        title: 'Glacial Boreal Lake & Peatland',
        caption: 'Pristine freshwater kettle lake reflecting dense taiga canopy in the circumpolar high latitudes.'
      }
    ]
  },
  {
    id: 'serengeti',
    canonicalName: 'Serengeti Acacia Savanna',
    aliases: ['serengeti', 'savanna', 'savannah', 'african savanna', 'maasai mara', 'tropical grassland'],
    isIndiaLandscape: false,
    biomeType: 'Tropical Open Savanna & Grassland',
    visualMarkers: [
      'Expansive open grassland horizons dotted with umbrella acacia trees (Vachellia tortilis)',
      'Isolated granite inselbergs and kopjes providing predator vantage points',
      'Vast herds of migrating wildebeest, zebras, and Thomson gazelles',
      'Seasonal mud rivers (Mara, Grumeti) with steep riverine banks'
    ],
    geographicContext: 'High-elevation volcanic ash plains in northern Tanzania and southern Kenya (1,100m to 2,000m altitude). Defined by a bimodal rainfall regime: short rains (Nov-Dec) and long rains (March-May).',
    environmentalStatus: 'Vulnerable to human-wildlife conflict along boundary reserves, poaching, climate-driven drought spikes, and infrastructure corridors bisecting migration paths.',
    climaticData: [
      { month: 'Jan', tempLow: 15, tempHigh: 28, precipitation: 90 },
      { month: 'Feb', tempLow: 15, tempHigh: 29, precipitation: 85 },
      { month: 'Mar', tempLow: 16, tempHigh: 29, precipitation: 130 },
      { month: 'Apr', tempLow: 16, tempHigh: 28, precipitation: 155 },
      { month: 'May', tempLow: 15, tempHigh: 27, precipitation: 80 },
      { month: 'Jun', tempLow: 14, tempHigh: 26, precipitation: 25 },
      { month: 'Jul', tempLow: 13, tempHigh: 26, precipitation: 15 },
      { month: 'Aug', tempLow: 14, tempHigh: 27, precipitation: 20 },
      { month: 'Sep', tempLow: 14, tempHigh: 28, precipitation: 35 },
      { month: 'Oct', tempLow: 15, tempHigh: 29, precipitation: 55 },
      { month: 'Nov', tempLow: 15, tempHigh: 28, precipitation: 110 },
      { month: 'Dec', tempLow: 15, tempHigh: 28, precipitation: 105 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?auto=format&fit=crop&w=1600&q=80',
        title: 'Acacia Tortilis Savanna Horizon',
        caption: 'Flat-topped umbrella acacia trees scattered across the golden volcanic ash plains of East Africa.'
      },
      {
        url: 'https://images.unsplash.com/photo-1547471080-7cc2caa01a7e?auto=format&fit=crop&w=1600&q=80',
        title: 'Rolling Savanna Grassland at Dawn',
        caption: 'Seasonal grassland ecosystem supporting the world largest terrestrial mammal migration.'
      }
    ]
  },
  {
    id: 'tibetan_plateau',
    canonicalName: 'Tibetan Plateau & Himalayan Alpine Steppe',
    aliases: ['china', 'tibet', 'tibetan plateau', 'plateau of tibet', 'roof of the world', 'qinghai', 'himalayan steppe', 'gobi'],
    isIndiaLandscape: false,
    biomeType: 'Montane Grasslands and Shrublands',
    visualMarkers: [
      'Vast high-altitude permafrost steppe bordered by snow-capped Himalayan massifs',
      'Turquoise glacial and endorheic lakes (Namtso, Yamdrok, Qinghai Lake)',
      'Sparse alpine cushion flora, Stipa needle grasses, and yak grazing pasture',
      'Deep river headwaters feeding the Yangtze, Yellow, and Mekong rivers'
    ],
    geographicContext: 'Spanning nearly 2.5 million square kilometers with an average elevation exceeding 4,500 meters, the Tibetan Plateau is the world\'s highest and largest plateau. Known as the "Third Pole", it acts as a primary heat and moisture engine driving the Asian summer monsoons.',
    environmentalStatus: 'Critically threatened by permafrost thaw, accelerated glacial melt, desertification, and downstream hydrological vulnerability across Asia.',
    climaticData: [
      { month: 'Jan', tempLow: -14, tempHigh: -1, precipitation: 2 },
      { month: 'Feb', tempLow: -11, tempHigh: 2, precipitation: 4 },
      { month: 'Mar', tempLow: -7, tempHigh: 6, precipitation: 8 },
      { month: 'Apr', tempLow: -2, tempHigh: 11, precipitation: 15 },
      { month: 'May', tempLow: 3, tempHigh: 16, precipitation: 35 },
      { month: 'Jun', tempLow: 7, tempHigh: 20, precipitation: 75 },
      { month: 'Jul', tempLow: 9, tempHigh: 21, precipitation: 125 },
      { month: 'Aug', tempLow: 8, tempHigh: 20, precipitation: 115 },
      { month: 'Sep', tempLow: 5, tempHigh: 17, precipitation: 60 },
      { month: 'Oct', tempLow: -1, tempHigh: 12, precipitation: 12 },
      { month: 'Nov', tempLow: -8, tempHigh: 5, precipitation: 3 },
      { month: 'Dec', tempLow: -13, tempHigh: 1, precipitation: 1 }
    ],
    photos: [
      {
        url: 'https://images.unsplash.com/photo-1544644181-1484b3fdfc62?auto=format&fit=crop&w=1600&q=80',
        title: 'Tibetan Plateau & Sacred Glacial Lake',
        caption: 'High-elevation turquoise glacial lake resting below snow-capped peaks on the Tibetan plateau.'
      },
      {
        url: 'https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?auto=format&fit=crop&w=1600&q=80',
        title: 'Alpine Steppe & Permafrost Basin',
        caption: 'Endless high-altitude grassland plains surrounded by the vast Trans-Himalayan escarpments.'
      },
      {
        url: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&w=1600&q=80',
        title: 'South China Karst Mountain Pinnacles',
        caption: 'Towering limestone karst pillars draped in subtropical evergreen flora in Southern China.'
      }
    ]
  }
];

export function findCuratedBiome(query?: string, biomeName?: string): CuratedBiomeEntry | null {
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
  const searchTerms = [query, biomeName].filter((t): t is string => Boolean(t && t.trim().length > 1));

  // 1. Exact or substring match across canonical name and aliases
  for (const term of searchTerms) {
    const clean = normalize(term);
    for (const entry of CURATED_BIOMES) {
      if (clean === normalize(entry.canonicalName)) return entry;
      if (entry.aliases.some(alias => clean.includes(normalize(alias)) || normalize(alias).includes(clean))) {
        return entry;
      }
    }
  }

  // 2. Token-level matching (e.g. "rainforest", "desert", "shola", "mangroves", "wetlands", "grasslands", "himalayas", "mountains", "plateau", "tundra", "savanna")
  const stopWords = new Set(['the', 'and', 'of', 'in', 'a', 'an', 'at', 'to', 'for', 'is', 'on', 'with', 'by']);
  for (const term of searchTerms) {
    const tokens = normalize(term).split(/\s+/).filter(t => t.length > 2 && !stopWords.has(t));
    for (const token of tokens) {
      for (const entry of CURATED_BIOMES) {
        if (normalize(entry.canonicalName).split(/\s+/).includes(token)) return entry;
        if (normalize(entry.biomeType).split(/\s+/).includes(token)) return entry;
        if (entry.aliases.some(alias => normalize(alias).split(/\s+/).includes(token))) return entry;
      }
    }
  }

  return null;
}
