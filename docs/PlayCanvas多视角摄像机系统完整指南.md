# PlayCanvas 多视角摄像机系统完整指南

本文档详细说明了如何在 PlayCanvas 引擎中实现多视角摄像机系统，包括摄像机创建、视口设置、层级管理、脚本编写、输入处理、渲染顺序、UI布局、坐标系转换和性能优化等各个方面。

## 目录

- [1. 摄像机（Camera）API](#1-摄像机camera-api)
- [2. 视口（Viewport）API](#2-视口viewport-api)
- [3. 层级管理](#3-层级管理)
- [4. 脚本编写](#4-脚本编写)
- [5. 输入处理](#5-输入处理)
- [6. 渲染顺序](#6-渲染顺序)
- [7. UI布局](#7-ui布局)
- [8. 坐标系转换](#8-坐标系转换)
- [9. 性能优化](#9-性能优化)

---

## 1. 摄像机（Camera）API

### 创建摄像机

在 PlayCanvas 中，摄像机是通过 `CameraComponent` 实现的，它附加到 `Entity` 上，用于渲染场景。

#### 基本创建方法

```javascript
// 创建一个摄像机实体
const camera = new pc.Entity('camera'); 

// 添加相机组件
camera.addComponent('camera', { 
    clearColor: new pc.Color(0.1, 0.2, 0.3) 
}); 

// 添加到场景
app.root.addChild(camera); 

// 设置摄像机位置
camera.setPosition(0, 0, 3); 
```

### 配置摄像机属性

`CameraComponent` 提供了多种属性来配置摄像机的行为和渲染效果：

#### 基本属性

```javascript
// 近裁剪面和远裁剪面
camera.camera.nearClip = 0.1;
camera.camera.farClip = 1000;

// 视场角（透视投影）
camera.camera.fov = 45;

// 投影类型
camera.camera.projection = pc.PROJECTION_PERSPECTIVE; // 透视投影
camera.camera.projection = pc.PROJECTION_ORTHOGRAPHIC; // 正交投影

// 清除颜色
camera.camera.clearColor = new pc.Color(0.2, 0.2, 0.2);

// 清除缓冲区控制
camera.camera.clearColorBuffer = true;
camera.camera.clearDepthBuffer = true;
camera.camera.clearStencilBuffer = false;

// 宽高比
camera.camera.aspectRatio = 16 / 9;
camera.camera.aspectRatioMode = pc.ASPECT_AUTO; // 或 pc.ASPECT_MANUAL

// 视口矩形（归一化坐标）
camera.camera.rect = new pc.Vec4(0, 0, 1, 1); // [x, y, width, height]

// 渲染优先级
camera.camera.priority = 0;

// 视锥体裁剪
camera.camera.frustumCulling = true;
```

#### 高级属性

```javascript
// 自定义投影矩阵计算
camera.camera.calculateProjection = function(matrix, viewWidth, viewHeight) {
    // 自定义投影矩阵计算逻辑
};

// 自定义变换矩阵计算
camera.camera.calculateTransform = function(matrix) {
    // 自定义变换矩阵计算逻辑（用于反射等效果）
};
```

### 摄像机与视角

在 PlayCanvas 中，每个视角通常对应一个 `CameraComponent`。您可以同时启用多个 `CameraComponent` 来实现分屏渲染或离屏渲染等效果。

`CameraComponentSystem` 会维护一个所有激活摄像机的列表，并根据它们的 `priority` 属性进行排序，以控制渲染顺序。

---

## 2. 视口（Viewport）API

### 摄像机视口设置

每个摄像机都有一个 `rect` 属性，它是一个 `Vec4` 类型的值，用于定义摄像机在屏幕上的渲染区域。

#### rect 属性说明

- **格式**：`new pc.Vec4(x, y, width, height)`
- **坐标系统**：归一化屏幕坐标，范围从 `[0, 0, 1, 1]`
- **参数说明**：
  - `x`, `y`：视口左下角的坐标
  - `width`, `height`：视口的宽度和高度

#### 基本使用

```javascript
// 设置摄像机渲染到整个屏幕
camera.camera.rect = new pc.Vec4(0, 0, 1, 1);

// 设置摄像机渲染到屏幕左半部分
camera.camera.rect = new pc.Vec4(0, 0, 0.5, 1);

// 设置摄像机渲染到屏幕右半部分
camera.camera.rect = new pc.Vec4(0.5, 0, 0.5, 1);

// 设置摄像机渲染到屏幕上半部分
camera.camera.rect = new pc.Vec4(0, 0.5, 1, 0.5);

// 设置摄像机渲染到屏幕下半部分
camera.camera.rect = new pc.Vec4(0, 0, 1, 0.5);
```

### GraphicsDevice 的 setViewport 方法

`GraphicsDevice` 类提供了 `setViewport` 方法，用于设置渲染的活动矩形。这个方法接收像素空间的 `x`, `y`, `w`, `h` 参数。

在渲染过程中，`ForwardRenderer` 会调用 `setupViewport` 方法来根据摄像机的 `rect` 和当前的 `renderTarget` 计算出实际的像素空间视口和裁剪矩形。

### 多摄像机渲染区域划分

要实现多个区域显示不同摄像机的渲染结果，您可以创建多个 `CameraComponent` 实例，并为每个摄像机设置不同的 `rect` 属性。

#### 示例：左右分屏

```javascript
// 创建第一个摄像机（左半屏）
const camera1 = new pc.Entity('Camera1');
camera1.addComponent('camera', {
    clearColor: new pc.Color(0.1, 0.1, 0.1)
});
camera1.camera.rect = new pc.Vec4(0, 0, 0.5, 1); // 左半部分
camera1.setPosition(0, 0, 5);
app.root.addChild(camera1);

// 创建第二个摄像机（右半屏）
const camera2 = new pc.Entity('Camera2');
camera2.addComponent('camera', {
    clearColor: new pc.Color(0.2, 0.2, 0.2)
});
camera2.camera.rect = new pc.Vec4(0.5, 0, 0.5, 1); // 右半部分
camera2.setPosition(0, 0, 5);
app.root.addChild(camera2);
```

#### 示例：四象限分屏

```javascript
// 左上角
camera1.camera.rect = new pc.Vec4(0, 0.5, 0.5, 0.5);

// 右上角
camera2.camera.rect = new pc.Vec4(0.5, 0.5, 0.5, 0.5);

// 左下角
camera3.camera.rect = new pc.Vec4(0, 0, 0.5, 0.5);

// 右下角
camera4.camera.rect = new pc.Vec4(0.5, 0, 0.5, 0.5);
```

### 裁剪矩形 (scissorRect)

`CameraComponent` 还有一个 `scissorRect` 属性，用于裁剪渲染区域。默认情况下，`scissorRect` 与 `rect` 相同，但可以独立设置以实现更精细的裁剪。

```javascript
// 设置裁剪矩形
camera.camera.scissorRect = new pc.Vec4(0, 0, 0.5, 1);
```

---

## 3. 层级管理

### 摄像机位置和旋转

在 PlayCanvas 中，摄像机是一个附加了 `CameraComponent` 的 `Entity`。`Entity` 继承了 `GraphNode` 的层级变换能力，这意味着您可以设置其局部位置、局部旋转和局部缩放。

#### 设置位置

```javascript
// 设置摄像机位置
camera.setPosition(0, 0, 3);

// 或者使用局部位置
camera.setLocalPosition(0, 0, 3);
```

#### 设置旋转

```javascript
// 设置欧拉角（绕 X、Y、Z 轴的旋转角度）
camera.setEulerAngles(45, 0, 0);

// 或者使用局部旋转
camera.setLocalEulerAngles(45, 0, 0);

// 累积旋转
camera.rotateLocal(1, 0, 0);
```

### 常见视角设置

#### 顶视图（Top View）

```javascript
const topCamera = new pc.Entity('TopCamera');
topCamera.addComponent('camera');
topCamera.setPosition(0, 10, 0);
topCamera.setEulerAngles(-90, 0, 0); // 向下看
topCamera.camera.projection = pc.PROJECTION_ORTHOGRAPHIC;
topCamera.camera.orthoHeight = 10;
app.root.addChild(topCamera);
```

#### 前视图（Front View）

```javascript
const frontCamera = new pc.Entity('FrontCamera');
frontCamera.addComponent('camera');
frontCamera.setPosition(0, 0, 10);
frontCamera.setEulerAngles(0, 180, 0); // 向后看
frontCamera.camera.projection = pc.PROJECTION_ORTHOGRAPHIC;
frontCamera.camera.orthoHeight = 10;
app.root.addChild(frontCamera);
```

#### 侧视图（Side View）

```javascript
const sideCamera = new pc.Entity('SideCamera');
sideCamera.addComponent('camera');
sideCamera.setPosition(10, 0, 0);
sideCamera.setEulerAngles(0, -90, 0); // 向左看
sideCamera.camera.projection = pc.PROJECTION_ORTHOGRAPHIC;
sideCamera.camera.orthoHeight = 10;
app.root.addChild(sideCamera);
```

### 摄像机控制脚本

PlayCanvas 引擎提供了一些脚本来帮助您更方便地控制摄像机。

#### CameraControls 脚本

`CameraControls` 脚本允许您通过不同的模式（如 `orbit` 轨道模式、`fly` 飞行模式和 `focus` 聚焦模式）来控制摄像机。

```javascript
// 聚焦到某个点
cameraControls.focus(focusPoint, resetZoom);

// 重置摄像机
cameraControls.reset(focus, position);
```

#### OrbitCamera 脚本

`OrbitCamera` 脚本提供了围绕一个焦点进行轨道运动的功能。

```javascript
// 设置俯仰角和偏航角
orbitCamera.pitch = 45;
orbitCamera.yaw = 0;

// 设置焦点
orbitCamera.pivotPoint = new pc.Vec3(0, 0, 0);

// 聚焦到实体
orbitCamera.focus(focusEntity);

// 重置并看向某点
orbitCamera.resetAndLookAtPoint(point);
orbitCamera.resetAndLookAtEntity(entity);
```

---

## 4. 脚本编写

### ScriptComponent 核心概念

`ScriptComponent` 是附加到实体 (`Entity`) 的组件，它管理着一个有序的脚本实例数组。

#### 脚本生命周期

```javascript
import { Script } from 'playcanvas';

export class MyScript extends Script {
    static scriptName = 'myScript';

    // 脚本首次启用时调用一次
    initialize() {
        // 一次性设置和资源加载
    }

    // 脚本启用时每帧调用
    update(dt) {
        // 主要的游戏逻辑
    }

    // 在所有 update 调用之后每帧调用
    postUpdate(dt) {
        // 依赖其他脚本更新的逻辑
    }

    // 脚本销毁时调用
    destroy() {
        // 清理资源
    }
}
```

### 响应按键

```javascript
import { Script, Keyboard } from 'playcanvas';

export class PlayerController extends Script {
    static scriptName = 'playerController';

    static attributes = {
        speed: { type: 'number', default: 1.0 }
    };

    initialize() {
        // 获取键盘输入实例
        this.app.keyboard.on(Keyboard.EVENT_KEYDOWN, this.onKeyDown, this);
        this.app.keyboard.on(Keyboard.EVENT_KEYUP, this.onKeyUp, this);
    }

    update(dt) {
        // 处理持续按下的按键
        if (this.app.keyboard.isPressed(Keyboard.KEY_W)) {
            this.entity.translateLocal(0, 0, -this.speed * dt);
        }
        if (this.app.keyboard.isPressed(Keyboard.KEY_S)) {
            this.entity.translateLocal(0, 0, this.speed * dt);
        }
        if (this.app.keyboard.isPressed(Keyboard.KEY_A)) {
            this.entity.translateLocal(-this.speed * dt, 0, 0);
        }
        if (this.app.keyboard.isPressed(Keyboard.KEY_D)) {
            this.entity.translateLocal(this.speed * dt, 0, 0);
        }
    }

    onKeyDown(event) {
        if (event.key === Keyboard.KEY_SPACE) {
            console.log("Space key pressed!");
        }
        event.event.preventDefault();
    }

    onKeyUp(event) {
        if (event.key === Keyboard.KEY_SPACE) {
            console.log("Space key released!");
        }
    }

    destroy() {
        this.app.keyboard.off(Keyboard.EVENT_KEYDOWN, this.onKeyDown, this);
        this.app.keyboard.off(Keyboard.EVENT_KEYUP, this.onKeyUp, this);
    }
}
```

### 切换视角

```javascript
import { Script, Entity } from 'playcanvas';

export class CameraSwitcher extends Script {
    static scriptName = 'cameraSwitcher';

    static attributes = {
        camera1: { type: 'entity', title: 'Camera 1' },
        camera2: { type: 'entity', title: 'Camera 2' },
        camera3: { type: 'entity', title: 'Camera 3' },
        switchKey: { type: 'number', default: 32 } // 32 是空格键
    };

    initialize() {
        this.cameras = [this.camera1, this.camera2, this.camera3];
        this.currentIndex = 0;
        
        // 启用第一个摄像机
        this.cameras.forEach((cam, index) => {
            cam.camera.enabled = (index === 0);
        });

        this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }

    onKeyDown(event) {
        if (event.key === this.switchKey) {
            this.switchCamera();
        }
    }

    switchCamera() {
        // 禁用当前摄像机
        this.cameras[this.currentIndex].camera.enabled = false;
        
        // 切换到下一个摄像机
        this.currentIndex = (this.currentIndex + 1) % this.cameras.length;
        
        // 启用新摄像机
        this.cameras[this.currentIndex].camera.enabled = true;
        
        console.log(`Switched to camera: ${this.cameras[this.currentIndex].name}`);
    }

    destroy() {
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }
}
```

### 调整视口

```javascript
import { Script, Vec4 } from 'playcanvas';

export class ViewportController extends Script {
    static scriptName = 'viewportController';

    static attributes = {
        camera: { type: 'entity', title: 'Camera' }
    };

    initialize() {
        this.app.keyboard.on(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }

    onKeyDown(event) {
        const camera = this.camera.camera;
        
        // 按数字键切换不同的视口布局
        switch(event.key) {
            case pc.KEY_1:
                // 全屏
                camera.rect = new pc.Vec4(0, 0, 1, 1);
                break;
            case pc.KEY_2:
                // 左半屏
                camera.rect = new pc.Vec4(0, 0, 0.5, 1);
                break;
            case pc.KEY_3:
                // 右半屏
                camera.rect = new pc.Vec4(0.5, 0, 0.5, 1);
                break;
            case pc.KEY_4:
                // 四分之一屏幕（左上）
                camera.rect = new pc.Vec4(0, 0.5, 0.5, 0.5);
                break;
        }
    }

    destroy() {
        this.app.keyboard.off(pc.EVENT_KEYDOWN, this.onKeyDown, this);
    }
}
```

---

## 5. 输入处理

### 输入设备管理

`AppBase` 类包含对各种输入设备的引用：

```javascript
app.mouse      // 鼠标输入
app.keyboard   // 键盘输入
app.touch      // 触摸输入
app.gamepads   // 游戏手柄输入
app.elementInput // UI元素输入
```

### 鼠标事件处理

```javascript
import { Script, Mouse } from 'playcanvas';

export class MouseController extends Script {
    static scriptName = 'mouseController';

    initialize() {
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app.mouse.on(pc.EVENT_MOUSEUP, this.onMouseUp, this);
        this.app.mouse.on(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        this.app.mouse.on(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
    }

    onMouseDown(event) {
        console.log('Mouse button pressed:', event.button);
        if (event.button === pc.MOUSEBUTTON_LEFT) {
            // 左键按下
        } else if (event.button === pc.MOUSEBUTTON_RIGHT) {
            // 右键按下
        } else if (event.button === pc.MOUSEBUTTON_MIDDLE) {
            // 中键按下
        }
    }

    onMouseUp(event) {
        console.log('Mouse button released:', event.button);
    }

    onMouseMove(event) {
        // 获取鼠标移动增量
        const dx = event.dx;
        const dy = event.dy;
        
        // 使用移动增量进行摄像机旋转等操作
    }

    onMouseWheel(event) {
        // 获取滚轮增量
        const wheelDelta = event.wheelDelta;
        
        // 使用滚轮进行缩放等操作
    }

    destroy() {
        this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
        this.app.mouse.off(pc.EVENT_MOUSEUP, this.onMouseUp, this);
        this.app.mouse.off(pc.EVENT_MOUSEMOVE, this.onMouseMove, this);
        this.app.mouse.off(pc.EVENT_MOUSEWHEEL, this.onMouseWheel, this);
    }
}
```

### 键盘事件处理

```javascript
import { Script, Keyboard } from 'playcanvas';

export class KeyboardController extends Script {
    static scriptName = 'keyboardController';

    initialize() {
        this.app.keyboard.on(Keyboard.EVENT_KEYDOWN, this.onKeyDown, this);
        this.app.keyboard.on(Keyboard.EVENT_KEYUP, this.onKeyUp, this);
    }

    update(dt) {
        // 检查按键是否持续按下
        if (this.app.keyboard.isPressed(Keyboard.KEY_W)) {
            // W 键持续按下
        }
        if (this.app.keyboard.isPressed(Keyboard.KEY_A)) {
            // A 键持续按下
        }
        if (this.app.keyboard.isPressed(Keyboard.KEY_S)) {
            // S 键持续按下
        }
        if (this.app.keyboard.isPressed(Keyboard.KEY_D)) {
            // D 键持续按下
        }
    }

    onKeyDown(event) {
        console.log('Key pressed:', event.key);
        
        // 根据按键执行不同操作
        switch(event.key) {
            case Keyboard.KEY_ESCAPE:
                // ESC 键
                break;
            case Keyboard.KEY_SPACE:
                // 空格键
                break;
        }
        
        event.event.preventDefault(); // 阻止浏览器默认行为
    }

    onKeyUp(event) {
        console.log('Key released:', event.key);
    }

    destroy() {
        this.app.keyboard.off(Keyboard.EVENT_KEYDOWN, this.onKeyDown, this);
        this.app.keyboard.off(Keyboard.EVENT_KEYUP, this.onKeyUp, this);
    }
}
```

### 触摸事件处理

```javascript
import { Script, Touch } from 'playcanvas';

export class TouchController extends Script {
    static scriptName = 'touchController';

    initialize() {
        this.app.touch.on(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        this.app.touch.on(pc.EVENT_TOUCHEND, this.onTouchEnd, this);
        this.app.touch.on(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
        this.app.touch.on(pc.EVENT_TOUCHCANCEL, this.onTouchCancel, this);
    }

    onTouchStart(event) {
        const touch = event.touches[0];
        console.log('Touch started at:', touch.x, touch.y);
    }

    onTouchEnd(event) {
        const touch = event.changedTouches[0];
        console.log('Touch ended at:', touch.x, touch.y);
    }

    onTouchMove(event) {
        const touch = event.touches[0];
        // 处理触摸移动
    }

    onTouchCancel(event) {
        console.log('Touch cancelled');
    }

    destroy() {
        this.app.touch.off(pc.EVENT_TOUCHSTART, this.onTouchStart, this);
        this.app.touch.off(pc.EVENT_TOUCHEND, this.onTouchEnd, this);
        this.app.touch.off(pc.EVENT_TOUCHMOVE, this.onTouchMove, this);
        this.app.touch.off(pc.EVENT_TOUCHCANCEL, this.onTouchCancel, this);
    }
}
```

### 多视口下的输入处理

在处理多个视口下的输入事件时，需要根据摄像机的 `rect` 属性来调整输入坐标。

```javascript
export class MultiViewportInput extends Script {
    static scriptName = 'multiViewportInput';

    static attributes = {
        camera: { type: 'entity', title: 'Camera' }
    };

    initialize() {
        this.app.mouse.on(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    }

    onMouseDown(event) {
        const camera = this.camera.camera;
        const rect = camera.rect;
        
        // 获取画布尺寸
        const canvas = this.app.graphicsDevice.canvas;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // 检查鼠标是否在当前摄像机的视口内
        const viewportX = rect.x * canvasWidth;
        const viewportY = rect.y * canvasHeight;
        const viewportWidth = rect.z * canvasWidth;
        const viewportHeight = rect.w * canvasHeight;
        
        if (event.x >= viewportX && 
            event.x < viewportX + viewportWidth &&
            event.y >= viewportY && 
            event.y < viewportY + viewportHeight) {
            
            // 将屏幕坐标转换为视口内的归一化坐标
            const normalizedX = (event.x - viewportX) / viewportWidth;
            const normalizedY = (event.y - viewportY) / viewportHeight;
            
            // 转换为世界坐标
            const worldCoord = new pc.Vec3();
            camera.screenToWorld(
                normalizedX * canvasWidth, 
                (1 - normalizedY) * canvasHeight, 
                10, 
                worldCoord
            );
            
            console.log('Clicked in viewport at world position:', worldCoord);
        }
    }

    destroy() {
        this.app.mouse.off(pc.EVENT_MOUSEDOWN, this.onMouseDown, this);
    }
}
```

---

## 6. 渲染顺序

### 摄像机优先级 (priority)

每个 `CameraComponent` 都有一个 `priority` 属性。具有较小 `priority` 值的摄像机将首先渲染。

```javascript
// 设置摄像机优先级
camera1.camera.priority = 0;  // 先渲染
camera2.camera.priority = 1;  // 后渲染
camera3.camera.priority = 2;  // 最后渲染
```

### 层组合 (LayerComposition)

`LayerComposition` 类管理 `Layer` 对象的集合，并决定摄像机渲染层的顺序。场景的 `layers` 属性持有 `LayerComposition` 实例。

#### 创建和管理层

```javascript
// 创建新层
const layer1 = new pc.Layer({ name: 'Layer1' });
const layer2 = new pc.Layer({ name: 'Layer2' });

// 添加到场景
app.scene.layers.push(layer1);
app.scene.layers.push(layer2);

// 设置摄像机渲染的层
camera1.camera.layers = [layer1.id];
camera2.camera.layers = [layer2.id];

// 启用/禁用层
layer1.enabled = true;
layer2.enabled = false;
```

### 渲染目标 (renderTarget)

`CameraComponent` 的 `renderTarget` 属性允许您指定摄像机渲染到的目标。如果未设置，摄像机将渲染到屏幕。

```javascript
// 创建渲染目标
const renderTarget = new pc.RenderTarget({
    colorBuffer: new pc.Texture(this.app.graphicsDevice, {
        width: 512,
        height: 512,
        format: pc.PIXELFORMAT_RGBA8
    }),
    depth: true
});

// 将摄像机渲染到渲染目标
camera.camera.renderTarget = renderTarget;
```

### 渲染流程

渲染流程由以下步骤组成：

1. **收集摄像机**：`LayerComposition` 收集所有激活的 `CameraComponent` 实例
2. **排序**：根据 `priority` 属性对摄像机进行排序
3. **生成渲染动作**：为每个摄像机的每个层创建 `RenderAction` 对象
4. **执行渲染**：`ForwardRenderer` 按顺序执行每个 `RenderAction`

### 控制渲染顺序示例

```javascript
// 创建多个摄像机
const mainCamera = new pc.Entity('MainCamera');
mainCamera.addComponent('camera');
mainCamera.camera.priority = 0;  // 主摄像机先渲染
mainCamera.camera.rect = new pc.Vec4(0, 0, 1, 1);

const overlayCamera = new pc.Entity('OverlayCamera');
overlayCamera.addComponent('camera');
overlayCamera.camera.priority = 1;  // 覆盖摄像机后渲染
overlayCamera.camera.rect = new pc.Vec4(0, 0, 0.3, 0.3);  // 小窗口

// 确保覆盖摄像机渲染在正确的位置
app.root.addChild(mainCamera);
app.root.addChild(overlayCamera);
```

---

## 7. UI布局

### 分屏显示多个视角

要在同一个屏幕上分屏显示多个视角，需要为每个摄像机设置不同的 `rect` 属性。

#### 左右分屏

```javascript
// 左摄像机
const leftCamera = new pc.Entity('LeftCamera');
leftCamera.addComponent('camera', {
    clearColor: new pc.Color(0.1, 0.1, 0.1)
});
leftCamera.camera.rect = new pc.Vec4(0, 0, 0.5, 1);  // 左半部分
leftCamera.setPosition(0, 0, 5);
app.root.addChild(leftCamera);

// 右摄像机
const rightCamera = new pc.Entity('RightCamera');
rightCamera.addComponent('camera', {
    clearColor: new pc.Color(0.2, 0.2, 0.2)
});
rightCamera.camera.rect = new pc.Vec4(0.5, 0, 0.5, 1);  // 右半部分
rightCamera.setPosition(0, 0, 5);
app.root.addChild(rightCamera);
```

#### 四象限分屏

```javascript
// 左上
const topLeftCamera = new pc.Entity('TopLeftCamera');
topLeftCamera.addComponent('camera');
topLeftCamera.camera.rect = new pc.Vec4(0, 0.5, 0.5, 0.5);
app.root.addChild(topLeftCamera);

// 右上
const topRightCamera = new pc.Entity('TopRightCamera');
topRightCamera.addComponent('camera');
topRightCamera.camera.rect = new pc.Vec4(0.5, 0.5, 0.5, 0.5);
app.root.addChild(topRightCamera);

// 左下
const bottomLeftCamera = new pc.Entity('BottomLeftCamera');
bottomLeftCamera.addComponent('camera');
bottomLeftCamera.camera.rect = new pc.Vec4(0, 0, 0.5, 0.5);
app.root.addChild(bottomLeftCamera);

// 右下
const bottomRightCamera = new pc.Entity('BottomRightCamera');
bottomRightCamera.addComponent('camera');
bottomRightCamera.camera.rect = new pc.Vec4(0.5, 0, 0.5, 0.5);
app.root.addChild(bottomRightCamera);
```

#### 画中画效果

```javascript
// 主摄像机（全屏）
const mainCamera = new pc.Entity('MainCamera');
mainCamera.addComponent('camera');
mainCamera.camera.rect = new pc.Vec4(0, 0, 1, 1);
mainCamera.camera.priority = 0;
app.root.addChild(mainCamera);

// 小窗口摄像机（右上角）
const pipCamera = new pc.Entity('PIPCamera');
pipCamera.addComponent('camera');
pipCamera.camera.rect = new pc.Vec4(0.7, 0.7, 0.3, 0.3);  // 右上角小窗口
pipCamera.camera.priority = 1;  // 后渲染，显示在上层
app.root.addChild(pipCamera);
```

### 动态调整视口

```javascript
import { Script, Vec4 } from 'playcanvas';

export class DynamicViewport extends Script {
    static scriptName = 'dynamicViewport';

    static attributes = {
        camera: { type: 'entity', title: 'Camera' }
    };

    initialize() {
        this.app.on('resize', this.onResize, this);
        this.onResize();
    }

    onResize() {
        const canvas = this.app.graphicsDevice.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // 根据屏幕尺寸动态调整视口
        if (width > height) {
            // 横屏：左右分屏
            this.camera.camera.rect = new pc.Vec4(0, 0, 0.5, 1);
        } else {
            // 竖屏：上下分屏
            this.camera.camera.rect = new pc.Vec4(0, 0, 1, 0.5);
        }
    }

    destroy() {
        this.app.off('resize', this.onResize, this);
    }
}
```

---

## 8. 坐标系转换

### 屏幕坐标到世界坐标

`Camera.screenToWorld` 方法用于将 2D 屏幕坐标转换为 3D 世界坐标。

#### 方法签名

```javascript
camera.screenToWorld(x, y, z, cw, ch, worldCoord)
```

- `x`, `y`：PlayCanvas 画布元素的 X 和 Y 坐标
- `z`：从相机到新点的世界空间距离
- `cw`, `ch`：PlayCanvas 画布元素的宽度和高度
- `worldCoord`：可选参数，用于接收世界坐标结果的 `Vec3` 向量

#### 使用示例

```javascript
// 获取画布尺寸
const canvas = this.app.graphicsDevice.canvas;
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// 屏幕坐标（鼠标位置）
const screenX = event.x;
const screenY = event.y;

// 转换为世界坐标
const worldCoord = new pc.Vec3();
camera.camera.screenToWorld(
    screenX, 
    screenY, 
    10,  // 距离相机的距离
    canvasWidth, 
    canvasHeight, 
    worldCoord
);

console.log('World position:', worldCoord);
```

#### 多视口下的坐标转换

```javascript
export class MultiViewportCoordinateConverter extends Script {
    static scriptName = 'multiViewportCoordinateConverter';

    static attributes = {
        camera: { type: 'entity', title: 'Camera' }
    };

    onMouseDown(event) {
        const camera = this.camera.camera;
        const rect = camera.rect;
        
        // 获取画布尺寸
        const canvas = this.app.graphicsDevice.canvas;
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // 计算视口在屏幕上的实际像素位置
        const viewportX = rect.x * canvasWidth;
        const viewportY = rect.y * canvasHeight;
        const viewportWidth = rect.z * canvasWidth;
        const viewportHeight = rect.w * canvasHeight;
        
        // 检查鼠标是否在视口内
        if (event.x >= viewportX && 
            event.x < viewportX + viewportWidth &&
            event.y >= viewportY && 
            event.y < viewportY + viewportHeight) {
            
            // 将屏幕坐标转换为视口内的归一化坐标
            const localX = event.x - viewportX;
            const localY = event.y - viewportY;
            
            // 注意：PlayCanvas 使用左下角为原点，需要翻转 Y 坐标
            const normalizedY = viewportHeight - localY;
            
            // 转换为世界坐标
            const worldCoord = new pc.Vec3();
            camera.screenToWorld(
                localX, 
                normalizedY, 
                10, 
                viewportWidth, 
                viewportHeight, 
                worldCoord
            );
            
            console.log('World position in viewport:', worldCoord);
        }
    }
}
```

### 世界坐标到屏幕坐标

`Camera.worldToScreen` 方法用于将 3D 世界坐标转换为 2D 屏幕像素空间坐标。

#### 方法签名

```javascript
camera.worldToScreen(worldCoord, cw, ch, screenCoord)
```

- `worldCoord`：要转换的世界空间坐标
- `cw`, `ch`：PlayCanvas 画布元素的宽度和高度
- `screenCoord`：可选参数，用于接收屏幕坐标结果的 `Vec3` 向量

#### 使用示例

```javascript
// 世界坐标
const worldPos = new pc.Vec3(0, 0, 0);

// 获取画布尺寸
const canvas = this.app.graphicsDevice.canvas;
const canvasWidth = canvas.width;
const canvasHeight = canvas.height;

// 转换为屏幕坐标
const screenCoord = new pc.Vec3();
camera.camera.worldToScreen(
    worldPos, 
    canvasWidth, 
    canvasHeight, 
    screenCoord
);

console.log('Screen position:', screenCoord.x, screenCoord.y);
```

### 射线投射

射线投射是另一种常用的坐标转换方法，用于从屏幕坐标生成射线并检测与场景对象的交点。

```javascript
// 从屏幕坐标创建射线
const from = new pc.Vec3();
const to = new pc.Vec3();

camera.camera.screenToWorld(event.x, event.y, 1, canvasWidth, canvasHeight, from);
camera.camera.screenToWorld(event.x, event.y, 100, canvasWidth, canvasHeight, to);

const ray = new pc.Ray(from, to.sub(to, from).normalize());

// 执行射线检测
const result = this.app.systems.rigidbody.raycastFirst(ray);
if (result) {
    console.log('Hit at:', result.point);
}
```

---

## 9. 性能优化

### 按需渲染摄像机

#### 禁用不需要的摄像机

```javascript
// 禁用摄像机
camera.camera.enabled = false;

// 启用摄像机
camera.camera.enabled = true;
```

#### 动态启用/禁用摄像机

```javascript
import { Script } from 'playcanvas';

export class CameraManager extends Script {
    static scriptName = 'cameraManager';

    static attributes = {
        cameras: { type: 'entity', array: true, title: 'Cameras' }
    };

    initialize() {
        // 默认只启用第一个摄像机
        this.cameras.forEach((cam, index) => {
            cam.camera.enabled = (index === 0);
        });
    }

    enableCamera(index) {
        this.cameras.forEach((cam, i) => {
            cam.camera.enabled = (i === index);
        });
    }

    toggleCamera(index) {
        this.cameras[index].camera.enabled = !this.cameras[index].camera.enabled;
    }
}
```

### 手动控制渲染

#### 禁用自动渲染

```javascript
// 禁用自动渲染
app.autoRender = false;

// 手动触发下一帧渲染
app.renderNextFrame = true;

// 或者在需要时手动调用
app.render();
```

#### 条件渲染

```javascript
import { Script } from 'playcanvas';

export class ConditionalRenderer extends Script {
    static scriptName = 'conditionalRenderer';

    static attributes = {
        camera: { type: 'entity', title: 'Camera' },
        renderInterval: { type: 'number', default: 1, title: 'Render Interval (frames)' }
    };

    initialize() {
        this.frameCount = 0;
        this.app.autoRender = false;
    }

    update(dt) {
        this.frameCount++;
        
        // 每 N 帧渲染一次
        if (this.frameCount % this.renderInterval === 0) {
            this.app.renderNextFrame = true;
        }
    }
}
```

### 调整渲染分辨率

#### 渲染目标缩放

```javascript
// 设置渲染目标缩放（0.1 到 1.0）
app.scene.rendering.renderTargetScale = 0.5;  // 50% 分辨率

// 通过 RenderPassCameraFrame 设置
const cameraFrame = new pc.RenderPassCameraFrame();
cameraFrame.renderTargetScale = 0.5;
```

#### 降低视口分辨率

```javascript
// 通过减小视口尺寸来降低渲染像素数
camera.camera.rect = new pc.Vec4(0, 0, 0.5, 0.5);  // 四分之一屏幕
```

#### 调整拾取分辨率

```javascript
// 降低拾取缓冲区分辨率
app.systems.picker.resize(256, 256);  // 降低拾取精度以提高性能
```

### 层级优化

#### 禁用不需要的层

```javascript
// 禁用层
layer.enabled = false;

// 只让摄像机渲染特定层
camera.camera.layers = [layer1.id, layer2.id];
```

#### 使用层来减少渲染对象

```javascript
// 创建不同的层
const mainLayer = new pc.Layer({ name: 'Main' });
const detailLayer = new pc.Layer({ name: 'Detail' });
const uiLayer = new pc.Layer({ name: 'UI' });

// 将对象分配到不同层
entity1.layers = [mainLayer.id];
entity2.layers = [detailLayer.id];
uiElement.layers = [uiLayer.id];

// 摄像机只渲染需要的层
mainCamera.camera.layers = [mainLayer.id];
detailCamera.camera.layers = [detailLayer.id];
uiCamera.camera.layers = [uiLayer.id];
```

### 视锥体裁剪

```javascript
// 启用视锥体裁剪（默认启用）
camera.camera.frustumCulling = true;

// 禁用视锥体裁剪（如果所有对象都需要渲染）
camera.camera.frustumCulling = false;
```

### 性能监控

```javascript
import { Script } from 'playcanvas';

export class PerformanceMonitor extends Script {
    static scriptName = 'performanceMonitor';

    initialize() {
        this.frameCount = 0;
        this.lastTime = Date.now();
    }

    update(dt) {
        this.frameCount++;
        
        const currentTime = Date.now();
        if (currentTime - this.lastTime >= 1000) {
            const fps = this.frameCount;
            console.log('FPS:', fps);
            
            // 如果 FPS 过低，可以动态调整渲染设置
            if (fps < 30) {
                // 降低渲染目标分辨率
                this.app.scene.rendering.renderTargetScale = 0.7;
            } else if (fps > 60) {
                // 提高渲染目标分辨率
                this.app.scene.rendering.renderTargetScale = 1.0;
            }
            
            this.frameCount = 0;
            this.lastTime = currentTime;
        }
    }
}
```

### 优化策略总结

1. **按需渲染**：
   - 使用 `camera.enabled` 控制摄像机是否渲染
   - 使用 `app.autoRender` 控制自动渲染
   - 使用 `app.renderNextFrame` 手动触发渲染

2. **降低分辨率**：
   - 使用 `renderTargetScale` 降低渲染目标分辨率
   - 减小摄像机视口尺寸
   - 降低拾取缓冲区分辨率

3. **层级管理**：
   - 禁用不需要的层
   - 将对象分配到不同层
   - 摄像机只渲染需要的层

4. **视锥体裁剪**：
   - 启用视锥体裁剪以剔除不可见对象

5. **性能监控**：
   - 监控 FPS
   - 根据性能动态调整渲染设置

---

## 完整示例：多视角编辑器

以下是一个完整的多视角编辑器示例，整合了上述所有功能：

```javascript
import { Script, Entity, Vec3, Vec4, Keyboard } from 'playcanvas';

export class MultiViewportEditor extends Script {
    static scriptName = 'multiViewportEditor';

    static attributes = {
        mainCamera: { type: 'entity', title: 'Main Camera' },
        topCamera: { type: 'entity', title: 'Top Camera' },
        frontCamera: { type: 'entity', title: 'Front Camera' },
        sideCamera: { type: 'entity', title: 'Side Camera' }
    };

    initialize() {
        this.cameras = [
            this.mainCamera,
            this.topCamera,
            this.frontCamera,
            this.sideCamera
        ];
        
        this.currentLayout = 'single';  // 'single', 'split', 'quad'
        
        // 设置初始布局
        this.setLayout('quad');
        
        // 注册键盘事件
        this.app.keyboard.on(Keyboard.EVENT_KEYDOWN, this.onKeyDown, this);
    }

    setLayout(layout) {
        switch(layout) {
            case 'single':
                // 单视图：只显示主摄像机
                this.mainCamera.camera.enabled = true;
                this.mainCamera.camera.rect = new pc.Vec4(0, 0, 1, 1);
                this.topCamera.camera.enabled = false;
                this.frontCamera.camera.enabled = false;
                this.sideCamera.camera.enabled = false;
                break;
                
            case 'split':
                // 分屏：主摄像机和顶视图
                this.mainCamera.camera.enabled = true;
                this.mainCamera.camera.rect = new pc.Vec4(0, 0, 0.5, 1);
                this.topCamera.camera.enabled = true;
                this.topCamera.camera.rect = new pc.Vec4(0.5, 0, 0.5, 1);
                this.frontCamera.camera.enabled = false;
                this.sideCamera.camera.enabled = false;
                break;
                
            case 'quad':
                // 四象限：所有四个视图
                this.mainCamera.camera.enabled = true;
                this.mainCamera.camera.rect = new pc.Vec4(0, 0.5, 0.5, 0.5);  // 左上
                this.topCamera.camera.enabled = true;
                this.topCamera.camera.rect = new pc.Vec4(0.5, 0.5, 0.5, 0.5);  // 右上
                this.frontCamera.camera.enabled = true;
                this.frontCamera.camera.rect = new pc.Vec4(0, 0, 0.5, 0.5);  // 左下
                this.sideCamera.camera.enabled = true;
                this.sideCamera.camera.rect = new pc.Vec4(0.5, 0, 0.5, 0.5);  // 右下
                break;
        }
        
        this.currentLayout = layout;
    }

    onKeyDown(event) {
        // 按数字键切换布局
        if (event.key === Keyboard.KEY_1) {
            this.setLayout('single');
        } else if (event.key === Keyboard.KEY_2) {
            this.setLayout('split');
        } else if (event.key === Keyboard.KEY_3) {
            this.setLayout('quad');
        }
    }

    destroy() {
        this.app.keyboard.off(Keyboard.EVENT_KEYDOWN, this.onKeyDown, this);
    }
}
```

---

## 参考资料

- [PlayCanvas 官方文档](https://developer.playcanvas.com/)
- [Core Architecture (playcanvas/engine)](https://deepwiki.com/wiki/playcanvas/engine#2)
- [Graphics System (playcanvas/engine)](https://deepwiki.com/wiki/playcanvas/engine#3)
- [Application and Scene (playcanvas/engine)](https://deepwiki.com/wiki/playcanvas/engine#2.1)

---

*文档生成时间：2024年*  
*来源：playcanvas/engine 仓库文档查询*

