import { _decorator, Asset, JsonAsset, Node, sys } from "cc";

import { Debug } from "./Debug";
import { ASSETS, CORE, ecs, FGUI, UI } from "./header";
import { HomeWindow } from "./UI/HomeWindow";
import { WindowHelper } from "./WindowHelper";

const { ccclass, property, menu } = _decorator;

@ccclass("GameEntry")
@menu("bit/GameEntry")
export class GameEntry extends CORE.CocosEntry {
    @property(Node)
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private root: Node = null;
    @property(JsonAsset)
    // eslint-disable-next-line @typescript-eslint/naming-convention
    private entityConfig: JsonAsset = null;

    public async onInit(): Promise<void> {
        let deviceId = sys.localStorage.getItem("xBBres") as string;
        if (!deviceId || deviceId === "") {
            deviceId = "browser@" + Date.now().toString();
            sys.localStorage.setItem("xBBres", deviceId);
        }
        CORE.Platform.deviceId = deviceId;
        Debug.register();
        WindowHelper.register();
        ecs.Data.parse(this.entityConfig.json as Record<string, unknown>);

        this.loadBasicsRes().then(() => {
            this.intoGame();
        });
    }

    /** 加载基础资源 */
    private async loadBasicsRes(): Promise<void> {
        return new Promise((resolve, reject) => {
            const configs = [
                // 加载必须的UI包
                { path: "manual", type: Asset, isFile: false, bundle: "fgui" }
            ];
            const assetLoader = new ASSETS.AssetLoader("basics-res");
            assetLoader.setCallbacks({
                complete: () => {
                    FGUI.UIPackage.addPackage(ASSETS.AssetPool.getBundle("fgui"), "manual/Basics");
                    resolve();
                },
                progress: (_percent: number) => {

                },
                fail: (code: number, msg: string) => {
                    reject(new Error(`load basics res fail: ${code} ${msg}`));
                }
            });
            assetLoader.start(configs);
        });
    }

    private intoGame(): void {
        UI.WindowManager.showWindow(HomeWindow, "这是一个测试窗口").then(() => {
            this.root.active = false;
            CORE.log("窗口显示成功");
        }).catch((err: Error) => {
            CORE.log("窗口显示失败", err.message);
        });
    }
}
