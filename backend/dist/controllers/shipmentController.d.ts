import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function checkServiceabilityHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createShipmentHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getLabelHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getInvoiceHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getManifestHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function trackShipmentHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function cancelShipmentHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function webhookHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=shipmentController.d.ts.map