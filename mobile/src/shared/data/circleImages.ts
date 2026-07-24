import type { Circle, CircleCategory } from '../types';

/** To'garak nomiga / yo'nalishiga mos rasmlar (Unsplash) */
const CATEGORY_IMAGES: Record<CircleCategory, string> = {
  art: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?auto=format&fit=crop&w=900&q=80',
  it: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80',
  sport: 'https://images.unsplash.com/photo-1461896836934-ffe607ba6856?auto=format&fit=crop&w=900&q=80',
  career: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80',
  science: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=900&q=80',
  reading: 'https://images.unsplash.com/photo-1456513080800-7d93dbebc733?auto=format&fit=crop&w=900&q=80',
  language: 'https://images.unsplash.com/photo-1546410531-bb4caa181212?auto=format&fit=crop&w=900&q=80',
};

const NAME_IMAGES: { match: RegExp; url: string }[] = [
  { match: /folklor|baxshi|milliy.*raqs|musiqa|fortepiano|estrada|vokal/i, url: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?auto=format&fit=crop&w=900&q=80' },
  { match: /tasviriy|chizma|dizayn|libos/i, url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&w=900&q=80' },
  { match: /teatr|rejissor|jurnalist|notiq|qo.?g.?irchoq/i, url: 'https://images.unsplash.com/photo-1503095396549-807759245b35?auto=format&fit=crop&w=900&q=80' },
  { match: /lego|konstruksiya|robot|mindstorm/i, url: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80' },
  { match: /dasturchi|scratch|python|java|frontend|backend|c\+\+|c#|unity/i, url: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=900&q=80' },
  { match: /kompyuter|dizayn va grafik|laboratoriya/i, url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=900&q=80' },
  { match: /foto|kino|video/i, url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=900&q=80' },
  { match: /kibersport|rubik/i, url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=900&q=80' },
  { match: /avtomodel|aviamodel|raketa|kemasoz/i, url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80' },
  { match: /shaxmat|shashka/i, url: 'https://images.unsplash.com/photo-1529699211952-734e80c4d42b?auto=format&fit=crop&w=900&q=80' },
  { match: /gimnastika|taekvondo|karate|kurash|boks/i, url: 'https://images.unsplash.com/photo-1555597673-b21d5c935865?auto=format&fit=crop&w=900&q=80' },
  { match: /futbol|voleybol|tennis|badminton/i, url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=900&q=80' },
  { match: /kulol|plastika|kvilling|kashta|to.?qish|munchoq|gilam|zardo.?z|do.?ppi/i, url: 'https://images.unsplash.com/photo-1452860606245-08befc0ff44b?auto=format&fit=crop&w=900&q=80' },
  { match: /bichish|tikish|charm|zargar|sartarosh/i, url: 'https://images.unsplash.com/photo-1558611848-73f7eb4001a1?auto=format&fit=crop&w=900&q=80' },
  { match: /pazanda|qandolat/i, url: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=900&q=80' },
  { match: /duradgor|yog.?och/i, url: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80' },
  { match: /payvand|santexnik|mashina ustasi/i, url: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&w=900&q=80' },
  { match: /ekolog|tabiat|florist|landshaft|ekodizayn|asalar|issiqxona|karving/i, url: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80' },
  { match: /sayyoh|ekskurs|o.?lkashunos/i, url: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=900&q=80' },
  { match: /hamshira|oila/i, url: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=900&q=80' },
  { match: /matematika|arifmetika|logika|fizika|kimyo|biologiya/i, url: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=900&q=80' },
  { match: /ona tili|adabiyot|tarix|huquq|o.?qish|husnixat/i, url: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=900&q=80' },
  { match: /ingliz|rus|chet til/i, url: 'https://images.unsplash.com/photo-1546410531-bb4caa181212?auto=format&fit=crop&w=900&q=80' },
];

export function getCircleImage(circle: Pick<Circle, 'name' | 'category' | 'id'>): string {
  for (const item of NAME_IMAGES) {
    if (item.match.test(circle.name)) return item.url;
  }
  return CATEGORY_IMAGES[circle.category] || CATEGORY_IMAGES.it;
}
