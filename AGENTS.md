# Football Draft - 足球经理模拟

## 项目概述
足球经理模拟 Web 应用，用于模拟 EAFC26 球员选秀/管理。

## 技术栈
- **后端**: 纯 Node.js，仅使用内置模块（http, fs, path），无需 npm install
- **前端**: 原生 HTML/CSS/JS，无框架
- **数据**: CSV (EAFC26-Men.csv) -> JSON (players.json)，通过 build-players.js 转换

## 文件结构
- `server.js` - HTTP 静态文件服务器
- `index.html` - 主页面（足球经理模拟界面）
- `build-players.js` - CSV 转 JSON 的构建脚本
- `EAFC26-Men.csv` - EAFC26 球员原始数据
- `players.json` - 转换后的球员数据

## 启动方式
```bash
node server.js
```
访问 http://localhost:8080

## 部署
- **GitHub 仓库**: git@github.com:chamtail/football_draft.git
- **GitHub Pages 地址**: https://chamtail.github.io/football_draft/
- **规则**: 每次代码更新后，自动执行 git add、commit、push 到 GitHub，无需额外确认

## 注意事项
- 无 package.json，无 node_modules，无需安装依赖
- 如需更新球员数据：先编辑 CSV，再运行 `node build-players.js` 重新生成 players.json

## index.html 架构概览
单文件前端（约2080行），所有 HTML/CSS/JS 在一个文件中。

### 核心数据结构
- `allPlayers` - 从 players.json 加载的球员数组，每球员含: `{ id, name, nation, league, team, ovr, age, positions[] }`
- `draftPicks[]` - 用户选中的11名首发球员（引用 allPlayers 中的对象，OVR/age 变动会同步）
- `userPlayerStats[]` - 球员赛季统计，每项含: `{ player, pos, goals, assists, cleanSheets, appearances, replaced, isTransfer }`
- `tianyanMode` (bool) - 天眼模式开关，控制是否显示球员 OVR
- `transferMode / transferSelecting / transferPosIndex / transferCandidateCache` - 转会窗口状态
- `summerTransferMode` (bool) - 夏季转会模式标记
- `currentSeason` (number) - 当前赛季号，从1开始
- `seasonHistory[]` - 历史赛季存档，每项含: `{ seasonNum, standings, stats, formation }`，stats 中球员信息已快照为 playerName/playerOvr/playerAge 扁平字段
- `viewSeason` (string) - 联赛视图当前查看的赛季: "current" | 赛季号 | "cumulative"
- `lastRoundResults[]` - 最近一轮联赛赛果，每项含 `{ homeName, awayName, homeGoals, awayGoals, isUser }`
- `cup` (object|null) - 当前赛季足总杯状态，含 `schedule`, `rounds`, `champion`
- `cupSeasons[]` - 用户夺冠的赛季标签字符串数组
- `cupFinalPending` (bool) - 联赛结束后是否等待踢杯赛决赛
- `cupRoundPending` (string|null) - 待踢的杯赛轮次key（"qualifying"|"roundOf16"|"quarterFinals"|"semiFinals"），杯赛作为独立一轮模拟
- `lastCupResults` (object|null) - 最近一次杯赛轮次赛果 `{ roundName, matches }`
- `lastSimType` (string|null) - "league"|"cup"，标记最近模拟的类型，控制赛果面板显示联赛还是杯赛赛果

### 关键函数
- `buildPlayerStatsHtml(stats)` - 生成个人数据表格HTML，接受可选的历史数据参数；使用 getName/getOvr/getAge helper 兼容实时和历史数据；只显示出场过的球员
- `buildStandingsTableHtml(sorted)` - 生成积分榜表格HTML
- `buildCumulativeStats()` - 聚合所有赛季+当前的球员统计数据
- `saveSeasonHistory()` - 保存当前赛季的 standings 和 stats 快照到 seasonHistory
- `progressOvr(ovr, age)` - 根据年龄计算OVR变动（<24岁60%提升，33+岁70%下降）
- `progressAllPlayers()` - 所有球员年龄+1，OVR按年龄变动
- `startNewSeason()` - currentSeason++，重置viewSeason，重建联赛
- `renderLeague()` - 联赛视图，含赛季选择器、赛果、积分榜、个人数据；支持切换历史赛季和累计视图
- `openTransferWindow(isSummer)` - 打开转会窗口，isSummer=true时为夏季转会
- `selectTransferPosition(index)` - 选择替换位置，天眼模式下显示当前球员 OVR
- `renderCandidates(candidates)` - 渲染候选球员卡片（含年龄），转会模式下底部追加个人数据表
- `confirmTransfer(player)` - 确认替换，旧球员标记 replaced=true，新球员追加 isTransfer=true
- `renderDraftSummary()` - 选秀总结页（含年龄）
- `distributeUserMatchStats(userGoals, oppGoals)` - 按位置权重×OVR³ 分配进球/助攻/零封
- `generateShareImage()` - 分享图片，标题含赛季号，仅分享当前赛季数据
- `initCup()` - 初始化杯赛状态（5轮空数据），重置 cupFinalPending/cupRoundPending/lastCupResults/lastSimType
- `drawCupQualifying()` - 杯赛预选赛：积分榜前12名直接进16强，后8名抽签对阵，胜者进16强；同时模拟比赛并分配用户球员数据
- `simulateCupRound(roundKey)` - 模拟杯赛单轮（16强/8强/4强/决赛）：随机抽签对阵，平局走点球，胜者推进下一轮，决赛产生冠军
- `penaltyShootout(homeIdx, awayIdx)` - 点球大战：按球队实力加权随机选胜者，返回 `{ winnerIdx, homePenalty, awayPenalty }` 含点球比分
- `buildCupBracketHtml(cupData)` - 生成杯赛对阵图HTML，展示各轮赛果（含点球比分）和冠军
- `getNextCupRound(key)` - 根据当前轮次key返回下一轮key
- `simulateMatch(homeStrength, awayStrength)` - 模拟单场比赛，返回 `{ homeGoals, awayGoals }`

### 转会窗口流程
- **冬季转会**: 赛季模拟到半程自动触发 `openTransferWindow(false)`
- **夏季转会**: 赛季结束点击"进入下一赛季" → `saveSeasonHistory()` → `openTransferWindow(true)`
- 两者复用同一套 UI 和逻辑，`closeTransferWindow()` 中判断 `summerTransferMode`
  - 夏季: `progressAllPlayers()` → `startNewSeason()`
  - 冬季: 恢复赛季模拟

### 足总杯系统
- **常量定义**:
  - `CUP_SCHEDULE = { 21: "qualifying", 25: "roundOf16", 29: "quarterFinals", 34: "semiFinals" }` — 联赛第N轮后触发对应杯赛轮次
  - `CUP_ROUND_NAMES = { qualifying: "预选赛", roundOf16: "16强", quarterFinals: "8强", semiFinals: "4强", final: "决赛" }`
  - `CUP_ROUND_ORDER = ["qualifying", "roundOf16", "quarterFinals", "semiFinals", "final"]`
- **杯赛数据结构** (`cup` 对象):
  - `schedule` - 引用 CUP_SCHEDULE
  - `rounds` - 5个轮次对象，每个含 `{ teams[], matches[], done }`
    - qualifying 轮无 teams（由 drawCupQualifying 内部生成对阵）
    - 其他轮先填 teams，再由 simulateCupRound 模拟后填 matches
  - `champion` - 决赛结束后设为冠军队名
- **杯赛轮次流程**:
  1. 联赛模拟完第N轮后，检查 `cup.schedule[currentRound]` 是否有对应杯赛轮次
  2. 若有且未完成，设置 `cupRoundPending = cupKey`，状态栏显示"足总杯XX待踢"
  3. 杯赛作为独立一轮：下次点击"模拟一场"时只模拟杯赛，不模拟联赛
  4. 杯赛模拟完成后设置 `lastSimType = "cup"`，赛果面板显示杯赛赛果
  5. 再下次点击继续模拟联赛下一轮
  - 批量模拟（模拟至半程/到结束）遇到杯赛轮次会暂停，需手动模拟杯赛后继续
- **预选赛特殊逻辑** (`drawCupQualifying`):
  - 积分榜前12名直接晋级16强
  - 后8名（第13-20名）抽签4组对阵，单场淘汰
  - 平局走点球大战
  - 4个胜者补入16强队伍列表
- **常规轮次** (`simulateCupRound`):
  - 16强(16队8场) → 8强(8队4场) → 4强(4队2场) → 决赛(2队1场)
  - 每轮随机抽签对阵，单场淘汰，平局走点球
  - 决赛胜者设为 `cup.champion`
- **点球大战** (`penaltyShootout`):
  - 按双方球队实力加权随机选胜者
  - 返回 `{ winnerIdx, homePenalty, awayPenalty }`，点球比分在3-5范围内，胜者多进1-2球
  - 比赛数据中存 `penaltyHome/penaltyAway` 字段，对阵图和赛果面板显示 `(点X-Y)`
- **决赛触发**:
  - 联赛全部38轮结束后，检查 `cup.rounds.final` 是否未完成
  - 设置 `cupFinalPending = true`，按钮显示"模拟一场"，状态栏显示"联赛已结束 · 足总杯决赛待踢"
  - 点击"模拟一场"模拟决赛，记录冠军，若用户夺冠则 `cupSeasons.push(seasonLabel)`
- **杯赛赛果展示**:
  - 赛果面板根据 `lastSimType` 决定显示联赛还是杯赛赛果
  - 杯赛赛果显示轮次名称（如"足总杯 16强 赛果"）和所有比赛比分（含点球）
  - 对阵图 `buildCupBracketHtml` 展示全部已完成轮次的赛果和冠军
- **杯赛数据序列化**:
  - `saveSeasonHistory()` 中 cup 对象深拷贝保存: `{ rounds, champion }`
  - 查看历史赛季时 `buildCupBracketHtml(hist.cup)` 渲染历史杯赛对阵图
- **重置**: "重来一局"重置 cup=null, cupSeasons=[], cupFinalPending=false, cupRoundPending=null, lastCupResults=null, lastSimType=null

### 天眼模式
- 点击"梦幻阵容"文字5次开启，再点5次关闭
- 开启后：候选球员卡片显示 OVR badge，选秀总结显示年龄和平均能力，个人数据显示年龄和 OVR badge
- 被替换球员的 OVR 也会展示（表格中灰色半透明行）

### 阵型定义
- `formations` 对象: 4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 3-4-3
- 每个阵型是 `{ pos, label }[]` 数组，11个位置
- `attackWeights / assistWeights` 按位置分配进球/助攻权重

### 多赛季流程
选秀(11人) → 开始赛季 → 模拟每轮 → 半程冬季转会 → 继续模拟 → 赛季结束 → 足总杯决赛 → 分享/进入下一赛季 → 夏季转会(换1人) → 球员能力成长 → 新赛季(S2) → ...
- 联赛第21/25/29/34轮后穿插足总杯预选赛/16强/8强/4强，杯赛作为独立一轮单独模拟
- 联赛全部38轮结束后踢足总杯决赛
- "重来一局"重置一切：currentSeason=1, seasonHistory=[], cup=null, 重新fetch players.json恢复原始数据
- 赛季选择器可在联赛视图中切换：当前赛季 / 历史赛季 / 累计统计

### sessionId
0a2d2f72-1f17-4167-9e56-05c40e9e6b35