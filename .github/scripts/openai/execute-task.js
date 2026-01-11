#!/usr/bin/env node

const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// OpenAI 客户端
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// 项目根目录（从 .github/scripts/openai 回到项目根）
const PROJECT_ROOT = path.join(__dirname, '../../..');

/**
 * 读取 task.md 文件
 */
function readTask() {
  const taskPath = path.join(PROJECT_ROOT, 'task.md');

  if (!fs.existsSync(taskPath)) {
    throw new Error('task.md not found');
  }

  return fs.readFileSync(taskPath, 'utf8');
}

/**
 * 获取项目结构
 */
function getProjectStructure() {
  try {
    // 使用 tree 命令或 ls -R 获取项目结构
    const structure = execSync('find . -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx" -o -name "*.json" -o -name "*.md" 2>/dev/null | grep -v node_modules | grep -v .git | head -50', {
      cwd: PROJECT_ROOT,
      encoding: 'utf8'
    });
    return structure;
  } catch (error) {
    return 'Unable to get project structure';
  }
}

/**
 * 读取相关文件内容（用于上下文）
 */
function readRelevantFiles() {
  const files = [];

  // 读取常见的配置文件
  const configFiles = ['package.json', 'README.md', 'tsconfig.json'];

  configFiles.forEach(file => {
    const filePath = path.join(PROJECT_ROOT, file);
    if (fs.existsSync(filePath)) {
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        files.push({
          path: file,
          content: content.slice(0, 1000) // 限制长度
        });
      } catch (error) {
        // 忽略读取错误
      }
    }
  });

  return files;
}

/**
 * 使用 OpenAI API 生成代码计划
 */
async function generateCodePlan(taskContent, projectContext) {
  console.log('🤔 Analyzing task and generating plan...');

  const messages = [
    {
      role: 'system',
      content: `你是一个专业的软件工程师，负责根据任务描述生成代码实现方案。

你的任务是：
1. 分析任务需求
2. 确定需要创建或修改的文件
3. 为每个文件生成完整的代码
4. 返回 JSON 格式的文件操作列表

返回格式必须是有效的 JSON：
{
  "files": [
    {
      "path": "src/components/Example.jsx",
      "action": "create",
      "content": "文件的完整代码内容"
    }
  ]
}

注意：
- path 是相对于项目根目录的路径
- action 可以是 "create" 或 "update"
- content 必须是完整的、可运行的代码
- 只返回 JSON，不要有其他文字说明`
    },
    {
      role: 'user',
      content: `## 任务描述

${taskContent}

## 项目上下文

### 项目结构
${projectContext.structure}

### 相关文件
${projectContext.files.map(f => `#### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n')}

请分析任务并生成实现方案。只返回 JSON 格式的文件操作列表。`
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    console.log('✅ Plan generated');

    return JSON.parse(content);
  } catch (error) {
    console.error('Error generating plan:', error);
    throw error;
  }
}

/**
 * 为单个文件生成代码
 */
async function generateCodeForFile(fileInfo, taskContent, projectContext) {
  console.log(`📝 Generating code for ${fileInfo.path}...`);

  const messages = [
    {
      role: 'system',
      content: `你是一个专业的软件工程师。根据任务描述和文件要求，生成高质量的代码。

要求：
- 代码必须完整、可运行
- 遵循最佳实践和编码规范
- 包含必要的错误处理
- 添加适当的注释
- 考虑安全性和性能

只返回代码内容，不要有其他说明文字。`
    },
    {
      role: 'user',
      content: `## 任务
${taskContent}

## 文件信息
- 路径: ${fileInfo.path}
- 操作: ${fileInfo.action}

## 项目上下文
${projectContext.files.map(f => `### ${f.path}\n\`\`\`\n${f.content}\n\`\`\``).join('\n\n')}

请生成完整的代码文件内容。只返回代码，不要有其他文字。`
    }
  ];

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: messages,
      temperature: 0.2,
      max_tokens: 4096
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error(`Error generating code for ${fileInfo.path}:`, error);
    throw error;
  }
}

/**
 * 执行文件操作
 */
function executeFileOperations(operations) {
  console.log(`\n📁 Executing ${operations.length} file operations...\n`);

  operations.forEach((op, index) => {
    const filePath = path.join(PROJECT_ROOT, op.path);
    const dir = path.dirname(filePath);

    // 确保目录存在
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // 写入文件
    fs.writeFileSync(filePath, op.content, 'utf8');

    console.log(`${index + 1}. ${op.action === 'create' ? '✅ Created' : '📝 Updated'}: ${op.path}`);
  });

  console.log(`\n✅ All file operations completed!\n`);
}

/**
 * 主函数
 */
async function main() {
  try {
    console.log('====================================');
    console.log('🤖 OpenAI Codex Task Executor');
    console.log('====================================\n');

    // 检查 API Key
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }

    // 1. 读取任务
    console.log('📋 Reading task.md...');
    const taskContent = readTask();
    console.log('✅ Task loaded\n');

    // 2. 获取项目上下文
    console.log('🔍 Analyzing project structure...');
    const projectContext = {
      structure: getProjectStructure(),
      files: readRelevantFiles()
    };
    console.log('✅ Project context loaded\n');

    // 3. 生成代码计划
    const plan = await generateCodePlan(taskContent, projectContext);

    if (!plan.files || plan.files.length === 0) {
      console.log('⚠️ No files to create or modify');
      return;
    }

    console.log(`\n📝 Plan: ${plan.files.length} file(s) to process\n`);
    plan.files.forEach((file, i) => {
      console.log(`${i + 1}. ${file.action}: ${file.path}`);
    });
    console.log('');

    // 4. 为每个文件生成详细代码
    const operations = [];

    for (const fileInfo of plan.files) {
      let content;

      if (fileInfo.content && fileInfo.content.length > 100) {
        // 如果计划中已经包含了完整代码，直接使用
        content = fileInfo.content;
        console.log(`✅ Using content from plan for ${fileInfo.path}`);
      } else {
        // 否则，为这个文件单独生成代码
        content = await generateCodeForFile(fileInfo, taskContent, projectContext);
      }

      operations.push({
        path: fileInfo.path,
        action: fileInfo.action,
        content: content
      });
    }

    // 5. 执行文件操作
    executeFileOperations(operations);

    console.log('====================================');
    console.log('✅ Task execution completed!');
    console.log('====================================\n');

  } catch (error) {
    console.error('❌ Error executing task:', error);
    process.exit(1);
  }
}

// 运行
main();
