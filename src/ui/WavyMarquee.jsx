import React, { useEffect, useRef } from "react";


export function WavyMarquee({
  text,
  id,
  pathDefinition,
  speed = 5,
  className = "",
}) {
  const textPathRef = useRef(null);

  const displayContent = Array.isArray(text) ? text.join("  •  ") : text;
  const repeatedText = `${displayContent}  •  `.repeat(30);

  useEffect(() => {
    let offset = 0;
    const animate = () => {
      offset += speed;
      if (offset >= 100) offset = 0;
      if (offset <= -100) offset = 0;

      if (textPathRef.current) {
        textPathRef.current.setAttribute("startOffset", `${offset}%`);
      }
      requestAnimationFrame(animate);
    };
    const animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [speed]);

  return (
    <div className={`absolute inset-0 ${className}`}>
      <style>
        {`
          /* CONFIGURATION MOBILE */
          #tp-${id} {
            font-size: 26px;
            dy: 10px; /* Centre le gros texte sur iPhone */
          }

          /* CONFIGURATION ORDINATEUR */
          @media (min-width: 768px) {
            #tp-${id} {
              font-size: 9px;
              dy: 3px; /* Centre le petit texte */
            }
          }
        `}
      </style>

      <svg
        viewBox="0 0 800 800"
        className="w-full h-full"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <path id={id} d={pathDefinition} />
        </defs>

        <use
          href={`#${id}`}
          stroke="#000000"
          strokeWidth="50"
          className="md:stroke-[20px]"
          fill="none"
          strokeLinecap="round"
        />

        <text
          id={`text-${id}`}
          className="font-black"
          style={{ fill: "white" }}
          dominantBaseline="middle"
          textAnchor="middle"
        >
          <textPath id={`tp-${id}`} ref={textPathRef} href={`#${id}`}>
            {repeatedText}
          </textPath>
        </text>
      </svg>
    </div>
  );
}
