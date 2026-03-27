/**
 * @Author: Gongxh
 * @Date: 2026-03-27
 * @Description: 瞄准输入组件，记录玩家手动瞄准方向
 */
import { ecs } from "../../../header";

const { ecsclass, ecsprop } = ecs._ecsdecorator;

@ecsclass("AimInput", { describe: "瞄准输入组件（玩家手动控制射击方向）" })
export class AimInput extends ecs.Component {
    /** X 轴输入 [-1, 1]，0 表示无输入 */
    @ecsprop({ type: "float", defaultValue: 0 })
    public dx: number = 0;

    /** Y 轴输入 [-1, 1]，0 表示无输入 */
    @ecsprop({ type: "float", defaultValue: 0 })
    public dy: number = 0;

    /** 当前是否有有效的手动输入 */
    public get isActive(): boolean {
        return this.dx !== 0 || this.dy !== 0;
    }

    public reset(): void {
        this.dx = 0;
        this.dy = 0;
    }
}
