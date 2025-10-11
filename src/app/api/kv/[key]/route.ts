import { isCodeValid } from "@/lib/codes";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string }> }
) {
    const { KV_ACCOUNT, KV_ID, KV_TOKEN } = process.env;

    if (!KV_ACCOUNT || !KV_ID || !KV_TOKEN) return NextResponse.json(
        { error: "Cloudflare credentials are not configured." },
        { status: 500 }
    );

    const key = (await params).key;
    if (!key) {
        return NextResponse.json({ error: "Key parameter is missing." }, { status: 400 });
    }
    if (!isCodeValid(key)) {
        return NextResponse.json({ error: "Invalid key format." }, { status: 400 });
    }

    const url = `https://api.cloudflare.com/client/v4/accounts/${KV_ACCOUNT}/storage/kv/namespaces/${KV_ID}/values/${key}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${KV_TOKEN}`,
        },
    }).catch((error) => {
        console.error("Fetch Error:", error);
        return NextResponse.json(
            { error: "Failed to connect to KV store." },
            { status: 500 }
        );
    });

    if (!response.ok) {
        if (response.status === 404) {
            return NextResponse.json(
                { error: "Key not found or has expired." },
                { status: 404 }
            );
        }
        const errorText = await response.text();
        console.error("Cloudflare API Error:", errorText);
        return NextResponse.json(
            { error: "Failed to read from KV store." },
            { status: response.status }
        );
    }

    const value = await response.text();
    try {
        const initialJson = JSON.parse(value);
        const decoded = Buffer.from(initialJson["devices"], "base64").toString("utf-8");
        const json = JSON.parse(decoded);
        return NextResponse.json(json, { status: 200 });
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return NextResponse.json(
            { error: "Stored value is not valid JSON." },
            { status: 500 }
        );
    }
}
