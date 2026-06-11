import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getCart(req: AuthRequest, res: Response): Promise<void>;
export declare function addToCart(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateCartItem(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function removeFromCart(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function clearCart(req: AuthRequest, res: Response): Promise<void>;
//# sourceMappingURL=cartController.d.ts.map