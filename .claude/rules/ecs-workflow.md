---
paths:
  - "assets/script/ecs/**/*.ts"
---

# ECS 工作流

## 正确的开发顺序
1. 先写 Component 组件代码（定义数据结构）
2. 再写 System 系统代码（定义处理逻辑）
3. 新系统必须在 `ECSHelper.register()` 中注册到对应 SystemGroup
4. 最后在 Cocos 插件中配置实体（组合组件），由开发者操作

## 组件规范
- 继承 `ecs.Component`，使用 `@ecsclass(名称, { describe: 描述 })` 装饰
- 属性使用 `@ecsprop({ type, defaultValue })` 装饰
- 必须实现 `reset()` 方法，将所有属性恢复到默认值
- 标记组件（Tag）无属性，`reset()` 为空实现
- 组件只存储数据，禁止包含业务逻辑
- 装饰器解构：`const { ecsclass, ecsprop } = ecs._ecsdecorator`

## 系统规范
- 继承 `ecs.System`，使用 `@ecsystem(名称, { describe: 描述 })` 装饰
- 在 `onInit()` 中配置 matcher：
  - `allOf(Comp1, Comp2)` — 必须包含的组件
  - `anyOf(Comp1, Comp2)` — 至少包含一个
  - `excludeOf(Comp)` — 排除包含此组件的实体
  - `optionalOf(Comp)` — 可选组件（iterate 中可能为 null）
- 在 `update(dt)` 中使用 `query.iterate1/2/3/4()` 遍历实体
- 系统只包含逻辑，禁止存储持久状态（单例数据用单例组件）
- 装饰器解构：`const { ecsystem } = ecs._ecsdecorator`

## 实体创建注意事项
- `createEntity` / `addComponent` 的组件添加是缓冲的（帧结束才生效），创建后不能立即 `getComponent` 获取组件
- 需要设置初始值时，使用 `createEntity` 的覆盖参数：`world.createEntity("Player", { Position: { x: 0, y: -100 } })`
- 只有在下一帧的系统 `update()` 中，组件才可通过 `getComponent` 正常访问

## 实体配置
- 位置：`extensions-config/entity/<entityName>.json`
- 配置描述实体包含哪些组件及默认属性值
- 可直接修改，修改后需通过编辑器重新导出配置文件
- 用途：了解已有实体的组件组合，帮助理解业务上下文

## 文件组织
- 组件放 `assets/script/ecs/component/` 下按类别分子目录
  - `basics/` — 基础通用组件（Position, Speed, Render 等）
  - `configure/` — 配置型组件（Shape, Asset 等）
  - `header/` — 枚举/类型定义
  - `mark/` — 标记组件（TagHero, TagEnemy 等）
  - `singleton/` — 单例组件
- 系统放 `assets/script/ecs/system/` 下按类别分子目录
  - `basics/` — 基础系统（Move, Render, LifeTime 等）
  - `generate/` — 初始化/生成系统
  - `debug/` — 调试系统

## import 风格
- 使用 header.ts：`import { ecs } from "../../../header"`
- 组件间引用使用相对路径
