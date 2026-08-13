import { Asset } from 'expo-asset';
import * as FileSystem from 'expo-file-system/legacy';
import { Montserrat_400Regular } from '@expo-google-fonts/montserrat/400Regular';
import { Montserrat_500Medium } from '@expo-google-fonts/montserrat/500Medium';
import { Montserrat_600SemiBold } from '@expo-google-fonts/montserrat/600SemiBold';
import { Montserrat_700Bold } from '@expo-google-fonts/montserrat/700Bold';
import { Montserrat_800ExtraBold } from '@expo-google-fonts/montserrat/800ExtraBold';
import { Montserrat_900Black } from '@expo-google-fonts/montserrat/900Black';

export type ProposalFontWeight = 400 | 500 | 600 | 700 | 800 | 900;
export type ProposalFontData = Record<ProposalFontWeight, string>;

const FONT_MODULES: Record<ProposalFontWeight, number> = {
  400: Montserrat_400Regular,
  500: Montserrat_500Medium,
  600: Montserrat_600SemiBold,
  700: Montserrat_700Bold,
  800: Montserrat_800ExtraBold,
  900: Montserrat_900Black,
};

let cachedAssets: Promise<{ fontFaceCss: string }> | null = null;

export function buildProposalFontFaceCss(fonts: ProposalFontData): string {
  return (Object.keys(fonts) as unknown as ProposalFontWeight[])
    .sort((left, right) => left - right)
    .map((weight) => `@font-face {
      font-family: 'Montserrat';
      src: url(data:font/ttf;base64,${fonts[weight]}) format('truetype');
      font-style: normal;
      font-weight: ${weight};
      font-display: block;
    }`)
    .join('\n');
}

async function readFontAsBase64(moduleId: number): Promise<string> {
  const asset = Asset.fromModule(moduleId);
  if (!asset.localUri) await asset.downloadAsync();
  const uri = asset.localUri || asset.uri;
  if (!uri) throw new Error('Proposal font asset is unavailable');
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

export function loadProposalPrintAssets(): Promise<{ fontFaceCss: string }> {
  if (!cachedAssets) {
    cachedAssets = Promise.all(
      (Object.entries(FONT_MODULES) as Array<[string, number]>).map(async ([weight, moduleId]) => [
        Number(weight) as ProposalFontWeight,
        await readFontAsBase64(moduleId),
      ] as const),
    ).then((entries) => ({
      fontFaceCss: buildProposalFontFaceCss(Object.fromEntries(entries) as ProposalFontData),
    })).catch((error) => {
      cachedAssets = null;
      throw error;
    });
  }
  return cachedAssets;
}

