/**
 * @Author: Gongxh
 * @Date: 2025-05-16
 * @Description: 这是一个单世界的例子
 */
import { Node } from "cc";

import { CORE, ecs, QT } from "../header";
import { AutoAimSystem } from "./system/basics/AutoAimSystem";
import { FacingSystem } from "./system/basics/FacingSystem";
import { LifeTimeSystem } from "./system/basics/LifeTimeSystem";
import { MoveSystem } from "./system/basics/MoveSystem";
import { RenderSystem } from "./system/basics/RenderSystem";
import { ShapeUpdateSystem } from "./system/basics/ShapeUpdateSystem";
import { ShooterSystem } from "./system/basics/ShooterSystem";
import { GraphicsRenderGenerate } from "./system/generate/GraphicsRenderGenerate";
import { MonsterFactorySystem } from "./system/generate/MonsterFactorySystem";
import { ShapeGenerateSystem } from "./system/generate/ShapeGenerateSystem";

/** 舞台分层枚举，索引顺序即渲染顺序（越大越靠上） */
export enum EStageLayer {
    /** 地板层 */
    FLOOR = 0,
    /** 实体层（玩家、敌人、子弹等） */
    ENTITY = 1,
    /** 特效层 */
    EFFECT = 2,
    /** 输入层（摇杆触摸节点） */
    INPUT = 3
}

export class ECSHelper {
    /** 四叉树实例 */
    public static quadTree: QT.QuadTree = null;

    private static _world: ecs.World;
    private static _stageNode: Node;
    private static _layers: Node[] = [];
    private static _singleton: ecs.Entity;

    public static get world(): ecs.World {
        return this._world;
    }

    public static get node(): Node {
        return this._stageNode;
    }

    /** 单例实体 */
    private static get singleton(): ecs.Entity {
        if (!this._singleton) {
            this._singleton = this._world.createEmptyEntity();
        }
        return this._singleton;
    }

    /** 获取指定分层节点 */
    public static getLayer(layer: EStageLayer): Node {
        return this._layers[layer];
    }

    /** 由 GameEntry 在启动时设置 stage 节点引用 */
    public static setStageNode(node: Node): void {
        this._stageNode = node;
    }

    /** 初始化 ECS 世界，只能注册一次 */
    public static register(): void {
        if (this._world || !this._stageNode) {
            return;
        }

        // 创建分层节点（索引顺序即渲染顺序）
        const layerNames = ["Floor", "Entity", "Effect", "Input"];
        this._layers = [];
        for (const name of layerNames) {
            const layer = new Node(name);
            layer.layer = 1 << 1;
            this._stageNode.addChild(layer);
            this._layers.push(layer);
        }

        // 初始化四叉树（以屏幕中心为原点）
        this.quadTree = new QT.QuadTree(
            -CORE.Screen.ScreenWidth / 2,
            -CORE.Screen.ScreenHeight / 2,
            CORE.Screen.ScreenWidth,
            CORE.Screen.ScreenHeight
        );

        const world = new ecs.World("world", 1 << 13);

        // 基础系统组
        const basicGroup = new ecs.SystemGroup("BasicSystemGroup", 1);
        basicGroup.addSystem(new AutoAimSystem())
            .addSystem(new MoveSystem())
            .addSystem(new FacingSystem())
            .addSystem(new ShooterSystem())
            .addSystem(new LifeTimeSystem());

        // 生成系统组
        const generateGroup = new ecs.SystemGroup("GenerateSystemGroup", 1);
        generateGroup.addSystem(new MonsterFactorySystem())
            .addSystem(new ShapeGenerateSystem())
            .addSystem(new GraphicsRenderGenerate())
            .addSystem(new ShapeUpdateSystem());

        // 渲染系统组 这个放到最后
        const renderGroup = new ecs.SystemGroup("RenderSystemGroup", 1);
        renderGroup.addSystem(new RenderSystem());

        world.addSystem(basicGroup).addSystem(generateGroup).addSystem(renderGroup);

        world.initialize();
        this._world = world;
    }

    /** 销毁 ECS 世界，下次调用 register() 时重新创建 */
    public static destroy(): void {
        if (!this._world) {
            return;
        }
        this._world.clear();
        this._world = null;
        this._singleton = null;
        this._layers = [];
        this._stageNode = null;

        if (this.quadTree) {
            this.quadTree.clear();
            this.quadTree = null;
        }
    }

    /** 更新四叉树，由 GameWindow 在 world.update(dt) 后调用 */
    public static updateQuadTree(): void {
        if (this.quadTree) {
            this.quadTree.update();
        }
    }

    /** 添加单例组件 */
    public static addSingleton<T extends ecs.Component>(component: ecs.ComponentType<T>): T {
        return this._world.addComponent(this.singleton, component);
    }

    /** 移除单例组件 */
    public static removeSingleton<T extends ecs.Component>(component: ecs.ComponentType<T>): void {
        this._world.removeComponent(this.singleton, component);
    }

    /** 获取单例组件 */
    public static getSingleton<T extends ecs.Component>(component: ecs.ComponentType<T>): T {
        return this._world.getComponent(this.singleton, component);
    }

    public static clear(): void {
        this._world.clear();
        this._singleton = null;
    }
}
