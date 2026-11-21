# KMD《峰峰一中：青春纪元》第一阶段

这是一个可直接部署到 GitHub Pages 的静态网页游戏原型。

## 第一阶段已经包含
- KMD 标题界面、角色创建
- 45° 等距（伪3D）校园视角
- 校园地图、教学楼、图书馆、食堂、宿舍、操场等区域
- 键盘 WASD / 方向键移动
- 手机虚拟摇杆、跑步按钮、互动按钮
- 靠近建筑/NPC后互动
- 本地角色资料保存、手动保存当前进度
- 手机与电脑自适应界面

## 文件
- `index.html`：页面结构
- `style.css`：界面和响应式样式
- `game.js`：地图、人物、移动、互动、存档逻辑

## 部署到 GitHub Pages
1. 在 GitHub 新建一个仓库，例如 `fengfeng-youth-era`。
2. 将这三个文件（以及本 README）放到仓库根目录。
3. 打开仓库 `Settings` → `Pages`。
4. 在 `Build and deployment` 中选择 `Deploy from a branch`。
5. Branch 选择 `main`，目录选择 `/ (root)`，点击 Save。
6. 等待部署完成，打开 GitHub Pages 给出的网址。

注意：本项目使用原生 HTML/CSS/JavaScript，不需要 npm、Vite 或构建命令。

## 本地测试
直接用浏览器打开 `index.html` 即可。若浏览器对本地存储有限制，可通过 VS Code Live Server 或任意静态 HTTP 服务预览。

## 当前阶段边界
第一阶段是可运行的单机校园原型。多人在线同步、账号系统、好友、聊天、跨设备云存档尚未接入；这些需要第二阶段之后的独立后端服务，不能仅靠 GitHub Pages 实现。

## 操作
- 电脑：WASD / 方向键移动，E 或 Enter 互动，Shift 跑步
- 手机：左下角虚拟摇杆，右下角互动/跑步
- 地图：右上角“地图”
- 设置：右上角“设置”
