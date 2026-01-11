# 🤖 OpenAI Codex 自动化任务工作流

## 📖 概述

这是一个使用 **OpenAI Codex (GPT-4)** 的自动化开发工作流：

```
提交 task.md
    ↓
GitHub Actions 自动触发
    ↓
OpenAI Codex 分析任务
    ↓
自动生成并提交代码
    ↓
创建 Pull Request 到原分支
```

## 🚀 快速开始

### 1️⃣ 配置 OpenAI API Key

访问 https://platform.openai.com/api-keys 获取 API Key，然后在 GitHub 配置：

```
仓库 → Settings → Secrets and variables → Actions
创建 Secret: OPENAI_API_KEY
值: 你的 OpenAI API Key
```

### 2️⃣ 启用 Workflow 权限

```
仓库 → Settings → Actions → General → Workflow permissions
✅ Read and write permissions
✅ Allow GitHub Actions to create and approve pull requests
```

### 3️⃣ 创建任务并提交

```bash
# 1. 创建特性分支
git checkout -b feature/new-login

# 2. 创建 task.md
cat > task.md <<EOF
# 添加用户登录功能

## 要求
1. 创建登录表单组件
2. 实现身份验证逻辑
3. 添加错误处理
EOF

# 3. 提交并推送
git add task.md
git commit -m "Add task: user login"
git push origin feature/new-login
```

### 4️⃣ 自动执行

GitHub Actions 会自动：
1. ✅ 读取 task.md
2. ✅ 使用 GPT-4 生成代码
3. ✅ 提交代码到当前分支
4. ✅ 创建 PR 到 main 分支

## 📋 工作流程详解

### 触发条件

- 当 `task.md` 文件被推送时自动触发
- 必须在非 `main` 分支
- 每次更新 task.md 都会重新执行

### 执行步骤

1. **读取任务** - 解析 task.md 内容
2. **分析项目** - 获取项目结构和相关文件
3. **生成计划** - GPT-4 分析任务并制定实现计划
4. **生成代码** - 为每个文件生成完整代码
5. **创建文件** - 自动创建/更新文件
6. **提交推送** - 提交代码到当前分支
7. **创建 PR** - 自动创建 Pull Request

### 代码生成逻辑

使用两步式生成：

**第一步：生成计划**
```javascript
{
  "files": [
    {
      "path": "src/components/Login.jsx",
      "action": "create"
    }
  ]
}
```

**第二步：生成代码**
- 为每个文件生成完整、可运行的代码
- 包含错误处理和最佳实践
- 遵循项目现有的代码风格

## 📝 task.md 编写指南

### 基本格式

```markdown
# 任务标题

## 任务描述
简要说明要完成什么

## 具体要求
1. 第一个要求
2. 第二个要求
3. ...

## 技术栈
- React
- TypeScript
- ...

## 注意事项
- 特殊要求
- 限制条件
```

### 最佳实践

#### ✅ 好的任务描述

```markdown
# 添加用户注册功能

## 要求
1. 创建 src/components/RegisterForm.jsx 组件
2. 包含字段：用户名、邮箱、密码、确认密码
3. 实现表单验证：
   - 邮箱格式验证
   - 密码强度检查（至少8位，包含数字和字母）
   - 确认密码匹配检查
4. 调用 API: POST /api/register
5. 注册成功后跳转到登录页

## 技术要求
- 使用 React Hooks (useState, useEffect)
- 使用 Axios 发送请求
- 使用 React Router 进行跳转
```

#### ❌ 不好的任务描述

```markdown
# 做一个注册功能

搞定就行
```

### 任务复杂度建议

- ✅ **简单任务**（1-3个文件）- 效果最好
- ⚠️ **中等任务**（4-6个文件）- 可能需要人工调整
- ❌ **复杂任务**（7+文件）- 建议拆分成多个小任务

## 🎯 使用场景

### 适合的任务类型

1. **创建新组件**
   ```markdown
   创建一个用户头像组件，支持自定义大小和圆角
   ```

2. **添加工具函数**
   ```markdown
   创建日期格式化工具函数，支持多种格式输出
   ```

3. **实现 API 调用**
   ```markdown
   创建用户服务模块，包含登录、注册、获取用户信息等方法
   ```

4. **添加页面**
   ```markdown
   创建用户设置页面，包含个人信息编辑和密码修改功能
   ```

### 不适合的任务类型

- ❌ 需要复杂业务逻辑判断的任务
- ❌ 需要连接真实数据库的任务
- ❌ 需要深入理解现有复杂代码的任务
- ❌ 需要第三方服务配置的任务

## ⚙️ 配置选项

### 更换 OpenAI 模型

编辑 `.github/scripts/openai/execute-task.js`：

```javascript
// 使用 GPT-4 Turbo（推荐，性价比高）
model: 'gpt-4-turbo-preview'

// 使用 GPT-4（更强大但更贵）
model: 'gpt-4'

// 使用 GPT-3.5 Turbo（更便宜但效果稍差）
model: 'gpt-3.5-turbo'
```

### 调整代码生成参数

```javascript
// 降低 temperature 使输出更确定
temperature: 0.2  // 0-1，越低越确定

// 增加 max_tokens 生成更长的代码
max_tokens: 8000  // 默认 4096
```

### 自定义文件类型过滤

编辑工作流文件中的项目结构获取命令：

```bash
find . -type f -name "*.py" -o -name "*.go"  # 支持 Python/Go
```

## 📊 成本估算

使用 GPT-4 Turbo 的成本：

- **输入**: $0.01 / 1K tokens
- **输出**: $0.03 / 1K tokens

典型任务成本：
- 简单任务（1-2个文件）: ~$0.05-0.10
- 中等任务（3-5个文件）: ~$0.15-0.30
- 复杂任务（6+文件）: ~$0.40+

**建议**: 使用 `gpt-3.5-turbo` 可降低约 90% 成本。

## 🐛 故障排除

### Q: Workflow 没有触发？

**检查清单**:
1. ✅ 是否在非 main 分支？
2. ✅ 文件名是否为 `task.md`？
3. ✅ Workflow 文件是否在 main 分支？
4. ✅ Actions 是否启用？

### Q: OpenAI API 调用失败？

**可能原因**:
1. ❌ API Key 未配置或无效
2. ❌ API 额度不足
3. ❌ 网络问题（GitHub Actions 网络限制）

**解决方案**:
```bash
# 检查 API Key 余额
https://platform.openai.com/account/usage

# 验证 API Key
curl https://api.openai.com/v1/models \
  -H "Authorization: Bearer YOUR_API_KEY"
```

### Q: 生成的代码有错误？

**原因**: AI 生成的代码可能不完美

**解决方案**:
1. 在 task.md 中提供更详细的说明
2. 包含代码示例或参考
3. 明确指出技术栈和依赖
4. 人工审查并修复

### Q: 没有创建 PR？

**检查**:
1. ✅ 是否有代码变更？
2. ✅ Workflow 权限是否正确？
3. ✅ PR 是否已存在？（会更新现有 PR）

## 🔄 与 Claude 工作流对比

| 特性 | OpenAI Codex | Claude Code |
|------|-------------|-------------|
| **执行方式** | API 调用 | CLI 工具 |
| **代码生成** | 基于提示生成 | 自主执行 |
| **上下文理解** | 需要提供 | 自动分析 |
| **成本** | 按使用付费 | 按使用付费 |
| **适用场景** | 简单到中等任务 | 中等到复杂任务 |
| **准确性** | 需要详细说明 | 更智能理解 |

## 📁 文件结构

```
.github/
├── workflows/
│   ├── openai-codex-task.yml        # OpenAI 工作流
│   └── auto-task-execution.yml      # Claude 工作流
└── scripts/
    ├── openai/
    │   ├── execute-task.js          # OpenAI 执行脚本
    │   └── package.json
    └── (claude scripts...)

task.md                               # 任务文件
OPENAI_CODEX_WORKFLOW.md             # 本文档
```

## 🎉 完整示例

### 示例 1: 创建计数器组件

**task.md**:
```markdown
# 创建计数器组件

## 要求
1. 创建 src/components/Counter.jsx
2. 包含：当前计数显示、增加按钮、减少按钮、重置按钮
3. 使用 React Hooks (useState)
4. 添加基本样式（内联样式或 CSS）

## 技术栈
- React 18
- JavaScript
```

**执行流程**:
```bash
git checkout -b feature/counter
echo "..." > task.md
git add task.md
git commit -m "Add counter task"
git push
# GitHub Actions 自动执行并创建 PR
```

### 示例 2: 添加 API 服务

**task.md**:
```markdown
# 创建用户 API 服务

## 要求
1. 创建 src/services/userService.js
2. 实现以下方法：
   - login(username, password) - 登录
   - register(userData) - 注册
   - getUserInfo() - 获取当前用户信息
   - updateProfile(data) - 更新用户资料
3. 使用 axios 发送请求
4. API 基础 URL: /api/users
5. 包含错误处理和响应拦截

## 技术栈
- Axios
- JavaScript ES6+
```

## 🔗 相关资源

- [OpenAI API 文档](https://platform.openai.com/docs)
- [GitHub Actions 文档](https://docs.github.com/en/actions)
- [GPT-4 定价](https://openai.com/pricing)

## 💡 高级技巧

### 1. 提供代码示例

在 task.md 中包含参考代码：

```markdown
## 参考代码风格

\`\`\`jsx
// 类似这样的组件结构
function MyComponent() {
  const [state, setState] = useState();
  return <div>...</div>;
}
\`\`\`
```

### 2. 指定文件位置

明确说明文件路径：

```markdown
- 创建 src/components/auth/LoginForm.jsx
- 创建 src/services/api/authService.js
```

### 3. 分步任务

将复杂任务拆分：

```markdown
# 第一步：创建基础组件结构
task-01.md: 创建组件骨架

# 第二步：添加交互逻辑
task-02.md: 实现状态管理

# 第三步：集成 API
task-03.md: 连接后端接口
```

---

<sub>🤖 使用 OpenAI Codex 让开发更高效 | Made with GPT-4</sub>
