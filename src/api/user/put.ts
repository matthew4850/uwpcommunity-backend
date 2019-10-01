import { Request, Response } from "express";
import User, { getUserByDiscordId } from "../../models/User"
import { genericServerError, validateAuthenticationHeader } from "../../common/helpers/generic";
import { GetDiscordIdFromToken } from "../../common/helpers/discord";
import { ErrorStatus, BuildErrorResponse, SuccessStatus, BuildSuccessResponse } from "../../common/helpers/responseHelper";

module.exports = async (req: Request, res: Response) => {
    const body = req.body;

    const authAccess = validateAuthenticationHeader(req, res);
    if (!authAccess) return;

    let discordId = await GetDiscordIdFromToken(authAccess, res);
    if (!discordId) return;

    let bodyCheck = checkBody(body);
    if (bodyCheck !== true) {
        BuildErrorResponse(res, ErrorStatus.MalformedRequest, `Parameter "${bodyCheck}" not provided or malformed`); 
        return;
    }

    updateUser(body, discordId)
        .then(() => {
            BuildSuccessResponse(res, SuccessStatus.Success, "Success");
        })
        .catch((err) => genericServerError(err, res));
};

function checkBody(body: IPutUserRequestBody): true | string {
    if (!body.name) return "name";
    return true;
}

function updateUser(userData: IPutUserRequestBody, discordId: string): Promise<User> {
    return new Promise<User>(async (resolve, reject) => {
        let user = await getUserByDiscordId(discordId);

        if (!user) {
            reject("User not found");
            return;
        }

        user.update(userData)
            .then(resolve)
            .catch(reject);
    });
}

interface IPutUserRequestBody {
    name?: string;
    email?: string;
}