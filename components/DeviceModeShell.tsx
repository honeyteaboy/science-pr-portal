"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Maximize2, Monitor, Smartphone, Tablet } from "lucide-react";

type DeviceMode = "desktop" | "tablet" | "mobile" | "fluid";

const DEVICE_OPTIONS: Array<{
  mode: DeviceMode;
  label: string;
  width: string;
  Icon: typeof Monitor;
}> = [
  { mode: "desktop", label: "Desktop", width: "1440px", Icon: Monitor },
  { mode: "tablet", label: "Tablet", width: "768px", Icon: Tablet },
  { mode: "mobile", label: "Mobile", width: "390px", Icon: Smartphone },
  { mode: "fluid", label: "Fluid", width: "100%", Icon: Maximize2 },
];

const STORAGE_KEY = "science-pr-portal-device-mode";

export function DeviceModeShell({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<DeviceMode>("fluid");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved && DEVICE_OPTIONS.some((option) => option.mode === saved)) {
      setMode(saved as DeviceMode);
    }
  }, []);

  const selectMode = (nextMode: DeviceMode) => {
    setMode(nextMode);
    window.localStorage.setItem(STORAGE_KEY, nextMode);
  };

  return (
    <div className="device-mode-shell" data-device-mode={mode}>
      <div className="device-mode-toolbar no-print" role="region" aria-label="เลือกขนาดการแสดงผล">
        <div className="device-mode-toolbar-inner">
          <span className="device-mode-label">มุมมองหน้าจอ</span>
          <div className="device-mode-options" role="group" aria-label="ขนาดหน้าจอ">
            {DEVICE_OPTIONS.map(({ mode: optionMode, label, width, Icon }) => {
              const active = mode === optionMode;
              return (
                <button
                  key={optionMode}
                  type="button"
                  onClick={() => selectMode(optionMode)}
                  aria-pressed={active}
                  title={`${label} (${width})`}
                  className={`device-mode-button ${active ? "is-active" : ""}`}
                >
                  <Icon aria-hidden="true" size={15} />
                  <span>{label}</span>
                </button>
              );
            })}
          </div>
          <span className="device-mode-current">
            {DEVICE_OPTIONS.find((option) => option.mode === mode)?.width}
          </span>
        </div>
      </div>
      <div className="device-mode-frame">{children}</div>
    </div>
  );
}
