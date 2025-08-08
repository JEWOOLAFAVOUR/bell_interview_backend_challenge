import { Request, Response } from "express";
import { Booking } from "../../models/booking/booking";
import { Property } from "../../models/property/property";
import { User } from "../../models/user/user";
import { sendError } from "../../utils/helper";
import { CustomRequest } from "../../utils/types";
import { Op } from "sequelize";

// POST /bookings - Create a new booking (immediately confirmed)
const createBooking = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { property_id, start_date, end_date } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, "User authentication required");
    }

    // Check if property exists
    const property = await Property.findByPk(property_id);
    if (!property) {
      return sendError(res, 404, "Property not found");
    }

    // Get user details for user_name
    const user = await User.findByPk(userId);
    if (!user) {
      return sendError(res, 404, "User not found");
    }

    const bookingStartDate = new Date(start_date);
    const bookingEndDate = new Date(end_date);
    const propertyStartDate = new Date(property.available_from);
    const propertyEndDate = new Date(property.available_to);

    // Validate dates are within property availability range
    if (
      bookingStartDate < propertyStartDate ||
      bookingEndDate > propertyEndDate
    ) {
      return sendError(
        res,
        400,
        `Booking dates must be within property availability range (${property.available_from} to ${property.available_to})`
      );
    }

    // Check for overlapping CONFIRMED bookings only (cancelled bookings don't block)
    const overlappingBookings = await Booking.findAll({
      where: {
        property_id,
        status: "confirmed", // Only confirmed bookings block availability
        [Op.or]: [
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
        ],
      },
    });

    if (overlappingBookings.length > 0) {
      return sendError(
        res,
        400,
        "Selected dates overlap with existing confirmed bookings"
      );
    }

    // Calculate total price
    const nights = Math.ceil(
      (bookingEndDate.getTime() - bookingStartDate.getTime()) /
        (1000 * 60 * 60 * 24)
    );
    const totalPrice = nights * parseFloat(property.price_per_night.toString());

    // Create booking as CONFIRMED immediately (no pending status)
    const newBooking = await Booking.create({
      property_id,
      user_id: userId,
      user_name: `${user.firstname} ${user.lastname}`,
      start_date,
      end_date,
      total_price: totalPrice,
      status: "confirmed", // Immediately confirmed
    });

    // Get booking with property details for response
    const bookingWithProperty = await Booking.findByPk(newBooking.id, {
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "price_per_night"],
        },
      ],
    });

    res.status(201).json({
      success: true,
      message: "Booking confirmed successfully",
      data: {
        booking: bookingWithProperty,
        booking_details: {
          nights,
          price_per_night: property.price_per_night,
          total_price: totalPrice,
          status: "confirmed", // Always confirmed
        },
      },
    });
  } catch (error: any) {
    console.error("Create booking error:", error);

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err: any) => err.message);
      return sendError(res, 400, messages.join(", "));
    }

    return sendError(res, 500, "Internal server error");
  }
};

// POST /bookings/:id/cancel - Cancel a booking
const cancelBooking = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title"],
        },
      ],
    });

    if (!booking) {
      return sendError(res, 404, "Booking not found");
    }

    // Check if user can cancel this booking
    if (!isAdmin && booking.user_id !== userId) {
      return sendError(res, 403, "Access denied");
    }

    // Check if booking is already cancelled
    if (booking.status === "cancelled") {
      return sendError(res, 400, "Booking is already cancelled");
    }

    // Check if booking can be cancelled (e.g., not in the past)
    const today = new Date();
    const bookingStart = new Date(booking.start_date);

    if (bookingStart < today && !isAdmin) {
      return sendError(res, 400, "Cannot cancel past bookings");
    }

    // Cancel the booking (set status to cancelled)
    await booking.update({
      status: "cancelled",
    });

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
      data: {
        booking: {
          id: booking.id,
          property_id: booking.property_id,
          user_id: booking.user_id,
          user_name: booking.user_name,
          start_date: booking.start_date,
          end_date: booking.end_date,
          total_price: booking.total_price,
          status: booking.status,
          created_at: booking.created_at,
          updatedAt: booking.updatedAt,
          property: (booking as any).property, // Type assertion to bypass TS error
        },
      },
    });
  } catch (error: any) {
    console.error("Cancel booking error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /bookings - Get all bookings (Admin only)
const getAllBookings = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { page = 1, limit = 10, status, property_id } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const offset = (pageNum - 1) * limitNum;

    const whereClause: any = {};

    if (status) whereClause.status = status;
    if (property_id) whereClause.property_id = property_id;

    const { count, rows: bookings } = await Booking.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "price_per_night"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "firstname", "lastname", "email"],
        },
      ],
      limit: limitNum,
      offset: offset,
      order: [["created_at", "DESC"]],
    });

    const totalPages = Math.ceil(count / limitNum);

    res.status(200).json({
      success: true,
      message: "Bookings retrieved successfully",
      data: {
        bookings,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalItems: count,
          itemsPerPage: limitNum,
        },
        summary: {
          total_bookings: count,
          confirmed_bookings: bookings.filter((b) => b.status === "confirmed")
            .length,
          cancelled_bookings: bookings.filter((b) => b.status === "cancelled")
            .length,
        },
      },
    });
  } catch (error: any) {
    console.error("Get bookings error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /bookings/my - Get current user's bookings
const getMyBookings = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return sendError(res, 401, "User authentication required");
    }

    const bookings = await Booking.findAll({
      where: { user_id: userId },
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "description", "price_per_night"],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    // Transform bookings to replace status with boolean flags
    const transformedBookings = bookings.map((booking) => {
      const bookingData = booking.toJSON();
      const { status, ...bookingWithoutStatus } = bookingData; // Remove status field

      return {
        ...bookingWithoutStatus,
        is_cancelled: status === "cancelled",
        is_confirmed: status === "confirmed",
      };
    });

    // Calculate summary
    const confirmedCount = bookings.filter(
      (b) => b.status === "confirmed"
    ).length;
    const cancelledCount = bookings.filter(
      (b) => b.status === "cancelled"
    ).length;

    res.status(200).json({
      success: true,
      message: "User bookings retrieved successfully",
      data: {
        bookings: transformedBookings,
        summary: {
          total_bookings: bookings.length,
          confirmed_bookings: confirmedCount,
          cancelled_bookings: cancelledCount,
        },
      },
    });
  } catch (error: any) {
    console.error("Get my bookings error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// GET /bookings/:id - Get specific booking
const getBookingById = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    const booking = await Booking.findByPk(id, {
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "description", "price_per_night"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "firstname", "lastname", "email"],
        },
      ],
    });

    if (!booking) {
      return sendError(res, 404, "Booking not found");
    }

    // Check if user can access this booking
    if (!isAdmin && booking.user_id !== userId) {
      return sendError(res, 403, "Access denied");
    }

    res.status(200).json({
      success: true,
      message: "Booking retrieved successfully",
      data: { booking },
    });
  } catch (error: any) {
    console.error("Get booking error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

// PUT /bookings/:id - Update booking
const updateBooking = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin;
    const updates = req.body;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return sendError(res, 404, "Booking not found");
    }

    // Check if user can update this booking
    if (!isAdmin && booking.user_id !== userId) {
      return sendError(res, 403, "Access denied");
    }

    // Don't allow updates to cancelled bookings unless admin
    if (booking.status === "cancelled" && !isAdmin) {
      return sendError(res, 400, "Cannot modify cancelled bookings");
    }

    // If updating dates, validate them
    if (updates.start_date || updates.end_date) {
      const property = await Property.findByPk(booking.property_id);
      const newStartDate = new Date(updates.start_date || booking.start_date);
      const newEndDate = new Date(updates.end_date || booking.end_date);

      // Check property availability range
      if (property) {
        const propertyStart = new Date(property.available_from);
        const propertyEnd = new Date(property.available_to);

        if (newStartDate < propertyStart || newEndDate > propertyEnd) {
          return sendError(
            res,
            400,
            "Updated dates must be within property availability range"
          );
        }
      }

      // Check for overlapping CONFIRMED bookings (excluding current booking)
      const overlappingBookings = await Booking.findAll({
        where: {
          property_id: booking.property_id,
          id: { [Op.ne]: id },
          status: "confirmed", // Only confirmed bookings matter
          [Op.or]: [
            {
              start_date: { [Op.between]: [newStartDate, newEndDate] },
            },
            {
              end_date: { [Op.between]: [newStartDate, newEndDate] },
            },
            {
              [Op.and]: [
                { start_date: { [Op.lte]: newStartDate } },
                { end_date: { [Op.gte]: newEndDate } },
              ],
            },
          ],
        },
      });

      if (overlappingBookings.length > 0) {
        return sendError(
          res,
          400,
          "Updated dates overlap with existing confirmed bookings"
        );
      }

      // Recalculate total price if dates changed
      if (property && (updates.start_date || updates.end_date)) {
        const nights = Math.ceil(
          (newEndDate.getTime() - newStartDate.getTime()) /
            (1000 * 60 * 60 * 24)
        );
        updates.total_price =
          nights * parseFloat(property.price_per_night.toString());
      }
    }

    await booking.update(updates);

    const updatedBooking = await Booking.findByPk(id, {
      include: [
        {
          model: Property,
          as: "property",
          attributes: ["id", "title", "price_per_night"],
        },
      ],
    });

    res.status(200).json({
      success: true,
      message: "Booking updated successfully",
      data: { booking: updatedBooking },
    });
  } catch (error: any) {
    console.error("Update booking error:", error);

    if (error.name === "SequelizeValidationError") {
      const messages = error.errors.map((err: any) => err.message);
      return sendError(res, 400, messages.join(", "));
    }

    return sendError(res, 500, "Internal server error");
  }
};

// DELETE /bookings/:id - Delete booking (Alternative to cancel)
const deleteBooking = async (
  req: CustomRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isAdmin = req.user?.isAdmin;

    const booking = await Booking.findByPk(id);

    if (!booking) {
      return sendError(res, 404, "Booking not found");
    }

    // Check if user can delete this booking
    if (!isAdmin && booking.user_id !== userId) {
      return sendError(res, 403, "Access denied");
    }

    // Check if booking can be deleted (e.g., not in the past)
    const today = new Date();
    const bookingStart = new Date(booking.start_date);

    if (bookingStart < today && !isAdmin) {
      return sendError(res, 400, "Cannot delete past bookings");
    }

    await booking.destroy();

    res.status(200).json({
      success: true,
      message: "Booking deleted successfully",
    });
  } catch (error: any) {
    console.error("Delete booking error:", error);
    return sendError(res, 500, "Internal server error");
  }
};

export default {
  createBooking,
  cancelBooking, // New function
  getAllBookings,
  getMyBookings,
  getBookingById,
  updateBooking,
  deleteBooking,
};
