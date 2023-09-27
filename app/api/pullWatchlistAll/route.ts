import { NextResponse } from "next/server";

export const revalidate = 0;

type User = {
    pfpUrl: string;
    username: string;
    name: string;
    subject: string;
    price: string;
    lastMessageTime: string;
    change24H: string;
};

export async function GET(request: Request): Promise<NextResponse> {
    const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')))
    const token = String(params.get('token'));
    let pageStart = Number(params.get('pageStart')) || 100;

    if (!token) {
        return NextResponse.json("No token provided", { status: 400 });
    }

    let allData: User[] = [];
    let hasMoreData = true;

    try {
        while (hasMoreData) {
            const response = await fetch(`https://prod-api.kosetto.com/watchlist?pageStart=${pageStart}`, {
                headers: {
                    Authorization: token
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch data from the watchlist API');
            }

            const data = await response.json();

            if (data.watchlist && data.watchlist.length > 0) {
                allData = [...allData, ...data.watchlist];
                pageStart += 100; 
            } else {
                hasMoreData = false;
            }
        }

        const uniqueData: User[] = allData.filter((user, index, self) => 
            index === self.findIndex((t) => t.subject === user.subject)
        );

        return NextResponse.json(uniqueData);
    } catch (error) {
        console.error("Error fetching data:", error);
        return NextResponse.json("Error fetching data", { status: 500 });
    }
}
