import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getEmployees(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function approveOrRejectEmployee(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function removeEmployee(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=employeeController.d.ts.map