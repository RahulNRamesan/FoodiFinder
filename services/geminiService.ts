import { GoogleGenAI, Type, Schema } from "@google/genai";
import { FoodSpot, Coordinates, DiscoveryResult } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Simple in-memory cache to ensure consistent results for the same query
const requestCache: Record<string, DiscoveryResult> = {};

export type { DiscoveryResult };

const spotSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING },
    cuisine: { type: Type.STRING },
    address: { type: Type.STRING },
    priceRange: { type: Type.STRING, enum: ['Low', 'Medium', 'High', 'Luxury'] },
    sentimentScore: { type: Type.NUMBER, description: "Score from 0-100 based on reviews" },
    trendingScore: { type: Type.NUMBER, description: "Score from 0-100 based on recent social media activity" },
    popularityVelocity: { type: Type.NUMBER, description: "Positive or negative integer indicating growth" },
    bestDishes: { type: Type.ARRAY, items: { type: Type.STRING } },
    description: { type: Type.STRING, description: "Short AI summary of the vibe" },
    aiConfidence: { type: Type.NUMBER, description: "0-100 confidence in data accuracy" },
    influencerSummary: { type: Type.STRING, description: "Summary of what influencers are saying" },
    topInfluencers: { type: Type.ARRAY, items: { type: Type.STRING } },
    latitude: { type: Type.NUMBER, description: "Precise latitude of the establishment" },
    longitude: { type: Type.NUMBER, description: "Precise longitude of the establishment" },
    viralPosts: { 
      type: Type.ARRAY, 
      description: "List of 1-2 relevant social media posts",
      items: {
        type: Type.OBJECT,
        properties: {
          handle: { type: Type.STRING },
          caption: { type: Type.STRING },
          likes: { type: Type.STRING },
          imageUrl: { type: Type.STRING },
          isReel: { type: Type.BOOLEAN }
        }
      }
    }
  },
  required: ["name", "cuisine", "sentimentScore", "trendingScore", "bestDishes", "description", "latitude", "longitude"]
};

// Root schema now includes region metadata to handle "Geocoding" via AI
const discoveryResponseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    regionName: { type: Type.STRING, description: "The formalized name of the location found, e.g. 'Paris, France'" },
    regionLat: { type: Type.NUMBER, description: "Latitude of the location center" },
    regionLng: { type: Type.NUMBER, description: "Longitude of the location center" },
    spots: {
      type: Type.ARRAY,
      items: spotSchema
    }
  }
};

export const fetchFoodSpots = async (
  query: string, 
  currentLat: number, 
  currentLng: number
): Promise<DiscoveryResult> => {
  const cacheKey = query.toLowerCase().trim();

  // 1. Check Cache
  if (requestCache[cacheKey]) {
    return requestCache[cacheKey];
  }

  try {
    if (!process.env.API_KEY) {
      console.warn("No API Key provided. Returning mock data.");
      const mockResult = mockSpots(query, currentLat, currentLng);
      requestCache[cacheKey] = mockResult;
      return mockResult;
    }

    const prompt = `
      You are an autonomous AI food discovery agent.
      
      Task:
      1. Analyze the query "${query}". If it is a location (e.g., "Tokyo"), identify its geographic center (lat/lng). If it is a generic food search (e.g., "Sushi"), use the provided current location coordinates.
      2. Find between 6 to 12 trending food spots in that area. 
      3. CRITICAL: All spots MUST be within a STRICT 5km radius of the location center. Do not recommend spots further away.
      4. For each spot, analyze recent social sentiment (TikTok/Instagram) to generate scores.
      5. Provide EXACT latitude and longitude for each spot to ensure map accuracy.
      6. For each spot, create 1 or 2 simulated viral social media posts (Instagram/TikTok style) that capture the vibe. Mark some as Reels.
      7. Return a structured JSON object containing the region details and the list of spots.
    `;

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: discoveryResponseSchema,
        systemInstruction: `You are FoodiFind's core intelligence. Focus on 'hidden gems', viral spots, and high-quality experiences within a 5km radius.`
      }
    });

    const rawData = JSON.parse(result.text || '{}');
    const regionName = rawData.regionName || query;
    const regionLat = rawData.regionLat || currentLat;
    const regionLng = rawData.regionLng || currentLng;
    const spotsList = rawData.spots || [];

    const processedSpots = spotsList.map((item: any, index: number) => ({
      id: `gemini-${Date.now()}-${index}`,
      name: item.name,
      cuisine: item.cuisine,
      address: item.address,
      priceRange: item.priceRange,
      coordinates: {
        lat: item.latitude || regionLat + (Math.random() * 0.02 - 0.01),
        lng: item.longitude || regionLng + (Math.random() * 0.02 - 0.01)
      },
      sentimentScore: item.sentimentScore,
      trendingScore: item.trendingScore,
      popularityVelocity: item.popularityVelocity,
      bestDishes: item.bestDishes,
      description: item.description,
      aiConfidence: item.aiConfidence,
      influencerData: {
        summary: item.influencerSummary || "Trending on social feeds",
        sourceCount: Math.floor(Math.random() * 50) + 10,
        topMentionedBy: item.topInfluencers || []
      },
      viralPosts: item.viralPosts || [
        {
          handle: "@foodie_explorer",
          caption: `Checking out ${item.name}! The vibes are unmatched. #foodie`,
          likes: "12.5k",
          imageUrl: `https://picsum.photos/seed/${index}/400/400`,
          isReel: true
        }
      ],
      lastUpdated: new Date().toISOString()
    }));

    const finalResult = {
      spots: processedSpots,
      center: { lat: regionLat, lng: regionLng },
      locationName: regionName
    };

    // 2. Save to Cache
    requestCache[cacheKey] = finalResult;
    return finalResult;

  } catch (error) {
    console.error("Gemini API Error:", error);
    const fallback = mockSpots(query, currentLat, currentLng);
    requestCache[cacheKey] = fallback;
    return fallback;
  }
};

// Fallback Mock Data generator
const mockSpots = (query: string, lat: number, lng: number): DiscoveryResult => {
  // Simple check to see if we should "move" the map in mock mode
  // This is a basic simulation for demo purposes without an API key
  let centerLat = lat;
  let centerLng = lng;
  let locName = "Kochi, Kerala";

  const q = query.toLowerCase();

  if (q.includes('paris')) {
    centerLat = 48.8566;
    centerLng = 2.3522;
    locName = "Paris, France";
  } else if (q.includes('new york')) {
    centerLat = 40.7128;
    centerLng = -74.0060;
    locName = "New York, USA";
  } else if (q.includes('kochi') || query === "Kochi, Kerala") {
    centerLat = 9.9312;
    centerLng = 76.2673;
    locName = "Kochi, Kerala";
  } else {
    // If unknown query in mock mode, stay put but update name
    locName = query;
  }

  // Generate deterministic mock spots based on location name length to seed randomness slightly
  const seed = locName.length;
  
  const spots: FoodSpot[] = [
    {
      id: `mock-1-${seed}`,
      name: q.includes('paris') ? "Le Bistrot" : "Paragon Restaurant",
      cuisine: q.includes('paris') ? "French" : "Kerala / Malabar",
      address: q.includes('paris') ? "Rue de Rivoli" : "Edappally",
      priceRange: "Medium",
      coordinates: { lat: centerLat + 0.002, lng: centerLng - 0.003 },
      sentimentScore: 98,
      trendingScore: 95,
      popularityVelocity: 12,
      bestDishes: q.includes('paris') ? ["Escargots", "Steak Frites"] : ["Fish Mango Curry", "Chicken Biryani", "Elaneer Payasam"],
      description: q.includes('paris') ? "Classic Parisian dining experience." : "Legendary culinary landmark famous for authentic Malabar biryani.",
      aiConfidence: 99,
      influencerData: { summary: "Must-visit for authentic flavors", sourceCount: 540, topMentionedBy: ["@eat_local", "@foodie_daily"] },
      viralPosts: [
        {
          handle: "@top_eats",
          caption: "The BEST in town! 🍛🔥 The biryani is to die for.",
          likes: "45.2k",
          imageUrl: "https://images.unsplash.com/photo-1633945274405-b6c8069047b0?w=500&q=80",
          isReel: true
        },
        {
          handle: "@travel_eats_kerala",
          caption: "Crowd is crazy but worth the wait. #paragon",
          likes: "8.1k",
          imageUrl: "https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=500&q=80",
          isReel: false
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: `mock-2-${seed}`,
      name: q.includes('paris') ? "Cafe de Flore" : "Kashi Art Cafe",
      cuisine: "Cafe",
      address: q.includes('paris') ? "Saint-Germain" : "Fort Kochi",
      priceRange: "Medium",
      coordinates: { lat: centerLat - 0.004, lng: centerLng - 0.012 },
      sentimentScore: 94,
      trendingScore: 88,
      popularityVelocity: 5,
      bestDishes: ["Chocolate Cake", "Coffee"],
      description: "Artsy ambiance perfect for casual meetups.",
      aiConfidence: 96,
      influencerData: { summary: "Instagrammable art spots", sourceCount: 320, topMentionedBy: ["@travel_diaries"] },
      viralPosts: [
        {
          handle: "@artandfood",
          caption: "Coffee + Art = Perfect Sunday 🎨☕️",
          likes: "12k",
          imageUrl: "https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=500&q=80",
          isReel: false
        },
        {
          handle: "@cafe_vibes",
          caption: "This chocolate cake is illegal 🍫",
          likes: "5.4k",
          imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=500&q=80",
          isReel: true
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: `mock-3-${seed}`,
      name: q.includes('paris') ? "L'Ambroisie" : "Grand Pavilion",
      cuisine: q.includes('paris') ? "Haute Cuisine" : "Seafood",
      address: q.includes('paris') ? "Place des Vosges" : "MG Road",
      priceRange: "High",
      coordinates: { lat: centerLat + 0.005, lng: centerLng + 0.002 },
      sentimentScore: 90,
      trendingScore: 82,
      popularityVelocity: -1,
      bestDishes: ["Seafood Platter", "Signature Curry"],
      description: "Classic fine dining spot known for traditional preparation.",
      aiConfidence: 92,
      influencerData: { summary: "Consistent quality over decades", sourceCount: 150, topMentionedBy: ["@chef_fan"] },
      viralPosts: [
        {
          handle: "@fine_dining",
          caption: "Dinner date perfection. 🍷",
          likes: "8.5k",
          imageUrl: "https://images.unsplash.com/photo-1599084993091-1cb5c0721cc6?w=500&q=80",
          isReel: false
        }
      ],
      lastUpdated: new Date().toISOString()
    },
    {
      id: `mock-4-${seed}`,
      name: q.includes('paris') ? "Big Mamma" : "District 7 Restro Cafe",
      cuisine: "Italian/Fusion",
      address: q.includes('paris') ? "Oberkampf" : "Vyttila",
      priceRange: "Medium",
      coordinates: { lat: centerLat - 0.001, lng: centerLng + 0.008 },
      sentimentScore: 88,
      trendingScore: 96,
      popularityVelocity: 25,
      bestDishes: ["Truffle Pasta", "Loaded Burger"],
      description: "Trending spot for heavy meals and youth crowd vibes.",
      aiConfidence: 85,
      influencerData: { summary: "Viral food challenges", sourceCount: 410, topMentionedBy: ["@food_hunter"] },
      viralPosts: [
        {
          handle: "@burger_king_local",
          caption: "Can you finish this? 🍔🍔",
          likes: "22k",
          imageUrl: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80",
          isReel: true
        },
        {
          handle: "@food_challenges",
          caption: "Challenge accepted! 🔥",
          likes: "15k",
          imageUrl: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=500&q=80",
          isReel: true
        }
      ],
      lastUpdated: new Date().toISOString()
    }
  ];

  return { spots, center: { lat: centerLat, lng: centerLng }, locationName: locName };
};