import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function listAdmins(_req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getAdmin(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createAdmin(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateAdmin(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function resetAdminPassword(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function setAdminActive(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteAdmin(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=adminManagementController.d.ts.map