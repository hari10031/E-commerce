import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function recordOfflineSale(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOfflineSales(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=salesController.d.ts.map