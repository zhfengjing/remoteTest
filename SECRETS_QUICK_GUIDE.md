# 🔑 Secrets 配置快速指南

## 两个变量对比

```
┌──────────────────┬────────────────────┬──────────────────────┐
│    变量名        │   GITHUB_TOKEN     │  OPENAI_API_KEY      │
├──────────────────┼────────────────────┼──────────────────────┤
│ 来源             │ GitHub 自动提供     │ 你手动配置           │
│ 配置需求         │ ❌ 无需配置         │ ✅ 必须配置          │
│ 生命周期         │ workflow 运行时生成 │ 永久有效             │
│ 权限             │ 仓库相关操作        │ OpenAI API 调用      │
│ 安全性           │ 自动过期           │ 需要手动保护          │
└──────────────────┴────────────────────┴──────────────────────┘
```

---

## 🚀 5 步配置 OPENAI_API_KEY

### Step 1: 获取 API Key
```
访问: https://platform.openai.com/api-keys
点击: Create new secret key
复制: sk-proj-xxxxxx...
```

### Step 2: 打开仓库设置
```
GitHub 仓库 → Settings
```

### Step 3: 进入 Secrets 页面
```
左侧菜单: Security → Secrets and variables → Actions
```

### Step 4: 添加 Secret
```
点击: New repository secret

Name:   OPENAI_API_KEY
Secret: sk-proj-xxxxxx... (粘贴你的 API Key)

点击: Add secret
```

### Step 5: 验证配置
```
你会在列表中看到:

Repository secrets
├── OPENAI_API_KEY  ✅
```

---

## 📋 配置位置图示

```
你的仓库
│
├── Settings (设置)
│   │
│   └── Security (安全)
│       │
│       └── Secrets and variables
│           │
│           └── Actions ← 在这里配置！
│               │
│               ├── Repository secrets
│               │   │
│               │   └── [New repository secret] ← 点击这里
│               │       │
│               │       ├── Name: OPENAI_API_KEY
│               │       └── Secret: sk-proj-xxx...
│               │
│               └── (配置完成后)
│                   │
│                   └── OPENAI_API_KEY ✅
│
└── .github/workflows/
    │
    └── openai-codex-task.yml
        │
        └── env:
            ├── GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}     ← 自动可用
            └── OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }} ← 读取你配置的
```

---

## 🔄 数据流向

```
OpenAI Platform                 GitHub Repository              GitHub Actions
     │                                │                              │
     │ 1. 创建 API Key                │                              │
     │    sk-proj-xxx...              │                              │
     │                                │                              │
     ├───────────────────────────────>│ 2. 手动配置到 Secrets        │
     │                                │    Settings → Secrets        │
     │                                │    OPENAI_API_KEY            │
     │                                │                              │
     │                                │ 3. Push 触发 workflow        │
     │                                ├─────────────────────────────>│
     │                                │                              │
     │                                │                        读取 Secrets
     │                                │                        ${{ secrets.OPENAI_API_KEY }}
     │                                │                              │
     │                                │                        设置环境变量
     │                                │                        env:
     │                                │                          OPENAI_API_KEY: xxx
     │                                │                              │
     │<───────────────────────────────┼──────────────────────────────┤
     │                                │                        调用 OpenAI API
     │  4. API 调用                   │                        with API Key
     │     验证 API Key               │                              │
     │     返回结果                   │                              │
```

---

## ⚠️ 常见错误

### 错误 1: 名称不匹配

```yaml
# ❌ 错误
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_KEY }}  # Secret 名称错误

# ✅ 正确
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

在 GitHub Secrets 中配置的名称必须是：`OPENAI_API_KEY`（完全一致）

### 错误 2: API Key 格式错误

```
❌ sk-xxx (太短，不完整)
❌ openai-key-12345 (错误格式)
✅ sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (正确格式)
```

### 错误 3: 在错误的地方配置

```
❌ User Settings → Developer settings → Personal access tokens
   (这是配置 GitHub Token 的地方，不是 OpenAI API Key)

✅ Repository → Settings → Secrets and variables → Actions
   (这才是配置 OpenAI API Key 的地方)
```

---

## 🎯 验证配置是否成功

### 方法 1: 查看 Secrets 列表

```
Settings → Secrets and variables → Actions

如果看到 OPENAI_API_KEY 在列表中 = 配置成功 ✅
```

### 方法 2: 运行 Workflow

```bash
# 1. 创建测试分支
git checkout -b test-openai

# 2. 创建 task.md
echo "# Test task" > task.md

# 3. 提交推送
git add task.md
git commit -m "Test OpenAI API"
git push origin test-openai

# 4. 查看 GitHub Actions 运行日志
# 如果成功调用 OpenAI API = 配置成功 ✅
# 如果报错 "API Key not set" = 配置失败 ❌
```

---

## 📊 GITHUB_TOKEN vs OPENAI_API_KEY

### GITHUB_TOKEN（自动）

```yaml
jobs:
  job1:
    steps:
      - name: Create PR
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # ← 自动存在
        run: gh pr create ...
```

**特点**:
- ✅ 无需任何配置
- ✅ 每次运行自动生成
- ✅ 拥有仓库操作权限
- ✅ workflow 结束自动失效

**用途**:
- 创建/更新 Pull Request
- 推送代码到仓库
- 添加 issue 评论
- 管理仓库标签

---

### OPENAI_API_KEY（手动）

```yaml
jobs:
  job1:
    steps:
      - name: Call OpenAI
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}  # ← 需要配置
        run: node script.js
```

**特点**:
- ⚠️ 必须手动配置
- ⚠️ 从 OpenAI 平台获取
- ⚠️ 需要妥善保管
- ⚠️ 使用会产生费用

**用途**:
- 调用 OpenAI GPT API
- 生成代码
- 文本处理
- 图像生成

---

## 🔐 安全提示

### ✅ 安全做法

```javascript
// 从环境变量读取
const apiKey = process.env.OPENAI_API_KEY;
```

```yaml
# 在 workflow 中使用 secrets
env:
  OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
```

### ❌ 危险做法

```javascript
// ❌ 千万不要这样做！
const apiKey = 'sk-proj-xxxxxx'; // 硬编码在代码中
```

```yaml
# ❌ 不要直接写在 workflow 中
env:
  OPENAI_API_KEY: sk-proj-xxxxxx
```

---

## 📞 需要帮助？

### 配置问题
- 查看详细指南: `SECRETS_CONFIGURATION_GUIDE.md`
- GitHub 官方文档: https://docs.github.com/en/actions/security-guides/encrypted-secrets

### API Key 问题
- OpenAI 平台: https://platform.openai.com/api-keys
- OpenAI 文档: https://platform.openai.com/docs

---

## ✅ 快速检查清单

配置前：
- [ ] 已注册 OpenAI 账号
- [ ] 已添加付款方式（如需使用付费 API）
- [ ] 已获取 API Key

配置后：
- [ ] Secret 名称为 `OPENAI_API_KEY`
- [ ] 已在仓库 Settings → Secrets 中添加
- [ ] 已测试 workflow 运行

---

<sub>🚀 正确配置 Secrets，顺利使用 GitHub Actions</sub>
