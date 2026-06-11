import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getWishlist(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function addToWishlist(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function removeFromWishlist(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function toggleWishlist(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=wishlistController.d.ts.map