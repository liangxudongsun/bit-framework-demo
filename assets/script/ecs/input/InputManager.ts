/**
 * @Author: Gongxh
 * @Date: 2026-03-23
 * @Description: 输入管理器
 * 管理多个输入源，按优先级选取活跃输入写入 ECS AimInput 组件
 */

import { ecs } from "../../header";
import { AimInput } from "../component/basics/AimInput";
import { IInputSource } from "./IInputSource";

export class InputManager {
    private _world: ecs.World;
    private _playerEntity: ecs.Entity;
    private _sources: IInputSource[] = [];

    constructor(world: ecs.World, playerEntity: ecs.Entity) {
        this._world = world;
        this._playerEntity = playerEntity;
    }

    /** 添加输入源（自动按优先级降序排列） */
    public addSource(source: IInputSource): void {
        this._sources.push(source);
        this._sources.sort((a, b) => b.priority - a.priority);
    }

    /** 移除输入源 */
    public removeSource(source: IInputSource): void {
        const idx = this._sources.indexOf(source);
        if (idx !== -1) {
            this._sources.splice(idx, 1);
        }
        source.dispose();
    }

    /** 轮询所有输入源，将最高优先级的活跃输入写入 AimInput 组件 */
    public update(): void {
        if (!this._world) {
            return;
        }

        let dx = 0;
        let dy = 0;

        // _sources 已按优先级降序排列，取第一个活跃的即可
        for (let i = 0, len = this._sources.length; i < len; i++) {
            const source = this._sources[i];
            if (source.isActive) {
                dx = source.dx;
                dy = source.dy;
                break;
            }
        }

        const aimInput = this._world.getComponent(this._playerEntity, AimInput);
        if (aimInput) {
            aimInput.dx = dx;
            aimInput.dy = dy;
        }
    }

    /** 销毁管理器及所有输入源 */
    public dispose(): void {
        for (let i = 0, len = this._sources.length; i < len; i++) {
            this._sources[i].dispose();
        }
        this._sources.length = 0;
        this._world = null;
    }
}
