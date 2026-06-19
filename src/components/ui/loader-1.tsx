"use client";

export function PencilLoader({ size = 80 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      height={size}
      width={size}
      viewBox="0 0 200 200"
      className="pencil"
      aria-label="Loading"
    >
      <defs>
        <clipPath id="pencil-eraser">
          <rect height="30" width="30" ry="5" rx="5" />
        </clipPath>
      </defs>

      {/* Outer writing-arc stroke */}
      <circle
        transform="rotate(-113,100,100)"
        strokeLinecap="round"
        strokeDashoffset="439.82"
        strokeDasharray="439.82 439.82"
        strokeWidth="2"
        stroke="#1c1c1c"
        fill="none"
        r="70"
        cx="100"
        cy="100"
        className="pencil__stroke"
      />

      {/* Rotating pencil group — centred on 100,100 */}
      <g transform="translate(100,100)" className="pencil__rotate">
        <g fill="none">
          {/* Body ring 1 — deep orange */}
          <circle
            transform="rotate(-90)"
            strokeDashoffset="402"
            strokeDasharray="402.12 402.12"
            strokeWidth="30"
            stroke="#2a2a2a"
            r="64"
            className="pencil__body1"
          />
          {/* Body ring 2 — mid orange */}
          <circle
            transform="rotate(-90)"
            strokeDashoffset="465"
            strokeDasharray="464.96 464.96"
            strokeWidth="10"
            stroke="#1c1c1c"
            r="74"
            className="pencil__body2"
          />
          {/* Body ring 3 — dark orange */}
          <circle
            transform="rotate(-90)"
            strokeDashoffset="339"
            strokeDasharray="339.29 339.29"
            strokeWidth="10"
            stroke="#0f0f0f"
            r="54"
            className="pencil__body3"
          />
        </g>

        {/* Eraser */}
        <g transform="rotate(-90) translate(49,0)" className="pencil__eraser">
          <g className="pencil__eraser-skew">
            <rect height="30" width="30" ry="5" rx="5" fill="#FDBA74" />
            <rect clipPath="url(#pencil-eraser)" height="30" width="5" fill="#FB923C" />
            <rect height="20" width="30" fill="#e8e4df" />
            <rect height="20" width="15" fill="#d4cec9" />
            <rect height="20" width="5"  fill="#ddd8d3" />
            <rect height="2"  width="30" y="6"  fill="rgba(0,0,0,0.12)" />
            <rect height="2"  width="30" y="13" fill="rgba(0,0,0,0.12)" />
          </g>
        </g>

        {/* Tip */}
        <g transform="rotate(-90) translate(49,-30)" className="pencil__point">
          <polygon points="15 0,30 30,0 30" fill="#FED7AA" />
          <polygon points="15 0,6 30,0 30"  fill="#FDBA74" />
          <polygon points="15 0,20 10,10 10" fill="#1c1917" />
        </g>
      </g>
    </svg>
  );
}
