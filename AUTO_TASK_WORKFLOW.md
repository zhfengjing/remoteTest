# 🤖 Claude 自动化任务执行工作流

## 📖 概述

这是一个完全自动化的开发工作流，实现了：

```
Claude (创建任务计划)
    ↓
提交 task.md 到 GitHub
    ↓
GitHub Actions 触发
    ↓
Claude Code (执行任务)
    ↓
Claude Agents (代码审查)
    ↓
自动创建 Pull Request
```

## 🚀 工作流程

### 1️⃣ Claude 创建任务计划

在本地使用 Claude 创建任务计划：

```bash
# 启动 Claude
claude

# 让 Claude 创建任务
请帮我创建一个 task.md 文件，任务是：添加用户注册功能
```

Claude 会生成 `task.md` 文件，包含：
- 任务描述
- 具体要求
- 技术栈
- 注意事项

### 2️⃣ 提交 task.md 到 GitHub

```bash
# 创建新分支（不要在 main 分支）
git checkout -b feature/user-registration

# 添加 task.md
git add task.md
git commit -m "Add task: user registration"

# 推送到 GitHub
git push origin feature/user-registration
```

**重要**: 必须在非 `main` 分支提交 task.md！

### 3️⃣ 自动执行

推送后，GitHub Actions 自动：

1. **执行任务**
   - 使用 Claude Code CLI (Sonnet 4.5)
   - 在 cloud 模式下执行
   - 自动生成代码

2. **代码审查**
   - 使用 `.claude/agents/code-reviewer` 审查代码质量
   - 使用 `.claude/agents/security-code-auditor` 审查安全问题
   - 生成详细的审查报告

3. **创建 PR**
   - 自动提交代码变更
   - 附带审查报告
   - 创建 Pull Request 到 main 分支

### 4️⃣ 人工审核

在 GitHub 上：
1. 查看 Pull Requests 标签页
2. 审阅代码变更
3. 查看 Claude 的审查报告
4. 决定合并或请求修改

## 📋 task.md 格式示例

```markdown
# 任务标题

## 任务描述
简要描述要完成的任务

## 具体要求
1. 第一个要求
2. 第二个要求
3. ...

## 技术栈
- 使用的技术和工具

## 注意事项
- 特殊要求
- 安全考虑
- 性能要求
```

参考 `task.md.example` 文件查看完整示例。

## ⚙️ 配置要求

### 必需的配置

1. **Anthropic API Key**
   ```
   仓库 → Settings → Secrets and variables → Actions
   创建 secret: ANTHROPIC_API_KEY
   ```

2. **Workflow 权限**
   ```
   仓库 → Settings → Actions → General → Workflow permissions
   选择: Read and write permissions
   勾选: Allow GitHub Actions to create and approve pull requests
   ```

3. **Claude Agents 配置**
   - 确保 `.claude/agents/` 目录存在
   - 包含 `code-reviewer` 和 `security-code-auditor` 配置

### 创建 Claude Agents

在本地 Claude Code 中运行：

```bash
claude
/agents
```

创建以下 agents：
- `code-reviewer` - 代码质量审查
- `security-code-auditor` - 安全审计

## 🎯 使用场景

### ✅ 适合的任务

- 添加新功能（组件、API、工具函数）
- 重构现有代码
- 修复 bug
- 编写测试
- 更新文档

### ❌ 不适合的任务

- 简单的文本修改（直接手动做更快）
- 需要人工判断的复杂决策
- 涉及外部系统配置的任务

## 📁 工作流文件结构

```
.github/
├── workflows/
│   ├── auto-task-execution.yml    # 主工作流
│   └── code-review.yml            # 代码审查工作流（可选）
└── scripts/
    ├── claude-review.js           # 审查脚本
    └── package.json

.claude/
└── agents/
    ├── code-reviewer/             # 代码审查 agent
    └── security-code-auditor/     # 安全审计 agent

task.md                            # 任务文件（你创建的）
task.md.example                    # 示例模板
```

## 🔧 自定义配置

### 修改 Claude 模型

编辑 `.github/workflows/auto-task-execution.yml`：

```yaml
# 使用更强大的模型
echo "$TASK_CONTENT" | claude --yes --model opus

# 或使用更快的模型
echo "$TASK_CONTENT" | claude --yes --model haiku
```

### 调整审查标准

修改 `.claude/agents/` 目录下的 agent 配置文件。

### 更改触发条件

编辑工作流的 `on` 部分：

```yaml
on:
  push:
    paths:
      - 'task.md'
      - 'tasks/*.md'  # 支持多个任务文件
```

## 🐛 常见问题

### Q: Workflow 没有触发？

**A**: 检查：
1. 是否在非 main 分支提交
2. 文件名是否正确（`task.md`）
3. Workflow 权限是否配置正确

### Q: Claude Code 执行失败？

**A**: 检查：
1. `ANTHROPIC_API_KEY` 是否配置
2. API Key 是否有效
3. 是否有足够的 API 额度

### Q: 没有创建 PR？

**A**: 检查：
1. 是否有代码变更
2. GitHub Actions 是否有创建 PR 的权限
3. 查看 workflow 日志

### Q: 审查报告为空？

**A**: 检查：
1. `.claude/agents/` 目录是否存在
2. agent 配置是否正确
3. 查看 workflow 日志中的审查步骤

## 📊 示例工作流日志

成功执行后，你会看到：

```
====================================
🚀 Starting Claude Code execution...
====================================
✅ Task execution completed by Claude Code

====================================
🔍 Starting Code Review...
====================================
✅ Code review completed

====================================
📝 Creating Pull Request...
====================================
✅ Pull Request created!
```

## 🔗 相关资源

- [Claude Code 文档](https://code.claude.com/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [Anthropic API 文档](https://docs.anthropic.com/)

## 💡 最佳实践

1. **任务描述要清晰**
   - 明确说明要做什么
   - 列出具体要求
   - 指定技术栈

2. **小步快跑**
   - 每个 task.md 只做一件事
   - 避免过于复杂的任务

3. **审查报告很重要**
   - 认真阅读 Claude 的审查报告
   - 不要盲目合并

4. **保持 agents 更新**
   - 定期更新审查标准
   - 根据项目需求调整

## 🎉 快速开始

```bash
# 1. 创建任务分支
git checkout -b feature/new-task

# 2. 复制示例模板
cp task.md.example task.md

# 3. 编辑任务内容
vim task.md

# 4. 提交并推送
git add task.md
git commit -m "Add task: [任务名称]"
git push origin feature/new-task

# 5. 等待自动执行，然后查看 PR！
```

---

<sub>🤖 自动化让开发更高效 | Made with Claude</sub>
