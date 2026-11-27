import { Info } from "lucide-react";

const InfoCard = ({ title, children, icon: Icon = Info, className = "" }) => (
  <div className={`surface space-y-3 p-5 ${className}`}>
    <div className="flex items-center gap-2.5">
      <Icon className="h-4 w-4 text-bone-3" aria-hidden />
      <h3 className="font-display text-base text-bone">{title}</h3>
    </div>
    <div className="text-sm leading-relaxed text-bone-2">{children}</div>
  </div>
);

export default InfoCard;
