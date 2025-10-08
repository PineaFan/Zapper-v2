"use client";

import { useEffect, useState } from "react";
import { UserConfigDialog } from "./config";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  CircleIcon,
  EditIcon,
  Settings2Icon,
  UploadIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { Config, Device, Shock, User } from "@/lib/types";
import { Button } from "./ui/button";
import { useLocalStorage } from "react-use";
import { isEqual } from "lodash";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { ImportExportPanel } from "./import-export";
import { v4 } from "uuid";
import Image from "next/image";
import { DeviceCard, EditUserDialog } from "./device-selector";
import Link from "next/link";
import { ZapPanel } from "./zap";
import { generateUrl } from "@/lib/generate-url";

function ConnectionCard({
  status,
  name,
  devices,
  remove,
  setName,
  last,
  noShift,
}: {
  status: "connected" | "disconnected";
  id: string;
  name: string;
  devices?: number;
  remove?: () => void;
  setName?: (name: string) => void;
  last?: boolean;
  noShift?: boolean;
}) {
  return (
    <>
      <div className="contents group">
        <div>
          <CircleIcon
            fill="currentColor"
            className={cn("inline mr-2", {
              "text-green-500": status === "connected",
              "text-red-500": status === "disconnected",
            })}
            size={16}
          />
          <span className="sr-only">{status}</span>
        </div>
        <div>
          {name}
          {setName && (
            <EditUserDialog currentName={name} setName={setName}>
              <Button
                variant="ghost"
                size="icon"
                className="ml-2 h-6 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200"
                aria-label="Edit Name"
              >
                <EditIcon size={12} />
              </Button>
            </EditUserDialog>
          )}
        </div>

        <div />

        {devices !== undefined ? (
          <span className="ml-4 text-sm text-muted-foreground">
            {devices} device{devices !== 1 ? "s" : ""}
          </span>
        ) : (
          <div />
        )}

        {!noShift ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={remove}
            className={cn("ml-2", remove === undefined ? "invisible" : "")}
            aria-label="Remove User"
          >
            <XIcon size={16} />
          </Button>
        ) : (
          <div />
        )}
      </div>
      {!last && <div className="col-span-full bg-[var(--border)] h-[1px]" />}
    </>
  );
}

export function ControlPanel() {
  const [configStorage, setConfigStorage] = useLocalStorage<Config>(
    "user-config",
    {
      version: 1,
      id: v4(),
      name: "New User",
      webhook: "",
      devices: [],
      connections: [],
    }
  );
  const [config, setConfig] = useState<Config>(configStorage!);
  const [mounted, setMounted] = useState(false);
  const [selectedDevices, setSelectedDevices] = useState<Set<string>>(
    new Set()
  );
  const [currentShock, setCurrentShock] = useState<Shock>({
    name: null,
    intensity: 10,
    frequency: 50,
    duration: 1000,
    rampTime: 0,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isEqual(config, configStorage)) return;
    setConfigStorage(config);
  }, [config, setConfigStorage, configStorage]);

  if (!mounted) return <Skeleton className="h-screen w-screen" />;

  const selectedOthersDevices = Array.from(selectedDevices).filter(
    (id) => !id.startsWith(config.id)
  );

  const generateShockArrayFor = (devices: string[]) => {
    const result: { device: Device; webhook: string }[] = [];
    for (const id of devices) {
      const arr = id.split("-");
      const userId = arr.slice(0, 5).join("-");
      const deviceId = arr.slice(5).join("-");
      if (userId === config.id) {
        const device = config.devices.find((d) => d.id === deviceId);
        if (device) result.push({ device, webhook: config.webhook });
      } else {
        const user = config.connections.find((u) => u.id === userId);
        if (!user) continue;
        const device = user.devices.find((d) => d.id === deviceId);
        if (device) result.push({ device, webhook: user.webhook });
      }
    }
    return result;
  };

  const allDevices = [
    ...config.devices.map((d) => ({ device: d, webhook: config.webhook })),
    ...config.connections.flatMap((u) =>
      u.devices.map((d) => ({ device: d, webhook: u.webhook }))
    ),
  ];

  return (
    <div className="h-screen w-full p-4 grid grid-rows-[auto_1fr] grid-cols-1">
      <div className="mx-auto w-full max-w-7xl space-y-4">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center">
              <Image
                src="/Zapper.svg"
                alt=""
                width={32}
                height={32}
                className="mr-2"
              />
              <h1 className="text-3xl font-bold text-balance flex items-center">
                <span className="text-primary/80">Zapper</span>
                <span className="text-muted-foreground text-sm ml-2">
                  V2.0 Beta
                </span>
              </h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Multi-user zap controller
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <div className="relative flex items-center">
              <UserConfigDialog config={config} setConfig={setConfig}>
                <Button variant="outline" className="relative z-10">
                  <Settings2Icon /> Device Settings
                </Button>
              </UserConfigDialog>
              {config.devices.length === 0 &&
                config.connections.length === 0 &&
                config.name === "New User" && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="h-full w-full rounded-md border-4 border-yellow-500 opacity-10 animate-pulse z-10" />
                  </span>
                )}
            </div>
            <ImportExportPanel
              config={config}
              addUser={(user: User) => {
                setConfig({
                  ...config,
                  connections: [
                    ...config.connections.filter((c) => c.id !== user.id),
                    user,
                  ],
                });
              }}
              setConfig={setConfig}
            >
              <Button variant="outline">
                <UploadIcon /> Import / Export
              </Button>
            </ImportExportPanel>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-[min(550px,33.33%)_1fr] gap-4">
          <div className="flex flex-col max-w-full items-center gap-4">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>
                  <UsersIcon className="inline" size={20} />
                  Connected Users
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1 grid-cols-[min-content_max-content_1fr_max-content_min-content] items-center">
                <ConnectionCard
                  status={config.devices.length ? "connected" : "disconnected"}
                  name={config.name || "You"}
                  devices={config.devices.length}
                  id={config.id}
                  setName={(name) => setConfig({ ...config, name })}
                  last={config.connections.length === 0}
                  noShift={config.connections.length === 0}
                />
                {config.connections.map((connection, i) => (
                  <ConnectionCard
                    key={connection.id}
                    status={
                      connection.devices.length ? "connected" : "disconnected"
                    }
                    name={connection.name || "Unknown User"}
                    id={connection.id}
                    setName={(name) => {
                      setConfig({
                        ...config,
                        connections: config.connections.map((c) =>
                          c.id === connection.id ? { ...c, name } : c
                        ),
                      });
                    }}
                    devices={connection.devices.length}
                    remove={() => {
                      setConfig({
                        ...config,
                        connections: config.connections.filter(
                          (c) => c.id !== connection.id
                        ),
                      });
                    }}
                    last={i === config.connections.length - 1}
                  />
                ))}
              </CardContent>
            </Card>
            <DeviceCard
              config={config}
              selectedDevices={selectedDevices}
              setSelectedDevices={(d) => setSelectedDevices(d)}
              setConfig={setConfig}
            />
          </div>
          <div className="flex flex-col gap-4">
            <Card className="w-full h-full">
              <CardHeader>
                <CardTitle>
                  <ZapIcon className="inline" size={20} /> Shock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ZapPanel
                  currentShock={currentShock}
                  setCurrentShock={setCurrentShock}
                />

                <div className="grid grid-cols-[minmax(min-content,_1fr)_minmax(min-content,_max-content)] gap-2">
                  <Button
                    variant="default"
                    disabled={selectedDevices.size === 0}
                    onClick={() =>
                      shockDevices(
                        generateShockArrayFor(Array.from(selectedDevices)),
                        currentShock
                      )
                    }
                  >
                    <ZapIcon />
                    Shock Selected ({selectedDevices.size} device
                    {selectedDevices.size !== 1 ? "s" : ""})
                  </Button>
                  <Button
                    variant="outline"
                    disabled={selectedOthersDevices.length === 0}
                    onClick={() =>
                      shockDevices(
                        generateShockArrayFor(selectedOthersDevices),
                        currentShock
                      )
                    }
                  >
                    <UsersIcon />
                    Shock Everyone Else ({selectedOthersDevices.length} device
                    {selectedOthersDevices.length !== 1 ? "s" : ""})
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => stopDevices(allDevices)}
                  >
                    <XIcon />
                    Stop All
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-500 border-2"
                    disabled={selectedDevices.size === 0}
                    onClick={() =>
                      stopDevices(
                        generateShockArrayFor(Array.from(selectedDevices))
                      )
                    }
                  >
                    <XIcon />
                    Stop Selected ({selectedDevices.size} device
                    {selectedDevices.size !== 1 ? "s" : ""})
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        <div className="w-full flex flex-col items-center justify-center mb-4 text-xs text-center border p-4 rounded-xl bg-muted text-balance space-y-2">
          <p className="text-balance">
            E-Stim devices can be dangerous. Please use them responsibly,
            including by following safety guidelines from both XToys and your
            toy{"'"}s manufacturer.
          </p>
          <p className="text-balance">
            Check areas for signs of burns, and be careful of muscle fatigue,
            strain, or spasms. Make informed choices about where you place your
            electrodes. If you have any known medical conditions, take those
            into account when placing your electrodes or deciding whether to
            participate in E-stim.
          </p>
          <p className="text-balance">
            Remember to keep everything <b>Safe, Sane,</b> and <b>Consensual</b>
            . Read more about{" "}
            <Link
              href="https://en.wikipedia.org/wiki/Risk-aware_consensual_kink"
              target="_blank"
              className="text-blue-700 dark:text-blue-600 underline visited:text-purple-600 font-bold"
            >
              RACK
            </Link>{" "}
            and{" "}
            <Link
              href="https://www.burnettfoundation.org.nz/articles/sex/safe-sane-consensual/"
              target="_blank"
              className="text-blue-700 dark:text-blue-600 underline visited:text-purple-600 font-bold"
            >
              SSC
            </Link>{" "}
            here.
          </p>
        </div>
      </div>
    </div>
  );
}

const nullShock: Shock = {
  name: null,
  intensity: 0,
  duration: 0,
  rampTime: 0,
  frequency: null,
};

function shockDevices(
  targets: { device: Device; webhook: string }[],
  shock: Shock
) {
  Promise.all(
    targets.map(({ device, webhook }) => {
      const url = generateUrl(webhook, device, shock);
      return fetch(url);
    })
  );
}

function stopDevices(targets: { device: Device; webhook: string }[]) {
  Promise.all(
    targets.map(({ device, webhook }) => {
      const url = generateUrl(webhook, device, nullShock, false);
      return fetch(url);
    })
  );
}
