"use client";

import { Config, Device } from "@/lib/types";
import { ReactNode, useState } from "react";
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
  ClipboardPasteIcon,
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

export function UserConfigDialog({
  config,
  setConfig,
  children,
}: {
  config: Config;
  setConfig: (config: Config) => void;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [activeElement, setActiveElement] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Device Settings</DialogTitle>
          <DialogDescription>
            Configure your own E-stim devices.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">
              <UserIcon size={16} /> Your Name
            </Label>
            <Input
              id="name"
              onFocus={() => setActiveElement("name")}
              onBlur={() => setActiveElement(null)}
              className="my-1"
              placeholder="Johnathan Doe"
              value={config.name}
              onChange={(e) => setConfig({ ...config, name: e.target.value })}
            />
            <ShowWhileActive isActive={activeElement === "name"}>
              <p className="text-sm text-muted-foreground">
                Your display name, shown to other users.
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
              value={config.webhook}
              onChange={(e) =>
                setConfig({ ...config, webhook: e.target.value })
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
                <ImportDevice
                  onImport={(importedConfig) => {
                    // ID is generated, so will never match. The webhook shouldn't change though.
                    setConfig({
                      ...config,
                      devices: [
                        ...config.devices.filter(
                          (d) => d.webhook !== importedConfig.webhook
                        ),
                        importedConfig,
                      ],
                    });
                  }}
                />
                <Button
                  onClick={() =>
                    setConfig({
                      ...config,
                      devices: [
                        ...config.devices,
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
            {config.devices.map((device, index) => (
              <ModifyDevice
                key={device.id}
                device={device}
                setDevice={(newDevice) => {
                  const newDevices = [...config.devices];
                  newDevices[index] = newDevice;
                  setConfig({ ...config, devices: newDevices });
                }}
                deleteDevice={() => {
                  const newDevices = config.devices.filter(
                    (_, i) => i !== index
                  );
                  setConfig({ ...config, devices: newDevices });
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

function ImportDevice({ onImport }: { onImport: (config: Device) => void }) {
  const [showInput, setShowInput] = useState(false);
  const [inputValue, setInputValue] = useState("");

  const handleDecode = (text: string) => {
    try {
      // Base64 decode the text
      const decoded = atob(text);
      const importedConfig = JSON.parse(decoded) as Omit<Device, "id">;
      console.log({
        id: v4(),
        ...importedConfig,
      });
      onImport({
        id: v4(),
        ...importedConfig,
      });
    } catch (error) {
      console.log(
        `Failed to import configuration. (${(error as Error).message})`
      );
    }
  };

  const handleClipboardPaste = async () => {
    try {
      // Read the clipboard
      const text = await navigator.clipboard.readText();
      handleDecode(text);
    } catch (error) {
      console.log(`Clipboard access failed. (${(error as Error).message})`);
      setShowInput(true);
    }
  };

  const handleInputSubmit = () => {
    if (inputValue.trim()) {
      handleDecode(inputValue);
      setInputValue("");
      setShowInput(false);
    }
  };

  if (showInput) {
    return (
      <div className="flex gap-2 items-center">
        <Input
          placeholder="Paste code..."
          autoFocus
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              handleInputSubmit();
            }
          }}
          className="w-32"
        />
        <Button variant="default" size="sm" onClick={handleInputSubmit}>
          <SaveIcon size={16} />
        </Button>
      </div>
    );
  }

  return (
    <Button variant="default" size="sm" onClick={handleClipboardPaste}>
      <ClipboardPasteIcon size={16} /> Import
    </Button>
  );
}

function ModifyDevice({
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
