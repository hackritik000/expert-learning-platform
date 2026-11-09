import { asyncHandler } from '../../middleware/asyncHandler';
import { authService } from './auth.service';

export class AuthController {
  register = asyncHandler(async (req, res) => {
    const result = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: result,
    });
  });

  login = asyncHandler(async (req, res) => {
    const result = await authService.login(req.body);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getMe = asyncHandler(async (req, res) => {
    const user = await authService.getMe(req.user!.userId);

    res.status(200).json({
      success: true,
      data: user,
    });
  });

  updateProfile = asyncHandler(async (req, res) => {
    const user = await authService.updateProfile(req.user!.userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  });

  logout = asyncHandler(async (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  });
}

export const authController = new AuthController();
