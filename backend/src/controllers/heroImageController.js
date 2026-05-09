import HeroImage from '../models/HeroImage.js';

// @desc    Get all hero images
// @route   GET /api/app/hero-images
// @access  Public
export const getHeroImages = async (req, res, next) => {
  try {
    const { active } = req.query;
    
    const query = active === 'true' ? { active: true } : {};
    const images = await HeroImage.find(query).sort({ sortOrder: 1 });

    res.json({
      success: true,
      data: {
        items: images,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create hero image
// @route   POST /api/app/hero-images
// @access  Private (Admin only)
export const createHeroImage = async (req, res, next) => {
  try {
    const { imageUrl, caption, sortOrder, active } = req.body;

    const image = await HeroImage.create({
      imageUrl,
      caption: caption || null,
      sortOrder: sortOrder || 0,
      active: active !== false,
    });

    res.status(201).json({
      success: true,
      message: 'Hero image created successfully',
      data: {
        image,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update hero image
// @route   PATCH /api/app/hero-images/:id
// @access  Private (Admin only)
export const updateHeroImage = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { imageUrl, caption, sortOrder, active } = req.body;

    const image = await HeroImage.findById(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Hero image not found',
      });
    }

    if (imageUrl !== undefined) image.imageUrl = imageUrl;
    if (caption !== undefined) image.caption = caption;
    if (sortOrder !== undefined) image.sortOrder = sortOrder;
    if (active !== undefined) image.active = active;

    await image.save();

    res.json({
      success: true,
      message: 'Hero image updated successfully',
      data: {
        image,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete hero image
// @route   DELETE /api/app/hero-images/:id
// @access  Private (Admin only)
export const deleteHeroImage = async (req, res, next) => {
  try {
    const { id } = req.params;

    const image = await HeroImage.findByIdAndDelete(id);
    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Hero image not found',
      });
    }

    res.json({
      success: true,
      message: 'Hero image deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getHeroImages,
  createHeroImage,
  updateHeroImage,
  deleteHeroImage,
};
