const fs = require("fs");

const INPUT = "EAFC26-Men.csv";
const OUTPUT = "players.json";

const LEAGUES = [
  "Premier League",
  "Serie A Enilive",
  "Bundesliga",
  "Ligue 1 McDonald's",
  "LALIGA EA SPORTS",
  "Eredivisie",
  "CSL"
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

// 计算每支球队能达到的最高平均能力值的固定首发（阵型+11名球员），并记录攻防线加权总和
function computeTeamLineup(teamPlayers) {
  let best = null;

  for (const [formation, slots] of Object.entries(FORMATIONS)) {
    const used = new Set();
    const picked = [];
    let total = 0;

    for (const pos of slots) {
      const candidate = teamPlayers
        .filter(p => !used.has(p) && p.positions.includes(pos))
        .sort((a, b) => b.ovr - a.ovr)[0];

      if (candidate) {
        used.add(candidate);
        picked.push(candidate);
        total += candidate.ovr;
      }
    }

    if (picked.length === 11) {
      const avg = total / 11;
      if (!best || avg > best.avg) {
        best = { formation, players: picked, avg };
      }
    }
  }

  // 无法凑齐11人时，用最佳可用球员+空位50分兜底
  if (!best && teamPlayers.length > 0) {
    const sorted = [...teamPlayers].sort((a, b) => b.ovr - a.ovr);
    const picked = sorted.slice(0, Math.min(11, sorted.length));
    const total = picked.reduce((s, p) => s + p.ovr, 0) + (11 - picked.length) * 50;
    best = { formation: "4-3-3", players: picked, avg: total / 11 };
  }

  if (!best) return null;

  // 攻防线加权（与游戏内一致）：防守=门将4/后卫3/中场2/锋线1；攻击=门将1/后卫2/中场3/锋线4
  const lineOf = (p) => {
    const pos = p.positions[0];
    if (pos === "GK") return "gk";
    if (["CB", "RB", "LB", "RWB", "LWB"].includes(pos)) return "def";
    if (["ST", "CF", "SS"].includes(pos)) return "fwd";
    return "mid";
  };
  const DW = { gk: 4, def: 3, mid: 2, fwd: 1 };
  const AW = { gk: 1, def: 2, mid: 3, fwd: 4 };
  let defense = 0, attack = 0;
  for (const p of best.players) {
    defense += p.ovr * DW[lineOf(p)];
    attack += p.ovr * AW[lineOf(p)];
  }

  return {
    formation: best.formation,
    lineup: best.players.map(p => p.id),
    avg: Number(best.avg.toFixed(2)),
    attack,
    defense
  };
}

const raw = fs.readFileSync(INPUT, "utf8");
const lines = raw.split(/\r?\n/).filter(Boolean);
const headers = parseCsvLine(lines[0]);

const idx = {
  id: headers.indexOf("ID"),
  name: headers.indexOf("Name"),
  ovr: headers.indexOf("OVR"),
  age: headers.indexOf("Age"),
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

  if (!LEAGUES.includes(league)) continue;

  const id = Number(row[idx.id]);
  const name = row[idx.name];
  const ovr = Number(row[idx.ovr]);
  const age = Number(row[idx.age]);
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
    age,
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
  const lineupInfo = computeTeamLineup(teamPlayers);
  teams.push({
    name,
    league: teamPlayers[0].league,
    playerCount: teamPlayers.length,
    strength: lineupInfo ? lineupInfo.avg : 50,
    formation: lineupInfo ? lineupInfo.formation : null,
    lineup: lineupInfo ? lineupInfo.lineup : [],
    attack: lineupInfo ? lineupInfo.attack : 0,
    defense: lineupInfo ? lineupInfo.defense : 0
  });
}

teams.sort((a, b) => b.strength - a.strength);

const output = {
  leagues: LEAGUES,
  count: players.length,
  teamCount: teams.length,
  teams,
  players
};

fs.writeFileSync(OUTPUT, JSON.stringify(output, null, 2), "utf8");
console.log(`已生成 ${OUTPUT}，共 ${players.length} 名球员，${teams.length} 支球队`);
