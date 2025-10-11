import { generateCode } from "@/lib/codes";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(request: NextRequest) {
    const { KV_ACCOUNT, KV_ID, KV_TOKEN } = process.env;

    if (!KV_ACCOUNT || !KV_ID || !KV_TOKEN) return NextResponse.json(
        { error: "Cloudflare credentials are not configured." },
        { status: 500 }
    );

    let value: string;
    try {
        value = await request.text();
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to read request body." },
            { status: 400 }
        );
    }
    if (!value) {
        return NextResponse.json({ error: "Request body is empty." }, { status: 400 });
    }

    const key = generateCode();

    const expirationTtl = 24 * 60 * 60; // 24 hours in seconds

    const url = `https://api.cloudflare.com/client/v4/accounts/${KV_ACCOUNT}/storage/kv/namespaces/${KV_ID}/values/${key}?expiration_ttl=${expirationTtl}`;

    const response = await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${KV_TOKEN}`,
            "Content-Type": "text/plain",
        },
        body: value,
    }).catch((error) => {
        console.error("Fetch Error:", error);
        return NextResponse.json(
            { error: "Failed to connect to KV store." },
            { status: 500 }
        );
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudflare API Error:", errorText);
        return NextResponse.json(
            { error: "Failed to write to KV store." },
            { status: response.status }
        );
    }

    return NextResponse.json({ key: key });
}
