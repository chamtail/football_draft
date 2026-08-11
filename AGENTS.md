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
- `lastSimType` (string|null) - "league"|"cup"|"ucl"，标记最近模拟的类型，控制赛果面板显示联赛/杯赛/欧冠赛果
- `ucl` (object|null) - 当前赛季欧冠状态，含 `active`, `teams[]`, `leagueStandings[]`, `leagueFixtures[]`, `knockout{playoff,r16,qf,sf,final}`, `champion`
- `uclSeasons[]` - 用户欧冠夺冠的赛季标签字符串数组
- `uclRoundPending` (string|null) - 待踢的欧冠轮次key（如"md1"|"playoffLeg1"|"r16Leg2"等）
- `uclSfPending` (bool) - 联赛结束后是否等待踢欧冠半决赛
- `uclFinalPending` (bool) - 是否等待踢欧冠决赛
- `lastUclResults` (object|null) - 最近一次欧冠赛果 `{ roundName, matches|ties|match, isLeaguePhase?, legNum? }`

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
  - `CUP_SCHEDULE = { 8: "roundOf64", 14: "roundOf32", 20: "roundOf16", 25: "quarterFinals", 31: "semiFinals", 38: "final" }` — 联赛第N轮后触发对应杯赛轮次
  - `CUP_ROUND_NAMES = { qualifying: "预选赛", roundOf64: "64强", roundOf32: "32强", roundOf16: "16强", quarterFinals: "8强", semiFinals: "半决赛", final: "决赛" }`
  - `CUP_ROUND_ORDER = ["roundOf64", "roundOf32", "roundOf16", "quarterFinals", "semiFinals", "final"]`
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
  - 足总杯决赛(R38)通过正常杯赛流程处理，夺冠后自动记录到 cupSeasons
- **64强** (roundOf64, R8): 初始抽签，所有参赛队
- **32强** (roundOf32, R14): 64强胜者
- **16强** (roundOf16, R20): 32强胜者
- **8强** (quarterFinals, R25): 16强胜者
- **4强** (semiFinals, R31): 8强胜者，胜者进入决赛（决赛对阵在4强后立即抽签）
- **决赛** (final, R38): 4强胜者，中立场地，产生冠军
- **点球大战** (`penaltyShootout`):
  - 按双方球队实力加权随机选胜者
  - 返回 `{ winnerIdx, homePenalty, awayPenalty }`，点球比分在3-5范围内，胜者多进1-2球
  - 比赛数据中存 `penaltyHome/penaltyAway` 字段，对阵图和赛果面板显示 `(点X-Y)`
- **决赛触发**:
  - 足总杯决赛在联赛第38轮后通过 `CUP_SCHEDULE[38]="final"` 正常触发
  - 4强(R31)完成后，`simulateCupRound` 自动推进胜者到决赛并抽签对阵
  - 决赛模拟后设置 `cup.champion`，若用户夺冠则 `cupSeasons.push(seasonLabel)`
  - 欧冠决赛在足总杯决赛之后：联赛结束后 renderLeague 检测 cup final done + SF done → 设置 `uclFinalPending = true`
- **杯赛赛果展示**:
  - 赛果面板根据 `lastSimType` 决定显示联赛还是杯赛赛果
  - 杯赛赛果显示轮次名称（如"足总杯 16强 赛果"）和所有比赛比分（含点球）
  - 对阵图 `buildCupBracketHtml` 展示全部已完成轮次的赛果和冠军
- **杯赛数据序列化**:
  - `saveSeasonHistory()` 中 cup 对象深拷贝保存: `{ rounds, champion }`
  - 查看历史赛季时 `buildCupBracketHtml(hist.cup)` 渲染历史杯赛对阵图
- **重置**: "重来一局"重置 cup=null, cupSeasons=[], cupFinalPending=false, cupRoundPending=null, lastCupResults=null, lastSimType=null

### 欧冠系统
- **常量定义**:
  - `UCL_SCHEDULE = { 2:"md1", 4:"md2", 7:"md3", 9:"md4", 12:"md5", 14:"md6", 17:"md7", 19:"md8", 22:"playoffLeg1", 24:"playoffLeg2", 26:"r16Leg1", 28:"r16Leg2", 30:"qfLeg1", 33:"qfLeg2", 34:"sfLeg1", 36:"sfLeg2" }` — 联赛第N轮后触发对应欧冠轮次
  - `UCL_ROUND_NAMES` — 各轮次中文名（联赛第N轮 / 附加赛首回合 / 附加赛次回合 / 16强首回合 ...）
  - `UCL_MATCHDAY_KEYS = ["md1"~"md8"]` — 联赛阶段8轮
- **欧冠数据结构** (`ucl` 对象):
  - `active` (bool) - 用户是否参加欧冠（联赛积分榜排名决定）
  - `teams[]` - 20支球队，每支含 `{ name, strength, isUser, roster[] }`
  - `leagueStandings[]` - 联赛阶段积分榜，每项含 `{ idx, played, won, drawn, lost, gf, ga, gd, points }`
  - `leagueFixtures[]` - 8轮联赛赛程，每轮10场比赛
  - `knockout` - 淘汰赛对象: `{ playoff, r16, qf, sf, final }`
    - playoff/r16/qf/sf 各含 `{ ties[], done }`，每个tie含 `{ teamAIdx, teamBIdx, teamAName, teamBName, leg1, leg2, aggA, aggB, winnerIdx, penaltyHome?, penaltyAway? }`
    - final 含 `{ match, done }`
  - `champion` - 决赛后设为冠军队名
  - `leaguePhaseDone` (bool) - MD8完成后标记
- **联赛阶段** (8轮小组赛):
  - MD1-MD8 穿插在联赛第2/4/7/9/12/14/17/19轮后（半程前全部完成）
  - `simulateUclMatchday(mdIdx)` 模拟一轮联赛，更新积分榜，MD8完成后 `drawUclTies("playoff")`
- **淘汰赛** (全部主客场两回合制，与足总杯交替穿插在联赛中):
  - **附加赛** (playoffLeg1/Leg2, 联赛第22/24轮后): 积分榜9-24名共16队抽签8组对阵，两回合制，总比分平则走点球
  - **16强** (r16Leg1/Leg2, 联赛第26/28轮后): 积分榜前8 + 附加赛8胜者共16队抽签，两回合制
  - **8强** (qfLeg1/Leg2, 联赛第30/33轮后): 16强胜者8队抽签，两回合制
  - **半决赛** (sfLeg1/Leg2, 联赛第34/36轮后): 8强胜者4队抽签，两回合制
  - **决赛** (final, 联赛结束后): 中立场地单场，由 `uclFinalPending` 触发（排在足总杯决赛之后）
  - `simulateUclLeg(roundKey, legNum)` 通用模拟函数，Leg2计算总比分、客场进球、点球
  - `drawUclTies(roundKey)` 抽签对阵: playoff=9-24名, r16=前8+playoff胜者, qf=r16胜者, sf=qf胜者
  - `handleUclPending()` 处理待模拟的欧冠轮次，Leg2完成后自动抽签下一轮
- **赛果展示**:
  - 联赛阶段: `lastUclResults.isLeaguePhase=true`，显示全部比赛，用户比赛置顶
  - 淘汰赛: `lastUclResults.ties`，显示全部对阵，Leg2显示总比分和晋级队，用户比赛置顶
  - 决赛: `lastUclResults.match`，显示单场赛果
- **对阵图** (`buildUclBracketHtml`):
  - 展示附加赛/16强/8强/半决赛/决赛各轮对阵和比分
  - 两回合显示总比分，点球显示 `(点X-Y)`
  - 用户球队绿色高亮，被淘汰队灰色
- **重置**: "重来一局"重置 ucl=null, uclSeasons=[], uclRoundPending=null, uclSfPending=false, uclFinalPending=false, lastUclResults=null

### 天眼模式
- 点击"梦幻阵容"文字5次开启，再点5次关闭
- 开启后：候选球员卡片显示 OVR badge，选秀总结显示年龄和平均能力，个人数据显示年龄和 OVR badge
- 被替换球员的 OVR 也会展示（表格中灰色半透明行）

### 阵型定义
- `formations` 对象: 4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 3-4-3
- 每个阵型是 `{ pos, label }[]` 数组，11个位置
- `attackWeights / assistWeights` 按位置分配进球/助攻权重

### 多赛季流程
选秀(11人) → 开始赛季 → 模拟每轮 → 半程冬季转会 → 继续模拟 → 赛季结束 → 欧冠决赛 → 分享/进入下一赛季 → 夏季转会(换1人) → 球员能力成长 → 新赛季(S2) → ...
- 足总杯6轮（64强/32强/16强/8强/4强/决赛）穿插在联赛第8/14/20/25/31/38轮
- 欧冠联赛阶段（MD1-8）在联赛第2/4/7/9/12/14/17/19轮，半程前完成
- 欧冠淘汰赛（附加赛/16强/8强/4强）穿插在联赛第22-36轮，与足总杯交替进行
- 欧冠决赛是唯一的赛后事件，在足总杯决赛(R38)之后触发
- "重来一局"重置一切：currentSeason=1, seasonHistory=[], cup=null, 重新fetch players.json恢复原始数据
- 赛季选择器可在联赛视图中切换：当前赛季 / 历史赛季 / 累计统计

### sessionId
0a2d2f72-1f17-4167-9e56-05c40e9e6b35