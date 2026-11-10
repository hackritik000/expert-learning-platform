import { asyncHandler } from '../../middleware/asyncHandler';
import { educatorsService } from './educators.service';

export class EducatorsController {
  getEducators = asyncHandler(async (req, res) => {
    const result = await educatorsService.getEducators(req.query as any);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getEducatorById = asyncHandler(async (req, res) => {
    const result = await educatorsService.getEducatorById(req.params.id as string);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getSubjects = asyncHandler(async (_req, res) => {
    const result = await educatorsService.getSubjects();

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  getEducatorSlots = asyncHandler(async (req, res) => {
    const result = await educatorsService.getEducatorSlots(
      req.params.id as string,
      req.query.date as string | undefined,
    );

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  registerEducatorProfile = asyncHandler(async (req, res) => {
    const result = await educatorsService.registerEducatorProfile(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Educator profile created successfully',
      data: result,
    });
  });

  getMyEducatorProfile = asyncHandler(async (req, res) => {
    const result = await educatorsService.getMyEducatorProfile(req.user!.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  updateEducatorProfile = asyncHandler(async (req, res) => {
    const result = await educatorsService.updateEducatorProfile(req.user!.userId, req.body);

    res.status(200).json({
      success: true,
      message: 'Educator profile updated successfully',
      data: result,
    });
  });

  getMySlots = asyncHandler(async (req, res) => {
    const result = await educatorsService.getMySlots(req.user!.userId);

    res.status(200).json({
      success: true,
      data: result,
    });
  });

  createSlot = asyncHandler(async (req, res) => {
    const result = await educatorsService.createSlot(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Time slot created successfully',
      data: result,
    });
  });

  batchCreateSlots = asyncHandler(async (req, res) => {
    const result = await educatorsService.batchCreateSlots(req.user!.userId, req.body);

    res.status(201).json({
      success: true,
      message: 'Time slots created successfully',
      data: result,
    });
  });

  updateSlot = asyncHandler(async (req, res) => {
    const result = await educatorsService.updateSlot(
      req.user!.userId,
      req.params.slotId as string,
      req.body,
    );

    res.status(200).json({
      success: true,
      message: 'Time slot updated successfully',
      data: result,
    });
  });

  deleteSlot = asyncHandler(async (req, res) => {
    const result = await educatorsService.deleteSlot(req.user!.userId, req.params.slotId as string);

    res.status(200).json({
      success: true,
      message: 'Time slot deleted successfully',
      data: result,
    });
  });
}

export const educatorsController = new EducatorsController();
