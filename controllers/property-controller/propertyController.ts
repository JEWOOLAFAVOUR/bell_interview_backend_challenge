import { Request, Response } from "express";
import { Property } from "../../models/property/property";
import { Booking } from "../../models/booking/booking";
import { sendError } from "../../utils/helper";
import { CustomRequest, AvailableProperty } from "../../utils/types";
import { Op } from "sequelize";

const getAvailableProperties = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      available_from,
      available_to,
      min_price,
      max_price,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause for properties
    const whereClause: any = {};

    // Date filtering
    if (available_from && available_to) {
      whereClause.available_from = { [Op.lte]: available_from };
      whereClause.available_to = { [Op.gte]: available_to };
    }

    // Price filtering
    if (min_price || max_price) {
      whereClause.price_per_night = {};
      if (min_price) whereClause.price_per_night[Op.gte] = min_price;
      if (max_price) whereClause.price_per_night[Op.lte] = max_price;
    }

    // Get all properties
    const allProperties = await Property.findAll({
      where: whereClause,
      order: [["createdAt", "DESC"]],
    });

    const availableProperties: AvailableProperty[] = [];

    // Check availability for each property
    for (const property of allProperties) {
      // Get all confirmed bookings for this property (excluding cancelled)
      const bookings = await Booking.findAll({
        where: {
          property_id: property.id,
          status: "confirmed",
        },
        order: [["start_date", "ASC"]],
      });

      // Calculate available periods
      const availablePeriods = [];
      const propertyStart = new Date(property.available_from);
      const propertyEnd = new Date(property.available_to);

      if (bookings.length === 0) {
        // No bookings, entire period is available
        const days = Math.ceil(
          (propertyEnd.getTime() - propertyStart.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        availablePeriods.push({
          start_date: property.available_from.toString(),
          end_date: property.available_to.toString(),
          days_available: days,
        });
      } else {
        // Check availability between bookings
        let currentDate = propertyStart;

        for (const booking of bookings) {
          const bookingStart = new Date(booking.start_date);

          // If there's a gap before this booking
          if (currentDate < bookingStart) {
            const gapEnd = new Date(bookingStart);
            gapEnd.setDate(gapEnd.getDate() - 1);

            const days = Math.ceil(
              (gapEnd.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24)
            );

            if (days > 0) {
              availablePeriods.push({
                start_date: currentDate.toISOString().split("T")[0],
                end_date: gapEnd.toISOString().split("T")[0],
                days_available: days,
              });
            }
          }

          // Move current date to after this booking
          currentDate = new Date(booking.end_date);
          currentDate.setDate(currentDate.getDate() + 1);
        }

        // Check if there's availability after the last booking
        if (currentDate <= propertyEnd) {
          const days = Math.ceil(
            (propertyEnd.getTime() - currentDate.getTime()) /
              (1000 * 60 * 60 * 24)
          );

          if (days > 0) {
            availablePeriods.push({
              start_date: currentDate.toISOString().split("T")[0],
              end_date: property.available_to.toString(),
              days_available: days,
            });
          }
        }
      }

      // Only include properties that have available periods
      if (availablePeriods.length > 0) {
        const totalDays = availablePeriods.reduce(
          (sum, period) => sum + period.days_available,
          0
        );

        availableProperties.push({
          ...property.toJSON(),
          is_fully_available: bookings.length === 0,
          available_periods: availablePeriods,
          total_available_days: totalDays,
        });
      }
    }

    // Apply pagination to available properties
    const startIndex = offset;
    const endIndex = offset + limitNum;
    const paginatedProperties = availableProperties.slice(startIndex, endIndex);
    const totalCount = availableProperties.length;
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      success: true,
      message: "Available properties retrieved successfully",
      data: {
        properties: paginatedProperties,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: totalCount,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Get available properties error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /properties - List all properties with optional filtering and pagination
const getAllProperties = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = 1,
      limit = 10,
      available_from,
      available_to,
      min_price,
      max_price,
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    // Build where clause
    const whereClause: any = {};

    // Date filtering
    if (available_from && available_to) {
      whereClause.available_from = { [Op.lte]: available_from };
      whereClause.available_to = { [Op.gte]: available_to };
    }

    // Price filtering
    if (min_price || max_price) {
      whereClause.price_per_night = {};
      if (min_price) whereClause.price_per_night[Op.gte] = min_price;
      if (max_price) whereClause.price_per_night[Op.lte] = max_price;
    }

    const { count, rows: properties } = await Property.findAndCountAll({
      where: whereClause,
      limit: limitNum,
      offset: offset,
      order: [["createdAt", "DESC"]],
    });

    const totalPages = Math.ceil(count / limitNum);

    res.status(200).json({
      success: true,
      message: "Properties retrieved successfully",
      data: {
        properties,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: count,
          itemsPerPage: limitNum,
          hasNextPage: pageNum < totalPages,
          hasPrevPage: pageNum > 1,
        },
      },
    });
  } catch (error: any) {
    console.error("Get properties error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /properties/:id - Get specific property
const getPropertyById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id);

    if (!property) {
      return sendError(res, 404, "Property not found");
    }

    res.status(200).json({
      success: true,
      message: "Property retrieved successfully",
      data: { property },
    });
  } catch (error: any) {
    console.error("Get property error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /properties/:id/availability - Get available date ranges for a property
const getPropertyAvailability = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;

    const property = await Property.findByPk(id);

    if (!property) {
      return sendError(res, 404, "Property not found");
    }

    // Get all confirmed bookings for this property (excluding cancelled)
    const whereClause: any = {
      property_id: id,
      status: "confirmed",
    };

    // If date range specified, filter bookings in that range
    if (start_date && end_date) {
      whereClause[Op.or] = [
        {
          start_date: { [Op.between]: [start_date, end_date] },
        },
        {
          end_date: { [Op.between]: [start_date, end_date] },
        },
        {
          [Op.and]: [
            { start_date: { [Op.lte]: start_date } },
            { end_date: { [Op.gte]: end_date } },
          ],
        },
      ];
    }

    const bookings = await Booking.findAll({
      where: whereClause,
      order: [["start_date", "ASC"]],
    });

    // Calculate available date ranges
    const availableRanges = [];
    const propertyStart = new Date(property.available_from);
    const propertyEnd = new Date(property.available_to);

    if (bookings.length === 0) {
      // No bookings, entire period is available
      availableRanges.push({
        start_date: property.available_from,
        end_date: property.available_to,
      });
    } else {
      // Check availability between bookings
      let currentDate = propertyStart;

      for (const booking of bookings) {
        const bookingStart = new Date(booking.start_date);
        const bookingEnd = new Date(booking.end_date);

        // If there's a gap before this booking
        if (currentDate < bookingStart) {
          const gapEnd = new Date(bookingStart);
          gapEnd.setDate(gapEnd.getDate() - 1);

          availableRanges.push({
            start_date: currentDate.toISOString().split("T")[0],
            end_date: gapEnd.toISOString().split("T")[0],
          });
        }

        // Move current date to after this booking
        currentDate = new Date(bookingEnd);
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Check if there's availability after the last booking
      if (currentDate <= propertyEnd) {
        availableRanges.push({
          start_date: currentDate.toISOString().split("T")[0],
          end_date: property.available_to,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: "Property availability retrieved successfully",
      data: {
        property_id: id,
        property_title: property.title,
        overall_availability: {
          available_from: property.available_from,
          available_to: property.available_to,
        },
        available_ranges: availableRanges,
        occupied_dates: bookings.map((booking) => ({
          start_date: booking.start_date,
          end_date: booking.end_date,
          status: booking.status,
        })),
      },
    });
  } catch (error: any) {
    console.error("Get availability error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// POST /properties - Create new property (Admin only)
const createProperty = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const {
      title,
      description,
      price_per_night,
      available_from,
      available_to,
    } = req.body;

    const newProperty = await Property.create({
      title,
      description,
      price_per_night,
      available_from,
      available_to,
    });

    res.status(201).json({
      success: true,
      message: "Property created successfully",
      data: { property: newProperty },
    });
  } catch (error: any) {
    console.error("Create property error:", error);

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err: any) => err.message);
      return sendError(res, 400, messages.join(", "));
    }

    return sendError(res, 500, "Internal server error");
  }
};

// PUT /properties/:id - Update property (Admin only)
const updateProperty = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const property = await Property.findByPk(id);

    if (!property) {
      return sendError(res, 404, "Property not found");
    }

    await property.update(updates);

    res.status(200).json({
      success: true,
      message: "Property updated successfully",
      data: { property },
    });
  } catch (error: any) {
    console.error("Update property error:", error);

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err: any) => err.message);
      return sendError(res, 400, messages.join(", "));
    }

    return sendError(res, 500, "Internal server error");
  }
};

// DELETE /properties/:id - Delete property (Admin only)
const deleteProperty = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const property = await Property.findByPk(id);

    if (!property) {
      return sendError(res, 404, "Property not found");
    }

    // Check if property has active bookings (confirmed only)
    const activeBookings = await Booking.count({
      where: {
        property_id: id,
        status: "confirmed",
        end_date: { [Op.gte]: new Date() },
      },
    });

    if (activeBookings > 0) {
      return sendError(
        res,
        400,
        "Cannot delete property with active confirmed bookings"
      );
    }

    await property.destroy();

    res.status(200).json({
      success: true,
      message: "Property deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete property error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

export default {
  getAllProperties,
  getAvailableProperties,
  getPropertyById,
  getPropertyAvailability,
  createProperty,
  updateProperty,
  deleteProperty,
};
