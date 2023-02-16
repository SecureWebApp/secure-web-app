import { Request, Response } from "express";
import CSRFToken from "./shared/csrfTokenClass";

export type CSRFToken = CSRFToken

/**
 * Generates and binds a CSRFToken to a response. Note that one response can be bound to multiple tokens if required.
 * @param {import('express').Request} req The request that caused the passed response.
 * @param {import('express').Response} res The response object that will be sent to the client.
 * @param {?string} target The target of the token, this value should be equal to the target property of the form element. Default value is `req.baseUrl`.
 * @param {?string} method The http method of the token, this value should be equal to the action property of the form element. Default value is `POST`.
 * @returns {CSRFToken | false} The generated token or false if token generation / binding failed
 */
export type csrf = (req: Request, res: Response, target?: string, method?: string) => CSRFToken

/**
 * This function validates a request's anti-csrf tokens.
 * 
 * Possible error codes:
 * - 1: Client has no established session
 * - 2: No token exists that matches the request (target, method & token name)
 * - 3: The token matching the request is expired
 * - 4: The token values do not match
 * 
 * @param {import('express').Request} req The request
 * @param {?CSRFToken} token The csrf token to validate with. If null the token will be fetched from the global cache.
 * @returns {number} 0 if the request passed all anti-csrf checks, an error code otherwise.
 */
export type validate = (req: Request, res: Response, token?: CSRFToken) => number

export type CSRF = { csrf: csrf, validate: validate }
