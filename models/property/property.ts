import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../db";
import { IProperty } from "../../utils/types";

// Creation attributes (optional id, timestamps)
interface PropertyCreationAttributes
  extends Optional<IProperty, "id" | "createdAt" | "updatedAt"> {}

// Property model class
class Property
  extends Model<IProperty, PropertyCreationAttributes>
  implements IProperty
{
  public id!: number;
  public title!: string;
  public description!: string;
  public price_per_night!: number;
  public available_from!: Date;
  public available_to!: Date;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
Property.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [3, 200],
        notEmpty: true,
      },
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        len: [10, 2000],
        notEmpty: true,
      },
    },
    price_per_night: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        min: 0.01,
        isDecimal: true,
      },
    },
    available_from: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfter: new Date(Date.now() - 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0], // Can't be before yesterday
      },
    },
    available_to: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      validate: {
        isDate: true,
        isAfterAvailableFrom(value: string) {
          if (
            this.available_from &&
            new Date(value) <= new Date(String(this.available_from))
          ) {
            throw new Error(
              "Available to date must be after available from date"
            );
          }
        },
      },
    },
  },
  {
    sequelize,
    modelName: "Property",
    tableName: "properties",
    timestamps: true,
    indexes: [
      {
        fields: ["available_from", "available_to"],
      },
      {
        fields: ["price_per_night"],
      },
    ],
  }
);

export { Property };
