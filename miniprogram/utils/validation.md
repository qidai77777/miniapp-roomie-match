# 校验工具类使用说明

## 概述

`validation.ts` 提供了统一的校验逻辑，用于检查个人资料必填字段和年龄限制。

## API

### 1. validateRequiredProfile(profile?)

检查个人资料必填字段是否完整。

**参数：**
- `profile?: ProfileData` - 可选，要检查的个人资料对象，不传则使用当前用户资料

**返回：**
```typescript
{
  isValid: boolean,        // 是否通过校验
  missingFields: string[], // 缺失的字段数组，如 ['性别', '学校']
  missingText: string      // 缺失字段的文本，如 '性别、学校'
}
```

**示例：**
```typescript
import { validateRequiredProfile } from '../../utils/validation'

const validation = validateRequiredProfile()
if (!validation.isValid) {
  console.log('缺少字段：', validation.missingText)
}
```

### 2. showProfileIncompleteModal(missingText, options?)

显示个人资料未完善的提示对话框，并提供跳转到个人资料页的选项。

**参数：**
- `missingText: string` - 缺失字段文本，如 "性别、学校"
- `options?: object` - 可选配置
  - `title?: string` - 对话框标题，默认 "请先完善个人资料"
  - `content?: string` - 对话框内容
  - `confirmText?: string` - 确认按钮文本，默认 "去完善"
  - `cancelText?: string` - 取消按钮文本，默认 "稍后"

**返回：**
- `Promise<boolean>` - 用户是否选择去完善（点击确认按钮）

**示例：**
```typescript
import { showProfileIncompleteModal } from '../../utils/validation'

const userConfirmed = await showProfileIncompleteModal('性别、学校')
if (userConfirmed) {
  // 用户已跳转到个人资料页
}
```

### 3. showProfileIncompleteToast(missingText)

显示个人资料未完善的Toast提示（轻量级提示）。

**参数：**
- `missingText: string` - 缺失字段文本

**示例：**
```typescript
import { showProfileIncompleteToast } from '../../utils/validation'

showProfileIncompleteToast('性别、学校')
```

### 4. checkAndPromptProfile()

检查并提示个人资料是否完整（使用对话框）。

**返回：**
- `Promise<boolean>` - 资料是否完整

**示例：**
```typescript
import { checkAndPromptProfile } from '../../utils/validation'

const isComplete = await checkAndPromptProfile()
if (isComplete) {
  // 资料完整，继续操作
}
```

### 5. checkAndToastProfile()

检查并提示个人资料是否完整（使用Toast）。

**返回：**
- `boolean` - 资料是否完整

**示例：**
```typescript
import { checkAndToastProfile } from '../../utils/validation'

if (checkAndToastProfile()) {
  // 资料完整，继续操作
}
```

### 6. validateAge(age)

检查年龄是否符合要求（18周岁及以上）。

**参数：**
- `age: string | number` - 年龄

**返回：**
- `boolean` - 是否符合要求

**示例：**
```typescript
import { validateAge } from '../../utils/validation'

if (validateAge(20)) {
  // 年龄符合要求
}
```

### 7. showAgeWarning()

显示年龄不符合要求的提示。

**示例：**
```typescript
import { showAgeWarning } from '../../utils/validation'

if (!validateAge(age)) {
  showAgeWarning()
}
```

## 使用场景

### 场景1：页面离开前检查（Toast提示）

```typescript
import { validateRequiredProfile, showProfileIncompleteToast } from '../../utils/validation'

async syncProfileOnLeave() {
  const validation = validateRequiredProfile()
  if (!validation.isValid) {
    showProfileIncompleteToast(validation.missingText)
    return
  }
  
  // 继续同步逻辑
}
```

### 场景2：表单提交前检查（对话框提示）

```typescript
import { validateRequiredProfile, showProfileIncompleteModal } from '../../utils/validation'

async nextStep() {
  const validation = validateRequiredProfile()
  
  if (!validation.isValid) {
    await showProfileIncompleteModal(validation.missingText)
    return
  }
  
  // 继续下一步
}
```

### 场景3：年龄输入校验

```typescript
import { validateAge, showAgeWarning } from '../../utils/validation'

onAgeInput(e: WechatMiniprogram.Input) {
  const age = Number(e.detail.value)
  
  if (age > 0 && !validateAge(age)) {
    showAgeWarning()
  }
  
  // 更新年龄
}
```

## 优势

1. **代码复用**：避免在多个页面重复编写相同的校验逻辑
2. **统一体验**：所有页面使用相同的提示文案和交互方式
3. **易于维护**：修改校验规则或提示文案只需修改一处
4. **类型安全**：完整的TypeScript类型定义
5. **灵活性**：提供多种提示方式（对话框、Toast）供不同场景使用
