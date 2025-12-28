import React from 'react';
import { Home, Music, Radio, Grid, Heart, PlusCircle } from 'lucide-react';

interface SidebarProps {
  onUploadClick: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onUploadClick }) => {
  const NavItem = ({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) => (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-lg cursor-pointer transition-colors ${active ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}>
      <Icon size={20} />
      <span className="font-medium text-sm">{label}</span>
    </div>
  );

  return (
    <div className="w-64 bg-[#1c1c1e] h-full flex flex-col border-r border-white/5 pt-8 pb-4 hidden md:flex">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-2 text-rose-500 mb-1">
          <Music size={28} fill="currentColor" />
          <span className="text-xl font-bold text-white tracking-tight">Music</span>
        </div>
      </div>

      <div className="px-2 space-y-1">
        <NavItem icon={Home} label="Home" />
        <NavItem icon={Grid} label="Browse" />
        <NavItem icon={Radio} label="Radio" />
      </div>

      <div className="mt-8 px-6 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
        Library
      </div>
      <div className="px-2 space-y-1">
        <NavItem icon={Music} label="Songs" active />
        <NavItem icon={Heart} label="Made For You" />
      </div>

      <div className="mt-auto px-4">
        <button 
          onClick={onUploadClick}
          className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-medium transition-all active:scale-95"
        >
          <PlusCircle size={18} />
          <span>Upload Music</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;