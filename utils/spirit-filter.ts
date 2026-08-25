// Spirit-base classification for the menu filter.
//
// Matching must be whole-word: plain substring checks misfire on short spirit
// tokens ("ginger beer".includes("gin") === true), which pulled Ginger Beer
// drinks into the Gin filter. Word boundaries keep "Gin", "London Dry Gin",
// "Old Tom Gin" etc. matching, while "Ginger Beer"/"Ginger Syrup" do not.
import { Cocktail } from '@/types/cocktail';

const lc = (v: unknown) => String(v ?? '').toLowerCase();

const hasWholeWord = (haystack: string, token: string): boolean =>
  new RegExp(`\\b${token}\\b`).test(haystack);

// Extra accepted spellings per spirit group. Whiskey deliberately recognizes
// bourbon and rye bottles as whiskey cocktails.
const SPIRIT_ALIASES: Record<string, string[]> = {
  whiskey: ['whiskey', 'bourbon', 'rye'],
};

export const matchesSpirit = (cocktail: Cocktail, spirit: string): boolean => {
  if (spirit === 'All') return true;
  const targetSpirit = lc(spirit);
  const aliases = SPIRIT_ALIASES[targetSpirit] ?? [targetSpirit];

  const haystack = [
    lc(cocktail.name),
    lc(cocktail.description),
    (cocktail.ingredients ?? []).map(ing => lc(ing.name)).join(' '),
  ].join(' ');

  return aliases.some(alias => hasWholeWord(haystack, alias));
};
