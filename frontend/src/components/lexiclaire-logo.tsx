interface LexiclaireLogo {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}

export function LexiclaireLogo({ 
  size = 32, 
  showText = true, 
  className = "", 
  textClassName = "" 
}: LexiclaireLogo) {
  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Logo Icon */}
      <div className="relative">
        <svg
          width={size}
          height={size}
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="drop-shadow-sm"
        >
          {/* Background Circle with Gradient */}
          <defs>
            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4A90E2" />
              <stop offset="100%" stopColor="#50E3C2" />
            </linearGradient>
            <linearGradient id="documentGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="100%" stopColor="#F7F8FA" />
            </linearGradient>
          </defs>
          
          {/* Main background circle */}
          <circle 
            cx="16" 
            cy="16" 
            r="15" 
            fill="url(#logoGradient)"
            stroke="#FFFFFF"
            strokeWidth="1"
          />
          
          {/* Document base */}
          <rect
            x="8"
            y="7"
            width="12"
            height="16"
            rx="1.5"
            fill="url(#documentGradient)"
            stroke="#DDE2E8"
            strokeWidth="0.5"
          />
          
          {/* AI Circuit Pattern - representing intelligence */}
          <g opacity="0.7">
            {/* Horizontal lines */}
            <line x1="10" y1="10" x2="18" y2="10" stroke="#4A90E2" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="10" y1="12.5" x2="16" y2="12.5" stroke="#4A90E2" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="10" y1="15" x2="18" y2="15" stroke="#50E3C2" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="10" y1="17.5" x2="15" y2="17.5" stroke="#50E3C2" strokeWidth="0.8" strokeLinecap="round" />
            <line x1="10" y1="20" x2="17" y2="20" stroke="#4A90E2" strokeWidth="0.8" strokeLinecap="round" />
            
            {/* Circuit nodes */}
            <circle cx="18" cy="10" r="1" fill="#4A90E2" />
            <circle cx="16" cy="12.5" r="0.8" fill="#4A90E2" />
            <circle cx="18" cy="15" r="1" fill="#50E3C2" />
            <circle cx="15" cy="17.5" r="0.8" fill="#50E3C2" />
          </g>
          
          {/* Clarity symbol - representing understanding */}
          <g transform="translate(14, 4)">
            <circle 
              cx="2" 
              cy="2" 
              r="1.5" 
              fill="none" 
              stroke="#50E3C2" 
              strokeWidth="0.8"
              opacity="0.9"
            />
            <circle cx="2" cy="2" r="0.5" fill="#50E3C2" opacity="0.9" />
          </g>
        </svg>
      </div>
      
      {/* Brand Text */}
      {showText && (
        <span 
          className={`font-bold text-foreground ${textClassName}`} 
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Lexiclaire
        </span>
      )}
    </div>
  );
}

export function LexiclaireWordmark({ className = "", size = "default" }: { 
  className?: string; 
  size?: "sm" | "default" | "lg" | "xl" 
}) {
  const sizeClasses = {
    sm: "text-lg",
    default: "text-2xl", 
    lg: "text-3xl",
    xl: "text-4xl"
  };

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      <LexiclaireLogo 
        size={size === "sm" ? 24 : size === "lg" ? 40 : size === "xl" ? 48 : 32} 
        showText={false} 
      />
      <div className="flex flex-col">
        <span 
          className={`font-bold text-foreground leading-tight ${sizeClasses[size]}`}
          style={{ fontFamily: 'Inter, sans-serif' }}
        >
          Lexiclaire
        </span>
        {size !== "sm" && (
          <span 
            className="text-xs text-secondary font-medium italic leading-tight"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Justice begins with understanding
          </span>
        )}
      </div>
    </div>
  );
}