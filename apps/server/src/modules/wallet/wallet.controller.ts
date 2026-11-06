import type { Request, Response, NextFunction } from 'express';
import { walletService } from './wallet.service';

export class WalletController {
  async getWallet(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await walletService.getWallet(req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }

  async recharge(req: Request, res: Response, _next: NextFunction) {
    try {
      const result = await walletService.rechargeWallet(req.user!.userId, req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(400).json({ success: false, error: error.message });
    }
  }

  async getTransactions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await walletService.getTransactions(req.user!.userId);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      next(error);
    }
  }
}

export const walletController = new WalletController();
