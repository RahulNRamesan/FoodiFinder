import React from 'react';
import { FoodSpot } from '../types';
import { TrendingUp, Star, MapPin } from 'lucide-react';

interface SpotCardProps {
  spot: FoodSpot;
  onSelect: (spot: FoodSpot) => void;
  selected: boolean;
}

export const SpotCard: React.FC<SpotCardProps> = ({ spot, onSelect, selected }) => {
  return (
    <div 
      onClick={() => onSelect(spot)}
      className={`group relative bg-white border transition-all duration-200 cursor-pointer rounded-lg overflow-hidden hover:shadow-lg ${selected ? 'border-brand-dark shadow-md ring-1 ring-brand-dark' : 'border-slate-200 hover:border-brand-dark/30'}`}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-2">
          <div className="flex-1">
            <h3 className="text-base font-bold text-slate-800 group-hover:text-brand-dark transition-colors">{spot.name}</h3>
            <div className="flex items-center text-xs text-slate-500 mt-1">
              <MapPin className="w-3 h-3 mr-1" />
              {spot.address.split(',')[0]}
            </div>
          </div>
          {spot.trendingScore > 85 && (
             <div className="bg-brand-dark text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center shadow-sm">
               <TrendingUp className="w-3 h-3 mr-1" />
               HOT
             </div>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed mb-3">
          {spot.description}
        </p>

        {/* Metrics Row */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
           <div className="flex space-x-2">
              <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded font-bold">{spot.cuisine}</span>
              <span className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded font-medium">{spot.priceRange}</span>
           </div>
           
           <div className="flex items-center text-brand-dark">
              <Star className="w-3 h-3 fill-current mr-1" />
              <span className="text-xs font-bold">{spot.aiConfidence}% Match</span>
           </div>
        </div>
      </div>

      {/* Selection Indicator Bar */}
      {selected && (
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-brand-dark"></div>
      )}
    </div>
  );
};