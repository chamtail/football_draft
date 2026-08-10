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

### 转会窗口流程
- **冬季转会**: 赛季模拟到半程自动触发 `openTransferWindow(false)`
- **夏季转会**: 赛季结束点击"进入下一赛季" → `saveSeasonHistory()` → `openTransferWindow(true)`
- 两者复用同一套 UI 和逻辑，`closeTransferWindow()` 中判断 `summerTransferMode`
  - 夏季: `progressAllPlayers()` → `startNewSeason()`
  - 冬季: 恢复赛季模拟

### 天眼模式
- 点击"梦幻阵容"文字5次开启，再点5次关闭
- 开启后：候选球员卡片显示 OVR badge，选秀总结显示年龄和平均能力，个人数据显示年龄和 OVR badge
- 被替换球员的 OVR 也会展示（表格中灰色半透明行）

### 阵型定义
- `formations` 对象: 4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 3-4-3
- 每个阵型是 `{ pos, label }[]` 数组，11个位置
- `attackWeights / assistWeights` 按位置分配进球/助攻权重

### 多赛季流程
选秀(11人) → 开始赛季 → 模拟每轮 → 半程冬季转会 → 继续模拟 → 赛季结束 → 分享/进入下一赛季 → 夏季转会(换1人) → 球员能力成长 → 新赛季(S2) → ...
- "重来一局"重置一切：currentSeason=1, seasonHistory=[], 重新fetch players.json恢复原始数据
- 赛季选择器可在联赛视图中切换：当前赛季 / 历史赛季 / 累计统计

### sessionId
0a2d2f72-1f17-4167-9e56-05c40e9e6b35