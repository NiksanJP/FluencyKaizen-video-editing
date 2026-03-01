import { useEffect, useState } from 'react';
import { FONTS, DEFAULT_FONT } from '@/data/fonts';

import { loadFont as loadInter } from '@remotion/google-fonts/Inter';
import { loadFont as loadMontserrat } from '@remotion/google-fonts/Montserrat';
import { loadFont as loadOpenSans } from '@remotion/google-fonts/OpenSans';
import { loadFont as loadRoboto } from '@remotion/google-fonts/Roboto';
import { loadFont as loadPoppins } from '@remotion/google-fonts/Poppins';
import { loadFont as loadLato } from '@remotion/google-fonts/Lato';
import { loadFont as loadOswald } from '@remotion/google-fonts/Oswald';
import { loadFont as loadPlayfairDisplay } from '@remotion/google-fonts/PlayfairDisplay';
import { loadFont as loadRobotoMono } from '@remotion/google-fonts/RobotoMono';
import { loadFont as loadSourceCodePro } from '@remotion/google-fonts/SourceCodePro';
import { loadFont as loadNotoSansJP } from '@remotion/google-fonts/NotoSansJP';

const FONT_LOADERS = {
  'Inter': () => loadInter('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }),
  'Montserrat': () => loadMontserrat('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }),
  'Open Sans': () => loadOpenSans('normal', { weights: ['400', '600', '700'], subsets: ['latin'] }),
  'Roboto': () => loadRoboto('normal', { weights: ['400', '500', '700'], subsets: ['latin'] }),
  'Poppins': () => loadPoppins('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }),
  'Lato': () => loadLato('normal', { weights: ['400', '700'], subsets: ['latin'] }),
  'Oswald': () => loadOswald('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }),
  'Playfair Display': () => loadPlayfairDisplay('normal', { weights: ['400', '700'], subsets: ['latin'] }),
  'Roboto Mono': () => loadRobotoMono('normal', { weights: ['400', '500', '700'], subsets: ['latin'] }),
  'Source Code Pro': () => loadSourceCodePro('normal', { weights: ['400', '500', '600', '700'], subsets: ['latin'] }),
  'Noto Sans JP': () => loadNotoSansJP('normal', { weights: ['400', '500', '700'] }),
};

const getUniqueFontFamilies = () => {
  const families = new Set();
  FONTS.forEach(font => {
    if (FONT_LOADERS[font.family]) {
      families.add(font.family);
    }
  });
  return Array.from(families);
};

export const useFonts = () => {
  const [loadedFonts, setLoadedFonts] = useState(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      setIsLoading(true);
      const uniqueFamilies = getUniqueFontFamilies();
      const fontMap = new Map();

      uniqueFamilies.forEach((family) => {
        try {
          const loader = FONT_LOADERS[family];
          if (!loader) return;
          const { fontFamily } = loader();
          fontMap.set(family, { fontFamily });
        } catch (fontError) {
          console.error(`Failed to load font ${family}:`, fontError);
        }
      });

      setLoadedFonts(fontMap);
      setError(null);
    } catch (err) {
      console.error('Error loading fonts:', err);
      setError(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getFontFamily = (familyName) => {
    const fontData = loadedFonts.get(familyName);
    return fontData?.fontFamily || familyName || DEFAULT_FONT.family;
  };

  const getAvailableFonts = () => {
    return FONTS.map(font => ({
      ...font,
      fontFamily: getFontFamily(font.family),
      isLoaded: loadedFonts.has(font.family),
    }));
  };

  const getFontWeights = (familyName) => {
    return FONTS
      .filter(font => font.family === familyName)
      .map(font => ({
        id: font.id,
        style: font.style,
        fullName: font.fullName,
        postScriptName: font.postScriptName,
      }));
  };

  return {
    loadedFonts,
    isLoading,
    error,
    getFontFamily,
    getAvailableFonts,
    getFontWeights,
    defaultFont: DEFAULT_FONT,
  };
};
