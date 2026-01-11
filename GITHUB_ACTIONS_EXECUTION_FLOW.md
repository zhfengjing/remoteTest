# 🔄 GitHub Actions 执行流程详解

## 📁 文件结构和关系

```
.github/
├── workflows/                          # 工作流定义文件（YAML）
│   ├── openai-codex-task.yml          # OpenAI 工作流定义
│   ├── auto-task-execution.yml        # Claude 工作流定义
│   └── code-review.yml                # 代码审查工作流定义
│
└── scripts/                            # 执行脚本（可执行代码）
    ├── openai/
    │   ├── package.json               # Node.js 依赖声明
    │   └── execute-task.js            # OpenAI 任务执行逻辑
    │
    ├── claude-review.js               # Claude 审查逻辑
    └── package.json                   # Claude 脚本依赖
```

## 🔗 文件关系图

```
┌─────────────────────────────────────────────────────────────┐
│ GitHub 仓库                                                  │
│                                                              │
│  1. 用户提交 task.md                                         │
│     ↓                                                        │
│  2. GitHub 检测到文件变更                                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ .github/workflows/openai-codex-task.yml (工作流定义)         │
│                                                              │
│  on:                                                         │
│    push:                                                     │
│      paths: ['task.md']    ← 定义触发条件                   │
│                                                              │
│  jobs:                                                       │
│    execute-task:           ← 定义任务                        │
│      steps:                ← 定义执行步骤                    │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ GitHub Actions Runner (虚拟机)                               │
│                                                              │
│  按 steps 顺序执行：                                         │
│  1. Checkout code                                            │
│  2. Setup Node.js                                            │
│  3. Install dependencies  ← 安装 scripts 目录的依赖          │
│  4. Execute script        ← 调用 scripts 中的脚本            │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ .github/scripts/openai/execute-task.js (执行脚本)            │
│                                                              │
│  1. 读取 task.md                                             │
│  2. 调用 OpenAI API                                          │
│  3. 生成代码文件                                             │
│  4. 返回结果                                                 │
└─────────────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│ 返回到 workflow (继续执行剩余 steps)                         │
│                                                              │
│  5. Commit changes                                           │
│  6. Create PR                                                │
└─────────────────────────────────────────────────────────────┘
```

## 📋 详细执行顺序（以 OpenAI Codex 工作流为例）

### 第 0 步：触发条件检测

```yaml
# .github/workflows/openai-codex-task.yml
on:
  push:
    paths:
      - 'task.md'      # 当 task.md 被推送时触发
    branches-ignore:
      - 'main'         # 排除 main 分支
```

**发生了什么**：
1. 用户执行 `git push`
2. GitHub 接收到推送
3. GitHub 检查所有 `.github/workflows/*.yml` 文件
4. 找到匹配触发条件的工作流
5. 将工作流加入执行队列

---

### 第 1 步：Checkout 代码

```yaml
- name: Checkout repository
  uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

**发生了什么**：
- GitHub Actions Runner 创建虚拟机（Ubuntu）
- 下载仓库代码到 Runner 的工作目录
- 工作目录：`/home/runner/work/remoteTest/remoteTest/`

**文件系统状态**：
```
/home/runner/work/remoteTest/remoteTest/
├── .github/
│   ├── workflows/
│   └── scripts/
├── task.md          ← 已存在
└── (其他项目文件)
```

---

### 第 2 步：Setup Node.js

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
```

**发生了什么**：
- 在 Runner 上安装 Node.js 20
- 配置 npm 环境变量
- 准备好 Node.js 运行环境

---

### 第 3 步：安装依赖

```yaml
- name: Install dependencies
  working-directory: .github/scripts/openai
  run: npm install
```

**发生了什么**：
1. 切换到 `.github/scripts/openai/` 目录
2. 读取 `package.json` 文件
3. 执行 `npm install`
4. 下载并安装 `openai` 包到 `node_modules/`

**等价于手动执行**：
```bash
cd .github/scripts/openai
npm install
# 安装 openai@^4.67.3
```

**文件系统变化**：
```
.github/scripts/openai/
├── package.json
├── execute-task.js
└── node_modules/         ← 新创建
    ├── openai/
    └── (其他依赖)
```

---

### 第 4 步：执行脚本

```yaml
- name: Execute task with OpenAI Codex
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  working-directory: .github/scripts/openai
  run: |
    node execute-task.js
```

**发生了什么**：

#### 4.1 设置环境变量
```bash
export OPENAI_API_KEY="sk-xxx..."
```

#### 4.2 执行 Node.js 脚本
```bash
cd .github/scripts/openai
node execute-task.js
```

#### 4.3 脚本内部执行流程
```javascript
// execute-task.js 的执行顺序

// 1. 读取环境变量
const apiKey = process.env.OPENAI_API_KEY;

// 2. 读取 task.md（从项目根目录）
const taskPath = path.join(__dirname, '../../..', 'task.md');
// 实际路径: /home/runner/work/remoteTest/remoteTest/task.md
const taskContent = fs.readFileSync(taskPath, 'utf8');

// 3. 调用 OpenAI API
const response = await openai.chat.completions.create({
  model: 'gpt-4-turbo-preview',
  messages: [...]
});

// 4. 生成代码文件（写入项目根目录）
const filePath = path.join(PROJECT_ROOT, 'src/components/Login.jsx');
fs.writeFileSync(filePath, codeContent);

// 5. 脚本执行完毕，返回到 workflow
```

**文件系统变化**：
```
/home/runner/work/remoteTest/remoteTest/
├── src/
│   └── components/
│       └── Login.jsx    ← 脚本生成的新文件
└── task.md
```

---

### 第 5 步：检查变更

```yaml
- name: Check for code changes
  run: |
    git add .
    git reset task.md

    if git diff --staged --quiet; then
      echo "has_changes=false" >> $GITHUB_OUTPUT
    else
      echo "has_changes=true" >> $GITHUB_OUTPUT
    fi
```

**发生了什么**：
1. 将所有变更添加到 Git 暂存区
2. 排除 task.md 文件
3. 检查是否有变更
4. 设置输出变量 `has_changes`

---

### 第 6 步：提交变更

```yaml
- name: Commit and push changes
  if: steps.check-changes.outputs.has_changes == 'true'
  run: |
    git commit -m "..."
    git push origin ${{ env.CURRENT_BRANCH }}
```

**发生了什么**：
1. 检查条件：`if has_changes == true`
2. 执行 git commit
3. 执行 git push

---

### 第 7 步：创建 PR

```yaml
- name: Create Pull Request
  if: steps.check-changes.outputs.has_changes == 'true'
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  run: |
    gh pr create --base main --head ${{ env.CURRENT_BRANCH }} ...
```

**发生了什么**：
1. 使用 GitHub CLI (`gh`) 工具
2. 调用 GitHub API 创建 Pull Request
3. 工作流执行完成

---

## 🔍 关键概念解析

### 1. `working-directory` 的作用

```yaml
- name: Install dependencies
  working-directory: .github/scripts/openai  # 指定工作目录
  run: npm install
```

**等价于**：
```bash
cd .github/scripts/openai
npm install
cd -  # 自动返回原目录
```

**每个 step 都有独立的工作目录上下文！**

---

### 2. 环境变量传递

```yaml
- name: Execute script
  env:
    OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}  # 从 GitHub Secrets 读取
    TASK_CONTENT: ${{ env.TASK_CONTENT }}          # 从前面的 step 读取
  run: node execute-task.js
```

**在脚本中访问**：
```javascript
// execute-task.js
const apiKey = process.env.OPENAI_API_KEY;
const task = process.env.TASK_CONTENT;
```

---

### 3. Step 之间的数据传递

```yaml
# Step 1: 设置输出
- name: Read task
  id: read-task
  run: |
    TASK_TITLE=$(head -n 1 task.md)
    echo "TASK_TITLE=$TASK_TITLE" >> $GITHUB_ENV        # 方式1: 环境变量
    echo "task_title=$TASK_TITLE" >> $GITHUB_OUTPUT      # 方式2: 输出变量

# Step 2: 使用输出
- name: Use task
  run: |
    echo ${{ env.TASK_TITLE }}                          # 使用环境变量
    echo ${{ steps.read-task.outputs.task_title }}      # 使用输出变量
```

---

### 4. 条件执行

```yaml
- name: Create PR
  if: steps.check-changes.outputs.has_changes == 'true'  # 条件判断
  run: gh pr create ...
```

**逻辑**：
- 如果条件为 `false`，跳过此 step
- 继续执行后续 step

---

## 📊 完整执行时间线

```
时间   | 事件                           | 位置
-------|--------------------------------|---------------------------
00:00  | 用户 git push task.md          | 本地 → GitHub
00:01  | GitHub 检测到推送              | GitHub 服务器
00:02  | 触发 workflow                  | GitHub Actions
00:03  | 创建 Runner 虚拟机             | Ubuntu 容器
00:05  | Checkout 代码                  | Runner
00:06  | Setup Node.js                  | Runner
00:08  | npm install                    | .github/scripts/openai/
00:15  | node execute-task.js 开始      | .github/scripts/openai/
       |   ├─ 读取 task.md             | 项目根目录
       |   ├─ 调用 OpenAI API          | 网络请求
       |   └─ 生成文件                 | 项目根目录
00:45  | 脚本执行完成                   | 返回到 workflow
00:46  | git commit                     | Runner
00:47  | git push                       | Runner → GitHub
00:48  | gh pr create                   | GitHub API
00:50  | 工作流完成                     | GitHub Actions
```

---

## 🎯 实际执行示例

假设你提交了这个 task.md：

```markdown
# 创建登录组件

创建 src/components/Login.jsx 文件
```

### 执行追踪

**Step 1-3**: 环境准备
```bash
# GitHub Actions Runner
/home/runner/work/remoteTest/remoteTest$ ls
.github/  task.md  package.json  src/

/home/runner/work/remoteTest/remoteTest$ cd .github/scripts/openai
/home/runner/work/.../openai$ npm install
added 52 packages
```

**Step 4**: 执行脚本
```bash
/home/runner/work/.../openai$ node execute-task.js

====================================
🤖 OpenAI Codex Task Executor
====================================

📋 Reading task.md...
✅ Task loaded

🔍 Analyzing project structure...
✅ Project context loaded

🤔 Analyzing task and generating plan...
✅ Plan generated

📝 Plan: 1 file(s) to process
1. create: src/components/Login.jsx

📝 Generating code for src/components/Login.jsx...
✅ Using content from plan

📁 Executing 1 file operations...
1. ✅ Created: src/components/Login.jsx
✅ All file operations completed!

====================================
✅ Task execution completed!
====================================
```

**Step 5-7**: 提交和 PR
```bash
/home/runner/work/remoteTest/remoteTest$ git status
Changes not staged for commit:
  modified:   src/components/Login.jsx

/home/runner/work/remoteTest/remoteTest$ git add .
/home/runner/work/remoteTest/remoteTest$ git commit -m "..."
[feature/login abc123] 🤖 Implement: 创建登录组件

/home/runner/work/remoteTest/remoteTest$ git push
/home/runner/work/remoteTest/remoteTest$ gh pr create
✓ Created pull request #42
```

---

## 🔧 调试技巧

### 1. 查看 workflow 日志

```
GitHub 仓库 → Actions 标签 → 选择运行记录 → 展开各个 step
```

### 2. 在脚本中添加调试输出

```javascript
// execute-task.js
console.log('📍 Current directory:', __dirname);
console.log('📍 Project root:', PROJECT_ROOT);
console.log('📍 Task path:', taskPath);
console.log('📋 Task content:', taskContent);
```

### 3. 在 workflow 中添加调试

```yaml
- name: Debug info
  run: |
    echo "Current directory: $(pwd)"
    echo "Files in current directory:"
    ls -la
    echo "Environment variables:"
    env | grep -i task
```

---

## 💡 最佳实践

### 1. 脚本文件使用相对路径

```javascript
// ✅ 好的做法
const PROJECT_ROOT = path.join(__dirname, '../../..');
const taskPath = path.join(PROJECT_ROOT, 'task.md');

// ❌ 不好的做法
const taskPath = '/home/runner/work/remoteTest/remoteTest/task.md';
```

### 2. 工作目录设置

```yaml
# ✅ 好的做法：明确指定工作目录
- name: Install dependencies
  working-directory: .github/scripts/openai
  run: npm install

# ❌ 不好的做法：手动 cd
- name: Install dependencies
  run: |
    cd .github/scripts/openai
    npm install
```

### 3. 错误处理

```javascript
// execute-task.js
try {
  const taskContent = fs.readFileSync(taskPath, 'utf8');
} catch (error) {
  console.error('❌ Error reading task.md:', error);
  process.exit(1);  // 让 workflow 失败
}
```

---

## 📝 总结

### Workflows vs Scripts 的职责

| 文件类型 | 职责 | 语言 | 示例 |
|---------|------|------|------|
| **Workflows** (YAML) | 定义**何时**、**在哪**执行 | YAML | 触发条件、环境配置、步骤编排 |
| **Scripts** (JS/Python) | 定义**如何**执行具体逻辑 | 编程语言 | API 调用、文件操作、业务逻辑 |

### 执行顺序

```
1. GitHub 检测触发条件 (on:)
2. 创建 Runner 虚拟机
3. 按顺序执行 steps:
   a. 环境准备 (checkout, setup)
   b. 安装依赖 (npm install)
   c. 调用脚本 (node script.js)
   d. 后处理 (commit, PR)
4. 清理 Runner，结束
```

### 关键点

- ✅ Workflow 是**编排器**，Scripts 是**执行者**
- ✅ 通过 `working-directory` 控制执行位置
- ✅ 通过 `env:` 传递数据给脚本
- ✅ 脚本内部使用相对路径访问项目文件
- ✅ 每个 step 相互独立，通过输出变量通信

---

<sub>📖 理解执行流程，调试更轻松</sub>
