import * as cookie from "cookie"
import type { EndpointOutput } from "@sveltejs/kit";
import { checkToken, getUserInfo } from "$lib/global";

export async function get({ request }): Promise<EndpointOutput> {
    const cookies = cookie.parse(request.headers.get("cookie") || '');
    
    let authResult = await checkToken(cookies.auth);

    if (authResult == "notoken" || authResult == "invalid") {
        return {
            status: 302
        }
    }

    let id = parseInt(authResult);

    let user = await getUserInfo(id);
    return {
        body: JSON.stringify(user),
        status: 200
    }
};