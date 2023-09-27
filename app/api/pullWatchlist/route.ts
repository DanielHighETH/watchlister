import { NextResponse } from "next/server";

export const revalidate = 0;

export async function GET(request: Request): Promise<NextResponse> {
    const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')))
    const token = String(params.get('token'));
    const pageStart = Number(params.get('pageStart')) || 0;

    if (!token) {
        return NextResponse.json("No token provided", { status: 400 });
    }

    try {
        const response = await fetch(`https://prod-api.kosetto.com/watchlist?pageStart=${pageStart}`, {
            headers: {
                Authorization: token
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch data from the watchlist API');
        }

        const data = await response.json();

        if (!data.watchlist || data.watchlist.length === 0) {
            return NextResponse.json([]);
        }

        return NextResponse.json(data.watchlist);
    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json("Error fetching data", { status: 500 });
    }
}
