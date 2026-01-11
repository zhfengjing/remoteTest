# 🔐 GitHub Secrets 配置指南

## 概述

GitHub Actions 中使用的敏感变量（API Keys, Tokens）需要通过 **GitHub Secrets** 安全存储。

## 两种变量类型

### 🤖 自动提供的变量

| 变量名 | 说明 | 配置需求 |
|-------|------|---------|
| `GITHUB_TOKEN` | GitHub Actions 自动生成的临时令牌 | ❌ 无需配置 |
| `GITHUB_ACTOR` | 触发 workflow 的用户名 | ❌ 无需配置 |
| `GITHUB_REPOSITORY` | 仓库名称 | ❌ 无需配置 |

### 🔑 手动配置的变量

| 变量名 | 说明 | 配置需求 |
|-------|------|---------|
| `OPENAI_API_KEY` | OpenAI API 密钥 | ✅ 必须手动配置 |
| `ANTHROPIC_API_KEY` | Anthropic/Claude API 密钥 | ✅ 必须手动配置 |
| 其他自定义变量 | 如数据库密码、第三方 API Key | ✅ 必须手动配置 |

---

## 📋 配置步骤详解

### Step 1: 获取 OpenAI API Key

#### 1.1 访问 OpenAI 平台
```
https://platform.openai.com/api-keys
```

#### 1.2 登录你的 OpenAI 账号
- 如果没有账号，需要先注册

#### 1.3 创建 API Key
1. 点击 **"Create new secret key"**
2. 给 Key 起个名字（例如：`github-actions-key`）
3. 点击 **"Create secret key"**
4. **⚠️ 立即复制并保存** - 只会显示一次！

```
示例格式:
sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

---

### Step 2: 在 GitHub 仓库中配置 Secret

#### 2.1 打开仓库设置

```
1. 访问你的 GitHub 仓库
   https://github.com/你的用户名/remoteTest

2. 点击顶部的 "Settings" 标签
```

![](https://docs.github.com/assets/cb-28266/images/help/repository/repo-actions-settings.png)

#### 2.2 进入 Secrets 配置页面

```
3. 左侧菜单找到: Security → Secrets and variables → Actions
   或直接访问: https://github.com/你的用户名/remoteTest/settings/secrets/actions
```

#### 2.3 添加新的 Secret

```
4. 点击 "New repository secret" 按钮
```

![添加 Secret 按钮位置]

#### 2.4 填写 Secret 信息

```
Name: OPENAI_API_KEY
      ↑ 必须与 workflow 中使用的名称完全一致

Secret: sk-proj-xxxxxx...
        ↑ 粘贴你在 Step 1 复制的 API Key

5. 点击 "Add secret" 保存
```

#### 2.5 验证配置成功

配置完成后，你会看到：

```
Repository secrets
┌────────────────────────────────────────┐
│ Name              │ Updated            │
├───────────────────┼───────────────────┤
│ OPENAI_API_KEY    │ 2 minutes ago     │
│                   │ [Update] [Remove] │
└───────────────────┴───────────────────┘
```

**⚠️ 注意**: Secret 的值添加后无法查看，只能更新或删除。

---

## 🔍 在 Workflow 中使用 Secrets

### 使用方式

```yaml
# .github/workflows/openai-codex-task.yml

jobs:
  execute-task:
    steps:
      - name: Execute task
        env:
          # 自动提供 - 无需配置
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}

          # 手动配置 - 从仓库 Secrets 读取
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        run: |
          node execute-task.js
```

### 在脚本中访问

```javascript
// .github/scripts/openai/execute-task.js

// 读取环境变量
const openaiKey = process.env.OPENAI_API_KEY;
const githubToken = process.env.GITHUB_TOKEN;

// 使用 API Key
const openai = new OpenAI({
  apiKey: openaiKey
});
```

---

## 🎯 完整配置清单

### 对于 OpenAI Codex 工作流

需要配置的 Secrets：

| Secret 名称 | 获取位置 | 是否必需 |
|------------|---------|---------|
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | ✅ 必需 |
| `GITHUB_TOKEN` | GitHub Actions 自动提供 | ✅ 自动 |

### 对于 Claude Code 工作流

需要配置的 Secrets：

| Secret 名称 | 获取位置 | 是否必需 |
|------------|---------|---------|
| `ANTHROPIC_API_KEY` | https://console.anthropic.com | ✅ 必需 |
| `GITHUB_TOKEN` | GitHub Actions 自动提供 | ✅ 自动 |

---

## 🛡️ 安全最佳实践

### ✅ 应该做的

1. **定期轮换 API Keys**
   - 建议每 3-6 个月更换一次

2. **使用最小权限原则**
   - API Key 只给予必要的权限

3. **监控 API 使用量**
   - 定期检查 API 调用次数和费用

4. **不要在代码中硬编码**
   ```javascript
   // ❌ 错误做法
   const apiKey = 'sk-proj-xxxxxx';

   // ✅ 正确做法
   const apiKey = process.env.OPENAI_API_KEY;
   ```

5. **不要提交 .env 文件**
   ```bash
   # 添加到 .gitignore
   echo ".env" >> .gitignore
   ```

### ❌ 不应该做的

1. ❌ 不要在 commit 历史中暴露 API Keys
2. ❌ 不要在 PR 描述或 issue 中粘贴 API Keys
3. ❌ 不要在公开的日志中打印 API Keys
4. ❌ 不要与他人共享 API Keys
5. ❌ 不要在多个项目使用同一个 API Key

---

## 🔧 故障排除

### Q1: Workflow 报错 "OPENAI_API_KEY is not set"

**原因**: Secret 未配置或名称不匹配

**解决方案**:
```bash
1. 检查 Secret 名称是否为 OPENAI_API_KEY（区分大小写）
2. 确认在正确的仓库中配置了 Secret
3. 重新运行 workflow
```

### Q2: API 调用返回 401 Unauthorized

**原因**: API Key 无效或过期

**解决方案**:
```bash
1. 访问 https://platform.openai.com/api-keys
2. 检查 API Key 是否有效
3. 生成新的 API Key
4. 更新 GitHub Secret
```

### Q3: 无法访问 GitHub Token

**原因**: Workflow 权限设置不正确

**解决方案**:
```yaml
# 在 workflow 中添加权限声明
jobs:
  execute-task:
    permissions:
      contents: write        # 允许推送代码
      pull-requests: write   # 允许创建 PR
```

或在仓库设置中启用:
```
Settings → Actions → General → Workflow permissions
✅ Read and write permissions
```

### Q4: Secret 更新后仍使用旧值

**原因**: Workflow 可能使用了缓存

**解决方案**:
```bash
1. 取消正在运行的 workflow
2. 重新触发 workflow（重新 push）
```

---

## 📸 配置截图指南

### 1. 打开 Settings

```
仓库首页 → Settings（需要仓库管理员权限）
```

### 2. 导航到 Secrets

```
左侧菜单:
Security
  ├── Code security and analysis
  ├── Deploy keys
  ├── Secrets and variables
  │   ├── Actions ← 点击这里
  │   ├── Codespaces
  │   └── Dependabot
  └── ...
```

### 3. 添加 Secret

```
页面右上角: [New repository secret] 按钮
```

### 4. 填写表单

```
┌─────────────────────────────────────────┐
│ Name *                                  │
│ ┌─────────────────────────────────────┐ │
│ │ OPENAI_API_KEY                      │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Secret *                                │
│ ┌─────────────────────────────────────┐ │
│ │ sk-proj-xxx...                      │ │
│ │                                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│          [Cancel]  [Add secret]         │
└─────────────────────────────────────────┘
```

---

## 🎓 高级用法

### 使用 Organization Secrets（组织级别）

如果你有多个仓库需要使用相同的 API Key：

```
1. 访问组织设置
   https://github.com/organizations/你的组织/settings/secrets/actions

2. 创建 Organization secret

3. 选择哪些仓库可以访问此 Secret
```

### 使用 Environment Secrets（环境级别）

为不同环境配置不同的 API Keys：

```yaml
jobs:
  deploy:
    environment: production  # 使用 production 环境的 Secrets
    steps:
      - name: Deploy
        env:
          API_KEY: ${{ secrets.PROD_API_KEY }}
```

---

## 📝 快速配置命令

### 使用 GitHub CLI 配置 Secret

如果你安装了 `gh` CLI 工具：

```bash
# 交互式添加 Secret
gh secret set OPENAI_API_KEY

# 从文件读取
echo "sk-proj-xxx..." | gh secret set OPENAI_API_KEY

# 列出所有 Secrets
gh secret list

# 删除 Secret
gh secret remove OPENAI_API_KEY
```

---

## 🔗 相关资源

- [GitHub Secrets 官方文档](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OpenAI API Keys 管理](https://platform.openai.com/api-keys)
- [Anthropic API Keys 管理](https://console.anthropic.com)
- [GitHub Actions 安全最佳实践](https://docs.github.com/en/actions/security-guides/security-hardening-for-github-actions)

---

## ✅ 配置检查清单

完成配置后，请检查：

- [ ] 已从 OpenAI 平台获取 API Key
- [ ] 已在 GitHub 仓库中创建 `OPENAI_API_KEY` Secret
- [ ] Secret 名称与 workflow 中使用的名称完全一致
- [ ] Workflow 权限设置为 "Read and write permissions"
- [ ] 已测试运行 workflow，无错误

---

<sub>🔐 安全存储敏感信息，保护你的 API Keys</sub>
