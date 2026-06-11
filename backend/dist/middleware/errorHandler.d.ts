import { Request, Response, NextFunction } from 'express';
export declare function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): Response<any, Record<string, any>> | undefined;
export declare function notFound(req: Request, res: Response): void;
//# sourceMappingURL=errorHandler.d.ts.map