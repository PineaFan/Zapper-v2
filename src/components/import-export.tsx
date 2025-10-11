"use client";

import { Config, ConfigSchema, DeviceSchema, UserSchema } from "@/lib/types";
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
  CheckIcon,
  ClipboardCheckIcon,
  ClipboardCopyIcon,
  ClipboardPasteIcon,
  ClipboardXIcon,
  Link2Icon,
  RefreshCcwDotIcon,
  SquareEqual,
  XIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ShowWhileActive } from "./show-while-active";
import { Switch } from "./ui/switch";
import { v4 } from "uuid";
import _ from "lodash";
import { ChangeIcon, ChangeText } from "./change-icon";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { Spinner } from "./ui/spinner";

type SupportedDevices = Array<"device" | "connection" | "full">;
export function handleImport(
  data: string | object,
  supportedDevices: SupportedDevices,
  config: Config,
  target?: string
): {
  config: Config;
  modified: boolean | null;
  status: string;
  type?: SupportedDevices[number];
} {
  let json;
  try {
    if (typeof data !== "string") {
      json = data;
    } else {
      const decodedJson = Buffer.from(data, "base64").toString("utf-8");
      json = JSON.parse(decodedJson);
    }
  } catch (TypeError) {
    console.error("Failed to decode import data:", TypeError);
    return { config, modified: false, status: "Failed to decode" };
  }
  const clonedConfig = _.cloneDeep(config);
  const withID = { ...json, id: json.id ?? v4() };

  const type = (() => {
    console.log("Attempting to detect import type...", withID);
    try {
      if (DeviceSchema.safeParse(withID).success) return "device";
      // It could also be a device[]
      if (
        Array.isArray(json) &&
        json.every((d) => DeviceSchema.safeParse(d).success)
      )
        return "device";
      if (UserSchema.safeParse(withID).success) return "connection";
      if (ConfigSchema.safeParse(json).success) return "full";
    } catch {
      return null;
    }
    return null;
  })();

  if (!type || !supportedDevices.includes(type))
    return { config, modified: false, status: "Unsupported device type" };

  let statusText = "";

  if (type === "device") {
    const asArray = Array.isArray(json) ? json : [withID];

    statusText =
      (clonedConfig.connections[clonedConfig.id].devices.length
        ? `Updating ${asArray.length} device `
        : "Importing new device") + (Array.isArray(json) ? "s" : "");

    asArray.forEach((device) => {
      // Find the user and device with the matching webhook
      const userWithDevice = Object.values(clonedConfig.connections).find((u) =>
        u.devices.some(
          (d) => d.webhook === device.webhook || d.id === device.id
        )
      );

      if (userWithDevice) {
        // Update the device's name/location in place
        userWithDevice.devices = userWithDevice.devices.map((d) =>
          d.webhook === device.webhook || d.id === device.id
            ? {
                ...d,
                name: device.name ?? d.name,
                location: device.location ?? d.location,
              }
            : d
        );
        clonedConfig.connections[userWithDevice.id] = userWithDevice;
      } else {
        // Add the device to the current user's devices
        clonedConfig.connections[target || clonedConfig.id].devices.push(
          DeviceSchema.parse(device)
        );
      }
    });
  } else if (type === "connection") {
    const parsedUser = UserSchema.parse(withID);
    // Just set the key
    statusText = clonedConfig.connections[parsedUser.id]
      ? `Replacing existing devices for ${parsedUser.name}`
      : `Importing devices for new user ${parsedUser.name}`;
    clonedConfig.connections[parsedUser.id] = {
      ...parsedUser,
      devices: parsedUser.devices || [],
    };
  } else if (type === "full") {
    const parsedConfig = ConfigSchema.parse(json);
    statusText = "Overwriting entire configuration";
    return { config: parsedConfig, modified: true, status: statusText, type };
  }

  return {
    config: clonedConfig,
    modified: _.isEqual(clonedConfig, config) ? null : true,
    status: statusText || "Imported successfully",
    type,
  };
}

export function ImportExportPanel({
  config,
  setConfig,
  children,
}: {
  config: Config;
  setConfig: (config: Config) => void;
  children: React.ReactNode;
}) {
  const [copied, setCopied] = useState<{
    button: "devices" | "all" | "import";
    status: "copied" | "failed";
  } | null>(null);
  const [importData, setImportData] = useState<string>("");
  const [open, setOpen] = useState(false);
  const [imported, setImported] = useState<null | boolean>(null);

  const [deviceEncoded, setDeviceEncoded] = useState("");
  const [fullEncoded, setFullEncoded] = useState("");

  const deviceRef = useRef<HTMLInputElement>(null);
  const fullRef = useRef<HTMLInputElement>(null);
  const [toggled, setToggled] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ownDevices = config.connections[config.id];
    const deviceData = JSON.stringify(ownDevices);
    const fullData = JSON.stringify(config);
    setDeviceEncoded(Buffer.from(deviceData, "utf-8").toString("base64"));
    setFullEncoded(Buffer.from(fullData, "utf-8").toString("base64"));
  }, [open, setDeviceEncoded, setFullEncoded, config]);

  const [importResult, setImportResult] = useState<ReturnType<
    typeof handleImport
  > | null>(null);

  const onValueChange = useCallback(() => {
    if (!importData) return;
    console.log("Recalculating");
    const result = handleImport(
      importData,
      ["device", "connection", "full"],
      config
    );
    setImportResult(result);
  }, [config, importData]);

  useEffect(onValueChange, [importData, onValueChange]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share Devices</DialogTitle>
          <DialogDescription>
            {"Export data for other users, or import a friend's data."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="share">Share Your Devices</Label>
            <div className="w-full flex flex-row gap-2 items-center mt-1">
              <Input
                id="share"
                ref={deviceRef}
                className="my-1"
                placeholder="No data provided"
                value={deviceEncoded}
                readOnly
                onClick={() => deviceRef.current?.select()}
              />
              <Button
                variant={
                  copied?.button === "devices"
                    ? copied.status === "copied"
                      ? "success"
                      : "destructive"
                    : "default"
                }
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(deviceEncoded);
                    setCopied({ button: "devices", status: "copied" });
                  } catch {
                    setCopied({ button: "devices", status: "failed" });
                  }
                  setTimeout(() => setCopied(null), 2000);
                }}
              >
                {(() => {
                  if (copied?.button !== "devices")
                    return <ClipboardCopyIcon />;
                  if (copied.status === "copied") return <CheckIcon />;
                  return <ClipboardXIcon />;
                })()}
                Copy
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="export">Export to a New Browser</Label>
            <div className="w-full flex flex-row gap-2 items-center mt-1">
              <Input
                id="share"
                ref={fullRef}
                className="my-1"
                placeholder="No data provided"
                value={fullEncoded}
                readOnly
                onClick={() => fullRef.current?.select()}
              />
              <Button
                variant={
                  copied?.button === "all"
                    ? copied.status === "copied"
                      ? "success"
                      : "destructive"
                    : "default"
                }
                onClick={() => {
                  try {
                    navigator.clipboard.writeText(fullEncoded);
                    setCopied({ button: "all", status: "copied" });
                  } catch {
                    setCopied({ button: "all", status: "failed" });
                  }
                  setTimeout(() => setCopied(null), 2000);
                }}
              >
                {(() => {
                  if (copied?.button !== "all") return <ClipboardCopyIcon />;
                  if (copied.status === "copied") return <CheckIcon />;
                  return <ClipboardXIcon />;
                })()}
                Copy
              </Button>
            </div>
          </div>
          <TemporaryComponent devices={deviceEncoded} />
          <div>
            <Label htmlFor="import">Import</Label>
            <div className="w-full flex flex-row gap-2 items-center mt-1">
              <Button
                onClick={() => {
                  try {
                    navigator.clipboard
                      .readText()
                      .then((text) => setImportData(text));
                  } catch {
                    setCopied({ button: "import", status: "failed" });
                    setTimeout(() => setCopied(null), 3000);
                  }
                }}
                variant={
                  copied?.button === "import" ? "destructive" : "default"
                }
              >
                {copied?.button !== "import" ? (
                  <ClipboardPasteIcon />
                ) : (
                  <ClipboardXIcon />
                )}
              </Button>
              <Input
                id="import"
                placeholder="Paste data here"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
              />
              <Button
                disabled={
                  (importResult?.type === "full" && !toggled) || !importData
                }
                size="sm"
                onClick={() => {
                  if (!importResult) return;
                  if (importResult.type === "full" && !toggled) {
                    return;
                  }
                  setConfig(importResult.config);
                  setImported(true);
                  setTimeout(() => setImported(null), 5000);
                  setImportData("");
                  setImportResult(null);
                  if (toggled) setToggled(false);
                }}
                variant={
                  importResult?.type === "full" ? "destructive" : "default"
                }
              >
                {imported ? (
                  <CheckIcon />
                ) : importResult?.modified === null ||
                  importResult?.type === "full" ? (
                  <RefreshCcwDotIcon />
                ) : (
                  <Link2Icon />
                )}
                {imported
                  ? "Imported"
                  : importResult?.modified === null ||
                    importResult?.type === "full"
                  ? "Overwrite"
                  : "Import"}
              </Button>
            </div>
            <AnimatePresence>
              {importData && importResult && importResult.type !== "full" && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginTop: 0 }}
                  animate={{ opacity: 1, height: "auto", marginTop: 4 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  key={importResult.status}
                  className={cn(
                    "text-xs",
                    importResult.modified === false ? "text-red-500" : ""
                  )}
                >
                  {importResult.status}
                </motion.div>
              )}
            </AnimatePresence>
            <ShowWhileActive isActive={importResult?.type === "full"}>
              <div className="flex items-center mt-1">
                <Switch
                  id="confirm"
                  checked={toggled}
                  onCheckedChange={setToggled}
                />
                <Label
                  htmlFor="confirm"
                  className="ml-2 select-none text-xs"
                >{`I'm sure I want to overwrite all my data.`}</Label>
              </div>
              <div className="text-xs text-red-600 mt-1">
                Importing a full configuration. This will overwrite all of your
                current data.
              </div>
            </ShowWhileActive>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ImportDeviceButton({
  target,
  config,
  setConfig,
}: {
  target: string;
  config: Config;
  setConfig: (newConfig: Config) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [status, setStatus] = useState<undefined | null | boolean>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const onImport = async () => {
    let text;
    try {
      text = inputRef.current?.value || (await navigator.clipboard.readText());
    } catch {
      setShowInput(true);
      setTimeout(() => inputRef.current?.focus(), 0);
      return;
    }
    const newConfig = handleImport(text, ["device"], config, target);
    setConfig(newConfig.config);
    setStatus(newConfig.modified);
    if (inputRef.current) inputRef.current.value = "";
    setTimeout(() => setStatus(undefined), 2000);
  };

  return (
    <>
      {showInput && (
        <Input ref={inputRef} placeholder="Paste here" className="ml-2" />
      )}
      <Button
        variant={
          status === true
            ? "success"
            : status === false
            ? "destructive"
            : "default"
        }
        size="sm"
        onClick={onImport}
      >
        <ChangeIcon changeKey={`${status}`} withScale>
          {(() => {
            if (status === undefined) return <ClipboardPasteIcon size={16} />;
            if (status === null) return <SquareEqual size={16} />;
            if (status === true) return <CheckIcon size={16} />;
            return <XIcon size={16} />;
          })()}
        </ChangeIcon>
        {showInput ? "" : "Import"}
      </Button>
    </>
  );
}

function TemporaryComponent({ devices }: { devices: string }) {
  const [code, setCode] = useState<string | null>(null);
  const [status, setStatus] = useState<
    "idle" | "loading" | "error" | "success" | "copied"
  >("idle");
  const [url, setUrl] = useState("");
  const link = `${url}?import=${code}`;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setCode(null), [devices]);

  const onClick = () => {
    if (status === "success") {
      inputRef.current?.select();
      try {
        navigator.clipboard.writeText(link);
        setStatus("copied");
      } catch {
        setStatus("error");
      }
      return;
    }
    if (status === "loading") return;
    setStatus("loading");
    fetch(`/api/kv`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ devices, ttl: 86400 }),
    })
      .then((res) => res.json())
      .then((data) => {
        setStatus("success");
        if (data.key) setCode(data.key);
      })
      .catch((err) => {
        console.error("Failed to generate temporary code:", err);
        setStatus("error");
      });
  };

  useEffect(() => {
    setUrl(`${window.location.href}`);
  }, []);

  return (
    <div>
      <Label htmlFor="export">Share Import Link</Label>
      <div className="w-full flex flex-row gap-2 items-center mt-1">
        <Input
          id="friend"
          className="my-1"
          placeholder="Generate an import link"
          value={code ? link : ""}
          readOnly
          ref={inputRef}
        />
        <Button
          variant={
            status === "success" || status === "copied"
              ? "success"
              : status === "error"
              ? "default"
              : "secondary"
          }
          onClick={onClick}
          disabled={(!!code || !devices) && status !== "success"}
        >
          <ChangeIcon changeKey={status} withScale>
            {status === "idle" && <Link2Icon />}
            {status === "loading" && <Spinner />}
            {status === "success" && <CheckIcon />}
            {status === "error" && <XIcon />}
            {status === "copied" && <ClipboardCheckIcon />}
          </ChangeIcon>
          <ChangeText>
            {status === "success"
              ? "Copy"
              : status === "copied"
              ? "Copied!"
              : "Generate Code"}
          </ChangeText>
        </Button>
      </div>
      <p className="text-muted-foreground text-xs">
        The generated link will last 24 hours. This will give users permanent
        access to your devices until you change your webhook ID in XToys.
      </p>
      <b className="text-muted-foreground text-xs">
        Your device setup will be sent via{" "}
        <Link
          href="https://vercel.com/legal/privacy-policy"
          className="text-blue-700 dark:text-blue-600 underline visited:text-purple-600"
        >
          Vercel
        </Link>
        {" and stored with "}
        <Link
          href="https://www.cloudflare.com/en-gb/privacypolicy/"
          className="text-blue-700 dark:text-blue-600 underline visited:text-purple-600"
        >
          Cloudflare
        </Link>
        .
      </b>
    </div>
  );
}
