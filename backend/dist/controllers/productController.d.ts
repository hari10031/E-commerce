import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth';
export declare function getAllProducts(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function getProductById(req: Request, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function createProduct(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function updateProduct(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function publishProduct(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function unpublishProduct(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function deleteProduct(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
export declare function addProductImage(req: AuthRequest, res: Response): Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=productController.d.ts.map