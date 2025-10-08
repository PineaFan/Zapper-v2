"use client";

import type { Config, User } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import {
  Table2Icon,
  ZapIcon,
  WavesIcon,
  ZapOffIcon,
  CircleSlashIcon,
  EditIcon,
  SaveIcon,
  ListIndentIncreaseIcon,
  ListXIcon,
} from "lucide-react";
import { Label } from "./ui/label";
import { Badge } from "./ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";
import { Switch } from "./ui/switch";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { ChangeIcon } from "./change-icon";

const icons = {
  enabled: {
    frequency: ZapIcon,
    flat: WavesIcon,
  },
  disabled: {
    frequency: ZapOffIcon,
    flat: CircleSlashIcon,
  },
};

export function DeviceCard({
  config,
  selectedDevices,
  setSelectedDevices,
  setConfig,
}: {
  config: Config;
  selectedDevices: Set<string>;
  setSelectedDevices: (devices: Set<string>) => void;
  setConfig: (config: Config) => void;
}) {
  // Used to indicate the default state of the device, without any overrides
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});
  const [disabledUsers, setDisabledUsers] = useState<Set<string>>(new Set());
  const [isolateChannel, setIsolatedChannel] = useState<string | null>(null);
  const [isolatedUser, setIsolatedUser] = useState<string | null>(null);

  const users = (
    config
      ? [
          {
            id: config.id,
            name: config.name,
            devices: config.devices || [],
          } as User,
          ...(config.connections || []),
        ]
      : []
  ).filter((u) => u.devices.length > 0);

  const toggleUser = (userId: string) => {
    const newDisabledUsers = new Set(disabledUsers);
    if (newDisabledUsers.has(userId)) {
      newDisabledUsers.delete(userId);
    } else {
      newDisabledUsers.add(userId);
    }
    setDisabledUsers(newDisabledUsers);

    if (newDisabledUsers.has(userId)) {
      // Deselect all devices for the user, without modifying toggleStates
      const newSelectedDevices = new Set(selectedDevices);
      users
        .find((u) => u.id === userId)
        ?.devices.forEach((device) => {
          const deviceKey = `${userId}-${device.id}`;
          newSelectedDevices.delete(deviceKey);
        });
      setSelectedDevices(newSelectedDevices);
    } else {
      // Set the devices for the user back to their toggleStates
      const newSelectedDevices = new Set(selectedDevices);
      users
        .find((u) => u.id === userId)
        ?.devices.forEach((device) => {
          const deviceKey = `${userId}-${device.id}`;
          if (deviceKey in toggleStates) {
            if (toggleStates[deviceKey]) {
              newSelectedDevices.add(deviceKey);
            } else {
              newSelectedDevices.delete(deviceKey);
            }
          }
        });
      setSelectedDevices(newSelectedDevices);
    }
  };

  const toggleDevice = (deviceKey: string) => {
    const newSelectedDevices = new Set(selectedDevices);
    if (newSelectedDevices.has(deviceKey)) {
      newSelectedDevices.delete(deviceKey);
      setToggleStates({
        ...toggleStates,
        [deviceKey]: false,
      });
    } else {
      newSelectedDevices.add(deviceKey);
      setToggleStates({
        ...toggleStates,
        [deviceKey]: true,
      });
    }
    setSelectedDevices(newSelectedDevices);
  };

  const getEnabledDeviceCount = (user: User) => {
    return user.devices.filter((device) =>
      selectedDevices.has(`${user.id}-${device.id}`)
    ).length;
  };

  const isDeviceEffectivelyEnabled = (deviceKey: string, userId: string) => {
    if (isolateChannel) {
      // Only enable the device whose key matches the isolated channel's key
      return deviceKey === `${userId}-${isolateChannel}`;
    }
    if (isolatedUser && isolatedUser !== userId) {
      return false;
    }
    if (disabledUsers.has(userId) && !(isolatedUser === userId)) {
      return false;
    }
    if (deviceKey in toggleStates) {
      return toggleStates[deviceKey];
    }
    return selectedDevices.has(deviceKey);
  };

  const userOwnsIsolatedDevice = (user: User) => {
    if (!isolateChannel) return false;
    return user.devices.some((device) => device.id === isolateChannel);
  };

  return (
    <Card className="w-full h-full">
      <CardHeader>
        <CardTitle>
          <Table2Icon className="inline" size={20} />
          Devices
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No users configured. Add a user to get started.
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="space-y-3">
              <div className="flex items-center gap-3 pb-2 border-b border-border group">
                <Switch
                  id={`user-${user.id}`}
                  checked={
                    !disabledUsers.has(user.id) ||
                    userOwnsIsolatedDevice(user) ||
                    isolatedUser === user.id
                  }
                  onCheckedChange={() => {
                    if (userOwnsIsolatedDevice(user)) {
                      setIsolatedChannel(null);
                      if (!disabledUsers.has(user.id)) toggleUser(user.id);
                      return;
                    }
                    if (isolatedUser === user.id) {
                      setIsolatedUser(null);
                      if (!disabledUsers.has(user.id)) toggleUser(user.id);
                      return;
                    }
                    toggleUser(user.id);
                  }}
                  className="cursor-pointer"
                  disabled={
                    (isolateChannel !== null &&
                      !userOwnsIsolatedDevice(user)) ||
                    (isolatedUser !== null && isolatedUser !== user.id)
                  }
                  aria-label="Toggle User"
                />
                <Label
                  htmlFor={`user-${user.id}`}
                  className="font-semibold text-base cursor-pointer"
                >
                  {user.name}
                </Label>
                <Button
                  variant={isolatedUser === user.id ? "default" : "ghost"}
                  size="sm"
                  className="h-6 w-8"
                  onClick={() => {
                    setIsolatedChannel(null);

                    if (isolatedUser === user.id) {
                      const restoredDevices = new Set<string>();
                      users.forEach((u) => {
                        if (!disabledUsers.has(u.id)) {
                          u.devices.forEach((d) => {
                            const key = `${u.id}-${d.id}`;
                            if (toggleStates[key]) {
                              restoredDevices.add(key);
                            }
                          });
                        }
                      });
                      setIsolatedUser(null);
                      setSelectedDevices(restoredDevices);
                    } else {
                      setIsolatedUser(user.id);
                      const maskedDevices = new Set<string>();
                      user.devices.forEach((d) => {
                        const key = `${user.id}-${d.id}`;
                        if (toggleStates[key]) {
                          maskedDevices.add(key);
                        }
                      });
                      setSelectedDevices(maskedDevices);
                    }
                  }}
                  aria-label={isolatedUser === user.id ? "Un-isolate User" : "Isolate User"}
                >
                  <ChangeIcon
                    changeKey={`isolate-user-${isolatedUser}-${user.id}`}
                  >
                    {isolatedUser === user.id ? (
                      <ListXIcon size={12} />
                    ) : (
                      <ListIndentIncreaseIcon size={12} />
                    )}
                  </ChangeIcon>
                </Button>
                <EditNameDialog
                  currentName={user.name}
                  setName={(name) => {
                    if (user.id === config.id) {
                      setConfig({ ...config, name });
                    } else {
                      setConfig({
                        ...config,
                        connections: config.connections.map((c) =>
                          c.id === user.id ? { ...c, name } : c
                        ),
                      });
                    }
                  }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-8 opacity-0 group-hover:opacity-100 transition-all duration-200"
                    aria-label="Edit Name"
                  >
                    <EditIcon size={12} />
                  </Button>
                </EditNameDialog>
                <div className="flex-1" />
                <Badge variant="outline" className="text-xs">
                  {getEnabledDeviceCount(user)} / {user.devices.length} enabled
                </Badge>
              </div>

              <div className="w-full pl-4">
                <div className="grid gap-x-2 w-full items-center auto-rows-fr grid-cols-[min-content_min-content_minmax(min-content,_max-content)_1fr_minmax(min-content,_max-content)]">
                  {user.devices.map((device) => {
                    const deviceKey = `${user.id}-${device.id}`;
                    const isSelected = toggleStates[deviceKey];
                    const isEffectivelyEnabled = isDeviceEffectivelyEnabled(
                      deviceKey,
                      user.id
                    );

                    return (
                      <div key={device.id} className="contents">
                        <Switch
                          id={deviceKey}
                          className="cursor-pointer"
                          checked={isSelected || isolateChannel === device.id}
                          disabled={
                            (isolatedUser !== user.id &&
                              disabledUsers.has(user.id) &&
                              !userOwnsIsolatedDevice(user)) ||
                            (isolateChannel !== null &&
                              isolateChannel !== device.id) ||
                            (isolatedUser !== null && isolatedUser !== user.id)
                          }
                          onCheckedChange={() => {
                            if (isolateChannel === device.id) {
                              setIsolatedChannel(null);
                              if (isSelected) toggleDevice(deviceKey);
                              return;
                            }
                            toggleDevice(deviceKey);
                          }}
                        />
                        <Button
                          variant={
                            isolateChannel === device.id ? "default" : "ghost"
                          }
                          size="sm"
                          className="h-6 w-8"
                          onClick={() => {
                            setIsolatedUser(null);
                            const deviceKey = `${user.id}-${device.id}`;
                            if (isolateChannel === device.id) {
                              setIsolatedChannel(null);
                              const restoredDevices = new Set<string>();
                              users.forEach((u) => {
                                if (!disabledUsers.has(u.id)) {
                                  u.devices.forEach((d) => {
                                    const key = `${u.id}-${d.id}`;
                                    if (toggleStates[key]) {
                                      restoredDevices.add(key);
                                    }
                                  });
                                }
                              });
                              setSelectedDevices(restoredDevices);
                            } else {
                              setIsolatedChannel(device.id);
                              setSelectedDevices(new Set([deviceKey]));
                            }
                          }}
                        >
                          <ChangeIcon
                            changeKey={`isolate-${isolateChannel}-${device.id}`}
                          >
                            {isolateChannel === device.id ? (
                              <ListXIcon size={12} />
                            ) : (
                              <ListIndentIncreaseIcon size={12} />
                            )}
                          </ChangeIcon>
                        </Button>
                        <Label
                          htmlFor={deviceKey}
                          className="cursor-pointer text-sm duration-200 min-w-max text-pretty"
                          style={{ minWidth: 0 }}
                        >
                          {device.location || device.name || "Unnamed Device"}
                        </Label>
                        <div />
                        <div className="justify-end flex">
                          <Tooltip>
                            <TooltipContent side="right" align="center">
                              {device.location && (
                                <p>Device Location: {device.location}</p>
                              )}
                              {device.name && <p>Device Name: {device.name}</p>}
                              <p>Device ID: {device.webhook}</p>
                            </TooltipContent>
                            <TooltipTrigger>
                              <div className="justify-end flex gap-2 items-center overflow-y-hidden">
                                <span
                                  className="text-xs width-full text-muted-foreground font-mono overflow-ellipsis line-clamp-2 text-end"
                                  style={{ overflow: "unset" }}
                                >
                                  {device.name}
                                </span>
                                <ChangeIcon
                                  changeKey={`${isEffectivelyEnabled}-${device.supportsFrequency}`}
                                  withScale={!device.supportsFrequency}
                                >
                                  {(() => {
                                    const IconComponent =
                                      icons[
                                        isEffectivelyEnabled
                                          ? "enabled"
                                          : "disabled"
                                      ][
                                        device.supportsFrequency
                                          ? "frequency"
                                          : "flat"
                                      ];
                                    return (
                                      <IconComponent
                                        size={16}
                                        className={
                                          isEffectivelyEnabled
                                            ? "text-green-600 dark:text-green-500"
                                            : isSelected
                                            ? "text-orange-600 dark:text-orange-500"
                                            : "text-red-600 dark:text-red-500"
                                        }
                                      />
                                    );
                                  })()}
                                </ChangeIcon>
                              </div>
                            </TooltipTrigger>
                          </Tooltip>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export function EditNameDialog({
  setName,
  currentName,
  children,
}: {
  setName: (name: string) => void;
  currentName: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [nameInput, setNameInput] = useState(currentName);
  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Name</DialogTitle>
          <DialogDescription>Change the name of the user.</DialogDescription>
        </DialogHeader>
        <Input
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
        <DialogFooter>
          <Button
            size="sm"
            disabled={
              nameInput.trim().length === 0 || nameInput === currentName
            }
            onClick={() => {
              setName(nameInput);
              setIsOpen(false);
            }}
          >
            <SaveIcon />
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
