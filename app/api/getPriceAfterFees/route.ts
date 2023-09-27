import { NextResponse } from "next/server";

export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
    const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')))
    const address = String(params.get('address'));
    const amount = String(params.get('amount'));

    if (!address) {
        return NextResponse.json("No address provided", { status: 400 });
    }

    const data = await fetch(`https://friendtech-extension-backend.vercel.app/api/getBuyPrice?address=${address}&amount=${amount}`).then(res => res.json());

    return NextResponse.json(data);
}
