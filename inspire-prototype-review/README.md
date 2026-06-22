# Inspire Prototype Review

原型走查（Review）模式工具：在原型上叠加悬浮球、走查图层、对比抽屉与多种走查模式（Guided / Spec / Explore），用于产品评审与设计走查。

## 在线访问

发布到 GitHub Pages 后，访问链接为：

```
https://<你的GitHub用户名>.github.io/<仓库名>/
```

---

## 一次性发布步骤（按顺序做一遍即可）

### 1. 在 GitHub 上新建一个空仓库

- 打开 https://github.com/new
- Repository name：填一个名字，例如 `inspire-prototype-review`
- 选择 **Public**（GitHub Pages 免费版仅支持 Public 仓库）
- **不要** 勾选 "Add a README" / "Add .gitignore"（本项目已自带）
- 点击 **Create repository**

### 2. 把本地代码推到 GitHub

在本项目根目录（即本 README 所在目录）打开终端，依次执行：

```bash
git init
git add .
git commit -m "init: 原型走查工具首次发布"
git branch -M main
git remote add origin https://github.com/<你的GitHub用户名>/<仓库名>.git
git push -u origin main
```

### 3. 开启 GitHub Pages（只需配置一次）

- 进入 GitHub 仓库页面 → **Settings** → 左侧 **Pages**
- **Source** 选择 **GitHub Actions**
- 保存

### 4. 等待自动构建

- 进入仓库 **Actions** 标签页，会看到一个名为 "Deploy to GitHub Pages" 的工作流正在运行
- 1–3 分钟后变绿，点进去能看到部署链接
- 之后再次访问 `https://<用户名>.github.io/<仓库名>/` 即可使用

> 以后每次 `git push` 到 `main` 分支，会自动重新构建并部署，无需手动操作。

---

## 本地开发

```bash
pnpm install
pnpm dev          # 启动开发服务器
pnpm build        # 构建生产包到 dist/
pnpm preview      # 本地预览构建产物
```

未安装 pnpm 的话，先 `npm install -g pnpm`。

## 技术栈

- React 18 + TypeScript
- Vite 4
- React Router 6（HashRouter，便于子路径部署）
- Semi Design (`@douyinfe/semi-ui`)

## 目录结构

```
src/
├── App.tsx              路由与全局 Provider
├── pages/               业务页面（Home / Stage / IframeBase 等）
├── components/          通用组件
└── review/              走查模式核心
    ├── FloatingBall.tsx       悬浮球
    ├── ReviewProvider.tsx     全局状态
    ├── ReviewLayer.tsx        走查图层
    ├── modes/                 Guided / Spec / Explore 三种模式
    ├── overlay/               热区高亮
    ├── compare/               对比抽屉
    └── data/                  规则与数据
public/
├── before/              原型快照（HTML/SVG）
└── bg/                  背景图
```

## 常见问题

**Q：部署后页面空白？**
A：检查浏览器控制台。本项目使用 HashRouter（URL 形如 `/#/...`）和相对路径资源（`base: './'`），通常子路径部署不会出问题。

**Q：能改成自定义域名吗？**
A：可以。在 GitHub 仓库 Settings → Pages → Custom domain 配置，并在域名 DNS 添加 CNAME 记录指向 `<用户名>.github.io`。
