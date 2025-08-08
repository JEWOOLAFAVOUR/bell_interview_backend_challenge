import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../db";
import { IBooking } from "../../utils/types";

// Creation attributes (optional id, timestamps, calculated fields)
interface BookingCreationAttributes
  extends Optional<
    IBooking,
    "id" | "created_at" | "updatedAt" | "total_price" | "status"
  > {}

// Booking model class
class Booking
  extends Model<IBooking, BookingCreationAttributes>
  implements IBooking
{
  public id!: number;
  public property_id!: number;
  public user_id!: number;
  public user_name!: string;
  public start_date!: Date;
  public end_date!: Date;
  public total_price?: number;
  public status!: "pending" | "confirmed" | "cancelled";
  public created_at!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
Booking.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    property_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "properties",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onUpdate: "CASCADE",
      onDelete: "CASCADE",
    },
    user_name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 100],
        notEmpty: true,
      },
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Can't book in the past
      },
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterStartDate(value: string) {
          if (
            this.start_date &&
            new Date(value) <=
              new Date(
                this.start_date instanceof Date
                  ? this.start_date
                  : String(this.start_date)
              )
          ) {
            throw new Error("End date must be after start date");
          }
        },
      },
    },
    total_price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      validate: {
        min: 0,
        isDecimal: true,
      },
    },
    status: {
      type: DataTypes.ENUM("pending", "confirmed", "cancelled"),
      allowNull: false,
      defaultValue: "pending",
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    modelName: "Booking",
    tableName: "bookings",
    timestamps: true,
    createdAt: "created_at",
    indexes: [
      {
        fields: ["property_id"],
      },
      {
        fields: ["user_id"],
      },
      {
        fields: ["start_date", "end_date"],
      },
      {
        fields: ["status"],
      },
      {
        // Composite index for checking overlapping bookings
        fields: ["property_id", "start_date", "end_date"],
      },
    ],
  }
);

export { Booking };
