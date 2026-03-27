/**
 * @Author: Gongxh
 * @Date: 2026-03-27
 * @Description: 自动瞄准系统（预测瞄准）
 * - 有手动输入时：将 AimInput 归一化后写入 Direction
 * - 无手动输入时：根据怪物速度计算拦截点，瞄准预测位置
 * - 无怪物且无输入时：默认朝上 (0, 1)
 */
import { ecs } from "../../../header";
import { AimInput } from "../../component/basics/AimInput";
import { Direction } from "../../component/basics/Direction";
import { Position } from "../../component/basics/Position";
import { Speed } from "../../component/basics/Speed";
import { TagEnemy } from "../../component/tag/TagEnemy";
import { TagHero } from "../../component/tag/TagHero";

const { ecsystem } = ecs._ecsdecorator;

/** 子弹速度，与 Bullet 实体配置保持一致 */
const BULLET_SPEED = 800;

@ecsystem("AutoAimSystem", { describe: "预测瞄准最近怪物，有手动输入时使用输入方向" })
export class AutoAimSystem extends ecs.System {
    private _queryHero: ecs.IQueryResult;

    protected onInit(): void {
        this._queryHero = this.createQuery(m => m.allOf(TagHero, Position, Direction, AimInput));
        this.matcher.allOf(TagEnemy, Position);
    }

    public update(_dt: number): void {
        for (const [_entity, _tag, heroPos, dir, aimInput] of this._queryHero.iterate4(TagHero, Position, Direction, AimInput)) {
            if (aimInput.isActive) {
                // 玩家有手动输入，归一化后写入 Direction
                const len = Math.sqrt(aimInput.dx * aimInput.dx + aimInput.dy * aimInput.dy);
                dir.x = aimInput.dx / len;
                dir.y = aimInput.dy / len;
            } else {
                // 预测瞄准最近怪物
                this.aimAtNearestEnemy(heroPos, dir);
            }
        }
    }

    /** 查找最近敌人，计算拦截点并更新朝向，无敌人时默认朝上 */
    private aimAtNearestEnemy(heroPos: Position, dir: Direction): void {
        let minDistSq = Infinity;
        let bestDx = 0;
        let bestDy = 1; // 默认朝上

        for (const [entity, _tag, enemyPos] of this.query.iterate2(TagEnemy, Position)) {
            const rx = enemyPos.x - heroPos.x;
            const ry = enemyPos.y - heroPos.y;
            const distSq = rx * rx + ry * ry;
            if (distSq >= minDistSq) {
                continue;
            }

            // 获取敌人的运动速度
            const enemyDir = this.world.getComponent(entity, Direction);
            const enemySpeed = this.world.getComponent(entity, Speed);

            if (enemyDir && enemySpeed && enemySpeed.value > 0) {
                // 计算预测瞄准方向
                const result = this.calcInterceptDir(
                    rx, ry,
                    enemyDir.x * enemySpeed.value, enemyDir.y * enemySpeed.value,
                    BULLET_SPEED
                );
                if (result) {
                    minDistSq = distSq;
                    bestDx = result.x;
                    bestDy = result.y;
                    continue;
                }
            }

            // 无法拦截或敌人静止，直接瞄准当前位置
            minDistSq = distSq;
            const len = Math.sqrt(distSq);
            bestDx = rx / len;
            bestDy = ry / len;
        }

        dir.x = bestDx;
        dir.y = bestDy;
    }

    /**
     * 解二次方程求拦截方向
     * @param rx 目标相对 X 偏移
     * @param ry 目标相对 Y 偏移
     * @param vx 目标 X 速度分量
     * @param vy 目标 Y 速度分量
     * @param bulletSpeed 子弹速度
     * @returns 归一化方向，无解时返回 null
     */
    private calcInterceptDir(
        rx: number, ry: number,
        vx: number, vy: number,
        bulletSpeed: number
    ): { x: number; y: number } | null {
        // 拦截方程：(vx²+vy²-bs²)t² + 2(rx·vx+ry·vy)t + (rx²+ry²) = 0
        const a = vx * vx + vy * vy - bulletSpeed * bulletSpeed;
        const b = 2 * (rx * vx + ry * vy);
        const c = rx * rx + ry * ry;

        let t: number;

        if (Math.abs(a) < 1e-6) {
            // 退化为一次方程
            if (Math.abs(b) < 1e-6) {
                return null;
            }
            t = -c / b;
        } else {
            const discriminant = b * b - 4 * a * c;
            if (discriminant < 0) {
                return null;
            }
            const sqrtD = Math.sqrt(discriminant);
            const t1 = (-b - sqrtD) / (2 * a);
            const t2 = (-b + sqrtD) / (2 * a);

            // 取最小正根
            if (t1 > 0 && t2 > 0) {
                t = Math.min(t1, t2);
            } else if (t1 > 0) {
                t = t1;
            } else if (t2 > 0) {
                t = t2;
            } else {
                return null;
            }
        }

        if (t <= 0) {
            return null;
        }

        // 预测位置 = 当前相对位置 + 敌人速度 * 拦截时间
        const px = rx + vx * t;
        const py = ry + vy * t;
        const len = Math.sqrt(px * px + py * py);
        if (len < 1e-6) {
            return null;
        }

        return { x: px / len, y: py / len };
    }
}
