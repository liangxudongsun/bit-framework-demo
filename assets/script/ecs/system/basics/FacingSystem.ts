/**
 * @Author: Gongxh
 * @Date: 2026-03-20
 * @Description: 转向系统，根据 Direction 方向计算角度并设置 Render 渲染节点的朝向
 */
import { ecs } from "../../../header";
import { Direction } from "../../component/basics/Direction";
import { Render } from "../../component/basics/Render";

const { ecsystem } = ecs._ecsdecorator;
const RAD_TO_DEG = 180 / Math.PI;

@ecsystem("FacingSystem", { describe: "根据方向设置 Render 节点朝向，优先使用 Direction，否则使用 Direction" })
export class FacingSystem extends ecs.System {
    protected onInit(): void {
        this.matcher.allOf(Render, Direction);
    }

    public update(_dt: number): void {
        for (const [_entity, render, face] of this.query.iterate2(Render, Direction)) {
            const dx = face.x;
            const dy = face.y;
            // 默认朝上(0,1)对应0度，atan2(x,y)得到偏离Y轴角度，取反适配Cocos逆时针正方向
            const angle = -Math.atan2(dx, dy) * RAD_TO_DEG;
            render.node.setRotationFromEuler(0, 0, angle);
        }
    }
}
