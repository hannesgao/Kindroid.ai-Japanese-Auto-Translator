# Kindroid.ai Japanese Auto Translator / Kindroid.ai 日语自动翻译器

[English](#english) | [中文](#中文)

## English

### Overview
This is a Tampermonkey userscript that automatically translates Japanese text to Chinese on kindroid.ai website. It uses DeepL API for high-quality translations and monitors the entire page for Japanese content.

### Features
- 🔄 **Automatic Translation**: Detects and translates Japanese text automatically
- 📄 **Full Page Monitoring**: Scans the entire page, not just specific elements
- 🚀 **Real-time Updates**: Monitors DOM changes and translates new content
- 🔁 **Smart Retry System**: Retries failed translations up to 5 times
- 📊 **Batch Processing**: Processes multiple elements efficiently
- 🛡️ **Error Handling**: Stops after 10 global failures to prevent API abuse
- 📝 **Detailed Logging**: Comprehensive console logs for debugging
- 🎨 **Visual Feedback**: Shows loading states and error messages

### Prerequisites
- Tampermonkey browser extension
- DeepL API key (free or paid)

### Installation

1. **Install Tampermonkey**
   - [Chrome](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)
   - [Edge](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **Get DeepL API Key**
   - Register at [DeepL API](https://www.deepl.com/pro-api)
   - Choose Free plan (500,000 characters/month) or Pro plan
   - Copy your API key

3. **Install the Script**
   - Click Tampermonkey icon → Create a new script
   - Copy and paste the entire script code
   - Replace `YOUR_DEEPL_API_KEY` with your actual API key
   - Save (Ctrl+S)

### Configuration

Edit the `CONFIG` object in the script to customize behavior:

```javascript
const CONFIG = {
    debounceTime: 500,        // Debounce time in milliseconds
    batchSize: 5,             // Number of elements to translate at once
    minTextLength: 2,         // Minimum text length to translate
    enableLogging: true,      // Enable/disable console logs
    logLevel: 'verbose',      // 'error', 'warn', 'info', 'verbose'
    maxRetries: 5,            // Max retries per element
    retryDelay: 1000,         // Delay between retries (ms)
    globalMaxFailures: 10     // Stop after this many failures
};
```

### Usage

1. **Automatic Operation**
   - Visit any page on kindroid.ai
   - The script runs automatically
   - Japanese text will be translated and displayed below the original

2. **Console Commands**
   - `resetTranslationService()` - Reset the translation service if it stops

3. **Monitoring Progress**
   - Open browser console (F12) to see detailed logs
   - Check translation status and any errors

### Troubleshooting

**Script not running?**
- Check if Tampermonkey is enabled
- Verify the script is activated in Tampermonkey dashboard
- Look for console errors (F12)

**Translations failing?**
- Verify your DeepL API key is correct
- Check if you've exceeded API limits
- Look for error messages in console
- Try `resetTranslationService()` in console

**Performance issues?**
- Increase `debounceTime` in CONFIG
- Reduce `batchSize` for slower processing
- Set `logLevel` to 'error' to reduce console output

### API Limits
- **Free DeepL API**: 500,000 characters/month
- **Pro DeepL API**: Based on your subscription

### License
MIT License - Feel free to modify and distribute

---

## 中文

### 概述
这是一个 Tampermonkey 用户脚本，可以在 kindroid.ai 网站上自动将日语翻译成中文。它使用 DeepL API 提供高质量翻译，并监控整个页面的日语内容。

### 功能特点
- 🔄 **自动翻译**：自动检测并翻译日语文本
- 📄 **全页面监控**：扫描整个页面，不限于特定元素
- 🚀 **实时更新**：监控 DOM 变化并翻译新内容
- 🔁 **智能重试系统**：失败的翻译最多重试 5 次
- 📊 **批量处理**：高效处理多个元素
- 🛡️ **错误处理**：全局失败 10 次后停止，防止 API 滥用
- 📝 **详细日志**：提供完整的控制台日志用于调试
- 🎨 **视觉反馈**：显示加载状态和错误信息

### 前置要求
- Tampermonkey 浏览器扩展
- DeepL API 密钥（免费或付费）

### 安装步骤

1. **安装 Tampermonkey**
   - [Chrome 版](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo)
   - [Firefox 版](https://addons.mozilla.org/zh-CN/firefox/addon/tampermonkey/)
   - [Edge 版](https://microsoftedge.microsoft.com/addons/detail/tampermonkey/iikmkjmpaadaobahmlepeloendndfphd)

2. **获取 DeepL API 密钥**
   - 在 [DeepL API](https://www.deepl.com/pro-api) 注册账号
   - 选择免费版（每月50万字符）或付费版
   - 复制你的 API 密钥

3. **安装脚本**
   - 点击 Tampermonkey 图标 → 添加新脚本
   - 复制粘贴完整的脚本代码
   - 将 `YOUR_DEEPL_API_KEY` 替换为你的实际 API 密钥
   - 保存（Ctrl+S）

### 配置选项

编辑脚本中的 `CONFIG` 对象来自定义行为：

```javascript
const CONFIG = {
    debounceTime: 500,        // 防抖时间（毫秒）
    batchSize: 5,             // 批量翻译数量
    minTextLength: 2,         // 最小翻译文本长度
    enableLogging: true,      // 启用/禁用控制台日志
    logLevel: 'verbose',      // 'error', 'warn', 'info', 'verbose'
    maxRetries: 5,            // 每个元素最大重试次数
    retryDelay: 1000,         // 重试延迟（毫秒）
    globalMaxFailures: 10     // 全局失败次数上限
};
```

### 使用方法

1. **自动运行**
   - 访问 kindroid.ai 的任意页面
   - 脚本会自动运行
   - 日语文本会被翻译并显示在原文下方

2. **控制台命令**
   - `resetTranslationService()` - 重置翻译服务（如果服务停止）

3. **监控进度**
   - 打开浏览器控制台（F12）查看详细日志
   - 检查翻译状态和错误信息

### 故障排除

**脚本没有运行？**
- 检查 Tampermonkey 是否已启用
- 确认脚本在 Tampermonkey 仪表板中已激活
- 查看控制台错误（F12）

**翻译失败？**
- 验证你的 DeepL API 密钥是否正确
- 检查是否超出 API 限额
- 查看控制台中的错误信息
- 尝试在控制台执行 `resetTranslationService()`

**性能问题？**
- 增加 CONFIG 中的 `debounceTime`
- 减少 `batchSize` 以降低处理速度
- 将 `logLevel` 设为 'error' 以减少控制台输出

### API 限制
- **免费 DeepL API**：每月 50 万字符
- **付费 DeepL API**：根据你的订阅计划

### 许可证
MIT 许可证 - 可自由修改和分发

### 常见问题

**Q: 为什么有些日语没有被翻译？**
A: 脚本会排除纯汉字文本（可能是中文），只翻译包含平假名或片假名的文本。

**Q: 可以翻译成其他语言吗？**
A: 可以，修改脚本中的 `target_lang=ZH` 为其他语言代码（如 EN 为英语）。

**Q: 翻译结果显示在哪里？**
A: 翻译会以灰色背景、绿色左边框的样式显示在原文下方。

### 更新日志

**v2.1 (2024)**
- 添加重试机制和全局失败限制
- 改进错误处理和用户反馈
- 优化性能和日志系统
- 支持手动重置翻译服务

### 贡献
欢迎提交 Issue 和 Pull Request！

### 联系方式
如有问题或建议，请在 GitHub 上提交 Issue。
