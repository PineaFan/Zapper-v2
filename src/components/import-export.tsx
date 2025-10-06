"use client";

import { Config, User } from "@/lib/types";
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
  ClipboardCopyIcon,
  ClipboardPasteIcon,
  ClipboardXIcon,
  Link2Icon,
  RefreshCcwDotIcon,
} from "lucide-react";
import { useState } from "react";
import { ShowWhileActive } from "./show-while-active";
import { Switch } from "./ui/switch";

export function ImportExportPanel({
  config,
  addUser,
  setConfig,
  children,
}: {
  config: Config;
  addUser: (user: User) => void;
  setConfig: (config: Config) => void;
  children: React.ReactNode;
}) {
  const encoded = Buffer.from(
    JSON.stringify({
      id: config.id,
      name: config.name,
      webhook: config.webhook,
      devices: config.devices,
    }),
  ).toString("base64");
  const fullEncoded = Buffer.from(JSON.stringify(config)).toString("base64");
  const [copied, setCopied] = useState<{
    button: "devices" | "all" | "import";
    status: "copied" | "failed";
  } | null>(null);
  const [importData, setImportData] = useState<string>("");
  const [imported, setImported] = useState<boolean | null | "full">(null);
  const [confirmed, setConfirmed] = useState(false);

  const isImportValid = (() => {
    try {
      const decoded = Buffer.from(importData, "base64").toString("utf-8");
      const parsed = JSON.parse(decoded);
      if (typeof parsed === "object" && parsed.version) {
        return "full";
      }
      console.log(parsed);
      const isValid =
        typeof parsed === "object" &&
        parsed !== null &&
        "id" in parsed &&
        "name" in parsed &&
        "webhook" in parsed &&
        "devices" in parsed &&
        Array.isArray(parsed.devices);
      if (parsed.id === config.id) return false;
      const isDuplicate = config.connections.some((u) => u.id === parsed.id);
      if (isDuplicate) return isValid ? null : false;
      return isValid;
    } catch {
      return false;
    }
  })();

  return (
    <Dialog>
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
                className="my-1"
                placeholder="No data provided"
                value={encoded}
                readOnly
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
                    navigator.clipboard.writeText(encoded);
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
                className="my-1"
                placeholder="No data provided"
                value={fullEncoded}
                readOnly
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
                  (!isImportValid && isImportValid !== null) ||
                  (isImportValid === "full" && !confirmed)
                }
                onClick={() => {
                  if (!isImportValid && isImportValid !== null) return;
                  if (isImportValid === "full") {
                    setConfig(
                      JSON.parse(
                        Buffer.from(importData, "base64").toString("utf-8"),
                      ),
                    );
                    setImported("full");
                    setImported(true);
                    setTimeout(() => setImported(null), 5000);
                    setConfirmed(false);
                    setImportData("");
                    return;
                  }
                  const decoded = Buffer.from(importData, "base64").toString(
                    "utf-8",
                  );
                  const parsed = JSON.parse(decoded);
                  addUser(parsed);
                  setImportData("");
                  setImported(true);
                  setTimeout(() => setImported(null), 3000);
                }}
                variant={isImportValid === "full" ? "destructive" : "default"}
              >
                {imported ? (
                  <CheckIcon />
                ) : isImportValid === null || isImportValid === "full" ? (
                  <RefreshCcwDotIcon />
                ) : (
                  <Link2Icon />
                )}
                {imported
                  ? "Imported"
                  : isImportValid === null || isImportValid === "full"
                    ? "Overwrite"
                    : "Import"}
              </Button>
            </div>
            <ShowWhileActive isActive={isImportValid === null}>
              <div className="text-xs text-yellow-600 mt-1">
                This person already has devices added. Importing will overwrite
                their current ones.
              </div>
            </ShowWhileActive>
            <ShowWhileActive
              isActive={
                isImportValid === false &&
                importData.length > 0 &&
                importData !== encoded
              }
            >
              <div className="text-xs text-red-600 mt-1">
                Invalid import data.
              </div>
            </ShowWhileActive>
            <ShowWhileActive isActive={importData === encoded}>
              <div className="text-xs text-yellow-600 mt-1 text-pretty">
                You may not use your own data, but this will work when shared
                with someone else.
              </div>
            </ShowWhileActive>
            <ShowWhileActive isActive={isImportValid === true}>
              <div className="text-xs text-green-600 mt-1">
                Data is ready to import!
              </div>
            </ShowWhileActive>
            <ShowWhileActive isActive={isImportValid === "full"}>
              <div className="flex items-center mt-1">
                <Switch
                  id="confirm"
                  checked={confirmed}
                  onCheckedChange={setConfirmed}
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
