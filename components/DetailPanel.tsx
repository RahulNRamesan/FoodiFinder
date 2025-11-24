import React from 'react';
import { FoodSpot } from '../types';
import { X, TrendingUp, DollarSign, Users, Heart, Play } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DetailPanelProps {
  spot: FoodSpot;
  onClose: () => void;
}

export const DetailPanel: React.FC<DetailPanelProps> = ({ spot, onClose }) => {
  // Generate mock historical data for the chart based on current trends
  const data = Array.from({ length: 7 }, (_, i) => ({
    day: `Day ${i + 1}`,
    score: Math.max(50, Math.min(100, spot.trendingScore + (Math.random() * 20 - 10) + (spot.popularityVelocity * i * 0.2))),
    mentions: Math.max(0, Math.floor(spot.influencerData.sourceCount / 7 * (i + 1) + Math.random() * 5))
  }));

  return (
    <div className="w-full h-full bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-[slideInRight_0.3s_ease-out]">
      {/* Header */}
      <div className="relative h-40 bg-slate-100 shrink-0">
        <img 
          src={`https://picsum.photos/seed/${spot.id}/800/400`} 
          alt={spot.name} 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 bg-white/90 hover:bg-white rounded-full text-slate-800 transition-colors shadow-sm"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="absolute bottom-3 left-4 right-4 text-white">
          <h2 className="text-xl font-bold mb-0.5">{spot.name}</h2>
          <div className="flex items-center space-x-3 text-xs opacity-90">
             <span className="bg-white/20 px-2 py-0.5 rounded backdrop-blur-sm border border-white/30">{spot.cuisine}</span>
             <span className="flex items-center"><DollarSign className="w-3 h-3 mr-0.5" /> {spot.priceRange}</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-white">
        
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
             <div className="text-brand-primary font-bold text-lg">{spot.sentimentScore}</div>
             <div className="text-[10px] text-slate-500 uppercase font-semibold">Sentiment</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
             <div className="text-brand-dark font-bold text-lg">{spot.trendingScore}</div>
             <div className="text-[10px] text-slate-500 uppercase font-semibold">Trend</div>
          </div>
          <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center">
             <div className="text-green-600 font-bold text-lg">+{spot.popularityVelocity}%</div>
             <div className="text-[10px] text-slate-500 uppercase font-semibold">Growth</div>
          </div>
        </div>

        {/* Viral on Social */}
        {spot.viralPosts && spot.viralPosts.length > 0 && (
          <div>
            <h3 className="text-xs font-bold text-brand-dark mb-2 flex items-center">
              <Heart className="w-3 h-3 mr-1.5 fill-current" />
              Viral on Social
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {spot.viralPosts.map((post, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-lg overflow-hidden group hover:shadow-md transition-shadow">
                  <div className="relative h-24 bg-slate-200">
                    <img src={post.imageUrl} alt={post.caption} className="w-full h-full object-cover" />
                    {post.isReel && (
                      <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                        <div className="w-6 h-6 bg-white/90 rounded-full flex items-center justify-center shadow-sm">
                          <Play className="w-3 h-3 text-slate-900 fill-slate-900 ml-0.5" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-1.5">
                      <p className="text-[10px] text-white font-medium truncate">{post.handle}</p>
                    </div>
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-slate-600 line-clamp-2 leading-tight mb-1.5">{post.caption}</p>
                    <div className="flex items-center text-[10px] text-slate-400">
                      <Heart className="w-2.5 h-2.5 mr-1" />
                      {post.likes} likes
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Insight */}
        <div className="bg-brand-background p-3 rounded-lg border border-slate-200">
          <h3 className="text-xs font-bold text-brand-dark mb-1 flex items-center">
            <Users className="w-3 h-3 mr-1.5" />
            Influencer Consensus
          </h3>
          <p className="text-xs text-slate-600 leading-relaxed italic">
            "{spot.influencerData.summary}"
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {spot.influencerData.topMentionedBy.map((inf, i) => (
              <span key={i} className="text-[10px] bg-white text-slate-500 px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
                {inf}
              </span>
            ))}
          </div>
        </div>

        {/* Charts */}
        <div>
          <h3 className="text-xs font-bold text-slate-800 mb-2 flex items-center">
            <TrendingUp className="w-3 h-3 mr-1.5 text-brand-primary" />
            Interest Over Time
          </h3>
          <div className="h-32 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" hide />
                <YAxis hide domain={[0, 120]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#fff', borderColor: '#e2e8f0', color: '#1e2937', fontSize: '12px', borderRadius: '4px', padding: '4px 8px' }}
                />
                <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Dishes */}
        <div>
           <h3 className="text-xs font-bold text-slate-800 mb-2">Recommended Items</h3>
           <ul className="space-y-1.5">
             {spot.bestDishes.map((dish, idx) => (
               <li key={idx} className="flex items-center text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                 <span className="w-5 h-5 rounded-full bg-brand-primary text-white flex items-center justify-center text-[10px] font-bold mr-2">
                   {idx + 1}
                 </span>
                 {dish}
               </li>
             ))}
           </ul>
        </div>
      </div>
    </div>
  );
};