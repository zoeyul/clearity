interface ClarityLogoProps {
  className?: string
  size?: number
}

export function ClarityLogo({ className, size = 24 }: ClarityLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Glass gradient - white to transparent */}
        <linearGradient id="glass-fill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="0.9" />
          <stop offset="50%" stopColor="white" stopOpacity="0.4" />
          <stop offset="100%" stopColor="white" stopOpacity="0.7" />
        </linearGradient>

        {/* Specular highlight */}
        <linearGradient id="glass-shine" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="white" stopOpacity="1" />
          <stop offset="40%" stopColor="white" stopOpacity="0.1" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>

        {/* Soft glow filter */}
        <filter id="glass-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Main large sparkle - glass body */}
      <path
        d="M12 2L13.8 8.6L18 4.8L14.8 9.6L21 12L14.8 14.4L18 19.2L13.8 15.4L12 22L10.2 15.4L6 19.2L9.2 14.4L3 12L9.2 9.6L6 4.8L10.2 8.6L12 2Z"
        fill="url(#glass-fill)"
        stroke="white"
        strokeWidth="0.5"
        strokeOpacity="0.6"
        filter="url(#glass-glow)"
      />

      {/* Inner specular reflection */}
      <path
        d="M12 4.5L13.2 9L16 6.5L13.8 10L19 12L13.8 14L16 17.5L13.2 15L12 19.5L10.8 15L8 17.5L10.2 14L5 12L10.2 10L8 6.5L10.8 9L12 4.5Z"
        fill="url(#glass-shine)"
        opacity="0.5"
      />

      {/* Top-left bright spot - light refraction */}
      <circle cx="10.5" cy="9" r="1.2" fill="white" opacity="0.7" />
      <circle cx="10.5" cy="9" r="0.5" fill="white" opacity="0.95" />

      {/* Small accent sparkle - bottom right */}
      <path
        d="M19 17L19.6 19L21 18.2L20 19.6L22 20L20 20.4L21 21.8L19.6 21L19 23L18.4 21L17 21.8L18 20.4L16 20L18 19.6L17 18.2L18.4 19L19 17Z"
        fill="url(#glass-fill)"
        stroke="white"
        strokeWidth="0.3"
        strokeOpacity="0.5"
        opacity="0.8"
      />
    </svg>
  )
}
