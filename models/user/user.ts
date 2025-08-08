import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "../../db";
import { IUser } from "../../utils/types";

// Creation attributes (optional id, timestamps)
interface UserCreationAttributes
  extends Optional<
    IUser,
    "id" | "createdAt" | "updatedAt" | "avatar" | "role"
  > {}

// User model class
class User extends Model<IUser, UserCreationAttributes> implements IUser {
  public id!: number;
  public firstname!: string;
  public lastname!: string;
  public email!: string;
  public password!: string;
  public role!: "user" | "admin";
  public avatar?: string;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

// Initialize the model
User.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
        isAlpha: true,
      },
    },
    lastname: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [2, 50],
        isAlpha: true,
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        len: [6, 255],
      },
    },
    role: {
      type: DataTypes.ENUM("user", "admin"),
      allowNull: false,
      defaultValue: "user",
    },
    avatar: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "users",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["email"],
      },
    ],
  }
);

export { User };
