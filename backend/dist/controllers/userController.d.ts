import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function listUsers(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteUser(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function resetUserPassword(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function setUserActive(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=userController.d.ts.map