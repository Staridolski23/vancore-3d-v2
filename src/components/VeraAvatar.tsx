export default function VeraAvatar({ className = "w-10 h-10" }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Background circle */}
      <circle cx="50" cy="50" r="50" fill="#991930" />
      
      {/* Hair - long, flowing */}
      <path d="M20 45 C20 25, 35 15, 50 15 C65 15, 80 25, 80 45 L80 70 C80 75, 75 80, 70 80 L30 80 C25 80, 20 75, 20 70 Z" fill="#4a2c2a" />
      {/* Hair sides flowing down */}
      <path d="M20 45 C18 55, 18 70, 22 80 L26 75 C24 65, 24 55, 28 48 Z" fill="#3d2420" />
      <path d="M80 45 C82 55, 82 70, 78 80 L74 75 C76 65, 76 55, 72 48 Z" fill="#3d2420" />
      
      {/* Face */}
      <ellipse cx="50" cy="52" rx="22" ry="25" fill="#f5d0b0" />
      
      {/* Eyes - big, friendly, slightly winking */}
      {/* Left eye - winking */}
      <path d="M36 50 Q40 46 44 50" stroke="#2d1810" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {/* Right eye - open, big and friendly */}
      <ellipse cx="62" cy="48" rx="5" ry="6" fill="white" />
      <circle cx="63" cy="48" r="3.5" fill="#4a2c2a" />
      <circle cx="64" cy="47" r="1.5" fill="white" />
      
      {/* Eyebrows */}
      <path d="M34 42 Q40 38 46 41" stroke="#4a2c2a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      <path d="M58 40 Q64 36 70 39" stroke="#4a2c2a" strokeWidth="1.8" fill="none" strokeLinecap="round" />
      
      {/* Nose */}
      <path d="M50 52 Q52 58 50 60 Q48 58 50 52" stroke="#d4a88a" strokeWidth="1.2" fill="none" />
      
      {/* Mouth - friendly smile */}
      <path d="M42 66 Q50 72 58 66" stroke="#c47a7a" strokeWidth="2" fill="none" strokeLinecap="round" />
      
      {/* Blush */}
      <ellipse cx="38" cy="58" rx="5" ry="3" fill="#f0b0b0" opacity="0.5" />
      <ellipse cx="62" cy="58" rx="5" ry="3" fill="#f0b0b0" opacity="0.5" />
      
      {/* Hair highlight */}
      <path d="M40 20 C45 12, 55 12, 60 20" stroke="#6b3d35" strokeWidth="2" fill="none" opacity="0.6" />
    </svg>
  );
}
