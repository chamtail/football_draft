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
单文件前端（约1900行），所有 HTML/CSS/JS 在一个文件中。

### 核心数据结构
- `allPlayers` - 从 players.json 加载的球员数组，每球员含: `{ id, name, nation, league, team, ovr, positions[] }`
- `draftPicks[]` - 用户选中的11名首发球员
- `userPlayerStats[]` - 球员赛季统计，每项含: `{ player, pos, goals, assists, cleanSheets, appearances, replaced, isTransfer }`
- `tianyanMode` (bool) - 天眼模式开关，控制是否显示球员 OVR
- `transferMode / transferSelecting / transferPosIndex / transferCandidateCache` - 转会窗口状态

### 关键函数
- `buildPlayerStatsHtml()` - 生成个人数据表格HTML，天眼模式下增加"能力"列和 OVR badge
- `renderLeague()` - 联赛视图，内含赛果、积分榜、个人数据表（调用 buildPlayerStatsHtml）
- `openTransferWindow()` - 打开冬季转会窗口，底部附带个人数据表
- `selectTransferPosition(index)` - 选择替换位置，天眼模式下显示当前球员 OVR
- `renderCandidates(candidates)` - 渲染候选球员卡片，转会模式下底部追加个人数据表
- `confirmTransfer(player)` - 确认替换，旧球员标记 replaced=true，新球员追加 isTransfer=true
- `renderDraftSummary()` - 选秀总结页
- `distributeUserMatchStats(userGoals, oppGoals)` - 按位置权重×OVR³ 分配进球/助攻/零封

### 冬季转会窗口流程
1. 赛季模拟到半程后自动触发 `openTransferWindow()`
2. 用户点击阵型图位置 → `selectTransferPosition()` 显示候选球员
3. 点击候选卡片 → `confirmTransfer()` 完成替换，旧球员标记 replaced，新球员追加 isTransfer
4. 可跳过窗口（skipTransferBtn）或继续模拟下半程

### 天眼模式
- 点击"梦幻阵容"文字5次开启，再点5次关闭（共10次切换）
- 开启后：候选球员卡片显示 OVR badge，选秀总结显示平均能力，个人数据表增加"能力"列
- 被替换球员的 OVR 也会展示（表格中灰色半透明行）

### 阵型定义
- `formations` 对象: 4-3-3, 4-4-2, 3-5-2, 4-2-3-1, 3-4-3
- 每个阵型是 `{ pos, label }[]` 数组，11个位置
- `attackWeights / assistWeights` 按位置分配进球/助攻权重

### 赛季流程
选秀(11人) → 开始赛季 → 模拟每轮比赛 → 半程冬季转会 → 继续模拟 → 赛季结束 → 分享战绩
