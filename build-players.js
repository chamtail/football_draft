const fs = require("fs");

const INPUT = "EAFC26-Men.csv";
const OUTPUT = "players.json";

const TOP5 = [
  "Premier League",
  "Serie A Enilive",
  "Bundesliga",
  "Ligue 1 McDonald's",
  "LALIGA EA SPORTS"
];

const TEAM_NAME_FIXES = {
  "Lombardia FC": "Inter Milan",
  "Milano FC": "AC Milan",
  "Bergamo Calcio": "Atalanta BC",
  "Latium": "Lazio"
};

function fixTeamName(name) {
  return TEAM_NAME_FIXES[name] || name;
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

function parsePositions(primary, alternatives) {
  const positions = [primary.trim()];

  const altClean = (alternatives || "")
    .replace(/^\s*\[\s*/, "")
    .replace(/\s*\]\s*$/, "")
    .split(/\s*,\s*/)
    .map(s => s.replace(/^['"]|['"]$/g, "").trim())
    .filter(Boolean);

  for (const pos of altClean) {
    if (!positions.includes(pos)) {
      positions.push(pos);
    }
  }

  return positions;
}

const FORMATIONS = {
  "4-3-3": ["GK", "RB", "CB", "CB", "LB", "CM", "CM", "CM", "RW", "ST", "LW"],
  "4-4-2": ["GK", "RB", "CB", "CB", "LB", "RM", "CM", "CM", "LM", "ST", "ST"],
  "3-5-2": ["GK", "CB", "CB", "CB", "RWB", "CM", "CM", "CM", "LWB", "ST", "ST"],
  "4-2-3-1": ["GK", "RB", "CB", "CB", "LB", "CDM", "CDM", "RW", "CAM", "LW", "ST"],
  "3-4-3": ["GK", "CB", "CB", "CB", "RM", "CM", "CM", "LM", "RW", "ST", "LW"]
};

function computeTeamStrength(teamPlayers) {
  let bestAvg = 0;

  for (const slots of Object.values(FORMATIONS)) {
    const used = new Set();
    let total = 0;
    let filled = 0;

    for (const pos of slots) {
      const candidate = teamPlayers
        .filter(p => !used.has(p.id) && p.positions.includes(pos))
        .sort((a, b) => b.ovr - a.ovr)[0];

      if (candidate) {
        used.add(candidate.id);
        total += candidate.ovr;
        filled++;
      }
    }

    if (filled === 11) {
      const avg = total / 11;
      if (avg > bestAvg) bestAvg = avg;
    }
  }

  return Number(bestAvg.toFixed(2));
}

const raw = fs.readFileSync(INPUT, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(lines[0]);

const idx = {
  id: headers.indexOf("ID"),
  name: headers.indexOf("Name"),
  ovr: headers.indexOf("OVR"),
  position: headers.indexOf("Position"),
  altPositions: headers.indexOf("Alternative positions"),
  nation: headers.indexOf("Nation"),
  league: headers.indexOf("League"),
  team: headers.indexOf("Team")
};

const players = [];

for (let i = 1; i < lines.length; i++) {
  const row = parseCsvLine(lines[i]);
  const league = row[idx.league];

  if (!TOP5.includes(league)) continue;

  const id = Number(row[idx.id]);
  const name = row[idx.name];
  const ovr = Number(row[idx.ovr]);
  const primary = row[idx.position];
  const alt = row[idx.altPositions];
  const nation = row[idx.nation];
  const team = fixTeamName(row[idx.team]);

  if (!name || Number.isNaN(ovr)) continue;

  players.push({
    id,
    name,
    nation,
    league,
    team,
    ovr,
    positions: parsePositions(primary, alt)
  });
}

const teamsMap = new Map();
for (const p of players) {
  if (!teamsMap.has(p.team)) {
    teamsMap.set(p.team, []);
  }
  teamsMap.get(p.team).push(p);
}

const teams = [];
for (const [name, teamPlayers] of teamsMap) {
  teams.push({
    name,
    league: teamPlayers[0].league,
    playerCount: teamPlayers.length,
    strength: computeTeamStrength(teamPlayers)
  });
}
teams.sort((a, b) => b.strength - a.strength);

const output = {
  leagues: TOP5,
  count: players.length,
  teamCount: teams.length,
  teams,
  players
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf8");
console.log(`已生成 ${OUTPUT}，共 ${players.length} 名球员，${teams.length} 支球队`);
