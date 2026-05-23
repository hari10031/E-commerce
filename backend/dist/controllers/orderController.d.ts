import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function createRazorpayOrder(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function placeOrder(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function verifyPayment(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOrders(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getOrderById(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateOrderStatus(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function requestRefund(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function cancelOrder(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=orderController.d.ts.map