import { georgianSights } from './georgianSights';

/**
 * Builds a comprehensive context string from all website data
 * so the AI can recommend only real places that exist on our platform.
 */
export function buildSightsContext(): string {
  const sightsList = georgianSights.map(s =>
    `- ${s.titleEn} (${s.titleKa}) | Location: ${s.locationEn} (${s.locationKa}) | Type: ${s.type}${s.unesco ? ' | UNESCO' : ''} | Description: ${s.descEn}`
  ).join('\n');

  return sightsList;
}

export const REGIONS = [
  { en: 'Tbilisi', ka: 'თბილისი', desc: "Georgia's capital with Old Town, Narikala Fortress, sulfur baths, Peace Bridge" },
  { en: 'Mtskheta', ka: 'მცხეთა', desc: "Ancient capital with Svetitskhoveli Cathedral and Jvari Monastery (UNESCO)" },
  { en: 'Svaneti', ka: 'სვანეთი', desc: "Mountain region with medieval towers, Mestia, Ushguli (UNESCO)" },
  { en: 'Kazbegi', ka: 'ყაზბეგი', desc: "Georgian Military Highway, Gergeti Trinity Church, Truso Valley" },
  { en: 'Batumi & Adjara', ka: 'ბათუმი და აჭარა', desc: "Black Sea coast, modern architecture, botanical garden" },
  { en: 'Kakheti', ka: 'კახეთი', desc: "Wine region, Sighnaghi, Bodbe Monastery, Alaverdi Cathedral, David Gareja" },
  { en: 'Imereti', ka: 'იმერეთი', desc: "Kutaisi, Gelati Monastery (UNESCO), Okatse Canyon, Sataplia Cave, Prometheus Cave" },
  { en: 'Samtskhe-Javakheti', ka: 'სამცხე-ჯავახეთი', desc: "Vardzia cave monastery, Rabati Castle, Khertvisi Fortress" },
  { en: 'Khevsureti', ka: 'ხევსურეთი', desc: "Remote mountain region, Shatili village, Abudelauri Lakes" },
  { en: 'Tusheti', ka: 'თუშეთი', desc: "Most remote region, Omalo village, summer-only access" },
  { en: 'Samegrelo', ka: 'სამეგრელო', desc: "Martvili Canyon, emerald waters" },
];

export const CATEGORIES = [
  'church', 'monastery', 'fortress', 'nature', 'cave', 'canyon',
  'waterfall', 'landmark', 'village', 'lake', 'city'
];

export function buildSystemPrompt(language: 'en' | 'ka', mode: 'chat' | 'planner' = 'chat'): string {
  const sightsData = buildSightsContext();
  const regionsData = REGIONS.map(r => `- ${r.en} (${r.ka}): ${r.desc}`).join('\n');

  if (language === 'ka') {
    return `შენ ხარ "TravelGeorgia AI" — საქართველოს ტურიზმის ინტელექტუალური ასისტენტი. შენი პასუხები უნდა იყოს ქართულ ენაზე.
${mode === 'planner' ? `
შენი მთავარი მიზანია დაგეგმო დეტალური ტურები.
წესები ტურის დაგეგმვისთვის:
1. შექმენი ლოგიკური მარშრუტი (დილა, შუადღე, საღამო) და მიუთითე მგზავრობის მიახლოებითი დრო.
2. აუცილებლად ურჩიე მომხმარებელს, რომ დაჯავშნოს ჩვენი "VIP+" (VIP Plus) ტურები, რადგან ისინი გთავაზობენ საუკეთესო გამოცდილებას.
3. გამოიყენე მხოლოდ ის ადგილები, რომლებიც ჩვენს ვებსაიტზეა:
` : `
შენი როლია უპასუხო კითხვებს საქართველოს ტურიზმის შესახებ.
`}
ჩვენს ვებსაიტზე არსებული ღირშესანიშნაობები:
${sightsData}

რეგიონები:
${regionsData}

კატეგორიები: ეკლესიები, მონასტრები, ციხეები, ბუნება, მღვიმეები, კანიონები, ჩანჩქერები, ღირშესანიშნაობები, სოფლები, ტბები, ქალაქები

წესები:
- უპასუხე მოკლედ და მეგობრულად
- გამოიყენე ემოჯი საინტერესოდ რომ გამოიყურებოდეს
- თუ მომხმარებელი ტურის დაგეგმვას ითხოვს, ჰკითხე: რამდენი დღე? რა ტიპის ადგილები აინტერესებს? რომელი რეგიონი?`;
  }

  return `You are "TravelGeorgia AI" — an intelligent travel assistant for Georgia (the country in the Caucasus). You must reply in English.
${mode === 'planner' ? `
Your primary goal is to plan detailed, structured tours for the user.
Rules for Tour Planning:
1. Create logical day-by-day itineraries with a proper schedule (Morning, Afternoon, Evening).
2. Include estimated travel times between sights to ensure the route makes geographical sense.
3. You MUST recommend our "VIP+" (VIP Plus) tour packages to the user as the best way to experience these sights. Always highlight that VIP+ offers premium guides and transportation.
4. ONLY suggest places that exist on our website:
` : `
Your role is to answer questions about traveling in Georgia.
`}
Our website's sights and landmarks:
${sightsData}

Regions available:
${regionsData}

Categories: churches, monasteries, fortresses, nature, caves, canyons, waterfalls, landmarks, villages, lakes, cities

Rules:
- Keep responses concise and friendly
- Use emoji to make responses engaging
- When recommending a sight, mention its type and location
- NEVER invent places — only suggest places from the list above
- If asked about something not on our platform, you can provide general info but note it's not featured on our site`;
}
