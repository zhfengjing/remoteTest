# 🎬 GitHub Actions 执行流程可视化

## 简化版流程图

```
用户操作                GitHub                  Runner 虚拟机              脚本执行
   │                      │                          │                      │
   │ git push task.md     │                          │                      │
   ├──────────────────────>                          │                      │
   │                      │                          │                      │
   │                      │ 检测触发条件              │                      │
   │                      │ (on: push: paths:)       │                      │
   │                      │                          │                      │
   │                      │ 启动 Runner              │                      │
   │                      ├─────────────────────────>                       │
   │                      │                          │                      │
   │                      │                    创建 Ubuntu 容器              │
   │                      │                          │                      │
   │                      │                   Step 1: Checkout              │
   │                      │                    下载代码到 Runner             │
   │                      │                          │                      │
   │                      │                   Step 2: Setup Node.js         │
   │                      │                    安装 Node 20                 │
   │                      │                          │                      │
   │                      │                   Step 3: npm install           │
   │                      │                    读取 package.json            │
   │                      │                    安装依赖到 node_modules/      │
   │                      │                          │                      │
   │                      │                   Step 4: 执行脚本              │
   │                      │                          │                      │
   │                      │                   node execute-task.js          │
   │                      │                          ├─────────────────────>│
   │                      │                          │                      │
   │                      │                          │            读取 task.md
   │                      │                          │            调用 OpenAI API
   │                      │                          │            生成代码文件
   │                      │                          │            写入文件系统
   │                      │                          │                      │
   │                      │                          │<─────────────────────┤
   │                      │                    脚本执行完成                  │
   │                      │                          │                      │
   │                      │                   Step 5: git commit            │
   │                      │                          │                      │
   │                      │                   Step 6: git push              │
   │                      │<─────────────────────────┤                      │
   │                      │  推送新代码                │                      │
   │                      │                          │                      │
   │                      │                   Step 7: gh pr create          │
   │                      │<─────────────────────────┤                      │
   │  收到 PR 通知         │  创建 PR                  │                      │
   │<─────────────────────┤                          │                      │
   │                      │                          │                      │
   │                      │                    清理 Runner                  │
   │                      │                    关闭容器                      │
```

## 详细文件调用关系

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. 触发阶段                                                          │
└─────────────────────────────────────────────────────────────────────┘

  用户提交
     │
     ├─> task.md (被修改的文件)
     │
     └─> git push origin feature/xxx
              │
              v
        GitHub 服务器检测
              │
              v
     扫描 .github/workflows/*.yml
              │
              v
     找到匹配的 openai-codex-task.yml
              │
              └─> 读取触发条件:
                  on:
                    push:
                      paths: ['task.md']
                      branches-ignore: ['main']

┌─────────────────────────────────────────────────────────────────────┐
│ 2. 准备阶段 (在 GitHub Actions Runner 上)                           │
└─────────────────────────────────────────────────────────────────────┘

  创建虚拟机 (Ubuntu)
     │
     v
  执行 Checkout
     │
     ├─> 下载整个仓库到 /home/runner/work/remoteTest/remoteTest/
     │
     └─> 文件系统:
         /home/runner/work/remoteTest/remoteTest/
         ├── .github/
         │   ├── workflows/
         │   │   └── openai-codex-task.yml  ← 正在执行的 workflow
         │   └── scripts/
         │       └── openai/
         │           ├── package.json        ← 待安装依赖
         │           └── execute-task.js     ← 待执行脚本
         ├── task.md                         ← 触发文件
         └── ...

┌─────────────────────────────────────────────────────────────────────┐
│ 3. 依赖安装阶段                                                      │
└─────────────────────────────────────────────────────────────────────┘

  Workflow Step:
  ┌──────────────────────────────────────────────────────────────┐
  │ - name: Install dependencies                                 │
  │   working-directory: .github/scripts/openai                  │
  │   run: npm install                                           │
  └──────────────────────────────────────────────────────────────┘
     │
     v
  实际执行命令:
     cd /home/runner/work/remoteTest/remoteTest/.github/scripts/openai
     npm install
     │
     v
  读取文件:
     .github/scripts/openai/package.json
     {
       "dependencies": {
         "openai": "^4.67.3"
       }
     }
     │
     v
  创建文件:
     .github/scripts/openai/node_modules/
     ├── openai/
     │   ├── index.js
     │   └── ...
     └── ...

┌─────────────────────────────────────────────────────────────────────┐
│ 4. 脚本执行阶段                                                      │
└─────────────────────────────────────────────────────────────────────┘

  Workflow Step:
  ┌──────────────────────────────────────────────────────────────┐
  │ - name: Execute task with OpenAI Codex                       │
  │   env:                                                       │
  │     OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}           │
  │   working-directory: .github/scripts/openai                  │
  │   run: node execute-task.js                                  │
  └──────────────────────────────────────────────────────────────┘
     │
     v
  设置环境变量:
     export OPENAI_API_KEY="sk-xxx..."
     │
     v
  切换目录并执行:
     cd .github/scripts/openai
     node execute-task.js
     ▼
     ┌────────────────────────────────────────────────────────────┐
     │ execute-task.js 内部执行流程:                               │
     ├────────────────────────────────────────────────────────────┤
     │                                                            │
     │ 1. const apiKey = process.env.OPENAI_API_KEY              │
     │    ↓                                                       │
     │    读取环境变量 (从 workflow 传入)                         │
     │                                                            │
     │ 2. const PROJECT_ROOT = path.join(__dirname, '../../..')  │
     │    ↓                                                       │
     │    计算项目根目录:                                         │
     │    __dirname = .github/scripts/openai                     │
     │    PROJECT_ROOT = /home/runner/work/remoteTest/remoteTest │
     │                                                            │
     │ 3. const taskPath = path.join(PROJECT_ROOT, 'task.md')    │
     │    const taskContent = fs.readFileSync(taskPath)          │
     │    ↓                                                       │
     │    读取文件:                                               │
     │    /home/runner/work/remoteTest/remoteTest/task.md        │
     │                                                            │
     │ 4. const response = await openai.chat.completions.create()│
     │    ↓                                                       │
     │    调用 OpenAI API (网络请求)                              │
     │    发送任务内容，接收生成的代码                            │
     │                                                            │
     │ 5. fs.writeFileSync(filePath, codeContent)                │
     │    ↓                                                       │
     │    写入文件:                                               │
     │    /home/runner/work/remoteTest/remoteTest/               │
     │      src/components/Login.jsx                             │
     │                                                            │
     │ 6. return / process.exit(0)                               │
     │    ↓                                                       │
     │    脚本执行完成，返回到 workflow                           │
     └────────────────────────────────────────────────────────────┘
     │
     v
  文件系统变化:
     /home/runner/work/remoteTest/remoteTest/
     ├── src/
     │   └── components/
     │       └── Login.jsx  ← 新创建的文件
     └── task.md

┌─────────────────────────────────────────────────────────────────────┐
│ 5. 提交推送阶段                                                      │
└─────────────────────────────────────────────────────────────────────┘

  Workflow Steps:
  ┌──────────────────────────────────────────────────────────────┐
  │ - name: Commit and push changes                              │
  │   run: |                                                     │
  │     git add .                                                │
  │     git commit -m "..."                                      │
  │     git push origin ${{ env.CURRENT_BRANCH }}               │
  └──────────────────────────────────────────────────────────────┘
     │
     v
  执行 Git 命令:
     git add src/components/Login.jsx
     git commit -m "🤖 Implement: ..."
     git push origin feature/xxx
     │
     v
  代码推送到 GitHub 仓库

┌─────────────────────────────────────────────────────────────────────┐
│ 6. PR 创建阶段                                                       │
└─────────────────────────────────────────────────────────────────────┘

  Workflow Step:
  ┌──────────────────────────────────────────────────────────────┐
  │ - name: Create Pull Request                                  │
  │   env:                                                       │
  │     GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}               │
  │   run: |                                                     │
  │     gh pr create --base main --head feature/xxx ...          │
  └──────────────────────────────────────────────────────────────┘
     │
     v
  调用 GitHub CLI:
     gh pr create
     │
     v
  GitHub CLI 内部流程:
     1. 读取 GITHUB_TOKEN 环境变量
     2. 调用 GitHub REST API
     3. 创建 Pull Request
     │
     v
  在 GitHub 网页上显示:
     Pull Request #123
     Title: 🤖 [Codex] 创建登录组件
     From: feature/xxx → main
```

## 环境变量传递路径

```
GitHub Secrets (仓库设置)
  │
  │ OPENAI_API_KEY = "sk-xxx..."
  │
  v
Workflow YAML (在 Runner 上)
  │
  │ env:
  │   OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
  │
  v
Shell 环境变量 (在 Runner 上)
  │
  │ export OPENAI_API_KEY="sk-xxx..."
  │
  v
Node.js 进程 (脚本执行)
  │
  │ const apiKey = process.env.OPENAI_API_KEY
  │
  v
OpenAI SDK (API 调用)
  │
  │ new OpenAI({ apiKey: apiKey })
  │
  v
OpenAI API 服务器
```

## Step 之间的数据流

```
Step 1: Read task
  ↓
  TASK_TITLE=$(head -n 1 task.md)
  echo "TASK_TITLE=$TASK_TITLE" >> $GITHUB_ENV
  ↓
写入文件: /home/runner/work/_temp/_runner_file_commands/set_env_xxx
  ↓
GitHub Actions 读取并设置为环境变量
  ↓
后续 steps 可以通过 ${{ env.TASK_TITLE }} 访问
  ↓
Step 2: Use task
  ↓
  echo "Task title is: ${{ env.TASK_TITLE }}"
```

## 条件执行流程

```
Step: Check for changes
  │
  ├─> git diff --staged --quiet
  │     │
  │     ├─ 有变更 (exit code 1)
  │     │   └─> echo "has_changes=true" >> $GITHUB_OUTPUT
  │     │
  │     └─ 无变更 (exit code 0)
  │         └─> echo "has_changes=false" >> $GITHUB_OUTPUT
  │
  v
Step: Commit changes
  │
  ├─> if: steps.check-changes.outputs.has_changes == 'true'
  │     │
  │     ├─ true: 执行此 step
  │     │   └─> git commit && git push
  │     │
  │     └─ false: 跳过此 step
  │           └─> (不执行任何操作)
  │
  v
Step: Create PR
  │
  └─> if: steps.check-changes.outputs.has_changes == 'true'
        │
        ├─ true: gh pr create
        └─ false: 跳过
```

## 文件路径解析示例

假设脚本位于: `.github/scripts/openai/execute-task.js`

```javascript
// 当前文件目录
__dirname
// = /home/runner/work/remoteTest/remoteTest/.github/scripts/openai

// 计算项目根目录
const PROJECT_ROOT = path.join(__dirname, '../../..')
// = /home/runner/work/remoteTest/remoteTest

// 读取 task.md
const taskPath = path.join(PROJECT_ROOT, 'task.md')
// = /home/runner/work/remoteTest/remoteTest/task.md

// 写入生成的文件
const outputPath = path.join(PROJECT_ROOT, 'src/components/Login.jsx')
// = /home/runner/work/remoteTest/remoteTest/src/components/Login.jsx
```

## 快速参考

### Workflow 文件职责
- ✅ 定义触发条件 (`on:`)
- ✅ 配置执行环境 (`runs-on:`, `setup-*`)
- ✅ 编排执行步骤 (`steps:`)
- ✅ 传递环境变量和秘密 (`env:`, `secrets`)
- ✅ 控制执行流程 (`if:`, `needs:`)

### Script 文件职责
- ✅ 实现具体业务逻辑
- ✅ 调用外部 API
- ✅ 读写文件
- ✅ 数据处理和转换
- ✅ 错误处理

### 通信方式
- Workflow → Script: 环境变量 (`env:`)
- Script → Workflow: 退出代码 (`process.exit()`)、标准输出
- Step → Step: `$GITHUB_ENV`, `$GITHUB_OUTPUT`
- GitHub → Workflow: `secrets.*`, `github.*`

---

<sub>📊 理解流程，掌握 GitHub Actions</sub>
