import { NextResponse } from "next/server";

export const revalidate = 0;

type User = {
    address: string;
    pfpUrl: string;
    username: string;
    name: string;
};

type Event = {
    trader: User;
    subject: User;
    isBuy: boolean;
    shareAmount: string;
    ethAmount: string;
    createdAt: number;
};

type DataResponse = {
    events: Event[];
};

export async function GET(request: Request): Promise<NextResponse> {
    const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')))
    const token = String(params.get('token'));

    if (!token) {
        return NextResponse.json("No token provided", { status: 400 });
    }

    const data = await fetch('https://prod-api.kosetto.com/global-activity', {
        headers: {
            Authorization: token
        }
    }).then(res => res.json() as Promise<DataResponse>);

    const extractedData: User[] = data.events.flatMap(event => {
        const { trader, subject } = event;
        return [
            {
                address: trader.address,
                pfpUrl: trader.pfpUrl,
                username: trader.username,
                name: trader.name
            },
            {
                address: subject.address,
                pfpUrl: subject.pfpUrl,
                username: subject.username,
                name: subject.name
            }
        ];
    });

    const uniqueData: User[] = extractedData.filter((user, index, self) => 
        index === self.findIndex((t) => t.address === user.address)
    );
    return NextResponse.json(uniqueData);
}
