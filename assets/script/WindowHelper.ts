/**
 * @Author: Gongxh
 * @Date: 2026-07-28
 * @Description: 窗口帮助类
 */

import { UI } from "./header";

/** 需要手动管理资源加载和卸载的ui包包名列表 */
const MANUAL_LOAD_PKGS = [
    "Basics"
];

export class WindowHelper {
    private static _isRegistered = false;
    public static register(): void {
        if (this._isRegistered) {
            return;
        }
        this._isRegistered = true;
        // 添加需要手动管理资源加载和卸载的ui包包名
        for (const pkg of MANUAL_LOAD_PKGS) {
            UI.WindowManager.addManualPackage(pkg);
        }

        // 拿到所有已注册窗口去重后的包名
        const pkgNames = new Set<string>();
        UI._uidecorator.getWindowMaps().forEach((value) => {
            pkgNames.add(value.res.pkg);
        });

        pkgNames.forEach((pkgName) => {
            if (MANUAL_LOAD_PKGS.indexOf(pkgName) < 0) {
                // 参数1: 包名
                // 参数2: bundle名
                // 参数3: 资源在bundle中的路径 (不包含包名本身)
                UI.WindowManager.setPackageInfo(pkgName, "fgui", "");
            }
        });

        /** 设置窗口打开时的等待回调函数 */
        this.initWaitWindow();
    }

    public static initWaitWindow(): void {
        UI.WindowManager.setWaitWindowCallbacks({
            showWaitWindow: (_content?: string) => {
                // UI.WindowManager.showWindow(Wait, content);
            },
            hideWaitWindow: () => {
                // UI.WindowManager.closeWindow(Wait);
            }
        });
    }
}
