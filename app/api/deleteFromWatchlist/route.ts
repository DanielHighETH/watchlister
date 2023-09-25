import { NextResponse } from "next/server";

export const revalidate = 0;

export async function DELETE(request: Request): Promise<NextResponse> {
    const params = new URLSearchParams(request.url.slice(request.url.indexOf('?')))
    const token = String(params.get('token'));
    const wallet = String(params.get('wallet'));
    
    if (!token) {
        return NextResponse.json("No token provided", { status: 400 });
    }

    if (!wallet) {
        return NextResponse.json("No wallet provided", { status: 400 });
    }

    const res = await fetch(`https://prod-api.kosetto.com/watchlist-users/${wallet}`, {
        method: 'DELETE',
        headers: {
            Authorization: token,
        },
        body: JSON.stringify({})
    });
    
    const statusCode = res.status;
    
    if(statusCode == 200) {
        return NextResponse.json({success: true },{ status: statusCode });
    } else {
        return NextResponse.json({success: false },{ status: statusCode });
    }


}