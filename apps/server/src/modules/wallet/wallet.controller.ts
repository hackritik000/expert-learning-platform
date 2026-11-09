import { asyncHandler } from '../../middleware/asyncHandler';
import { walletService } from './wallet.service';

export class WalletController {
  getWallet = asyncHandler(async (req, res) => {
    const result = await walletService.getWallet(req.user!.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  recharge = asyncHandler(async (req, res) => {
    console.log('recharge started');
    const result = await walletService.rechargeWallet(req.user!.userId, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  withdraw = asyncHandler(async (req, res) => {
    console.log('withdraw started');
    const result = await walletService.withdrawWallet(req.user!.userId, req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getTransactions = asyncHandler(async (req, res) => {
    const result = await walletService.getTransactions(req.user!.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });
}

export const walletController = new WalletController();
