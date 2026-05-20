import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getDashboardStats(_req: AuthRequest, res: Response): Promise<void>;
export declare function getSalesTimeline(_req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getInventory(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getEmployeePerformance(_req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getSalesSummary(_req: AuthRequest, res: Response): Promise<void>;
export declare function getCategoryInventory(_req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getCategorySales(_req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=analyticsController.d.ts.map