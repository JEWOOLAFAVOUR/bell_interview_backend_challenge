import { User } from "./user/user";
import { Property } from "./property/property";
import { Booking } from "./booking/booking";

// Define associations
User.hasMany(Booking, { foreignKey: "user_id", as: "bookings" });
Booking.belongsTo(User, { foreignKey: "user_id", as: "user" });

Property.hasMany(Booking, { foreignKey: "property_id", as: "bookings" });
Booking.belongsTo(Property, { foreignKey: "property_id", as: "property" });

export { User, Property, Booking };
