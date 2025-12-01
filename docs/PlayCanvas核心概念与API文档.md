# PlayCanvas 核心概念与 API 文档

本文档详细说明了 PlayCanvas 引擎的核心概念和 API 接口，包括应用程序（Application）、场景（Scene）、实体（Entity）、组件（Component）等。

## 目录

- [核心概念架构](#核心概念架构)
- [应用程序 (Application)](#应用程序-application)
- [场景 (Scene)](#场景-scene)
- [实体 (Entity)](#实体-entity)
- [组件 (Component)](#组件-component)
- [架构关系](#架构关系)

---

## 核心概念架构

PlayCanvas 引擎采用**实体-组件-系统（ECS）架构**，用于构建交互式 3D 应用程序。这种架构将数据（组件）、行为（系统）和对象（实体）分离，提供了灵活且可扩展的框架。

---

## 应用程序 (Application)

`Application` 是 PlayCanvas 应用程序的中心枢纽，负责初始化和管理应用程序的生命周期。

### 主要职责

- **初始化和管理应用程序生命周期**
- **协调核心引擎系统**：
  - 图形设备（Graphics Device）
  - 资产注册表（Asset Registry）
  - 组件系统注册表（Component System Registry）
  - 场景（Scene）
  - 输入设备（Input Device）
- `Application` 类是 `AppBase` 的子类
- **自动注册** PlayCanvas 引擎中实现的所有 `ComponentSystem` 和 `ResourceHandler`

### API 使用

#### 创建应用程序实例

```javascript
// 创建应用程序实例
const app = new pc.Application(canvas, options);
```

#### 启动应用程序

```javascript
// 启动应用程序的主循环
app.start();
```

#### 访问应用程序属性

```javascript
// 访问场景
const scene = app.scene;

// 访问图形设备
const device = app.graphicsDevice;

// 访问资产注册表
const assets = app.assets;
```

---

## 场景 (Scene)

`Scene` 代表应用程序管理的图形场景，包含场景的层级结构和渲染属性。

### 主要特性

- **包含场景的层级结构**：管理所有实体及其层级关系
- **管理场景属性**：
  - 雾效（Fog）
  - 环境光（Ambient Light）
  - 天空盒（Skybox）
  - 其他全局渲染设置

### API 使用

#### 访问场景

```javascript
// 通过应用程序访问场景
const scene = app.scene;
```

#### 修改场景属性

```javascript
// 设置雾效类型
scene.fog = pc.FOG_LINEAR;
scene.fogColor = new pc.Color(0.5, 0.5, 0.5);
scene.fogStart = 10;
scene.fogEnd = 100;

// 设置环境光
scene.ambientLight = new pc.Color(0.2, 0.2, 0.2);
```

---

## 实体 (Entity)

`Entity` 是 PlayCanvas 应用程序的核心原语，应用程序中的任何对象都由一个 `Entity` 及其一组 `Component` 表示。

### 主要特性

- **继承自 `GraphNode`**：
  - 继承变换能力（位置、旋转、缩放）
  - 继承层级场景组织能力
  - 支持父子关系
- **组件容器**：每个实体可以附加多个组件以提供不同功能
- **直接访问组件**：实体提供了直接访问其组件的属性，例如 `entity.model` 或 `entity.camera`

### API 使用

#### 创建实体

```javascript
// 创建实体
const entity = new pc.Entity('MyEntity');
```

#### 向实体添加组件

```javascript
// 向实体添加组件
entity.addComponent(type, data);
```

#### 访问组件

```javascript
// 直接访问组件（便捷属性）
entity.model   // 访问模型组件
entity.camera // 访问相机组件
entity.script // 访问脚本组件

// 通过 getComponent 方法访问
const modelComponent = entity.getComponent('model');
```

#### 实体变换

```javascript
// 设置位置
entity.setPosition(0, 1, 0);

// 设置旋转
entity.setEulerAngles(0, 45, 0);

// 设置缩放
entity.setLocalScale(1, 1, 1);

// 添加到场景
app.root.addChild(entity);
```

---

## 组件 (Component)

`Component` 用于向 `Entity` 附加功能，每个组件实现特定的功能。

### 主要特性

- **功能模块化**：每个组件实现特定功能
- **生命周期管理**：组件实现由其管理 `ComponentSystem` 调用的生命周期钩子
- **数据存储**：组件的数据存储在其 `ComponentSystem.store` 中，通过 `component.data` 访问
- **基类**：`Component` 是所有组件类型的基类

### 常用组件类型

#### RenderComponent（渲染组件）

使实体能够渲染 3D 模型。

```javascript
// 添加模型组件来渲染一个盒子
entity.addComponent('model', {
    type: 'box'
});

// 添加模型组件来渲染一个球体
entity.addComponent('model', {
    type: 'sphere'
});

// 添加模型组件来渲染自定义模型
entity.addComponent('model', {
    type: 'asset',
    asset: modelAsset
});
```

#### CameraComponent（相机组件）

定义摄像机属性，用于渲染场景。

```javascript
// 添加相机组件
entity.addComponent('camera', {
    fov: 45,
    nearClip: 0.1,
    farClip: 1000,
    clearColor: new pc.Color(0.2, 0.2, 0.2)
});
```

#### ScriptComponent（脚本组件）

使实体能够运行实现自定义行为的代码。

```javascript
// 添加脚本组件
entity.addComponent('script', {
    enabled: true
});

// 添加脚本实例
entity.script.create('myScript', {
    attributes: {
        speed: { default: 1.0 }
    }
});
```

#### LightComponent（光源组件）

为场景添加光源。

```javascript
// 添加方向光
entity.addComponent('light', {
    type: 'directional',
    color: new pc.Color(1, 1, 1),
    intensity: 1.0
});
```

#### RigidBodyComponent（刚体组件）

为实体添加物理属性。

```javascript
// 添加刚体组件
entity.addComponent('rigidbody', {
    type: 'dynamic',
    mass: 1.0
});
```

### API 使用

#### 添加组件

```javascript
// 基本用法
entity.addComponent(type, data);

// 带配置的用法
entity.addComponent('model', {
    type: 'box',
    material: materialAsset
});
```

#### 访问组件数据

```javascript
// 获取组件
const component = entity.getComponent('model');

// 访问组件数据
const data = component.data;

// 修改组件属性
component.enabled = true;
```

#### 移除组件

```javascript
// 移除组件
entity.removeComponent('model');
```

---

## 架构关系

PlayCanvas 引擎的架构关系如下：

```
Application (应用程序)
    ├── Scene (场景)
    │   └── Entity (实体)
    │       ├── Component (组件)
    │       ├── Component (组件)
    │       └── Component (组件)
    ├── GraphicsDevice (图形设备)
    ├── AssetRegistry (资产注册表)
    ├── ComponentSystemRegistry (组件系统注册表)
    └── InputDevice (输入设备)
```

### 层级关系

1. **Application** → 管理 `Scene` 和所有系统
2. **Scene** → 包含 `Entity` 的层级结构
3. **Entity** → 可以附加多个 `Component`
4. **Component** → 由 `ComponentSystem` 管理，提供具体功能

### 数据流

1. **创建阶段**：创建 Application → 创建 Scene → 创建 Entity → 添加 Component
2. **初始化阶段**：Application 启动 → ComponentSystem 初始化 → Component 初始化
3. **运行阶段**：Application 主循环 → ComponentSystem 更新 → Component 更新 → 渲染

---

## 常用组件系统

PlayCanvas 引擎提供了多种组件系统，每个系统管理特定类型的组件：

- **RenderComponentSystem**：管理渲染组件
- **CameraComponentSystem**：管理相机组件
- **ScriptComponentSystem**：管理脚本组件
- **LightComponentSystem**：管理光源组件
- **RigidBodyComponentSystem**：管理物理刚体组件
- **CollisionComponentSystem**：管理碰撞组件
- **AudioComponentSystem**：管理音频组件
- **AnimationComponentSystem**：管理动画组件

---

## 最佳实践

### 1. 实体命名

```javascript
// 使用有意义的名称
const player = new pc.Entity('Player');
const enemy = new pc.Entity('Enemy');
```

### 2. 组件组织

```javascript
// 将相关组件添加到同一实体
const camera = new pc.Entity('Camera');
camera.addComponent('camera');
camera.addComponent('script');
```

### 3. 层级结构

```javascript
// 使用层级结构组织实体
const parent = new pc.Entity('Parent');
const child = new pc.Entity('Child');
parent.addChild(child);
```

### 4. 组件启用/禁用

```javascript
// 动态启用/禁用组件
entity.getComponent('model').enabled = false;
```

---

## 参考资料

- [Core Architecture (playcanvas/engine)](https://deepwiki.com/wiki/playcanvas/engine#2)
- [Entity-Component System (playcanvas/engine)](https://deepwiki.com/wiki/playcanvas/engine#2.2)
- [PlayCanvas 官方文档](https://developer.playcanvas.com/)

---

*文档生成时间：2024年*  
*来源：playcanvas/engine 仓库文档查询*

