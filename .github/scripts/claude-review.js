#!/usr/bin/env node

const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

// 解析命令行参数
function parseArgs() {
  const args = process.argv.slice(2);
  const params = {};

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i].replace('--', '');
    params[key] = args[i + 1];
  }

  return params;
}

// 读取文件内容
function readFileContents(files) {
  const fileList = files.split(' ').filter(f => f.trim());
  const contents = [];

  for (const file of fileList) {
    try {
      // 回到项目根目录读取文件
      const filePath = path.join(process.cwd(), '../../', file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const ext = path.extname(file);
        contents.push({
          path: file,
          content: content,
          extension: ext
        });
      }
    } catch (error) {
      console.error(`Error reading ${file}:`, error.message);
    }
  }

  return contents;
}

// 构建审查提示
function buildReviewPrompt(fileContents, prNumber) {
  let prompt = `请作为代码审查专家，审查以下 PR #${prNumber} 中的代码变更：\n\n`;

  fileContents.forEach(({ path, content, extension }) => {
    const lang = extension.replace('.', '');
    prompt += `### 文件: ${path}\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
  });

  prompt += `
请提供以下方面的审查意见：

## 1. 代码质量评估
- 代码可读性
- 代码结构和组织
- 命名规范
- 代码复杂度

## 2. 潜在问题
- 可能的 bug 或逻辑错误
- 边界情况处理
- 错误处理

## 3. 安全问题
- SQL 注入风险
- XSS 跨站脚本
- 输入验证
- 敏感数据处理
- 权限控制

## 4. 性能优化
- 算法效率
- 资源使用
- 可能的性能瓶颈

## 5. 最佳实践
- 是否遵循语言/框架最佳实践
- 代码可维护性建议
- 测试覆盖建议

请用中文回复，使用 Markdown 格式，突出重要问题。如果某个方面没有问题，请简要说明"该方面无明显问题"。
`;

  return prompt;
}

// 构建安全审查提示（可选）
function buildSecurityPrompt(fileContents, prNumber) {
  let prompt = `请作为安全审计专家，对以下 PR #${prNumber} 中的代码进行安全审查：\n\n`;

  fileContents.forEach(({ path, content, extension }) => {
    const lang = extension.replace('.', '');
    prompt += `### 文件: ${path}\n\`\`\`${lang}\n${content}\n\`\`\`\n\n`;
  });

  prompt += `
请重点检查以下安全问题：

## 🔒 安全审查清单

### 1. 注入攻击
- SQL 注入
- NoSQL 注入
- 命令注入
- LDAP 注入

### 2. 跨站攻击
- XSS (跨站脚本)
- CSRF (跨站请求伪造)

### 3. 身份验证与授权
- 认证机制是否安全
- 权限控制是否完善
- Session 管理
- Token 处理

### 4. 数据安全
- 敏感数据加密
- 密码存储
- API 密钥暴露
- 个人信息保护

### 5. 输入验证
- 用户输入验证
- 文件上传安全
- 参数校验

### 6. 其他安全问题
- 依赖项漏洞
- 配置错误
- 日志敏感信息泄露

请用中文详细说明发现的所有安全问题，并提供：
- 🚨 严重级别（高/中/低）
- 📝 问题描述
- 💡 修复建议
- 🔧 示例代码（如适用）

如果没有发现安全问题，请说明"✅ 未发现明显安全隐患"。
`;

  return prompt;
}

// 调用 Claude API
async function reviewCode(fileContents, prNumber, reviewType = 'general') {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY environment variable is not set');
  }

  const client = new Anthropic({
    apiKey: apiKey
  });

  // 根据审查类型选择提示
  const prompt = reviewType === 'security'
    ? buildSecurityPrompt(fileContents, prNumber)
    : buildReviewPrompt(fileContents, prNumber);

  console.log('Calling Claude API for code review...');

  try {
    const message = await client.messages.create({
      model: 'claude-sonnet-4-5-20250929',
      max_tokens: 8192,
      temperature: 0,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    const reviewText = message.content[0].text;

    // 构建最终的审查报告
    const reviewReport = `## 🤖 Claude 代码审查报告

> **PR #${prNumber}** | 审查时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}
>
> 审查类型: ${reviewType === 'security' ? '🔒 安全审计' : '📋 综合审查'}

---

${reviewText}

---

<sub>由 [Claude Sonnet 4.5](https://www.anthropic.com/claude) 自动生成 | 仅供参考，最终决策请人工审核</sub>
`;

    return reviewReport;
  } catch (error) {
    console.error('Error calling Claude API:', error);
    throw error;
  }
}

// 主函数
async function main() {
  try {
    const args = parseArgs();
    const { files, 'pr-number': prNumber } = args;

    if (!files || !prNumber) {
      console.error('Usage: node claude-review.js --files "file1 file2" --pr-number 123');
      process.exit(1);
    }

    console.log(`Reviewing PR #${prNumber}...`);
    console.log(`Changed files: ${files}`);

    // 读取文件内容
    const fileContents = readFileContents(files);

    if (fileContents.length === 0) {
      console.log('No valid files to review');
      process.exit(0);
    }

    console.log(`Found ${fileContents.length} files to review`);

    // 执行代码审查
    // 可以通过环境变量 REVIEW_TYPE 切换审查类型
    const reviewType = process.env.REVIEW_TYPE || 'general';
    const reviewReport = await reviewCode(fileContents, prNumber, reviewType);

    // 保存审查结果
    const outputPath = path.join(__dirname, 'review-result.md');
    fs.writeFileSync(outputPath, reviewReport, 'utf8');

    console.log('Code review completed!');
    console.log(`Review saved to: ${outputPath}`);

  } catch (error) {
    console.error('Error during code review:', error);
    process.exit(1);
  }
}

// 运行主函数
main();
