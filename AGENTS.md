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
