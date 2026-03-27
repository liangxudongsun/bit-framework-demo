/**
 * @Author: Gongxh
 * @Date: 2026-03-18
 * @Description: ECS 小游戏窗口
 * - 打开时在 FGUI stage 组件内创建 ECS 舞台节点，初始化 ECS 世界
 * - 输入委托给 InputManager 处理（控制瞄准方向）
 * - 关闭时清理输入、销毁舞台节点和 ECS 世界
 */

import { Node } from "cc";

import { ECSHelper } from "../../ecs/ECSHelper";
import { InputManager } from "../../ecs/input/InputManager";
import { KeyboardInputSource } from "../../ecs/input/KeyboardInputSource";
import { TouchInputSource } from "../../ecs/input/TouchInputSource";
import { CORE, FGUI, UI } from "../../header";

const { uiclass, uiprop } = UI._uidecorator;

@uiclass("Window", "Game", "GameWindow")
export class GameWindow extends UI.Window {
    @uiprop
    private _stage: FGUI.GComponent;

    private _stageNode: Node;
    private _inputManager: InputManager;

    protected onInit(): void {
        this.adapterType = UI.AdapterType.Full;
        this.type = UI.WindowType.CloseAll;
        this.bgAlpha = 0;
    }

    protected onShow(_userdata?: unknown): void {
        this.setupGame();
    }

    protected onClose(): void {
        this._inputManager?.dispose();
        this._inputManager = null;
        this._stageNode?.destroy();
        this._stageNode = null;
        ECSHelper.destroy();
    }

    // ── 游戏初始化 ─────────────────────────────────────────────

    private setupGame(): void {
        // 在 FGUI stage 组件内创建 CC Node 作为 ECS 世界舞台
        this._stageNode = new Node("ECSStage");
        this._stageNode.layer = 1 << 1;
        this._stage.node.addChild(this._stageNode);

        ECSHelper.setStageNode(this._stageNode);
        ECSHelper.register();

        // 创建玩家实体，固定在屏幕底部
        const halfH = CORE.Screen.ScreenHeight / 2;
        const { entity } = ECSHelper.world.createEntity("Player", {
            Position: { x: 0, y: -halfH + 80 }
        });

        // 注册输入源（用于控制瞄准方向）
        this._inputManager = new InputManager(ECSHelper.world, entity);
        this._inputManager.addSource(new TouchInputSource());
        this._inputManager.addSource(new KeyboardInputSource());
    }

    protected onUpdate(dt?: number): void {
        this._inputManager?.update();
        ECSHelper.world.update(dt);
    }
}
