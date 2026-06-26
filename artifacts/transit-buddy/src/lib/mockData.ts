export const bartLines = [
  { id: 'yellow', name: 'Yellow Line', color: '#F5A623', bgClass: 'bg-yellow-400', textClass: 'text-yellow-900', symbol: '★', symbolName: 'Star', termini: ['Pittsburg/Bay Point', 'Millbrae/SFO'] },
  { id: 'red',    name: 'Red Line',    color: '#E84040', bgClass: 'bg-red-500',    textClass: 'text-white',     symbol: '■', symbolName: 'Square',   termini: ['Richmond', 'Millbrae'] },
  { id: 'orange', name: 'Orange Line', color: '#F97316', bgClass: 'bg-orange-500', textClass: 'text-white',     symbol: '▲', symbolName: 'Triangle', termini: ['Richmond', 'Berryessa/North San José'] },
  { id: 'green',  name: 'Green Line',  color: '#22C55E', bgClass: 'bg-green-500',  textClass: 'text-white',     symbol: '●', symbolName: 'Circle',   termini: ['Berryessa/North San José', 'Daly City'] },
  { id: 'blue',   name: 'Blue Line',   color: '#3B82F6', bgClass: 'bg-blue-500',   textClass: 'text-white',     symbol: '◆', symbolName: 'Diamond',  termini: ['Dublin/Pleasanton', 'Daly City'] },
];

export const bartStations = {
  yellow: ['Pittsburg/Bay Point', 'North Concord/Martinez', 'Concord', 'Pleasant Hill', 'Walnut Creek', 'Lafayette', 'Orinda', 'Rockridge', 'MacArthur', '19th St/Oakland', '12th St/Oakland City Center', 'West Oakland', 'Embarcadero', 'Montgomery St', 'Powell St', 'Civic Center/UN Plaza', '16th St Mission', '24th St Mission', 'Glen Park', 'Balboa Park', 'Daly City', 'Colma', 'South San Francisco', 'San Bruno', 'SFO Airport', 'Millbrae'],
  red:    ['Richmond', 'El Cerrito del Norte', 'El Cerrito Plaza', 'North Berkeley', 'Downtown Berkeley', 'Ashby', 'MacArthur', '19th St/Oakland', '12th St/Oakland City Center', 'West Oakland', 'Embarcadero', 'Montgomery St', 'Powell St', 'Civic Center/UN Plaza', '16th St Mission', '24th St Mission', 'Glen Park', 'Balboa Park', 'Daly City', 'Colma', 'South San Francisco', 'San Bruno', 'SFO Airport', 'Millbrae'],
  orange: ['Richmond', 'El Cerrito del Norte', 'El Cerrito Plaza', 'North Berkeley', 'Downtown Berkeley', 'Ashby', 'MacArthur', '19th St/Oakland', '12th St/Oakland City Center', 'Lake Merritt', 'Fruitvale', 'Coliseum', 'San Leandro', 'Bay Fair', 'Hayward', 'South Hayward', 'Union City', 'Fremont', 'Warm Springs/South Fremont', 'Milpitas', 'Berryessa/North San José'],
  green:  ['Berryessa/North San José', 'Milpitas', 'Warm Springs/South Fremont', 'Fremont', 'Union City', 'South Hayward', 'Hayward', 'Bay Fair', 'San Leandro', 'Coliseum', 'Fruitvale', 'Lake Merritt', '12th St/Oakland City Center', 'West Oakland', 'Embarcadero', 'Montgomery St', 'Powell St', 'Civic Center/UN Plaza', '16th St Mission', '24th St Mission', 'Balboa Park', 'Daly City'],
  blue:   ['Dublin/Pleasanton', 'West Dublin/Pleasanton', 'Castro Valley', 'Bay Fair', 'San Leandro', 'Coliseum', 'Fruitvale', 'Lake Merritt', '12th St/Oakland City Center', 'West Oakland', 'Embarcadero', 'Montgomery St', 'Powell St', 'Civic Center/UN Plaza', '16th St Mission', '24th St Mission', 'Balboa Park', 'Daly City'],
};

export const mockTripSteps = [
  {
    id: 1,
    text: 'Walk to 16th St Mission BART',
    detail: 'Head to 16th St and Mission St. Look for the BART sign — it is red and white.',
    time: 'About 5 minutes',
    type: 'walk',
  },
  {
    id: 2,
    text: 'Enter station and tap your Clipper card',
    detail: 'Use the fare gate on the right side. Tap your Clipper card on the yellow reader. Wait for the green light.',
    time: 'About 2 minutes',
    type: 'station',
  },
  {
    id: 3,
    text: 'Go to the upper platform — Yellow Line toward Pittsburg/Bay Point',
    detail: 'Take the elevator or stairs up. Look for Yellow Line signs with a yellow star ★. Stand behind the yellow line.',
    time: 'About 3 minutes',
    type: 'platform',
    route: 'Yellow Line',
    symbol: '★',
    lineId: 'yellow',
  },
  {
    id: 4,
    text: 'Board the Yellow Line train — ride 4 stops',
    detail: 'Stops in order: Civic Center/UN Plaza → Powell St → Montgomery St → Embarcadero. Count the stops as you go.',
    time: 'About 10 minutes',
    type: 'train',
    route: 'Yellow Line',
    symbol: '★',
    lineId: 'yellow',
    stops: 4,
    stopList: ['Civic Center/UN Plaza', 'Powell St', 'Montgomery St', 'Embarcadero'],
  },
  {
    id: 5,
    text: 'Exit at Embarcadero Station',
    detail: 'When the announcement says Embarcadero, stand up and move toward the doors. Exit and follow signs for The Embarcadero exit.',
    time: 'About 2 minutes',
    type: 'stop',
  },
  {
    id: 6,
    text: 'You have arrived at the Ferry Building',
    detail: 'Walk straight out of the exit. The Ferry Building and Embarcadero waterfront are right in front of you.',
    time: 'You are here',
    type: 'arrive',
  },
];

export const liveTrackingStations = [
  { name: '16th St Mission', passed: true },
  { name: 'Civic Center/UN Plaza', passed: true },
  { name: 'Powell St', passed: false, current: true },
  { name: 'Montgomery St', passed: false },
  { name: 'Embarcadero', passed: false, destination: true },
];

export const mockAlerts = [
  { id: 1, type: 'Delay',   severity: 'medium', text: 'Yellow Line is running 8 minutes late due to earlier track work.', action: 'Your arrival is updated to 4:33 PM. No changes needed.' },
  { id: 2, type: 'Change',  severity: 'low',    text: 'Bus 14 is using a temporary stop at Mission & 15th.', action: 'Walk one block south if you normally board at Mission & 16th.' },
  { id: 3, type: 'Alert',   severity: 'high',   text: 'Elevator at 16th St Mission is out of service.', action: 'Use the stairs near the turnstiles, or enter via the Guerrero St side.' },
  { id: 4, type: 'Change',  severity: 'low',    text: 'Weekend service: Yellow Line runs every 20 minutes.', action: 'Plan for a slightly longer wait on weekends.' },
];

export const mockReviews = [
  { id: 1, location: 'Embarcadero Station', rating: 5, tip: 'Exit toward the Ferry Building — it is bright and easy to navigate.', tags: ['easy', 'accessible'], author: 'Sam' },
  { id: 2, location: '16th St Mission BART', rating: 3, tip: 'The elevator is often out of service. The stairs on the left side are less crowded.', tags: ['confusing', 'crowded'], author: 'Alex' },
  { id: 3, location: 'Powell St Station', rating: 4, tip: 'Follow the yellow stripe on the floor — it leads straight to the transfer platform.', tags: ['easy', 'accessible'], author: 'Jordan' },
  { id: 4, location: 'MacArthur Station', rating: 4, tip: 'Good transfer point between Yellow and Orange lines. Signs are clear.', tags: ['quiet', 'accessible'], author: 'Taylor' },
  { id: 5, location: 'West Oakland Station', rating: 3, tip: 'Can get windy on the platform. The covered area is near the middle of the platform.', tags: ['quiet'], author: 'Remi' },
];

export const mockRouteChanges = [
  { id: 1, original: 'Yellow Line via Civic Center', suggested: 'Orange Line via Lake Merritt', reason: 'Lake Merritt station is calmer and the platform has more seating.', tags: ['Quieter', 'Less crowded'] },
  { id: 2, original: 'Red Line to Millbrae, transfer to Caltrain', suggested: 'Yellow Line to SFO Airport station directly', reason: 'No transfer needed. Yellow Line goes straight to SFO Airport station.', tags: ['Fewer transfers', 'Easier signs'] },
  { id: 3, original: 'Orange Line, transfer at MacArthur', suggested: 'Stay on to 19th St/Oakland, less crowded transfer', reason: '19th St is less crowded during peak hours and the platform is easier to navigate.', tags: ['Less crowded', 'Better for beginners'] },
];

export const chatbotResponses: Record<string, string> = {
  hello: "Hi! I'm TransitBuddy, your calm transit guide. I can help you with BART routes, fares, station tips, and what to do if you feel lost. What do you need?",
  hey: "Hey there. You're doing great. What can I help you with today?",
  hi: "Hi! What can I help you with? You can ask me about BART lines, stations, fares, or what to do if you're confused.",
  default: "I'm not sure about that, but I'm here to help. Try asking about BART lines, fares, what to do if you miss a stop, or how to find a platform.",

  // BART lines
  "yellow line": "The Yellow Line runs from Pittsburg/Bay Point all the way to Millbrae and SFO Airport. It passes through San Francisco's main downtown stations: Embarcadero, Montgomery, Powell, and Civic Center. Look for the yellow star ★ symbol.",
  "red line": "The Red Line runs from Richmond to Millbrae. It shares the same SF stations as the Yellow Line. Look for the red square ■ symbol.",
  "orange line": "The Orange Line runs from Richmond to Berryessa/North San José in the East Bay. It does not cross into San Francisco. Look for the orange triangle ▲ symbol.",
  "green line": "The Green Line runs from Berryessa/North San José through the East Bay to Daly City. Look for the green circle ● symbol.",
  "blue line": "The Blue Line runs from Dublin/Pleasanton to Daly City. It passes through East Bay stations and into San Francisco. Look for the blue diamond ◆ symbol.",

  // Fares
  "fare": "BART fares are based on distance. A short trip is about $2.50 to $4.00. A longer trip like Richmond to Millbrae can be around $6 to $8. Use a Clipper card to pay — it is faster and sometimes cheaper.",
  "clipper": "A Clipper card is a reusable card you tap on the yellow reader at the fare gate. You can add money online at clippercard.com or at machines inside BART stations. It works on BART, Muni, AC Transit, and more.",
  "cost": "BART fares depend on distance. Most trips in the Bay Area cost between $2.50 and $6.00. You can check the exact fare at any station on the fare chart near the ticket machines.",

  // Stations
  "embarcadero": "Embarcadero Station is in downtown San Francisco near the Ferry Building and waterfront. Exit toward Market Street for buses, or toward The Embarcadero for the waterfront. It is served by Yellow, Red, Green, and Blue lines.",
  "powell": "Powell St Station is in the heart of San Francisco near Union Square. It connects Yellow, Red, Green, and Blue lines. The exit near Hallidie Plaza is the main one. Muni streetcars (F and historic lines) also stop nearby.",
  "16th st": "16th St Mission Station is in the Mission District of San Francisco. Yellow and Red lines stop here. The neighborhood is busy but the station itself is easy to navigate. Head toward the BART sign on 16th St and Mission St.",
  "montgomery": "Montgomery St Station is downtown SF, great for the Financial District and Chinatown. Served by Yellow, Red, Green, and Blue lines. Follow signs for Sutter Street or New Montgomery exit.",
  "civic center": "Civic Center/UN Plaza Station is near City Hall and the Asian Art Museum. Served by Yellow, Red, Green, and Blue lines. Be aware this station can be busy. Use the Larkin St exit for a quieter exit.",
  "bart": "BART stands for Bay Area Rapid Transit. It connects San Francisco, Oakland, Berkeley, Fremont, San José, and more. There are 5 lines: Yellow ★, Red ■, Orange ▲, Green ●, and Blue ◆. Trains usually come every 15 minutes, or every 20 minutes on weekends.",

  // What to do
  "missed stop": "That is okay. Do not panic. Stay calm. Get off at the next stop. Look for the other platform across the tracks. Take the next train going back the way you came. Count one stop back to where you meant to get off.",
  "missed my stop": "That is okay. Stay calm. Get off at the very next stop. Cross to the other platform. Wait for the next train going back. Count one stop back. You've got this.",
  "lost": "You are not stuck. First, stay where you are for a moment. Look for a BART employee in a blue uniform, or find a blue phone on the wall of the station. You can also press the 'I'm Lost' button in TransitBuddy for step-by-step help.",
  "confused": "That is completely okay. Take a breath. Look at the signs above you — they list the line names and which direction trains are going. If you are unsure, ask a BART employee or tap the 'I'm Confused' button in TransitBuddy.",
  "transfer": "A transfer means switching from one train to another. Usually you stay inside the station and walk to a different platform. Look for signs showing the line you need. You do not need a new ticket when transferring — your Clipper card fare covers the whole trip.",
  "how long": "Most BART trips within San Francisco take 5 to 15 minutes. A trip from SF to Oakland takes about 10 minutes. From SF to Fremont is about 45 minutes. From SF to SFO Airport is about 30 minutes.",
  "delay": "Check the Live Updates section on the Home screen for current delays. BART sometimes has delays due to equipment or track work. If your train is delayed, stay on the platform — the next train will usually come within a few minutes.",
  "schedule": "BART runs from about 5 AM to midnight on weekdays and weekdays. On weekends, it starts at 6 AM and trains come every 20 minutes instead of every 15. You can check exact times at bart.gov or on the TransitBuddy Live Updates screen.",
  "wheelchair": "All BART stations have elevators and wheelchair-accessible fare gates. The accessible gate is usually wider and on the far side. On the train, there are designated wheelchair spaces near the doors. If an elevator is broken, there will be a notice at the station.",
  "accessibility": "BART is designed to be accessible. Every station has elevators, accessible fare gates, and tactile yellow strips on the platform edge. Trains announce stops by voice. If you need help, press the intercom button on any platform or find a blue BART employee.",
  "platform": "Look for signs above your head when you enter the station. They will show the line color and name, and which direction it is going (the endpoint name). Match the line you need with the direction shown on your TransitBuddy trip steps.",
  "safe": "BART is generally safe. Stations have BART police and cameras. If you ever feel unsafe, find a blue emergency phone on the platform wall, or press the intercom button. You can also call BART police at 510-464-7000.",
  "help": "I am here to help. You can ask me about: BART lines and stations, fares and Clipper cards, what to do if you miss a stop, transfers, accessibility, or how long a trip takes. What do you need?",
};
