/**
 * @Author: Gongxh
 * @Date: 2026-03-20
 * @Description: 射击系统，根据 Shooter 冷却计时和 ShootPattern 弹道配置自动创建子弹实体
 */
import { ecs } from "../../../header";
import { Direction } from "../../component/basics/Direction";
import { Position } from "../../component/basics/Position";
import { ShootCycle } from "../../component/shoot/ShootCycle";
import { Shooter } from "../../component/shoot/Shooter";
import { EShootType, ShootPattern } from "../../component/shoot/ShootPattern";

const { ecsystem } = ecs._ecsdecorator;
const DEG_TO_RAD = Math.PI / 180;

@ecsystem("ShooterSystem", { describe: "根据 Shooter 冷却计时和 ShootPattern 配置自动创建子弹" })
export class ShooterSystem extends ecs.System {
    protected onInit(): void {
        this.matcher.allOf(Shooter, ShootPattern, Direction, Position);
    }

    public update(dt: number): void {
        for (const [entity, shooter, pattern, face, pos] of this.query.iterate4(Shooter, ShootPattern, Direction, Position)) {
            // ShootCycle：周期到时触发一次散射，然后重置周期
            const cycle = this.world.getComponent(entity, ShootCycle);
            if (cycle) {
                cycle.elapsed += dt;
                if (cycle.elapsed >= cycle.singleDuration) {
                    cycle.elapsed = 0;
                    this.spawnScatter(pos, face, pattern);
                    shooter.elapsed = 0;
                    continue;
                }
            }

            // 单发冷却
            shooter.elapsed += dt;
            if (shooter.elapsed < shooter.cooldown) {
                continue;
            }
            shooter.elapsed = 0;

            this.shoot(pattern, face, pos);
        }
    }

    /** 根据弹道配置发射子弹 */
    private shoot(pattern: ShootPattern, face: Direction, pos: Position): void {
        switch (pattern.type) {
            case EShootType.SINGLE:
                this.spawnBullet(pos, face.x, face.y);
                break;
            case EShootType.SCATTER:
                this.spawnScatter(pos, face, pattern);
                break;
            default:
                this.spawnBullet(pos, face.x, face.y);
                break;
        }
    }

    /** 散射：将 count 颗子弹均匀分布在 spreadAngle 夹角内 */
    private spawnScatter(pos: Position, face: Direction, pattern: ShootPattern): void {
        const count = pattern.bulletCount;
        const spreadAngle = pattern.spreadAngle;

        if (count <= 1) {
            this.spawnBullet(pos, face.x, face.y);
            return;
        }

        const halfSpread = spreadAngle * 0.5;
        const step = spreadAngle / (count - 1);

        for (let i = 0; i < count; i++) {
            const offsetDeg = -halfSpread + step * i;
            const offsetRad = offsetDeg * DEG_TO_RAD;
            const cos = Math.cos(offsetRad);
            const sin = Math.sin(offsetRad);
            // 2D 旋转矩阵：x' = x*cos - y*sin, y' = x*sin + y*cos
            const bx = face.x * cos - face.y * sin;
            const by = face.x * sin + face.y * cos;
            this.spawnBullet(pos, bx, by);
        }
    }

    /** 创建一颗子弹实体并设置位置和方向 */
    private spawnBullet(pos: Position, dirX: number, dirY: number): void {
        this.world.createEntity("Bullet", {
            Position: {
                x: pos.x,
                y: pos.y
            },
            Direction: {
                x: dirX,
                y: dirY
            }
        });
    }
}
