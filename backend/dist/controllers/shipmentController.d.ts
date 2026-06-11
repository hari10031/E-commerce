import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function checkServiceabilityHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
/**
 * Fire-and-forget shipment creation triggered after successful payment.
 * Gated by SHIPROCKET_AUTO_CREATE (default on). Always resolves — failures are
 * logged so an admin can still create the shipment manually from the dashboard.
 */
export declare function autoCreateShipment(orderId: string): Promise<void>;
export declare function createShipmentHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getLabelHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getInvoiceHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getManifestHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function trackShipmentHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function cancelShipmentHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export type NormalizedShipmentStatus = 'PICKED UP' | 'IN TRANSIT' | 'OUT FOR DELIVERY' | 'DELIVERED' | 'RETURNED' | 'CANCELLED';
export declare function webhookHandler(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=shipmentController.d.ts.map