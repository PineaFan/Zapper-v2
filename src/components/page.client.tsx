"use client";

import { useEffect, useState } from "react";
import { UserConfigDialog } from "./config";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  CircleIcon,
  Settings2Icon,
  Trash2Icon,
  UploadIcon,
  UsersIcon,
  XIcon,
  ZapIcon,
} from "lucide-react";
import { Config, Device, Shock } from "@/lib/types";
import { Button } from "./ui/button";
import { useDebounce, useLocalStorage } from "react-use";
import _, { isEqual } from "lodash";
import { cn } from "@/lib/utils";
import { Skeleton } from "./ui/skeleton";
import { handleImport, ImportExportPanel } from "./import-export";
import { v4 } from "uuid";
import Image from "next/image";
import { DeviceCard } from "./device-selector";
import Link from "next/link";
import { ZapPanel } from "./zap";
import { generateUrl } from "@/lib/generate-url";
import { ModeToggle } from "./ui/theme-switcher";
import { useRouter, useSearchParams } from "next/navigation";

function ConnectionCard({
  config,
  setConfig,
  target,
}: {
  config: Config;
  setConfig: (config: Config) => void;
  target: string;
}) {
  const devices = config.connections[target].devices.length;

  const name = config.connections[target].name || "Unknown User";
  return (
    <>
      <div className="contents group">
        <div>
          <CircleIcon
            fill="currentColor"
            className={cn("inline mr-2", {
              "text-green-500": devices,
              "text-red-500": !devices,
            })}
            size={16}
          />
          <span className="sr-only">
            {devices ? "connected" : "disconnected"}
          </span>
        </div>
        <div className="overflow-hidden text-ellipsis line-clamp-1 inline-block">
          {name}
        </div>
        <div className="flex items-center">
          <UserConfigDialog
            config={config}
            setConfig={setConfig}
            target={target}
          >
            <Button
              variant="ghost"
              size="icon"
              className="ml-2 h-6 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200"
              aria-label="Edit User"
            >
              <Settings2Icon size={12} />
            </Button>
          </UserConfigDialog>
          <Button
            variant="ghost"
            size="icon"
            className="ml-2 h-6 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200 bg-red-500 hover:bg-red-600 text-white hover:text-white"
            aria-label="Remove User"
            onClick={() => {
              const newConfig = { ...config };
              delete newConfig.connections[target];
              if (newConfig.id === target) {
                newConfig.id = Object.keys(newConfig.connections)[0];
              }
              setConfig(newConfig);
            }}
          >
            <Trash2Icon size={12} />
          </Button>
        </div>

        <div className="w-full h-full" />

        {devices !== undefined ? (
          <span className="ml-4 text-sm text-muted-foreground">
            {devices} device{devices !== 1 ? "s" : ""}
          </span>
        ) : (
          <div />
        )}
      </div>
      {Object.values(config.connections)[
        Object.keys(config.connections).length - 1
      ].id !== target && (
        <div className="col-span-full bg-[var(--border)] h-[1px]" />
      )}
    </>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const migrateConfig = (oldConfig: any) => {
  let config = oldConfig;
  if (oldConfig.version === 1) {
    const newConfig = {
      version: 2,
      id: config.id,
      connections: {
        [config.id]: {
          id: config.id,
          name: config.name,
          webhook: config.webhook,
          devices: config.devices,
        },
        ..._.keyBy(config.connections, "id"),
      },
    };
    config = newConfig;
  }
  return config as Config;
};

const defaultUsername = "New User";
function createDefaultConfig(): Config {
  const id = v4();
  return {
    version: 2,
    id,
    connections: {
      [id]: {
        id,
        name: defaultUsername,
        webhook: "",
        devices: [],
      },
    },
  };
}

export function ControlPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const importCode = searchParams.get("import");

  const [mounted, setMounted] = useState(false);
  const [configStorage, setConfigStorage] = useLocalStorage<Config>(
    "user-config",
    createDefaultConfig()
  );

  const [config, setConfig] = useState<Config | null>(null);

  useDebounce(
    () => {
      if (!config) return;
      setConfigStorage(config);
    },
    500,
    [config]
  );

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

  // Initialize config once configStorage is loaded
  useEffect(() => {
    if (mounted) return;
    if (!configStorage || config !== null) return;

    const migratedConfig =
      configStorage.version === 2
        ? configStorage
        : migrateConfig(configStorage);

    setConfig(migratedConfig);

    // Persist migration if needed
    if (migratedConfig.version === 2 && configStorage.version !== 2) {
      setConfigStorage(migratedConfig);
    }

    if (importCode) {
      fetch(`/api/kv/${importCode}`)
        .then((result) => result.json())
        .then((data) => {
          if (data.error) {
            console.error("Import Error:", data.error);
            return;
          }
          console.log("Import Data:", data);
          const result = handleImport(
            data,
            ["full", "connection", "device"],
            migratedConfig
          );
          if (result) setConfig(result.config);
          router.replace("/");
        });
    }

    setMounted(true);
  }, [configStorage, config, setConfigStorage, importCode, mounted, router]);

  // Sync config changes to storage
  useEffect(() => {
    if (!mounted || !config || isEqual(config, configStorage)) return;
    setConfigStorage(config);
  }, [config, mounted, setConfigStorage, configStorage]);

  if (!mounted || !config) return <Skeleton className="h-screen w-screen" />;

  const selectedOthersDevices = Array.from(selectedDevices).filter((id) => {
    for (const user of Object.values(config.connections)) {
      if (user.devices.find((d) => d.id === id) && user.id !== config.id) {
        return true;
      }
    }
    return false;
  });

  const generateShockArrayFor = (devices: string[]) => {
    const result: { device: Device; webhook: string }[] = [];
    for (const id of devices) {
      for (const user of Object.values(config.connections)) {
        const device = user.devices.find((d) => d.id === id);
        if (device) {
          result.push({ device, webhook: user.webhook });
          break;
        }
      }
    }
    return result;
  };

  const allDevices = Object.values(config.connections).flatMap((user) =>
    user.devices.map((device) => ({ device, webhook: user.webhook }))
  );
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
              {config.connections[config.id].devices.length === 0 &&
                Object.keys(config.connections).length <= 1 &&
                config.connections[config.id].name === defaultUsername && (
                  <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="h-full w-full rounded-md border-4 border-yellow-500 opacity-10 animate-pulse z-10" />
                  </span>
                )}
            </div>
            <ImportExportPanel config={config} setConfig={setConfig}>
              <Button variant="outline">
                <UploadIcon /> Import / Export
              </Button>
            </ImportExportPanel>
            <ModeToggle />
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
              <CardContent className="grid gap-1 grid-cols-[min-content_auto_auto_1fr_max-content_min-content] items-center w-full overflow-hidden">
                {Object.values(config.connections).map((connection) => (
                  <ConnectionCard
                    key={connection.id}
                    config={config}
                    setConfig={setConfig}
                    target={connection.id}
                  />
                ))}
              </CardContent>
            </Card>
            <DeviceCard
              config={config}
              selectedDevices={selectedDevices}
              setSelectedDevices={(d) => setSelectedDevices(d)}
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
      return fetch(url, { credentials: "omit" });
    })
  );
}

function stopDevices(targets: { device: Device; webhook: string }[]) {
  Promise.all(
    targets.map(({ device, webhook }) => {
      const url = generateUrl(webhook, device, nullShock, false);
      return fetch(url, { credentials: "omit" });
    })
  );
}
