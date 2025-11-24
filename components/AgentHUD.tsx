import React, { useEffect, useRef } from 'react';
import { Terminal, ShieldCheck, Search, Database, Radio, Activity } from 'lucide-react';
import { AgentType, AgentLog } from '../types';

interface AgentHUDProps {
  logs: AgentLog[];
  activeAgent: AgentType;
}

export const AgentHUD: React.FC<AgentHUDProps> = ({ logs, activeAgent }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs]);

  const getIcon = (agent: AgentType) => {
    switch (agent) {
      case AgentType.DISCOVERY: return <Radio className="w-3 h-3 text-blue-500" />;
      case AgentType.SEARCH: return <Search className="w-3 h-3 text-purple-500" />;
      case AgentType.RANKING: return <Activity className="w-3 h-3 text-orange-500" />;
      case AgentType.VALIDATION: return <ShieldCheck className="w-3 h-3 text-green-500" />;
      default: return <Database className="w-3 h-3 text-slate-400" />;
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-soft flex flex-col w-80 max-h-48 overflow-hidden font-mono text-xs">
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 bg-slate-50">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3 h-3 text-slate-400" />
          <span className="font-bold text-slate-700">AGENT LOGS</span>
        </div>
        <div className="flex items-center space-x-1.5">
          <span className="text-[10px] font-medium text-slate-500">{activeAgent === AgentType.IDLE ? 'IDLE' : 'RUNNING'}</span>
          <div className={`w-1.5 h-1.5 rounded-full ${activeAgent !== AgentType.IDLE ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
        </div>
      </div>
      
      <div className="relative flex-1 bg-white p-2">
        <div ref={scrollRef} className="h-full overflow-y-auto space-y-1.5 pr-1 max-h-[10rem]">
          {logs.map((log) => (
            <div key={log.id} className="flex items-start space-x-2">
              <span className="mt-0.5 opacity-70">{getIcon(log.agent)}</span>
              <div>
                <span className="text-[10px] text-slate-400 block">{new Date(log.timestamp).toLocaleTimeString()}</span>
                <span className="text-slate-700 leading-tight">{log.message}</span>
              </div>
            </div>
          ))}
          {logs.length === 0 && (
            <div className="text-slate-400 italic text-center mt-6">System ready. Waiting for input...</div>
          )}
        </div>
      </div>
    </div>
  );
};