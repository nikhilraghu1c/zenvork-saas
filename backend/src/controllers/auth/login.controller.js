import jwt from "jsonwebtoken";
import validator from "validator";
import { environment } from "../../config/environment.js";
import User from "../../modules/users/user.model.js";

const { ACCESS_TKN_SECRET, ACCESS_TKN_EXPIRE, NODE_ENV } = environment;

const invalidCredentials = (res) =>
  res.status(401).json({ message: "Invalid email or password" });

const login = async (req, res) => {
  try {
    // Validate credentials and create a tenant-scoped authenticated session.
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !validator.isEmail(email.trim())
    ) {
      return invalidCredentials(res);
    }

    const user = await User.findOne({
      email: email.trim().toLowerCase(),
    }).select("+password");

    if (!user) {
      return invalidCredentials(res);
    }

    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return invalidCredentials(res);
    }

    const token = jwt.sign(
      {
        userId: user._id.toString(),
        businessId: user.businessId.toString(),
        role: user.role,
      },
      ACCESS_TKN_SECRET,
      { expiresIn: ACCESS_TKN_EXPIRE },
    );

    res.cookie("accessToken", token, {
      httpOnly: true,
      sameSite: "strict",
      secure: NODE_ENV === "production",
    });

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        businessId: user.businessId,
      },
    });
  } catch (error) {
    console.error("Login failed:", error);
    return res.status(500).json({ message: "Login failed" });
  }
};

export { login };
