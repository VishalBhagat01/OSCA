import { Info } from "lucide-react";

const InfoCard = ({ title, children, icon: Icon = Info, className = "" }) => {
  return (
    <div className={`rounded-2xl border border-white/6 bg-[#111111] p-5 space-y-3 ${className}`}>
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 text-[#737370] border border-white/6">
          <Icon className="h-4 w-4" />
        </div>
        <h3 className="text-sm font-semibold text-[#E8E8E3]">{title}</h3>
      </div>
      <div className="text-[13px] text-[#737370] leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default InfoCard;