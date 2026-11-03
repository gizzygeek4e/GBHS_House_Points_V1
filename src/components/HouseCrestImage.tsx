import React, { useState } from 'react';
import { HouseId } from '../types';
import tawhirimateaCrest from '../assets/houses/TAWHIRIMATEA_transparent.png';
import tumatauengaCrest from '../assets/houses/TUMATAUENGA_transparent.png';
import tangaroaCrest from '../assets/houses/TANGAROA_transparent.png';
import tanemahutaCrest from '../assets/houses/TANE_MAHUTA_transparent.png';
import gbhsCrest from '../assets/gbhs_crest.png';

const BUNDLED_CRESTS: Record<string, string> = {
  tawhirimatea: tawhirimateaCrest,
  tumatauenga: tumatauengaCrest,
  tangaroa: tangaroaCrest,
  tanemahuta: tanemahutaCrest,
};

const PUBLIC_CRESTS: Record<string, string> = {
  tawhirimatea: 'assets/houses/TAWHIRIMATEA_transparent.png',
  tumatauenga: 'assets/houses/TUMATAUENGA_transparent.png',
  tangaroa: 'assets/houses/TANGAROA_transparent.png',
  tanemahuta: 'assets/houses/TANE_MAHUTA_transparent.png',
};

interface HouseCrestImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  houseId: HouseId | string;
  houseName: string;
}

/**
 * Resilient House Crest component with multi-tier fallback:
 * 1. Bundled Vite asset import
 * 2. Relative base public asset path
 * 3. Root public asset path
 * 4. School crest fallback
 * Prevents broken images on local dev, preview server, and GitHub Pages.
 */
export const HouseCrestImage: React.FC<HouseCrestImageProps> = ({
  houseId,
  houseName,
  className = '',
  src,
  ...props
}) => {
  const [attempt, setAttempt] = useState(0);

  const getSource = (): string => {
    const defaultBundled = BUNDLED_CRESTS[houseId] || src || gbhsCrest;
    const base = import.meta.env.BASE_URL || './';
    const cleanBase = base.endsWith('/') ? base : base + '/';
    const publicRelative = PUBLIC_CRESTS[houseId] ? `${cleanBase}${PUBLIC_CRESTS[houseId]}` : gbhsCrest;
    const rootPath = PUBLIC_CRESTS[houseId] ? `/${PUBLIC_CRESTS[houseId]}` : gbhsCrest;

    if (attempt === 0) return src || defaultBundled;
    if (attempt === 1) return publicRelative;
    if (attempt === 2) return rootPath;
    return gbhsCrest;
  };

  return (
    <img
      src={getSource()}
      alt={houseName}
      className={className}
      loading="eager"
      decoding="async"
      onError={() => {
        if (attempt < 3) {
          setAttempt((prev) => prev + 1);
        }
      }}
      {...props}
    />
  );
};
