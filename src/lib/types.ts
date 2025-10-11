import * as z from "zod";


/**
 * Creates a Zod schema that clamps a number within the specified range
 * before validating it.
 * @param min The minimum allowed value.
 * @param max The maximum allowed value.
 * @returns A Zod number schema with preprocessing for clamping.
 */
const createClampedNumberSchema = (min: number, max: number) =>
    z.preprocess((val) => {
        if (typeof val === "number") {
            return Math.max(min, Math.min(val, max));
        }
        // Let the underlying schema handle the type error if it's not a number
        return val;
    }, z.number());

export const DeviceSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    location: z.string().nullable(),
    webhook: z.string(),
    supportsFrequency: z.boolean(),
});

export type Device = z.infer<typeof DeviceSchema>;

export const UserSchema = z.object({
    id: z.uuid(),
    name: z.string(),
    webhook: z.string(),
    devices: z.array(DeviceSchema),
});

export type User = z.infer<typeof UserSchema>;

export const ConfigSchema = z.object({
    version: z.number().min(1),
    id: z.uuid(),
    connections: z.record(z.uuid(), UserSchema)
});

export type Config = z.infer<typeof ConfigSchema>;

export const ShockSchema = z.object({
    name: z.string().nullable(),
    intensity: createClampedNumberSchema(0, 100),
    duration: createClampedNumberSchema(0, Infinity),
    rampTime: createClampedNumberSchema(0, Infinity),
    frequency: createClampedNumberSchema(10, 100).nullable()
});

export type Shock = z.infer<typeof ShockSchema>;

export type DispatchShock = {
    devices: Device[];
    webhook: string;
}
