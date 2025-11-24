export interface Coordinates {
  lat: number;
  lng: number;
}

export interface InfluencerData {
  summary: string;
  sourceCount: number;
  topMentionedBy: string[];
}

export interface ViralPost {
  handle: string;
  caption: string;
  likes: string;
  imageUrl: string;
  isReel?: boolean;
}

export interface FoodSpot {
  id: string;
  name: string;
  cuisine: string;
  address: string;
  priceRange: 'Low' | 'Medium' | 'High' | 'Luxury';
  coordinates: Coordinates;
  sentimentScore: number; // 0-100
  trendingScore: number; // 0-100
  popularityVelocity: number; // Change in popularity
  bestDishes: string[];
  description: string;
  aiConfidence: number; // 0-100
  influencerData: InfluencerData;
  viralPosts: ViralPost[];
  lastUpdated: string;
}

export interface DiscoveryResult {
  spots: FoodSpot[];
  center: Coordinates;
  locationName: string;
}

export enum AgentType {
  IDLE = 'IDLE',
  DISCOVERY = 'Nearby Discovery Agent',
  SEARCH = 'Search & Extract Agent',
  RANKING = 'Spot Ranking Agent',
  VALIDATION = 'Validation Agent',
  REFRESH = 'Weekly Refresh Agent'
}

export interface AgentLog {
  id: string;
  timestamp: number;
  message: string;
  agent: AgentType;
}

export interface FilterState {
  cuisine: string | null;
  minSentiment: number;
  onlyTrending: boolean;
}