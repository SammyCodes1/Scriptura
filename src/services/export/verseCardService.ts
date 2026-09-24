import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

export type VerseCardDesignId = 'classic' | 'celestial' | 'botanical';

export interface VerseCardDesignInfo {
  id: VerseCardDesignId;
  name: string;
  tagline: string;
  background: string;
  cardBg: string;
  textColor: string;
  accentColor: string;
  borderColor: string;
  badgeBg: string;
  badgeText: string;
  fontFamily: string;
  ornamentColor: string;
}

export const VERSE_CARD_DESIGNS: Record<VerseCardDesignId, VerseCardDesignInfo> = {
  classic: {
    id: 'classic',
    name: 'Classic Parchment',
    tagline: 'Archival warm paper with gold foil seal & classical serif',
    background: '#F5EFE6',
    cardBg: '#FCF9F2',
    textColor: '#2D2118',
    accentColor: '#B8860B',
    borderColor: '#D4AF37',
    badgeBg: '#F3E8D0',
    badgeText: '#7B5E1A',
    fontFamily: 'Georgia, "Times New Roman", serif',
    ornamentColor: '#D4AF37',
  },
  celestial: {
    id: 'celestial',
    name: 'Celestial Midnight',
    tagline: 'Deep cosmic sapphire twilight with luminous starlight glow',
    background: '#070B14',
    cardBg: '#0F172A',
    textColor: '#F1F5F9',
    accentColor: '#38BDF8',
    borderColor: '#1E3A5F',
    badgeBg: '#132842',
    badgeText: '#38BDF8',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    ornamentColor: '#60A5FA',
  },
  botanical: {
    id: 'botanical',
    name: 'Modern Botanical',
    tagline: 'Calming evergreen sage with warm terracotta earth accents',
    background: '#0B1612',
    cardBg: '#13231D',
    textColor: '#E8F1EC',
    accentColor: '#E07A5F',
    borderColor: '#264235',
    badgeBg: '#2C1D18',
    badgeText: '#E07A5F',
    fontFamily: 'Palatino, "Palatino Linotype", serif',
    ornamentColor: '#34D399',
  },
};

export interface VerseDataForCard {
  text: string;
  reference: string;
  translation: string;
}

/**
 * Word wraps text into lines of max character width for SVG rendering.
 */
function wrapText(text: string, maxCharsPerLine = 38): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    if ((currentLine + ' ' + word).trim().length <= maxCharsPerLine) {
      currentLine = (currentLine + ' ' + word).trim();
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

/**
 * Generates an SVG vector graphic representing the verse card in the chosen design.
 */
export function generateVerseCardSvg(verse: VerseDataForCard, designId: VerseCardDesignId): string {
  const design = VERSE_CARD_DESIGNS[designId];
  const width = 1080;
  const height = 1080;
  const padding = 80;

  const lines = wrapText(verse.text, 36);
  const totalTextHeight = lines.length * 52;
  const startY = Math.max(340, 520 - totalTextHeight / 2);

  // XML escape helper
  const escapeXml = (str: string) =>
    str.replace(/[<>&'"]/g, (c) => {
      switch (c) {
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
        case '\'': return '&apos;';
        case '"': return '&quot;';
        default: return c;
      }
    });

  const textSpans = lines
    .map(
      (line, i) =>
        `<tspan x="540" y="${startY + i * 54}" text-anchor="middle">${escapeXml(line)}</tspan>`
    )
    .join('\n      ');

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${design.cardBg}" />
      <stop offset="100%" stop-color="${design.background}" />
    </linearGradient>
    <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="16" stdDeviation="24" flood-color="#000000" flood-opacity="0.3" />
    </filter>
  </defs>

  <!-- Background Canvas -->
  <rect width="100%" height="100%" fill="${design.background}" />

  <!-- Inner Padded Card Container -->
  <rect x="${padding}" y="${padding}" width="${width - padding * 2}" height="${height - padding * 2}" rx="32" ry="32" fill="url(#bgGrad)" stroke="${design.borderColor}" stroke-width="3" filter="url(#cardShadow)" />

  <!-- Decorative Inner Border Frame -->
  <rect x="${padding + 24}" y="${padding + 24}" width="${width - (padding + 24) * 2}" height="${height - (padding + 24) * 2}" rx="20" ry="20" fill="none" stroke="${design.ornamentColor}" stroke-width="1.5" stroke-opacity="0.45" stroke-dasharray="8 6" />

  <!-- Corner Flourishes -->
  <circle cx="${padding + 38}" cy="${padding + 38}" r="5" fill="${design.accentColor}" />
  <circle cx="${width - padding - 38}" cy="${padding + 38}" r="5" fill="${design.accentColor}" />
  <circle cx="${padding + 38}" cy="${height - padding - 38}" r="5" fill="${design.accentColor}" />
  <circle cx="${width - padding - 38}" cy="${height - padding - 38}" r="5" fill="${design.accentColor}" />

  <!-- Header Category / Holy Scripture Tag -->
  <g transform="translate(540, 180)">
    <rect x="-140" y="-22" width="280" height="44" rx="22" ry="22" fill="${design.badgeBg}" stroke="${design.accentColor}" stroke-width="1.5" />
    <text x="0" y="6" font-family="${design.fontFamily}" font-size="16" font-weight="bold" fill="${design.badgeText}" text-anchor="middle" letter-spacing="3">HOLY SCRIPTURE</text>
  </g>

  <!-- Opening Quotation Mark -->
  <text x="540" y="${startY - 40}" font-family="Georgia, serif" font-size="76" font-weight="bold" fill="${design.accentColor}" text-anchor="middle" opacity="0.6">“</text>

  <!-- Scripture Body Lines -->
  <text font-family="${design.fontFamily}" font-size="34" font-weight="500" fill="${design.textColor}" line-height="54">
    ${textSpans}
  </text>

  <!-- Scripture Reference & Translation Badge -->
  <g transform="translate(540, ${startY + lines.length * 54 + 60})">
    <line x1="-120" y1="-28" x2="120" y2="-28" stroke="${design.accentColor}" stroke-width="1.5" opacity="0.5" />
    <text x="0" y="8" font-family="${design.fontFamily}" font-size="28" font-weight="bold" fill="${design.textColor}" text-anchor="middle" letter-spacing="1">
      — ${escapeXml(verse.reference)} —
    </text>
    <rect x="-50" y="26" width="100" height="30" rx="6" fill="${design.badgeBg}" stroke="${design.accentColor}" stroke-width="1" />
    <text x="0" y="47" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="${design.badgeText}" text-anchor="middle">${escapeXml(verse.translation)}</text>
  </g>

  <!-- Bottom Scriptura Watermark Seal -->
  <g transform="translate(540, ${height - padding - 50})">
    <text x="0" y="0" font-family="system-ui, sans-serif" font-size="15" font-weight="600" fill="${design.textColor}" text-anchor="middle" opacity="0.45" letter-spacing="3">SCRIPTURA BIBLE</text>
  </g>
</svg>`;
}

/**
 * Downloads or shares the verse card file to the user's device.
 */
export async function downloadVerseCard(
  verse: VerseDataForCard,
  designId: VerseCardDesignId
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    const svgContent = generateVerseCardSvg(verse, designId);
    const cleanRef = verse.reference.replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Scriptura_${cleanRef}_${designId}.svg`;

    if (Platform.OS === 'web') {
      // Trigger instant browser download on Web
      const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return { success: true, uri: url };
    }

    // Native: Write to local device cache/document directory
    const dir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const fileUri = `${dir}${fileName}`;
    await FileSystem.writeAsStringAsync(fileUri, svgContent, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    // Check if sharing is available to present Save/Share options
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'image/svg+xml',
        dialogTitle: `Download Verse Card: ${verse.reference}`,
        UTI: 'public.svg-image',
      });
    }

    return { success: true, uri: fileUri };
  } catch (err: any) {
    console.error('Failed to download verse card:', err);
    return { success: false, error: err?.message || 'Error downloading card' };
  }
}

/**
 * Returns formatted text representation suitable for standard text sharing.
 */
export function formatScriptureForShare(verse: VerseDataForCard): string {
  return `“${verse.text.trim()}”\n— ${verse.reference} (${verse.translation})\n\nShared via Scriptura Bible`;
}
