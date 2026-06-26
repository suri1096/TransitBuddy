import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTour } from "@/lib/tour-context";

const LINES = [
  {
    id: "yellow",
    name: "Yellow Line",
    symbol: "★",
    color: "#F5A623",
    bg: "bg-yellow-400",
    text: "text-yellow-900",
    lightBg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-300",
    termini: ["Pittsburg/Bay Point", "Millbrae"],
    stations: [
      "Pittsburg/Bay Point","North Concord/Martinez","Concord",
      "Pleasant Hill/Contra Costa Centre","Walnut Creek","Lafayette",
      "Orinda","Rockridge","MacArthur","19th St/Oakland",
      "12th St/Oakland City Center","West Oakland","Embarcadero",
      "Montgomery St","Powell St","Civic Center/UN Plaza",
      "16th St Mission","24th St Mission","Glen Park","Balboa Park",
      "Daly City","Colma","South San Francisco","San Bruno",
      "SFO Airport","Millbrae",
    ],
  },
  {
    id: "red",
    name: "Red Line",
    symbol: "■",
    color: "#E84040",
    bg: "bg-red-500",
    text: "text-white",
    lightBg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-300",
    termini: ["Richmond", "Millbrae"],
    stations: [
      "Richmond","El Cerrito del Norte","El Cerrito Plaza",
      "North Berkeley","Downtown Berkeley","Ashby","MacArthur",
      "19th St/Oakland","12th St/Oakland City Center","West Oakland",
      "Embarcadero","Montgomery St","Powell St","Civic Center/UN Plaza",
      "16th St Mission","24th St Mission","Glen Park","Balboa Park",
      "Daly City","Colma","South San Francisco","San Bruno",
      "SFO Airport","Millbrae",
    ],
  },
  {
    id: "orange",
    name: "Orange Line",
    symbol: "▲",
    color: "#F97316",
    bg: "bg-orange-500",
    text: "text-white",
    lightBg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-300",
    termini: ["Richmond", "Berryessa/North San José"],
    stations: [
      "Richmond","El Cerrito del Norte","El Cerrito Plaza",
      "North Berkeley","Downtown Berkeley","Ashby","MacArthur",
      "19th St/Oakland","12th St/Oakland City Center","Lake Merritt",
      "Fruitvale","Coliseum","San Leandro","Bay Fair","Hayward",
      "South Hayward","Union City","Fremont","Warm Springs/South Fremont",
      "Milpitas","Berryessa/North San José",
    ],
  },
  {
    id: "green",
    name: "Green Line",
    symbol: "●",
    color: "#22C55E",
    bg: "bg-green-500",
    text: "text-white",
    lightBg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-300",
    termini: ["Berryessa/North San José", "Daly City"],
    stations: [
      "Berryessa/North San José","Milpitas","Warm Springs/South Fremont",
      "Fremont","Union City","South Hayward","Hayward","Bay Fair",
      "San Leandro","Coliseum","Fruitvale","Lake Merritt",
      "12th St/Oakland City Center","West Oakland","Embarcadero",
      "Montgomery St","Powell St","Civic Center/UN Plaza",
      "16th St Mission","24th St Mission","Balboa Park","Daly City",
    ],
  },
  {
    id: "blue",
    name: "Blue Line",
    symbol: "◆",
    color: "#3B82F6",
    bg: "bg-blue-500",
    text: "text-white",
    lightBg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-300",
    termini: ["Dublin/Pleasanton", "Daly City"],
    stations: [
      "Dublin/Pleasanton","West Dublin/Pleasanton","Castro Valley",
      "Bay Fair","San Leandro","Coliseum","Fruitvale","Lake Merritt",
      "12th St/Oakland City Center","West Oakland","Embarcadero",
      "Montgomery St","Powell St","Civic Center/UN Plaza",
      "16th St Mission","24th St Mission","Balboa Park","Daly City",
    ],
  },
];

// Stations that appear on 2+ lines (transfer points)
function getTransfers(selected: typeof LINES): Set<string> {
  if (selected.length < 2) return new Set();
  const counts: Record<string, number> = {};
  for (const line of selected) {
    for (const s of line.stations) {
      counts[s] = (counts[s] || 0) + 1;
    }
  }
  return new Set(Object.entries(counts).filter(([, n]) => n >= 2).map(([s]) => s));
}

function StopDot({ active, transfer, color, label, showLabel }: { active: boolean; transfer: boolean; color: string; label: string; showLabel: boolean }) {
  return (
    <div className="flex flex-col items-center gap-1" style={{ minWidth: showLabel ? 70 : 20 }}>
      <div
        className={`rounded-full border-2 border-white shadow-sm transition-all ${transfer ? "ring-2 ring-offset-1 ring-white" : ""}`}
        style={{
          width: transfer ? 14 : 10,
          height: transfer ? 14 : 10,
          backgroundColor: active ? color : transfer ? color : "#d1d5db",
          borderColor: active ? "white" : "white",
        }}
      />
      {showLabel && (
        <span className="text-[8px] font-bold text-center leading-tight w-16 text-foreground/70 truncate">
          {label}
        </span>
      )}
    </div>
  );
}

function LineTrack({ line, selected, transfers, showLabels }: {
  line: typeof LINES[0];
  selected: boolean;
  transfers: Set<string>;
  showLabels: boolean;
}) {
  return (
    <div className="overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      <div className="flex items-center" style={{ minWidth: line.stations.length * (showLabels ? 72 : 24) + 20, padding: "4px 8px" }}>
        {line.stations.map((s, i) => (
          <React.Fragment key={s}>
            <StopDot
              active={selected}
              transfer={transfers.has(s)}
              color={line.color}
              label={s}
              showLabel={showLabels}
            />
            {i < line.stations.length - 1 && (
              <div
                className="flex-1 h-1.5 rounded-full"
                style={{
                  backgroundColor: selected ? line.color : "#d1d5db",
                  minWidth: showLabels ? 4 : 8,
                  opacity: selected ? 1 : 0.4,
                }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

export default function BartMap() {
  const allTransfers = getTransfers(LINES);
  const { highlightId } = useTour();

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      {/* Header */}
      <div
        data-tour-id="tour-lines"
        className={`px-5 pt-5 pb-3 border-b border-border ${highlightId === "tour-lines" ? "ring-4 ring-primary/60 ring-offset-2 rounded-2xl transition-all duration-300" : ""}`}
      >
        <h1 className="text-2xl font-extrabold mb-1">BART Lines</h1>
        <p className="text-sm text-muted-foreground">All lines and their stations at a glance.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 pb-24">
        {LINES.map(line => (
          <Card key={line.id} className={`rounded-2xl border-2 ${line.border} ${line.lightBg} overflow-hidden`}>
            <CardContent className="p-4 space-y-3">
              {/* Line header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl ${line.bg} flex items-center justify-center shadow-sm`}>
                    <span className={`text-lg font-bold ${line.text}`}>{line.symbol}</span>
                  </div>
                  <div>
                    <p className="font-extrabold text-base">{line.name}</p>
                    <p className="text-xs text-muted-foreground">{line.stations.length} stations</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground font-semibold">{line.termini[0]}</p>
                  <p className="text-xs font-bold text-muted-foreground">↕</p>
                  <p className="text-xs text-muted-foreground font-semibold">{line.termini[1]}</p>
                </div>
              </div>

              {/* Visual track */}
              <LineTrack
                line={line}
                selected={true}
                transfers={allTransfers}
                showLabels={true}
              />

              {/* Terminus labels */}
              <div className="flex justify-between text-xs font-bold text-foreground/60 px-1">
                <span>{line.termini[0]}</span>
                <span>{line.termini[1]}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
