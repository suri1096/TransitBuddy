export interface BartStation {
  name: string;
  lat: number;
  lng: number;
  city: string;
}

export const BART_STATIONS: BartStation[] = [
  // San Francisco
  { name: "Embarcadero", lat: 37.7929, lng: -122.3969, city: "San Francisco" },
  { name: "Montgomery St", lat: 37.7894, lng: -122.4012, city: "San Francisco" },
  { name: "Powell St", lat: 37.7844, lng: -122.4079, city: "San Francisco" },
  { name: "Civic Center/UN Plaza", lat: 37.7796, lng: -122.4138, city: "San Francisco" },
  { name: "16th St Mission", lat: 37.7651, lng: -122.4194, city: "San Francisco" },
  { name: "24th St Mission", lat: 37.7524, lng: -122.4183, city: "San Francisco" },
  { name: "Glen Park", lat: 37.7329, lng: -122.4342, city: "San Francisco" },
  { name: "Balboa Park", lat: 37.7220, lng: -122.4472, city: "San Francisco" },
  { name: "Daly City", lat: 37.7059, lng: -122.4690, city: "Daly City" },
  // Peninsula / SFO
  { name: "Colma", lat: 37.6843, lng: -122.4667, city: "Colma" },
  { name: "South San Francisco", lat: 37.6574, lng: -122.4469, city: "South San Francisco" },
  { name: "San Bruno", lat: 37.6302, lng: -122.4117, city: "San Bruno" },
  { name: "SFO Airport", lat: 37.6160, lng: -122.3929, city: "SFO" },
  { name: "Millbrae", lat: 37.5997, lng: -122.3869, city: "Millbrae" },
  // Oakland / West Bay
  { name: "West Oakland", lat: 37.8047, lng: -122.2943, city: "Oakland" },
  { name: "12th St/Oakland City Center", lat: 37.8036, lng: -122.2720, city: "Oakland" },
  { name: "19th St/Oakland", lat: 37.8079, lng: -122.2688, city: "Oakland" },
  { name: "MacArthur", lat: 37.8285, lng: -122.2597, city: "Oakland" },
  { name: "Lake Merritt", lat: 37.7977, lng: -122.2651, city: "Oakland" },
  { name: "Fruitvale", lat: 37.7746, lng: -122.2243, city: "Oakland" },
  { name: "Coliseum", lat: 37.7542, lng: -122.1972, city: "Oakland" },
  // Berkeley / North
  { name: "Rockridge", lat: 37.8441, lng: -122.2516, city: "Oakland" },
  { name: "Ashby", lat: 37.8529, lng: -122.2701, city: "Berkeley" },
  { name: "Downtown Berkeley", lat: 37.8701, lng: -122.2680, city: "Berkeley" },
  { name: "North Berkeley", lat: 37.8748, lng: -122.2836, city: "Berkeley" },
  // El Cerrito / Richmond
  { name: "El Cerrito Plaza", lat: 37.9020, lng: -122.2997, city: "El Cerrito" },
  { name: "El Cerrito del Norte", lat: 37.9254, lng: -122.3171, city: "El Cerrito" },
  { name: "Richmond", lat: 37.9368, lng: -122.3532, city: "Richmond" },
  // Contra Costa
  { name: "Orinda", lat: 37.8785, lng: -122.1792, city: "Orinda" },
  { name: "Lafayette", lat: 37.8934, lng: -122.1241, city: "Lafayette" },
  { name: "Walnut Creek", lat: 37.9059, lng: -122.0669, city: "Walnut Creek" },
  { name: "Pleasant Hill/Contra Costa Centre", lat: 37.9283, lng: -122.0566, city: "Pleasant Hill" },
  { name: "Concord", lat: 37.9739, lng: -122.0290, city: "Concord" },
  { name: "North Concord/Martinez", lat: 37.9887, lng: -122.0202, city: "Martinez" },
  { name: "Pittsburg/Bay Point", lat: 37.9944, lng: -121.9449, city: "Pittsburg" },
  // East Bay South
  { name: "San Leandro", lat: 37.7222, lng: -122.1609, city: "San Leandro" },
  { name: "Bay Fair", lat: 37.6968, lng: -122.1268, city: "San Leandro" },
  { name: "Castro Valley", lat: 37.6909, lng: -122.0760, city: "Castro Valley" },
  { name: "West Dublin/Pleasanton", lat: 37.6995, lng: -121.9280, city: "Dublin" },
  { name: "Dublin/Pleasanton", lat: 37.7019, lng: -121.8993, city: "Dublin" },
  { name: "Hayward", lat: 37.6706, lng: -122.0888, city: "Hayward" },
  { name: "South Hayward", lat: 37.6344, lng: -122.0576, city: "Hayward" },
  { name: "Union City", lat: 37.5913, lng: -122.0176, city: "Union City" },
  { name: "Fremont", lat: 37.5577, lng: -121.9762, city: "Fremont" },
  { name: "Warm Springs/South Fremont", lat: 37.5019, lng: -121.9390, city: "Fremont" },
  { name: "Milpitas", lat: 37.4437, lng: -121.9010, city: "Milpitas" },
  { name: "Berryessa/North San José", lat: 37.3770, lng: -121.8733, city: "San José" },
];

export const STATION_NAMES = BART_STATIONS.map(s => s.name);

// ── Line definitions (ordered, terminus to terminus) ─────────────────────────
export const LINES: Record<string, { color: string; symbol: string; stations: string[] }> = {
  Yellow: {
    color: "#F5A623", symbol: "★",
    stations: ["Pittsburg/Bay Point","North Concord/Martinez","Concord","Pleasant Hill/Contra Costa Centre","Walnut Creek","Lafayette","Orinda","Rockridge","MacArthur","19th St/Oakland","12th St/Oakland City Center","West Oakland","Embarcadero","Montgomery St","Powell St","Civic Center/UN Plaza","16th St Mission","24th St Mission","Glen Park","Balboa Park","Daly City","Colma","South San Francisco","San Bruno","SFO Airport","Millbrae"],
  },
  Red: {
    color: "#E84040", symbol: "■",
    stations: ["Richmond","El Cerrito del Norte","El Cerrito Plaza","North Berkeley","Downtown Berkeley","Ashby","MacArthur","19th St/Oakland","12th St/Oakland City Center","West Oakland","Embarcadero","Montgomery St","Powell St","Civic Center/UN Plaza","16th St Mission","24th St Mission","Glen Park","Balboa Park","Daly City","Colma","South San Francisco","San Bruno","SFO Airport","Millbrae"],
  },
  Orange: {
    color: "#F97316", symbol: "▲",
    stations: ["Richmond","El Cerrito del Norte","El Cerrito Plaza","North Berkeley","Downtown Berkeley","Ashby","MacArthur","19th St/Oakland","12th St/Oakland City Center","Lake Merritt","Fruitvale","Coliseum","San Leandro","Bay Fair","Hayward","South Hayward","Union City","Fremont","Warm Springs/South Fremont","Milpitas","Berryessa/North San José"],
  },
  Green: {
    color: "#22C55E", symbol: "●",
    stations: ["Berryessa/North San José","Milpitas","Warm Springs/South Fremont","Fremont","Union City","South Hayward","Hayward","Bay Fair","San Leandro","Coliseum","Fruitvale","Lake Merritt","12th St/Oakland City Center","West Oakland","Embarcadero","Montgomery St","Powell St","Civic Center/UN Plaza","16th St Mission","24th St Mission","Balboa Park","Daly City"],
  },
  Blue: {
    color: "#3B82F6", symbol: "◆",
    stations: ["Dublin/Pleasanton","West Dublin/Pleasanton","Castro Valley","Bay Fair","San Leandro","Coliseum","Fruitvale","Lake Merritt","12th St/Oakland City Center","West Oakland","Embarcadero","Montgomery St","Powell St","Civic Center/UN Plaza","16th St Mission","24th St Mission","Balboa Park","Daly City"],
  },
};

// ── Haversine distance (km) ──────────────────────────────────────────────────
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function nearestStation(lat: number, lng: number): BartStation {
  return BART_STATIONS.reduce((best, s) => {
    const d = haversine(lat, lng, s.lat, s.lng);
    const bd = haversine(lat, lng, best.lat, best.lng);
    return d < bd ? s : best;
  });
}

export function nearestStationWithDistance(lat: number, lng: number): { station: BartStation; distKm: number } {
  let best = BART_STATIONS[0];
  let bestDist = haversine(lat, lng, best.lat, best.lng);
  for (const s of BART_STATIONS) {
    const d = haversine(lat, lng, s.lat, s.lng);
    if (d < bestDist) { best = s; bestDist = d; }
  }
  return { station: best, distKm: bestDist };
}

// ── Routing ──────────────────────────────────────────────────────────────────
export interface RouteSegment {
  line: string;
  color: string;
  symbol: string;
  from: string;
  to: string;
  stops: string[];
  direction: string;
  numStops: number;
}

export interface PlannedRoute {
  from: string;
  to: string;
  segments: RouteSegment[];
  totalMinutes: number;
  walkMinutesStart: number;
}

function linesForStation(station: string): string[] {
  return Object.entries(LINES).filter(([, l]) => l.stations.includes(station)).map(([name]) => name);
}

function buildSegment(lineName: string, from: string, to: string): RouteSegment {
  const line = LINES[lineName];
  const fi = line.stations.indexOf(from);
  const ti = line.stations.indexOf(to);
  const forward = fi < ti;
  const stops = forward ? line.stations.slice(fi, ti + 1) : [...line.stations.slice(ti, fi + 1)].reverse();
  const direction = forward ? line.stations[line.stations.length - 1] : line.stations[0];
  return {
    line: `${lineName} Line`,
    color: line.color,
    symbol: line.symbol,
    from,
    to,
    stops,
    direction,
    numStops: Math.abs(ti - fi),
  };
}

const TRANSFER_HUBS = [
  "12th St/Oakland City Center",
  "MacArthur",
  "Bay Fair",
  "West Oakland",
  "Embarcadero",
  "Daly City",
  "Richmond",
  "Millbrae",
  "19th St/Oakland",
  "Balboa Park",
  "Coliseum",
];

export function findRoute(from: string, to: string): PlannedRoute | null {
  if (from === to) return null;

  // Direct route
  const fromLines = linesForStation(from);
  const toLines = linesForStation(to);
  const common = fromLines.filter(l => toLines.includes(l));
  if (common.length > 0) {
    const seg = buildSegment(common[0], from, to);
    const mins = 2 + seg.numStops * 2.5;
    return { from, to, segments: [seg], totalMinutes: Math.round(mins), walkMinutesStart: 5 };
  }

  // One-transfer route
  for (const hub of TRANSFER_HUBS) {
    const hubLines = linesForStation(hub);
    const line1 = fromLines.find(l => hubLines.includes(l));
    const line2 = toLines.find(l => hubLines.includes(l));
    if (line1 && line2 && line1 !== line2) {
      const seg1 = buildSegment(line1, from, hub);
      const seg2 = buildSegment(line2, hub, to);
      const mins = 5 + (seg1.numStops + seg2.numStops) * 2.5 + 4; // +4 for transfer
      return {
        from, to,
        segments: [seg1, seg2],
        totalMinutes: Math.round(mins),
        walkMinutesStart: 5,
      };
    }
  }

  // Try same-line transfer (line1 == line2, different hub)
  for (const hub of TRANSFER_HUBS) {
    const hubLines = linesForStation(hub);
    const line1 = fromLines.find(l => hubLines.includes(l));
    if (!line1) continue;
    // Now from hub, can we reach to?
    const hubToLines = hubLines.filter(l => toLines.includes(l));
    if (hubToLines.length > 0) {
      const seg1 = buildSegment(line1, from, hub);
      const seg2 = buildSegment(hubToLines[0], hub, to);
      const mins = 5 + (seg1.numStops + seg2.numStops) * 2.5 + 4;
      return {
        from, to,
        segments: [seg1, seg2],
        totalMinutes: Math.round(mins),
        walkMinutesStart: 5,
      };
    }
  }

  return null;
}

export function buildTripSteps(route: PlannedRoute) {
  const steps: { id: number; text: string; detail: string; time: string; type: string; stopList?: string[]; symbol?: string; route?: string }[] = [];
  let id = 1;

  steps.push({
    id: id++,
    text: `Walk to ${route.from} BART station`,
    detail: `Head toward the BART sign. Look for the blue and white station entrance. Most stations have a "BART" sign visible from the street.`,
    time: `About ${route.walkMinutesStart} minutes`,
    type: "walk",
  });

  steps.push({
    id: id++,
    text: "Tap your Clipper card at the fare gate",
    detail: "Touch your Clipper card to the yellow circular reader. Wait for the green light and a click sound before walking through.",
    time: "About 1 minute",
    type: "station",
  });

  route.segments.forEach((seg, i) => {
    steps.push({
      id: id++,
      text: `Platform: Take the ${seg.line} toward ${seg.direction}`,
      detail: `Look for ${seg.line} signs with the ${seg.symbol} symbol. The sign above the platform shows the final destination: "${seg.direction}". Stand behind the yellow safety line.`,
      time: "About 3 minutes",
      type: "platform",
      symbol: seg.symbol,
      route: seg.line,
    });

    const middleStops = seg.stops.slice(1, -1);
    steps.push({
      id: id++,
      text: `Ride ${seg.numStops} stop${seg.numStops !== 1 ? "s" : ""} to ${seg.to}`,
      detail: `Stay on the train. The stops you will pass through are listed below. Count them as you go. The train announces each station by name.`,
      time: `About ${Math.round(seg.numStops * 2.5)} minutes`,
      type: "train",
      symbol: seg.symbol,
      route: seg.line,
      stopList: seg.stops,
    });

    if (i < route.segments.length - 1) {
      const nextSeg = route.segments[i + 1];
      steps.push({
        id: id++,
        text: `Transfer at ${seg.to} — switch to ${nextSeg.line}`,
        detail: `Exit the ${seg.line} train. Follow the signs inside the station for ${nextSeg.line} (${nextSeg.symbol}). Stay inside the fare gates — you do not need a new ticket.`,
        time: "About 4 minutes",
        type: "transfer",
        symbol: nextSeg.symbol,
        route: nextSeg.line,
      });
    }
  });

  const lastSeg = route.segments[route.segments.length - 1];
  steps.push({
    id: id++,
    text: `Exit at ${route.to}`,
    detail: `When the train announces "${route.to}", move toward the doors. Exit the train and follow signs to the street. You have arrived!`,
    time: "About 2 minutes",
    type: "arrive",
  });

  return steps;
}
