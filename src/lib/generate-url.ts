import { Device, Shock } from "./types";

export function generateUrl(
  webhook: string,
  device: Device,
  shock: Shock,
  supportsFrequency: boolean = true,
) {
  const params = new URLSearchParams();
  params.append("action", `zapper-v2.0-${device.webhook}`);
  params.append("power", shock.intensity.toString());
  params.append("duration", shock.duration.toString());
  params.append("ramp", shock.rampTime.toString());
  if (supportsFrequency && shock.frequency) {
    params.append("frequency", shock.frequency.toString());
  }
  const url = new URL(`https://webhook.xtoys.app/${webhook}`);
  url.search = params.toString();
  return url.toString();
}
