/**
 * @Author: Gongxh
 * @Date: 2026-03-23
 * @Description: 怪物工厂系统，每2秒从屏幕顶部外侧生成一个敌人实体
 */
import { CORE, ecs } from "../../../header";
import { ECSHelper } from "../../ECSHelper";

const { ecsystem } = ecs._ecsdecorator;

/** 生成间隔（秒） */
const SPAWN_INTERVAL = 2;

/** 生成位置在屏幕顶部外侧的偏移量 */
const SPAWN_OFFSET_Y = 30;

@ecsystem("MonsterFactorySystem", { describe: "每2秒从屏幕顶部外侧生成一个敌人" })
export class MonsterFactorySystem extends ecs.System {
    /** 累计计时 */
    private _elapsed: number = 0;

    protected onInit(): void {
        // 纯计时生成系统，不查询任何实体
    }

    public update(dt: number): void {
        this._elapsed += dt;
        if (this._elapsed < SPAWN_INTERVAL) {
            return;
        }
        this._elapsed -= SPAWN_INTERVAL;

        // X 在屏幕宽度范围内随机，Y 在屏幕顶部外侧
        const halfW = CORE.Screen.ScreenWidth / 2;
        const halfH = CORE.Screen.ScreenHeight / 2;
        const x = (Math.random() - 0.5) * 2 * halfW;
        const y = halfH + SPAWN_OFFSET_Y;

        ECSHelper.world.createEntity("Enemy", {
            Position: { x, y },
            Direction: { x: 0, y: -1 },
            Speed: { value: 25 }
        });
    }

    protected onDestroy(): void {
        this._elapsed = 0;
    }
}
