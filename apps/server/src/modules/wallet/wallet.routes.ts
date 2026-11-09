import { rechargeSchema, withdrawSchema } from '@repo/validation';
import { Router } from 'express';
import { requireAuth } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { walletController } from './wallet.controller';

export const walletRouter = Router();

walletRouter.use(requireAuth);

/**
 * @openapi
 * /api/wallet:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get wallet balance
 *     description: Retrieve the current wallet balance and currency for the authenticated user.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Wallet'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
walletRouter.get('/', walletController.getWallet);

/**
 * @openapi
 * /api/wallet/recharge:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Recharge wallet
 *     description: Add funds to the user wallet (instant simulated payment via UPI, NetBanking, or Card).
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 50
 *                 maximum: 50000
 *                 example: 500
 *                 description: Recharge amount in INR (min ₹50, max ₹50,000)
 *               paymentMethod:
 *                 type: string
 *                 default: upi
 *                 example: upi
 *     responses:
 *       200:
 *         description: Wallet recharged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     wallet:
 *                       $ref: '#/components/schemas/Wallet'
 *                     transaction:
 *                       $ref: '#/components/schemas/WalletTransaction'
 *       400:
 *         description: Invalid amount or recharge error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized
 */
walletRouter.post('/recharge', validateBody(rechargeSchema), walletController.recharge);

/**
 * @openapi
 * /api/wallet/withdraw:
 *   post:
 *     tags:
 *       - Wallet
 *     summary: Withdraw funds from wallet
 *     description: Educator or user withdraws funds from their consultation wallet to their UPI or bank account.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 100
 *                 maximum: 100000
 *                 example: 500
 *                 description: Withdrawal amount in INR (min ₹100, max ₹100,000)
 *               accountDetails:
 *                 type: string
 *                 example: educator@upi
 *                 description: Target UPI ID or Bank account details
 *     responses:
 *       200:
 *         description: Withdrawal processed successfully
 *       400:
 *         description: Insufficient funds or invalid amount
 *       401:
 *         description: Unauthorized
 */
walletRouter.post('/withdraw', validateBody(withdrawSchema), walletController.withdraw);

/**
 * @openapi
 * /api/wallet/transactions:
 *   get:
 *     tags:
 *       - Wallet
 *     summary: Get wallet transaction history
 *     description: Retrieve all wallet transactions (recharges, consultation session deductions, and cancellation refunds) in chronological order.
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of wallet transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WalletTransaction'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
walletRouter.get('/transactions', walletController.getTransactions);
