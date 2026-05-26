"use client";

import { useLayoutEffect, useRef, useState } from "react";

function nameToHue(name: string): number {
  return name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360;
}

export function GalleryThumb({
  thumbnailUrl,
  providerName
}: {
  thumbnailUrl: string | null;
  providerName: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const showImage = thumbnailUrl != null && !errored;

  useLayoutEffect(() => {
    const image = imageRef.current;
    if (image?.complete && image.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [thumbnailUrl]);

  return (
    <div
      data-testid="gallery-thumb"
      className={`gallery-thumb${loaded && showImage ? " gallery-thumb-loaded" : ""}`}
      aria-hidden="true"
    >
      {showImage ? (
        <img
          ref={imageRef}
          src={thumbnailUrl}
          alt=""
          className="gallery-thumb-img"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
        />
      ) : (
        <div
          className="gallery-thumb-placeholder"
          style={
            { "--ph": String(nameToHue(providerName)) } as React.CSSProperties
          }
        >
          <span>{providerName.slice(0, 2).toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}
