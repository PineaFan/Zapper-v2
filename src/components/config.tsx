"use client";

import { Config, Device } from "@/lib/types";
import { ReactNode, useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  ExternalLinkIcon,
  ListIcon,
  Plus,
  SaveIcon,
  Trash2Icon,
  UserIcon,
  WebhookIcon,
} from "lucide-react";
import { ShowWhileActive } from "./show-while-active";
import Link from "next/link";
import { Switch } from "./ui/switch";
import { motion } from "framer-motion";
import { v4 } from "uuid";
import { useDebounce } from "react-use";
import { isEqual } from "lodash";
import { ImportDeviceButton } from "./import-export";

export function UserConfigDialog({
  config,
  setConfig,
  target,
  children,
}: {
  config: Config;
  setConfig: (config: Config) => void;
  target?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [activeElement, setActiveElement] = useState<string | null>(null);
  // Local state to allow for debouncing
  const [componentConfig, setComponentConfig] = useState(config);

  // Sync local state if the parent's prop changes
  useEffect(() => {
    setComponentConfig(config);
  }, [config]);

  useDebounce(
    () => {
      // Only call the parent's setConfig if there's a difference
      if (!isEqual(config, componentConfig)) {
        setConfig(componentConfig);
      }
    },
    500,
    [componentConfig]
  );

  const userInfo = componentConfig.connections[target || componentConfig.id];
  if (!userInfo) return null;
  const isOwn = userInfo.id === componentConfig.id;

  const modifyUserConfig = (newInfo: typeof userInfo) => {
    const newConfig = {
      ...componentConfig,
      connections: {
        ...componentConfig.connections,
        [target || componentConfig.id]: newInfo,
      },
    };
    setComponentConfig(newConfig);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Device Settings</DialogTitle>
          <DialogDescription>
            Configure {isOwn ? "your" : `${userInfo.name}'s`} info and devices.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">
              <UserIcon size={16} /> Name
            </Label>
            <Input
              id="name"
              onFocus={() => setActiveElement("name")}
              onBlur={() => setActiveElement(null)}
              className="my-1"
              placeholder="Johnathan Doe"
              value={userInfo.name}
              onChange={(e) =>
                modifyUserConfig({ ...userInfo, name: e.target.value })
              }
            />
            <ShowWhileActive isActive={activeElement === "name"}>
              <p className="text-sm text-muted-foreground">
                {isOwn
                  ? "Your display name, shown to other users."
                  : "Name of the user in your device list."}
              </p>
            </ShowWhileActive>
          </div>
          <div>
            <Label htmlFor="webhook">
              <WebhookIcon size={16} /> Webhook ID
            </Label>
            <Input
              id="webhook"
              onFocus={() => setActiveElement("webhook")}
              onBlur={() => setActiveElement(null)}
              className="my-1"
              placeholder="abc123xyz"
              value={userInfo.webhook}
              onChange={(e) =>
                modifyUserConfig({ ...userInfo, webhook: e.target.value })
              }
            />
            <ShowWhileActive isActive={activeElement === "webhook"}>
              <p className="text-sm text-muted-foreground">
                Your personal Webhook ID, found in XToys.
                <Link
                  href="https://xtoys.app/scripts/-OaVY67-YP3fYTO-aw2P"
                  target="_blank"
                  className="ml-1 underline text-blue-500"
                >
                  Add block.
                  <ExternalLinkIcon className="inline-block mb-1 ml-1 h-4 w-4" />
                </Link>
              </p>
            </ShowWhileActive>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Label>
                <ListIcon size={16} /> Devices
              </Label>
              <div className="flex flex-row gap-2">
                <ImportDeviceButton
                  target={target || componentConfig.id}
                  config={componentConfig}
                  setConfig={setComponentConfig}
                />
                <Button
                  onClick={() =>
                    modifyUserConfig({
                      ...userInfo,
                      devices: [
                        ...userInfo.devices,
                        {
                          id: v4(),
                          name: "",
                          webhook: "",
                          location: null,
                          supportsFrequency: false,
                        },
                      ],
                    })
                  }
                  size="sm"
                  variant="outline"
                >
                  <Plus size={16} />
                  Add Device
                </Button>
              </div>
            </div>
            {userInfo.devices.map((device, index) => (
              <ModifyDevice
                key={device.id}
                device={device}
                setDevice={(newDevice) => {
                  const newDevices = [...userInfo.devices];
                  newDevices[index] = newDevice;
                  modifyUserConfig({ ...userInfo, devices: newDevices });
                }}
                deleteDevice={() => {
                  const newDevices = userInfo.devices.filter(
                    (_, i) => i !== index
                  );
                  modifyUserConfig({ ...userInfo, devices: newDevices });
                }}
              />
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button onClick={() => setOpen(false)}>
            <SaveIcon /> Save & Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ModifyDevice({
  device,
  setDevice,
  deleteDevice,
}: {
  device: Device;
  setDevice: (device: Device) => void;
  deleteDevice: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="bg-muted p-4 border-2 rounded-lg space-y-2">
      <div>
        <Label htmlFor={`device-name-${device.id}`}>Device Name</Label>
        <Input
          id={`device-name-${device.id}`}
          className="my-1 bg-background"
          value={device.name}
          onChange={(e) => setDevice({ ...device, name: e.target.value })}
          placeholder="Coyote Channel A"
        />
      </div>
      <div>
        <Label htmlFor={`device-id-${device.id}`}>Device ID</Label>
        <Input
          id={`device-id-${device.id}`}
          className="my-1 bg-background"
          value={device.webhook}
          onChange={(e) => setDevice({ ...device, webhook: e.target.value })}
          placeholder="XToys device ID"
        />
      </div>
      <div>
        <Label htmlFor={`device-location-${device.id}`}>Location</Label>
        <Input
          id={`device-location-${device.id}`}
          className="my-1 bg-background"
          value={device.location ?? ""}
          onChange={(e) =>
            setDevice({
              ...device,
              location: e.target.value.trim() === "" ? null : e.target.value,
            })
          }
          placeholder="E.g. Left Thigh"
        />
      </div>
      <div className="flex items-center space-x-2">
        <Label htmlFor={`supports-frequency-${device.id}`}>
          Supports frequency control?
        </Label>
        <Switch
          id={`supports-frequency-${device.id}`}
          checked={device.supportsFrequency}
          onCheckedChange={(checked) =>
            setDevice({ ...device, supportsFrequency: checked })
          }
        />
      </div>
      <Button
        onClick={() => {
          if (confirmDelete || (device.name === "" && device.webhook === "")) {
            deleteDevice();
          } else {
            setConfirmDelete(true);
            setTimeout(() => setConfirmDelete(false), 5000);
          }
        }}
        variant="destructive"
        size="sm"
        className="flex items-center relative min-w-[120px] px-2"
      >
        <Trash2Icon className="h-4 w-4 mr-2" />
        <motion.span
          initial={false}
          animate={{
            opacity: confirmDelete ? 0 : 1,
            x: confirmDelete ? 8 : 0,
          }}
          transition={{ duration: 0.2 }}
        >
          Remove Device
        </motion.span>
        <motion.span
          initial={false}
          animate={{
            opacity: confirmDelete ? 1 : 0,
            x: confirmDelete ? 0 : -8,
          }}
          transition={{ duration: 0.2 }}
          className="absolute left-8"
        >
          Click to confirm
        </motion.span>
      </Button>
    </div>
  );
}
